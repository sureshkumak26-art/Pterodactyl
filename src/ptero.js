const axios = require('axios');
const config = require('./config');

const api = axios.create({
  baseURL: `${config.pteroUrl}/api/application`,
  headers: { Authorization: `Bearer ${config.pteroApiKey}`, Accept: 'Application/vnd.pterodactyl.v1+json', 'Content-Type': 'application/json' },
  timeout: 30000
});

async function request(method, path, data, params) {
  try { return (await api.request({ method, url: path, data, params })).data; }
  catch (e) {
    const errors = e.response?.data?.errors;
    if (Array.isArray(errors)) throw new Error(errors.map(x => x.detail || x.code).join('\n'));
    throw new Error(e.response?.data?.message || e.message || `HTTP ${e.response?.status || 500}`);
  }
}

module.exports = {
  getUsers: (filter) => request('GET', '/users', undefined, { 'filter[email]': filter || undefined, per_page: 100 }),
  getUser: (id) => request('GET', `/users/${id}`),
  createUser: (body) => request('POST', '/users', body),
  deleteUser: (id) => request('DELETE', `/users/${id}`),
  getServers: () => request('GET', '/servers', undefined, { per_page: 100 }),
  getServer: (id) => request('GET', `/servers/${id}`),
  createServer: (body) => request('POST', '/servers', body),
  deleteServer: (id, force = false) => request('DELETE', `/servers/${id}${force ? '/force' : ''}`),
  suspendServer: (id) => request('POST', `/servers/${id}/suspend`),
  unsuspendServer: (id) => request('POST', `/servers/${id}/unsuspend`),
  getNodes: () => request('GET', '/nodes', undefined, { per_page: 100 }),
  getLocations: () => request('GET', '/locations', undefined, { per_page: 100 }),
  getNests: () => request('GET', '/nests', undefined, { include: 'eggs', per_page: 100 }),
  getEgg: (nestId, eggId) => request('GET', `/nests/${nestId}/eggs/${eggId}`, undefined, { include: 'variables' }),
  getEggs: (nestId) => request('GET', `/nests/${nestId}/eggs`, undefined, { per_page: 100 }),
  getAllocations: (nodeId) => request('GET', `/nodes/${nodeId}/allocations`, undefined, { per_page: 100 })
};
