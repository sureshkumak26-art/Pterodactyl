const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'expiry.json');

function load() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return {}; }
}

function save(data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  all: load,
  get(serverId) { return load()[String(serverId)] || null; },
  set(serverId, expiresAt, discordId = null) {
    const data = load();
    data[String(serverId)] = { expiresAt: new Date(expiresAt).toISOString(), discordId };
    save(data);
  },
  remove(serverId) {
    const data = load();
    delete data[String(serverId)];
    save(data);
  }
};
