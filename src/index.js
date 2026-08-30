const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const config = require('./config');
const commands = require('./commands');
const ptero = require('./ptero');
const crypto = require('crypto');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const embed = (title, description, color = 0x5865f2) => new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
const ok = (d) => embed('✅ Pterodactyl', d, 0x57f287);
const fail = (e) => embed('❌ Pterodactyl Error', String(e).slice(0, 3900), 0xed4245);
const lines = (arr, fn) => arr.length ? arr.slice(0, 50).map(fn).join('\n') : 'No results found.';
const admin = (i) => i.memberPermissions?.has('Administrator') || i.member?.roles?.cache?.has(config.adminRoleId);

function generatePassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
  const bytes = crypto.randomBytes(18);
  let password = '';
  for (let i = 0; i < 18; i++) password += alphabet[bytes[i] % alphabet.length];
  return password;
}

function safeUsername(name, discordId) {
  let value = String(name || 'user').toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 20);
  if (value.length < 3) value = `user${discordId.slice(-6)}`;
  return `${value}-${discordId.slice(-6)}`.slice(0, 32);
}

async function register() {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands.map(x => x.toJSON()) });
  console.log('Slash commands registered.');
}

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;

  if (!admin(i)) {
    return i.reply({ embeds: [fail('You do not have permission to use this command.')], ephemeral: true });
  }

  try {
    const c = i.commandName;

    if (c === 'help') {
      return i.reply({ embeds: [embed('☁️ Pterodactyl Bot Help', [
        '**👤 Users**',
        '`/create-user member:<user>` — Auto-create account and DM credentials',
        '`/createuser member:<user>` — Legacy alias',
        '`/user` — View a user',
        '`/users` — List users',
        '`/deleteuser` — Delete a user',
        '',
        '**🖥️ Servers**',
        '`/create-server` — Create a server',
        '`/server` — View a server',
        '`/servers` — List servers',
        '`/rename-server` — Rename a server',
        '`/delete-server` — Delete a server',
        '`/suspend` — Suspend a server',
        '`/unsuspend` — Unsuspend a server',
        '`/start` — Start a server',
        '`/stop` — Stop a server',
        '`/restart` — Restart a server',
        '',
        '**⚙️ Panel**',
        '`/nodes` — List nodes',
        '`/locations` — List locations',
        '`/nests` — List nests',
        '`/eggs` — List eggs in a nest',
        '`/allocations` — List node allocations'
      ].join('\n'))], ephemeral: true });
    }

    await i.deferReply({ ephemeral: true });

    // Automatic Pterodactyl account creation from a Discord member.
    // Discord bots cannot read a user's private Discord email, so an email is either
    // supplied explicitly or generated from the configured PTERO_EMAIL_DOMAIN.
    if (c === 'create-user' || c === 'createuser') {
      const member = i.options.getUser('member', true);
      const suppliedEmail = i.options.getString('email');
      const username = safeUsername(member.username, member.id);
      const email = suppliedEmail || `${username}@${config.emailDomain}`;
      const password = generatePassword();
      const firstName = (member.globalName || member.username || 'Discord').replace(/[^a-zA-Z0-9 ._-]/g, '').trim().slice(0, 191) || 'Discord';
      const lastName = `Discord-${member.id.slice(-6)}`;

      const u = await ptero.createUser({
        username,
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        root_admin: false,
        language: 'en'
      });

      const a = u.attributes;
      const dm = embed('☁️ Your Pterodactyl Account', [
        'Your Pterodactyl account has been created.',
        '',
        `**Panel:** ${config.pteroUrl}`,
        `**Username:** \`${a.username}\``,
        `**Email:** \`${a.email}\``,
        `**Password:** \`${password}\``,
        `**Pterodactyl User ID:** \`${a.id}\``,
        '',
        '🔐 Keep these credentials private and change your password after your first login if your panel allows it.'
      ].join('\n'), 0x62d9ff);

      try {
        await member.send({ embeds: [dm] });
        return i.editReply({ embeds: [ok(`Pterodactyl user created for **${member.tag}**.\n\n**User ID:** ${a.id}\n**Username:** ${a.username}\n\n📩 All login details were sent to the member's Discord DM.`)] });
      } catch (dmError) {
        console.error('DM failed:', dmError);
        return i.editReply({ embeds: [embed('⚠️ User Created — DM Failed', `The Pterodactyl account **${a.username}** was created, but Discord could not send the credentials to **${member.tag}**.\n\nAsk the user to enable DMs and run the command again only after removing the existing Pterodactyl account, or use the panel's password reset flow.\n\n**User ID:** ${a.id}`, 0xfee75c)] });
      }
    }

    if (c === 'deleteuser') { const id=i.options.getInteger('id'); await ptero.deleteUser(id); return i.editReply({embeds:[ok(`User **${id}** deleted.`)]}); }
    if (c === 'user') { const a=(await ptero.getUser(i.options.getInteger('id'))).attributes; return i.editReply({embeds:[embed(`User #${a.id}`,`**Username:** ${a.username}\n**Email:** ${a.email}\n**Name:** ${a.first_name} ${a.last_name}\n**Root admin:** ${a.root_admin ? 'Yes':'No'}`)]}); }
    if (c === 'users') { const d=(await ptero.getUsers()).data||[]; return i.editReply({embeds:[embed('Pterodactyl Users',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.username} — ${a.email}`;}))]}); }

    if (c === 'create-server') {
      const user=i.options.getInteger('user'), node=i.options.getInteger('node'), nest=i.options.getInteger('nest'), egg=i.options.getInteger('egg'), allocation=i.options.getInteger('allocation');
      const eggData=(await ptero.getEgg(nest,egg)).attributes;
      const body={name:i.options.getString('name'), user, node, nest, egg, docker_image:eggData.docker_image, startup:eggData.startup, environment:{}, limits:{memory:i.options.getInteger('memory'),swap:0,disk:i.options.getInteger('disk'),io:500,cpu:i.options.getInteger('cpu'),threads:null}, feature_limits:{databases:0,allocations:1,backups:i.options.getInteger('backups')||0}, allocation:{default:allocation}};
      const s=(await ptero.createServer(body)).attributes;
      return i.editReply({embeds:[ok(`Server created\n**ID:** ${s.id}\n**Identifier:** ${s.identifier}\n**Name:** ${s.name}\n**Node:** ${node}`)]});
    }
    if (c === 'delete-server') { const id=i.options.getInteger('id'); await ptero.deleteServer(id,i.options.getBoolean('force')||false); return i.editReply({embeds:[ok(`Server **${id}** deleted.`)]}); }
    if (c === 'server') { const a=(await ptero.getServer(i.options.getInteger('id'))).attributes; return i.editReply({embeds:[embed(`Server #${a.id}`,`**Name:** ${a.name}\n**Identifier:** ${a.identifier}\n**UUID:** ${a.uuid}\n**Node:** ${a.node}\n**RAM:** ${a.limits.memory} MB\n**Disk:** ${a.limits.disk} MB\n**CPU:** ${a.limits.cpu}%\n**Suspended:** ${a.suspended?'Yes':'No'}`)]}); }
    if (c === 'servers') { const d=(await ptero.getServers()).data||[]; return i.editReply({embeds:[embed('Pterodactyl Servers',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — \`${a.identifier}\``;}))]}); }
    if (c === 'rename-server') { const id=i.options.getInteger('id'); const name=i.options.getString('name'); await ptero.updateServerDetails(id,{name}); return i.editReply({embeds:[ok(`Server **${id}** renamed to **${name}**.`)]}); }
    if (c === 'suspend') { const id=i.options.getInteger('id'); await ptero.suspendServer(id); return i.editReply({embeds:[ok(`Server **${id}** suspended.`)]}); }
    if (c === 'unsuspend') { const id=i.options.getInteger('id'); await ptero.unsuspendServer(id); return i.editReply({embeds:[ok(`Server **${id}** unsuspended.`)]}); }
    if (c === 'start') { const id=i.options.getInteger('id'); await ptero.power(id,'start'); return i.editReply({embeds:[ok(`Start signal sent to server **${id}**.`)]}); }
    if (c === 'stop') { const id=i.options.getInteger('id'); await ptero.power(id,'stop'); return i.editReply({embeds:[ok(`Stop signal sent to server **${id}**.`)]}); }
    if (c === 'restart') { const id=i.options.getInteger('id'); await ptero.power(id,'restart'); return i.editReply({embeds:[ok(`Restart signal sent to server **${id}**.`)]}); }
    if (c === 'nodes') { const d=(await ptero.getNodes()).data||[]; return i.editReply({embeds:[embed('Nodes',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — ${a.fqdn}`;}))]}); }
    if (c === 'locations') { const d=(await ptero.getLocations()).data||[]; return i.editReply({embeds:[embed('Locations',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.short} — ${a.long}`;}))]}); }
    if (c === 'nests') { const d=(await ptero.getNests()).data||[]; return i.editReply({embeds:[embed('Nests',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name}`;}))]}); }
    if (c === 'eggs') { const nest=i.options.getInteger('nest'), d=(await ptero.getEggs(nest)).data||[]; return i.editReply({embeds:[embed(`Eggs — Nest ${nest}`,lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name}`;}))]}); }
    if (c === 'allocations') { const node=i.options.getInteger('node'), d=(await ptero.getAllocations(node)).data||[]; return i.editReply({embeds:[embed(`Allocations — Node ${node}`,lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.ip}:${a.port} — ${a.assigned?'Assigned':'Available'}`;}))]}); }

    return i.editReply({ embeds:[fail('Unknown command. Run `/help` to see available commands.')] });
  } catch (e) {
    console.error(e);
    if (i.deferred || i.replied) return i.editReply({ embeds:[fail(e.message)] });
    return i.reply({ embeds:[fail(e.message)], ephemeral:true });
  }
});

(async()=>{
  try {
    await register();
    await client.login(config.discordToken);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
})();
