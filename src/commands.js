const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  new SlashCommandBuilder().setName('help').setDescription('Show all Pterodactyl bot commands'),

  new SlashCommandBuilder().setName('create-user').setDescription('Create a Pterodactyl user for yourself or a Discord member')
    .addUserOption(o=>o.setName('member').setDescription('Optional: Discord member; defaults to you').setRequired(false))
    .addStringOption(o=>o.setName('email').setDescription('Optional email').setRequired(false)),

  new SlashCommandBuilder().setName('createuser').setDescription('Legacy alias for automatic user creation')
    .addUserOption(o=>o.setName('member').setDescription('Optional: Discord member; defaults to you').setRequired(false))
    .addStringOption(o=>o.setName('email').setDescription('Optional email').setRequired(false)),

  new SlashCommandBuilder().setName('deleteuser').setDescription('Delete a user').addIntegerOption(o=>o.setName('id').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('user').setDescription('View a user').addIntegerOption(o=>o.setName('id').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('users').setDescription('List users'),

  new SlashCommandBuilder().setName('create-server').setDescription('Create a server for yourself or a Discord member')
    .addIntegerOption(o=>o.setName('node').setDescription('Node ID').setRequired(true))
    .addIntegerOption(o=>o.setName('nest').setDescription('Nest ID').setRequired(true))
    .addIntegerOption(o=>o.setName('egg').setDescription('Egg ID').setRequired(true))
    .addIntegerOption(o=>o.setName('allocation').setDescription('Allocation ID').setRequired(true))
    .addStringOption(o=>o.setName('name').setDescription('Server name').setRequired(true))
    .addIntegerOption(o=>o.setName('memory').setDescription('RAM in MB').setRequired(true))
    .addIntegerOption(o=>o.setName('disk').setDescription('Disk in MB').setRequired(true))
    .addIntegerOption(o=>o.setName('cpu').setDescription('CPU percentage').setRequired(true))
    .addUserOption(o=>o.setName('member').setDescription('Optional: Discord member; defaults to you').setRequired(false))
    .addIntegerOption(o=>o.setName('backups').setDescription('Backup limit').setRequired(false)),

  new SlashCommandBuilder().setName('delete-server').setDescription('Delete a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)).addBooleanOption(o=>o.setName('force').setDescription('Force delete').setRequired(false)),
  new SlashCommandBuilder().setName('server').setDescription('View a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('servers').setDescription('List servers'),
  new SlashCommandBuilder().setName('rename-server').setDescription('Rename a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)).addStringOption(o=>o.setName('name').setDescription('New server name').setRequired(true)),
  new SlashCommandBuilder().setName('suspend').setDescription('Suspend a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('unsuspend').setDescription('Unsuspend a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('start').setDescription('Start a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('stop').setDescription('Stop a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('restart').setDescription('Restart a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('nodes').setDescription('List nodes'),
  new SlashCommandBuilder().setName('locations').setDescription('List locations'),
  new SlashCommandBuilder().setName('nests').setDescription('List nests'),
  new SlashCommandBuilder().setName('eggs').setDescription('List eggs').addIntegerOption(o=>o.setName('nest').setDescription('Nest ID').setRequired(true)),
  new SlashCommandBuilder().setName('allocations').setDescription('List node allocations').addIntegerOption(o=>o.setName('node').setDescription('Node ID').setRequired(true))
];
