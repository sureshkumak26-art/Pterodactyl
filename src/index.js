const { Client, GatewayIntentBits, REST, Routes, EmbedBuilder } = require('discord.js');
const config = require('./config');
const commands = require('./commands');
const ptero = require('./ptero');
const crypto = require('crypto');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const embed=(title,description,color=0x5865f2)=>new EmbedBuilder().setColor(color).setTitle(title).setDescription(description).setTimestamp();
const ok=d=>embed('✅ Pterodactyl',d,0x57f287);
const fail=e=>embed('❌ Pterodactyl Error',String(e).slice(0,3900),0xed4245);
const admin=i=>i.memberPermissions?.has('Administrator')||i.member?.roles?.cache?.has(config.adminRoleId);
const list=(d,fn)=>d.length?d.slice(0,50).map(fn).join('\n'):'No results found.';
function password(){const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';const b=crypto.randomBytes(24);return [...b].map(x=>a[x%a.length]).slice(0,24).join('');}
function username(member){let n=String(member.username||'user').toLowerCase().replace(/[^a-z0-9_.-]/g,'').slice(0,20);if(n.length<3)n=`user${member.id.slice(-6)}`;return `${n}-${member.id.slice(-6)}`.slice(0,32);}

async function ensureUser(member){
  const u=username(member); const existing=await ptero.findUserByUsername(u);
  if(existing)return {user:existing.attributes,created:false,password:null};
  const pass=password();
  const created=await ptero.createUser({username:u,email:`${u}@${config.emailDomain}`,first_name:(member.globalName||member.username||'Discord').replace(/[^a-zA-Z0-9 ._-]/g,'').slice(0,191)||'Discord',last_name:`Discord-${member.id.slice(-6)}`,password:pass,root_admin:false,language:'en'});
  return {user:created.attributes,created:true,password:pass};
}

async function sendAccountDM(member, account){
  if(!account.created)return true;
  try{
    await member.send({embeds:[embed('☁️ Your Pterodactyl Account',[`**Panel:** ${config.pteroUrl}`,`**Discord:** ${member.tag}`,`**Username:** \`${account.user.username}\``,`**Email:** \`${account.user.email}\``,`**Password:** \`${account.password}\``,`**User ID:** \`${account.user.id}\``,'','🔐 Keep these credentials private.'].join('\n'),0x62d9ff)]});
    return true;
  }catch(e){console.error('Account DM failed:',e.message);return false;}
}

async function sendServerDM(member, account, server, node, allocation, memory, disk, cpu){
  try{
    const lines=[
      '☁️ **Your Pterodactyl Server is Ready!**',
      '',
      `**Panel:** ${config.pteroUrl}`,
      `**Discord:** ${member.tag}`,
      `**Pterodactyl User ID:** \`${account.user.id}\``,
      `**Username:** \`${account.user.username}\``,
      `**Email:** \`${account.user.email}\``,
      account.created ? `**Password:** \`${account.password}\`` : '**Password:** Your existing password',
      '',
      `**Server ID:** \`${server.id}\``,
      `**Server Name:** \`${server.name}\``,
      `**Identifier:** \`${server.identifier}\``,
      `**Node:** \`${node.name}\` (ID ${node.id})`,
      `**Allocation:** \`${allocation.ip}:${allocation.port}\``,
      `**RAM:** ${memory} MB`,
      `**Disk:** ${disk} MB`,
      `**CPU:** ${cpu}%`,
      `**Status:** ${server.suspended?'Suspended':'Active'}`,
      '',
      '🔐 Keep your login details private.'
    ];
    await member.send({embeds:[embed('🎮 Server Details',lines.join('\n'),0x62d9ff)]});
    return true;
  }catch(e){console.error('Server DM failed:',e.message);return false;}
}

async function register(){const rest=new REST({version:'10'}).setToken(config.discordToken);await rest.put(Routes.applicationGuildCommands(config.clientId,config.guildId),{body:commands.map(x=>x.toJSON())});console.log('Slash commands registered.');}
client.once('ready',()=>console.log(`Logged in as ${client.user.tag}`));

client.on('interactionCreate',async i=>{
 if(!i.isChatInputCommand())return;
 if(!admin(i))return i.reply({embeds:[fail('You do not have permission to use this command.')],ephemeral:true});
 try{
  const c=i.commandName;
  if(c==='help')return i.reply({embeds:[embed('☁️ Pterodactyl Bot Help','`/create-user` — Create account for a selected member\n`/create-server` — Create server for a selected member; node and allocation are automatic\n`/users` `/user` `/deleteuser`\n`/servers` `/server` `/delete-server` `/rename-server`\n`/start` `/stop` `/restart` `/suspend` `/unsuspend`\n`/nodes` `/locations` `/nests` `/eggs` `/allocations`')],ephemeral:true});
  await i.deferReply({ephemeral:true});

  if(c==='create-user'||c==='createuser'){
    const member=i.options.getUser('member',true); const email=i.options.getString('email'); const u=username(member);
    const existing=await ptero.findUserByUsername(u);
    if(existing)return i.editReply({embeds:[embed('⚠️ Already Exists',`**Discord:** ${member.tag}\n**User ID:** ${existing.attributes.id}\n**Username:** ${existing.attributes.username}`,0xfee75c)]});
    const pass=password(); const created=await ptero.createUser({username:u,email:email||`${u}@${config.emailDomain}`,first_name:(member.globalName||member.username||'Discord').replace(/[^a-zA-Z0-9 ._-]/g,'').slice(0,191)||'Discord',last_name:`Discord-${member.id.slice(-6)}`,password:pass,root_admin:false,language:'en'}); const a=created.attributes;
    try{await member.send({embeds:[embed('☁️ Your Pterodactyl Account',[`**Panel:** ${config.pteroUrl}`,`**Discord:** ${member.tag}`,`**Username:** \`${a.username}\``,`**Email:** \`${a.email}\``,`**Password:** \`${pass}\``,`**User ID:** \`${a.id}\``, '', '🔐 Keep these credentials private.'].join('\n'),0x62d9ff)]});return i.editReply({embeds:[ok(`Account created for **${member.tag}**.\n📩 Login details sent by DM.`)]});}catch(e){return i.editReply({embeds:[embed('⚠️ Created — DM Failed',`Account **${a.username}** created, but Discord blocked the DM.\n**User ID:** ${a.id}`,0xfee75c)]});}
  }
  if(c==='deleteuser'){const id=i.options.getInteger('id',true);await ptero.deleteUser(id);return i.editReply({embeds:[ok(`User **${id}** deleted.`)]});}
  if(c==='user'){const a=(await ptero.getUser(i.options.getInteger('id',true))).attributes;return i.editReply({embeds:[embed(`User #${a.id}`,`**Username:** ${a.username}\n**Email:** ${a.email}\n**Name:** ${a.first_name} ${a.last_name}\n**Admin:** ${a.root_admin?'Yes':'No'}`)]});}
  if(c==='users'){const d=(await ptero.getUsers()).data||[];return i.editReply({embeds:[embed('Pterodactyl Users',list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.username} — ${a.email}`;}))]});}

  if(c==='create-server'){
    const member=i.options.getUser('member',true);
    const name=i.options.getString('name',true);
    const nest=i.options.getInteger('nest',true);
    const egg=i.options.getInteger('egg',true);
    const requestedAllocation=i.options.getInteger('allocation',true);
    const memory=i.options.getInteger('memory',true);
    const disk=i.options.getInteger('disk',true);
    const cpu=i.options.getInteger('cpu',true);
    const backups=i.options.getInteger('backups')||0;
    const account=await ensureUser(member);
    const nodes=(await ptero.getNodes()).data||[];
    if(!nodes.length)throw new Error('No Pterodactyl nodes found.');
    const node=nodes.find(x=>!x.attributes.maintenance)||nodes[0];
    const nodeId=Number(node.attributes.id);
    const allocations=(await ptero.getAllocations(nodeId)).data||[];
    const available=allocations.find(x=>!x.attributes.assigned && (!requestedAllocation || Number(x.attributes.id)===requestedAllocation));
    const autoAllocation=available || allocations.find(x=>!x.attributes.assigned);
    if(!autoAllocation)throw new Error(`No available allocation on node ${node.attributes.name}.`);
    const allocation=autoAllocation.attributes;
    const r=await ptero.getCreateServerResources({user:Number(account.user.id),node:nodeId,nest,egg,allocation:Number(allocation.id)});
    const ed=r.egg; const env={};
    for(const x of ed.relationships?.variables?.data||[]){const v=x.attributes||{};if(v.env_variable&&v.default_value!==undefined&&v.default_value!==null)env[v.env_variable]=String(v.default_value);}
    const server=(await ptero.createServer({name,user:Number(account.user.id),node:nodeId,nest,egg,docker_image:ed.docker_image,startup:ed.startup,environment:env,limits:{memory,swap:0,disk,io:500,cpu,threads:null},feature_limits:{databases:0,allocations:1,backups},allocation:{default:Number(allocation.id)}})).attributes;
    const dm=await sendServerDM(member,account,server,node.attributes,allocation,memory,disk,cpu);
    return i.editReply({embeds:[ok(`**Server created successfully!**\n\n**Discord:** ${member.tag}\n**Server:** ${server.name}\n**Server ID:** ${server.id}\n**Node:** ${node.attributes.name}\n**Allocation:** ${allocation.ip}:${allocation.port}\n**RAM:** ${memory} MB\n**Disk:** ${disk} MB\n**CPU:** ${cpu}%\n${dm?'📩 All server/login details sent by DM.':'⚠️ Server created, but the user could not receive a DM.'}${account.created?'\n👤 New Pterodactyl account created automatically.':''}`)]});
  }

  if(c==='delete-server'){const id=i.options.getInteger('id',true);await ptero.deleteServer(id,i.options.getBoolean('force')||false);return i.editReply({embeds:[ok(`Server **${id}** deleted.`)]});}
  if(c==='server'){const a=(await ptero.getServer(i.options.getInteger('id',true))).attributes;return i.editReply({embeds:[embed(`Server #${a.id}`,`**Name:** ${a.name}\n**Identifier:** ${a.identifier}\n**Node:** ${a.node}\n**RAM:** ${a.limits.memory} MB\n**Disk:** ${a.limits.disk} MB\n**CPU:** ${a.limits.cpu}%\n**Suspended:** ${a.suspended?'Yes':'No'}`)]});}
  if(c==='servers'){const d=(await ptero.getServers()).data||[];return i.editReply({embeds:[embed('Pterodactyl Servers',list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — \`${a.identifier}\``;}))]});}
  if(c==='rename-server'){const id=i.options.getInteger('id',true);await ptero.updateServerDetails(id,{name:i.options.getString('name',true)});return i.editReply({embeds:[ok(`Server **${id}** renamed.`)]});}
  if(['start','stop','restart'].includes(c)){const id=i.options.getInteger('id',true);await ptero.power(id,c);return i.editReply({embeds:[ok(`${c} signal sent to server **${id}**.`)]});}
  if(c==='suspend'||c==='unsuspend'){const id=i.options.getInteger('id',true);await ptero[`${c}Server`](id);return i.editReply({embeds:[ok(`Server **${id}** ${c}ed.`)]});}
  if(c==='nodes'){const d=(await ptero.getNodes()).data||[];return i.editReply({embeds:[embed('Nodes',list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name} — ${a.fqdn}`;}))]});}
  if(c==='locations'){const d=(await ptero.getLocations()).data||[];return i.editReply({embeds:[embed('Locations',list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.short} — ${a.long}`;}))]});}
  if(c==='nests'){const d=(await ptero.getNests()).data||[];return i.editReply({embeds:[embed('Nests',list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.name}`;}))]});}
  if(c==='eggs'){const n=i.options.getInteger('nest',true),d=(await ptero.getEggs(n)).data||[];return i.editReply({embeds:[embed(`Eggs — Nest ${n}`,list(d,x=>`**${x.attributes.id}** — ${x.attributes.name}`))]});}
  if(c==='allocations'){const n=i.options.getInteger('node',true),d=(await ptero.getAllocations(n)).data||[];return i.editReply({embeds:[embed(`Allocations — Node ${n}`,list(d,x=>{const a=x.attributes;return `**${a.id}** — ${a.ip}:${a.port} — ${a.assigned?'Assigned':'Available'}`;}))]});}
  return i.editReply({embeds:[fail('Unknown command. Run `/help`.')]});
 }catch(e){console.error(e);if(i.deferred||i.replied)return i.editReply({embeds:[fail(e.message)]});return i.reply({embeds:[fail(e.message)],ephemeral:true});}
});

(async()=>{try{await register();await client.login(config.discordToken);}catch(e){console.error(e);process.exit(1);}})();
