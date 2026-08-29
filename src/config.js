require('dotenv').config();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

module.exports = {
  discordToken: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: required('GUILD_ID'),
  pteroUrl: required('PTERO_URL').replace(/\/+$/, ''),
  pteroApiKey: required('PTERO_API_KEY'),
  adminRoleId: required('ADMIN_ROLE_ID')
};
