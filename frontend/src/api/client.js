const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function getHeaders() {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handle(res) {
  if (res.status === 401) {
    const msg = await res.text().catch(() => 'Unauthorized');
    const err = new Error(msg || 'Unauthorized'); err.code = 401; throw err;
  }
  if (!res.ok) { throw new Error(await res.text().catch(()=>res.statusText)); }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  async login({ username, password }) {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handle(res);
  },
  async getAttendance() {
    const res = await fetch(`${BASE_URL}/api/attendance`, { headers: getHeaders() });
    return handle(res);
  },
  async getRecentUsers() {
    const res = await fetch(`${BASE_URL}/api/users/recent`, { headers: getHeaders() });
    return handle(res);
  },
  async addUser({ name }) {
    const res = await fetch(`${BASE_URL}/api/users`, {
      method: 'POST', headers: getHeaders(), body: JSON.stringify({ name }),
    });
    return handle(res);
  },
};

export async function detectEmotion(imageBlob) {
  const token = localStorage.getItem('token');
  const form = new FormData();
  form.append('image', imageBlob, 'frame.jpg');
  const res = await fetch(`${BASE_URL}/api/emotion/detect`, {
    method: 'POST', headers: token ? { 'Authorization': `Bearer ${token}` } : {}, body: form,
  });
  if (res.status === 401) { const err = new Error('Unauthorized'); err.code = 401; throw err; }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const dashboardApi = {
  async summary() {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/dashboard/summary`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (res.status === 401) { const err = new Error('Unauthorized'); err.code = 401; throw err; }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async attendanceDaily(days = 7) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/dashboard/attendance_daily?days=${days}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (res.status === 401) { const err = new Error('Unauthorized'); err.code = 401; throw err; }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async emotions(days = 7) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/dashboard/emotions?days=${days}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (res.status === 401) { const err = new Error('Unauthorized'); err.code = 401; throw err; }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  async recent(limit = 10) {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE_URL}/api/dashboard/recent?limit=${limit}`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
    });
    if (res.status === 401) { const err = new Error('Unauthorized'); err.code = 401; throw err; }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },


};

export function getUsernameFromToken() {
  const token = localStorage.getItem('token')
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload?.sub || null
  } catch { return null }
}

// Derive username from JWT payload 
// export function getUsernameFromToken() {
//   const token = localStorage.getItem('token')
//   if (!token) return null
//   const parts = token.split('.')
//   if (parts.length !== 3) return null
//   try {
//     const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))
//     return payload?.sub || null
//   } catch { return null }
// }

// // Mark my own attendance (server takes username from token)
// export async function markMyAttendance(emotion) {
//   const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
//   const token = localStorage.getItem('token') || ''
//   const res = await fetch(`${BASE_URL}/api/attendance/mark_self`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       'Authorization': `Bearer ${token}`,
//     },
//     body: JSON.stringify({ emotion }),
//   })
//   if (res.status === 401) { const e = new Error('Unauthorized'); e.code = 401; throw e }
//   if (!res.ok) throw new Error(await res.text())
//   return res.json()
// }
