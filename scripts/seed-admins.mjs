// Clean Care Admin — Database seeding for admin roles
// Creates: 4 Master Admins, 10 Super Admins, 20 Admins
// Usage:
//   SEED_EMAIL=<root_email> SEED_PASSWORD=<root_password> SEED_API_URL=<base_url> npm run seed:admins
// Defaults:
//   SEED_API_URL falls back to VITE_LOCAL_API_URL or http://192.168.0.100:4000

const BASE_URL = process.env.SEED_API_URL || process.env.VITE_LOCAL_API_URL || 'http://192.168.0.100:4000';
const ROOT_EMAIL = process.env.SEED_EMAIL;
const ROOT_PASSWORD = process.env.SEED_PASSWORD;
const SEED_TOKEN = process.env.SEED_TOKEN; // Optional: bypass login if provided

if (!SEED_TOKEN && (!ROOT_EMAIL || !ROOT_PASSWORD)) {
  console.error('❌ Missing SEED_TOKEN or SEED_EMAIL/SEED_PASSWORD. Provide a bearer token (SEED_TOKEN) or valid admin credentials.');
  process.exit(1);
}

const endpoints = {
  login: '/api/admin/auth/login',
  profile: '/api/admin/auth/me',
  roles: '/api/admin/users/roles',
  users: '/api/admin/users',
};

const toUrl = (p) => `${BASE_URL}${p}`;

async function api(path, { method = 'GET', token, json } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(toUrl(path), {
    method,
    headers,
    body: json ? JSON.stringify(json) : undefined,
  });
  if (!res.ok) {
    const msg = await safeText(res);
    throw new Error(`${method} ${path} failed (${res.status}) ${msg}`);
  }
  return await res.json().catch(() => ({}));
}

async function safeText(res) {
  try { return await res.text(); } catch { return ''; }
}

function namePair(prefix, i) {
  const idx = String(i).padStart(2, '0');
  return {
    firstName: prefix.charAt(0).toUpperCase() + prefix.slice(1),
    lastName: idx,
    email: `${prefix}${idx}@cc.app`,
    phone: `017${String(10000000 + i).padStart(8, '0')}`,
  };
}

function genUsers() {
  const masters = Array.from({ length: 4 }, (_, i) => ({ ...namePair('master', i + 1), role: 'MASTER_ADMIN' }));
  const supers = Array.from({ length: 10 }, (_, i) => ({ ...namePair('super', i + 1), role: 'SUPER_ADMIN' }));
  const admins = Array.from({ length: 20 }, (_, i) => ({ ...namePair('admin', i + 1), role: 'ADMIN' }));
  return { masters, supers, admins };
}

async function ensureUser(token, user) {
  const q = encodeURIComponent(user.email);
  // Try to find existing by email
  try {
    const existing = await api(`${endpoints.users}?email=${q}`, { token });
    const list = Array.isArray(existing?.data) ? existing.data : existing?.data?.users || existing?.users || [];
    if (Array.isArray(list) && list.length > 0) {
      console.log(`↺ Skipped (exists): ${user.email}`);
      return;
    }
  } catch (e) {
    // If search fails, proceed to attempt creation
  }

  const payload = {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    password: '123456',
    status: 'active',
    role: user.role,
  };
  await api(endpoints.users, { method: 'POST', token, json: payload });
  console.log(`✅ Created: ${user.role} → ${user.email}`);
}

async function main() {
  console.log('🔧 Seeding to:', BASE_URL);
  // Login as root admin
  let accessToken = SEED_TOKEN;
  if (!accessToken) {
    const loginResp = await api(endpoints.login, {
      method: 'POST',
      json: { email: ROOT_EMAIL, password: ROOT_PASSWORD, rememberMe: false },
    });
    accessToken = loginResp?.accessToken || loginResp?.data?.accessToken;
    if (!accessToken) throw new Error('Login did not return accessToken');
  }

  // Optionally verify profile (skip if token invalid)
  try { await api(endpoints.profile, { token: accessToken }); } catch {}

  const { masters, supers, admins } = genUsers();

  for (const u of masters) { await ensureUser(accessToken, u); }
  for (const u of supers) { await ensureUser(accessToken, u); }
  for (const u of admins) { await ensureUser(accessToken, u); }

  console.log('🎉 Seeding completed');
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err.message);
  process.exit(1);
});
