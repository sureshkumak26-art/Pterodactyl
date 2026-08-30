require('dotenv').config();

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
};

// PTERO_URL should normally be the panel root. If /api/application was
// accidentally included, remove it so the API path is not duplicated.
const rawPteroUrl = required('PTERO_URL').replace(/\/+$/, '');
const pteroUrl = rawPteroUrl.replace(/\/api\/application\/?$/i, '');

module.exports = {
  discordToken: required('DISCORD_TOKEN'),
  clientId: required('CLIENT_ID'),
  guildId: required('GUILD_ID'),
  pteroUrl,
  pteroApiKey: required('PTERO_API_KEY'),
  adminRoleId: required('ADMIN_ROLE_ID'),
  emailDomain: process.env.PTERO_EMAIL_DOMAIN || 'example.com'
};
