const { SlashCommandBuilder } = require('discord.js');

module.exports = [
  new SlashCommandBuilder().setName('createuser').setDescription('Create a Pterodactyl user')
    .addStringOption(o=>o.setName('username').setDescription('Username').setRequired(true))
    .addStringOption(o=>o.setName('email').setDescription('Email').setRequired(true))
    .addStringOption(o=>o.setName('firstname').setDescription('First name').setRequired(true))
    .addStringOption(o=>o.setName('lastname').setDescription('Last name').setRequired(true))
    .addStringOption(o=>o.setName('password').setDescription('Password').setRequired(true)),
  new SlashCommandBuilder().setName('deleteuser').setDescription('Delete a user').addIntegerOption(o=>o.setName('id').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('user').setDescription('View a user').addIntegerOption(o=>o.setName('id').setDescription('User ID').setRequired(true)),
  new SlashCommandBuilder().setName('users').setDescription('List users'),
  new SlashCommandBuilder().setName('create-server').setDescription('Create a server')
    .addIntegerOption(o=>o.setName('user').setDescription('User ID').setRequired(true))
    .addIntegerOption(o=>o.setName('node').setDescription('Node ID').setRequired(true))
    .addIntegerOption(o=>o.setName('nest').setDescription('Nest ID').setRequired(true))
    .addIntegerOption(o=>o.setName('egg').setDescription('Egg ID').setRequired(true))
    .addIntegerOption(o=>o.setName('allocation').setDescription('Allocation ID').setRequired(true))
    .addStringOption(o=>o.setName('name').setDescription('Server name').setRequired(true))
    .addIntegerOption(o=>o.setName('memory').setDescription('RAM MB').setRequired(true))
    .addIntegerOption(o=>o.setName('disk').setDescription('Disk MB').setRequired(true))
    .addIntegerOption(o=>o.setName('cpu').setDescription('CPU %').setRequired(true))
    .addIntegerOption(o=>o.setName('backups').setDescription('Backup limit').setRequired(false)),
  new SlashCommandBuilder().setName('delete-server').setDescription('Delete a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)).addBooleanOption(o=>o.setName('force').setDescription('Force delete')),
  new SlashCommandBuilder().setName('server').setDescription('View a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('servers').setDescription('List servers'),
  new SlashCommandBuilder().setName('suspend').setDescription('Suspend a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('unsuspend').setDescription('Unsuspend a server').addIntegerOption(o=>o.setName('id').setDescription('Server ID').setRequired(true)),
  new SlashCommandBuilder().setName('nodes').setDescription('List nodes'),
  new SlashCommandBuilder().setName('locations').setDescription('List locations'),
  new SlashCommandBuilder().setName('nests').setDescription('List nests'),
  new SlashCommandBuilder().setName('eggs').setDescription('List eggs').addIntegerOption(o=>o.setName('nest').setDescription('Nest ID').setRequired(true)),
  new SlashCommandBuilder().setName('allocations').setDescription('List allocations').addIntegerOption(o=>o.setName('node').setDescription('Node ID').setRequired(true))
];
