const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const config = require('./config');
const commands = require('./commands');
const ptero = require('./ptero');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const embed = (title, description, color = 0x5865f2) => new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
const ok = (d) => embed('✅ Pterodactyl', d, 0x57f287);
const fail = (e) => embed('❌ Pterodactyl Error', String(e).slice(0, 3900), 0xed4245);
const lines = (arr, fn) => arr.length ? arr.slice(0, 50).map(fn).join('\n') : 'No results found.';
const admin = (i) => i.memberPermissions?.has('Administrator') || i.member.roles?.cache?.has(config.adminRoleId);

async function register() {
  const rest = new REST({ version: '10' }).setToken(config.discordToken);
  await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands.map(x => x.toJSON()) });
}

client.once('ready', () => console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate', async (i) => {
  if (!i.isChatInputCommand()) return;
  if (!admin(i)) return i.reply({ embeds: [fail('You do not have permission to use this command.')], ephemeral: true });
  await i.deferReply({ ephemeral: true });
  try {
    const c = i.commandName;

    if (c === 'createuser') {
      const u = await ptero.createUser({ username:i.options.getString('username'), email:i.options.getString('email'), first_name:i.options.getString('firstname'), last_name:i.options.getString('lastname'), password:i.options.getString('password'), root_admin:false, language:'en' });
      const a = u.attributes; return i.editReply({ embeds:[ok(`User created\n**ID:** ${a.id}\n**Username:** ${a.username}\n**Email:** ${a.email}`)] });
    }
    if (c === 'deleteuser') { const id=i.options.getInteger('id'); await ptero.deleteUser(id); return i.editReply({embeds:[ok(`User **${id}** deleted.`)]}); }
    if (c === 'user') { const a=(await ptero.getUser(i.options.getInteger('id'))).attributes; return i.editReply({embeds:[embed(`User #${a.id}`,`**Username:** ${a.username}\n**Email:** ${a.email}\n**Name:** ${a.first_name} ${a.last_name}\n**Root admin:** ${a.root_admin ? 'Yes':'No'}`)]}); }
    if (c === 'users') { const d=(await ptero.getUsers()).data||[]; return i.editReply({embeds:[embed('Pterodactyl Users',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.username} — ${a.email}`;}) )]}); }

    if (c === 'create-server') {
      const user=i.options.getInteger('user'), node=i.options.getInteger('node'), nest=i.options.getInteger('nest'), egg=i.options.getInteger('egg'), allocation=i.options.getInteger('allocation');
      const eggData=(await ptero.getEgg(nest,egg)).attributes;
      const vars=((await ptero.getEgg(nest,egg)).meta?.pagination ? [] : []);
      const body={name:i.options.getString('name'), user, node, nest, egg, docker_image:eggData.docker_image, startup:eggData.startup, environment:{}, limits:{memory:i.options.getInteger('memory'),swap:0,disk:i.options.getInteger('disk'),io:500,cpu:i.options.getInteger('cpu'),threads:null}, feature_limits:{databases:0,allocations:1,backups:i.options.getInteger('backups')||0}, allocation:{default:allocation}};
      const s=(await ptero.createServer(body)).attributes;
      return i.editReply({embeds:[ok(`Server created\n**ID:** ${s.id}\n**Identifier:** ${s.identifier}\n**Name:** ${s.name}\n**Node:** ${node}`)]});
    }
    if (c === 'delete-server') { const id=i.options.getInteger('id'); await ptero.deleteServer(id,i.options.getBoolean('force')||false); return i.editReply({embeds:[ok(`Server **${id}** deleted.`)]}); }
    if (c === 'server') { const a=(await ptero.getServer(i.options.getInteger('id'))).attributes; return i.editReply({embeds:[embed(`Server #${a.id}`,`**Name:** ${a.name}\n**Identifier:** ${a.identifier}\n**UUID:** ${a.uuid}\n**Node:** ${a.node}\n**RAM:** ${a.limits.memory} MB\n**Disk:** ${a.limits.disk} MB\n**CPU:** ${a.limits.cpu}%\n**Suspended:** ${a.suspended?'Yes':'No'}`)]}); }
    if (c === 'servers') { const d=(await ptero.getServers()).data||[]; return i.editReply({embeds:[embed('Pterodactyl Servers',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — \`${a.identifier}\``;}))]}); }
    if (c === 'suspend') { const id=i.options.getInteger('id'); await ptero.suspendServer(id); return i.editReply({embeds:[ok(`Server **${id}** suspended.`)]}); }
    if (c === 'unsuspend') { const id=i.options.getInteger('id'); await ptero.unsuspendServer(id); return i.editReply({embeds:[ok(`Server **${id}** unsuspended.`)]}); }
    if (c === 'nodes') { const d=(await ptero.getNodes()).data||[]; return i.editReply({embeds:[embed('Nodes',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — ${a.fqdn}`;}))]}); }
    if (c === 'locations') { const d=(await ptero.getLocations()).data||[]; return i.editReply({embeds:[embed('Locations',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.short} — ${a.long}`;}))]}); }
    if (c === 'nests') { const d=(await ptero.getNests()).data||[]; return i.editReply({embeds:[embed('Nests',lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name}`;}))]}); }
    if (c === 'eggs') { const nest=i.options.getInteger('nest'), d=(await ptero.getEggs(nest)).data||[]; return i.editReply({embeds:[embed(`Eggs — Nest ${nest}`,lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name}`;}))]}); }
    if (c === 'allocations') { const node=i.options.getInteger('node'), d=(await ptero.getAllocations(node)).data||[]; return i.editReply({embeds:[embed(`Allocations — Node ${node}`,lines(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.ip}:${a.port} — ${a.assigned?'Assigned':'Available'}`;}))]}); }
  } catch (e) { console.error(e); return i.editReply({ embeds:[fail(e.message)] }); }
});

(async()=>{ try { await register(); await client.login(config.discordToken); } catch(e) { console.error(e); process.exit(1); } })();
