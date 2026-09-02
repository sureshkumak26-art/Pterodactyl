const axios = require('axios');
const dns = require('dns');
const config = require('./config');

// Prefer IPv4. This prevents Node from trying unreachable IPv6 routes first
// on VPS hosts that have broken/disabled IPv6 connectivity.
dns.setDefaultResultOrder('ipv4first');

const api = axios.create({
  baseURL: `${config.pteroUrl}/api/application`,
  headers: {
    Authorization: `Bearer ${config.pteroApiKey}`,
    Accept: 'Application/vnd.pterodactyl.v1+json',
    'Content-Type': 'application/json'
  },
  timeout: 30000,
  family: 4
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
      throw new Error(`HTTP 404: ${method} ${path} was not found. Check PTERO_URL and verify that the supplied ID exists.`);
    }
    throw new Error(`HTTP ${status || 'ERR'} ${method} ${path}\n${e.response?.data?.message || e.message || 'Unknown Pterodactyl API error'}`);
  }
}

async function getCreateServerResources({ user, node, nest, egg, allocation }) {
  if (!Number.isInteger(user) || user <= 0) throw new Error('A valid Pterodactyl user ID is required.');
  if (!Number.isInteger(node) || node <= 0) throw new Error('A valid node ID is required.');
  if (!Number.isInteger(nest) || nest <= 0) throw new Error('A valid nest ID is required.');
  if (!Number.isInteger(egg) || egg <= 0) throw new Error('A valid egg ID is required.');
  if (!Number.isInteger(allocation) || allocation <= 0) throw new Error('A valid allocation ID is required.');

  const [u, n, e, a] = await Promise.all([
    request('GET', `/users/${user}`),
    request('GET', `/nodes/${node}`),
    request('GET', `/nests/${nest}/eggs/${egg}`, undefined, { include: 'variables' }),
    request('GET', `/nodes/${node}/allocations`, undefined, { per_page: 100 })
  ]);

  const allocations = a.data || [];
  const selectedAllocation = allocations.find(x => Number(x.attributes.id) === Number(allocation));
  if (!selectedAllocation) throw new Error(`Allocation ${allocation} was not found on node ${node}.`);
  if (selectedAllocation.attributes.assigned) throw new Error(`Allocation ${allocation} is already assigned.`);

  return { user: u.attributes, node: n.attributes, egg: e.attributes, allocation: selectedAllocation.attributes };
}

async function findUserByUsername(username) {
  const result = await request('GET', '/users', undefined, { per_page: 100 });
  return (result.data || []).find(x => String(x.attributes?.username).toLowerCase() === String(username).toLowerCase()) || null;
}

function cleanName(value, fallback) {
  const cleaned = String(value ?? '')
    .normalize('NFKC')
    .replace(/[^a-zA-Z0-9 ._-]/g, '')
    .trim()
    .slice(0, 191);
  return cleaned || fallback;
}

async function createUser(body = {}) {
  const payload = {
    username: String(body.username || '').trim(),
    email: String(body.email || '').trim(),
    first_name: cleanName(body.first_name ?? body.firstName, 'Discord'),
    last_name: cleanName(body.last_name ?? body.lastName, 'User'),
    password: String(body.password || ''),
    root_admin: Boolean(body.root_admin ?? body.rootAdmin ?? false),
    language: String(body.language || 'en')
  };

  if (!payload.username) throw new Error('Username is required.');
  if (!payload.email) throw new Error('Email is required.');
  if (!payload.password) throw new Error('Password is required.');

  return request('POST', '/users', payload);
}

module.exports = {
  getUsers: (filter) => request('GET', '/users', undefined, { 'filter[email]': filter || undefined, per_page: 100 }),
  getUser: (id) => request('GET', `/users/${id}`),
  findUserByUsername,
  createUser,
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
