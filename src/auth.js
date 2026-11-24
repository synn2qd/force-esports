// Accounts and sessions for the admin panel.
// Passwords are stored as salted PBKDF2-SHA256 hashes; session tokens are stored hashed.

const enc = new TextEncoder();
const PBKDF2_ITERATIONS = 100000;
export const SESSION_COOKIE = 'force_session';
const SESSION_DAYS = 7;
const LOGIN_LIMIT = 8; // failed sign-ins allowed per address in 15 minutes

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const toHex = (buf) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
const randomToken = (bytes = 32) => toB64(crypto.getRandomValues(new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const sha256Hex = async (s) => toHex(await crypto.subtle.digest('SHA-256', enc.encode(s)));

export function safeEqual(a, b) {
  const x = enc.encode(String(a));
  const y = enc.encode(String(b));
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

async function derive(password, salt, iterations) {
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  return crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256);
}
export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return { hash: toB64(await derive(password, salt, PBKDF2_ITERATIONS)), salt: toB64(salt), iter: PBKDF2_ITERATIONS };
}
export async function verifyPassword(password, rec) {
  return safeEqual(toB64(await derive(password, fromB64(rec.salt), rec.iter)), rec.hash);
}

/* -------------------------------------------------------------------- rules */
export const normUsername = (s) => String(s || '').trim().toLowerCase();
export function checkUsername(u) {
  return /^[a-z0-9][a-z0-9._-]{2,23}$/.test(u) ? '' : 'Usernames are 3 to 24 characters: letters, numbers, dots, dashes or underscores.';
}
export function checkPassword(p) {
  if (typeof p !== 'string' || p.length < 10) return 'Passwords need at least 10 characters.';
  if (p.length > 200) return 'That password is too long.';
  return '';
}
export const cleanName = (s) => String(s || '').replace(/\s+/g, ' ').trim().slice(0, 40);
export const ROLES = ['owner', 'editor'];

/* -------------------------------------------------------------------- users */
export async function loadUsers(env) {
  return (await env.DATA.get('users', { type: 'json' })) || {};
}
export const saveUsers = (env, users) => env.DATA.put('users', JSON.stringify(users));
export const publicUser = (u) => ({ username: u.username, name: u.name, role: u.role, disabled: !!u.disabled, created: u.created, lastLogin: u.lastLogin || null });
export const activeOwners = (users) => Object.values(users).filter((u) => u.role === 'owner' && !u.disabled).length;

export async function makeUser({ username, name, password, role }) {
  return { username, name: name || username, role, ...(await hashPassword(password)), pwv: 1, created: new Date().toISOString(), disabled: false };
}

/* ----------------------------------------------------------------- sessions */
const readCookie = (request, name) => {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return '';
};
const cookie = (value, maxAge, secure) => `${SESSION_COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;

export async function startSession(env, user, secure) {
  const token = randomToken();
  const session = { u: user.username, pwv: user.pwv, csrf: randomToken(18), at: Date.now() };
  await env.DATA.put(`sess:${await sha256Hex(token)}`, JSON.stringify(session), { expirationTtl: SESSION_DAYS * 86400 });
  return { cookie: cookie(token, SESSION_DAYS * 86400, secure), csrf: session.csrf };
}

export async function endSession(env, request, secure) {
  const token = readCookie(request, SESSION_COOKIE);
  if (token && env.DATA) await env.DATA.delete(`sess:${await sha256Hex(token)}`);
  return cookie('', 0, secure);
}

/** The signed-in user for this request, or null. A changed password or disabled account ends the session. */
export async function currentSession(env, request) {
  if (!env.DATA) return null;
  const token = readCookie(request, SESSION_COOKIE);
  if (!token || token.length > 100) return null;
  const session = await env.DATA.get(`sess:${await sha256Hex(token)}`, { type: 'json' });
  if (!session) return null;
  const users = await loadUsers(env);
  const user = users[session.u];
  if (!user || user.disabled || user.pwv !== session.pwv) return null;
  return { user, users, csrf: session.csrf };
}

/* ----------------------------------------------------------- sign-in limiter */
const limiterKey = (request) => `rl:login:${request.headers.get('cf-connecting-ip') || 'local'}`;
export async function loginBlocked(env, request) {
  return Number((await env.DATA.get(limiterKey(request))) || 0) >= LOGIN_LIMIT;
}
export async function noteFailedLogin(env, request) {
  const key = limiterKey(request);
  const n = Number((await env.DATA.get(key)) || 0) + 1;
  await env.DATA.put(key, String(n), { expirationTtl: 900 });
}
export const clearFailedLogins = (env, request) => env.DATA.delete(limiterKey(request));

/** Spend about as long as a real check, so a wrong username looks the same as a wrong password. */
export async function fakeVerify(password) {
  await derive(String(password || ''), new Uint8Array(16), PBKDF2_ITERATIONS);
}
