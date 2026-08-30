const axios = require('axios');
const config = require('./config');

const api = axios.create({
  baseURL: `${config.pteroUrl}/api/application`,
  headers: {
    Authorization: `Bearer ${config.pteroApiKey}`,
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

async function request(method, path, data, params) {
  try {
    return (await api.request({ method, url: path, data, params })).data;
  } catch (e) {
    const status = e.response?.status;
    const errors = e.response?.data?.errors;
    if (Array.isArray(errors) && errors.length) {
      throw new Error(`HTTP ${status || 'ERR'} ${method} ${path}\n${errors.map(x => x.detail || x.code || 'API error').join('\n')}`);
    }
    if (status === 404) {
      throw new Error(`HTTP 404: ${method} ${path} was not found. Check PTERO_URL and verify that the supplied ID exists and belongs to the selected parent (for example, the Egg must belong to the selected Nest).`);
    }
    throw new Error(`HTTP ${status || 'ERR'} ${method} ${path}\n${e.response?.data?.message || e.message || 'Unknown Pterodactyl API error'}`);
  }
}

async function getCreateServerResources({ user, node, nest, egg, allocation }) {
  const [u, n, e, a] = await Promise.all([
    getUser(user),
    getNode(node),
    getEgg(nest, egg),
    getAllocations(node)
  ]);

  const allocations = a.data || [];
  const selectedAllocation = allocations.find(x => Number(x.attributes.id) === Number(allocation));
  if (!selectedAllocation) {
    throw new Error(`Allocation ${allocation} was not found on node ${node}. Run /allocations node:${node} and select an Available allocation.`);
  }
  if (selectedAllocation.attributes.assigned) {
    throw new Error(`Allocation ${allocation} is already assigned. Run /allocations node:${node} and choose an Available allocation.`);
  }

  return { user: u.attributes, node: n.attributes, egg: e.attributes, allocation: selectedAllocation.attributes };
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
  updateServerDetails: (id, body) => request('PATCH', `/servers/${id}/details`, body),
  suspendServer: (id) => request('POST', `/servers/${id}/suspend`),
  unsuspendServer: (id) => request('POST', `/servers/${id}/unsuspend`),
  power: (id, signal) => request('POST', `/servers/${id}/power`, { signal }),
  getNodes: () => request('GET', '/nodes', undefined, { per_page: 100 }),
  getNode: (id) => request('GET', `/nodes/${id}`),
  getLocations: () => request('GET', '/locations', undefined, { per_page: 100 }),
  getNests: () => request('GET', '/nests', undefined, { include: 'eggs', per_page: 100 }),
  getNest: (id) => request('GET', `/nests/${id}`, undefined, { include: 'eggs' }),
  getEgg: (nestId, eggId) => request('GET', `/nests/${nestId}/eggs/${eggId}`, undefined, { include: 'variables' }),
  getEggs: (nestId) => request('GET', `/nests/${nestId}/eggs`, undefined, { per_page: 100 }),
  getAllocations: (nodeId) => request('GET', `/nodes/${nodeId}/allocations`, undefined, { per_page: 100 }),
  getCreateServerResources
};
