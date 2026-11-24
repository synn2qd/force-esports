// Force Esports — the whole site as one Cloudflare Worker.
//   /                      public pages, rendered from the stored content
//   /assets/*              static files (served by Cloudflare without running this code)
//   /media/<id>            pictures uploaded in the admin panel
//   /admin                 the admin panel
//   /api/admin/*           what the admin panel talks to
import { renderRoute, renderNotFound } from './render.js';
import { SCHEMA, cleanContent, cleanUrl, loadContent, saveContent, referencedMedia } from './content.js';
import * as auth from './auth.js';
import { adminShell } from './admin-page.js';

const MAX_UPLOAD = 5 * 1024 * 1024;
const BASE_HEADERS = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'x-frame-options': 'DENY',
  'permissions-policy': 'camera=(), microphone=(), geolocation=()',
};
const CSP = "default-src 'self'; img-src 'self' data: blob:; style-src 'self'; script-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

const html = (body, status = 200, cache = 'public, max-age=60') =>
  new Response(body, { status, headers: { ...BASE_HEADERS, 'content-type': 'text/html; charset=utf-8', 'cache-control': cache, 'content-security-policy': CSP } });
const json = (data, status = 200, extra = {}) =>
  new Response(JSON.stringify(data), { status, headers: { ...BASE_HEADERS, 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra } });
const fail = (status, error) => json({ error }, status);

export default {
  async fetch(request, env, ctx) {
    try {
      return await route(request, env, ctx);
    } catch (err) {
      console.error(err && err.stack ? err.stack : err);
      const wantsJson = new URL(request.url).pathname.startsWith('/api/');
      return wantsJson ? fail(500, 'Something went wrong on our side. Try again.') : new Response('Something went wrong. Please try again.', { status: 500, headers: BASE_HEADERS });
    }
  },
};

async function route(request, env, ctx) {
  const url = new URL(request.url);
  let path = url.pathname;
  if (path.length > 1 && path.endsWith('/')) path = path.replace(/\/+$/, '') || '/';

  if (path.startsWith('/api/admin/')) return api(request, env, ctx, url, path.slice('/api/admin/'.length));
  if (path.startsWith('/media/')) return media(request, env, path.slice('/media/'.length));
  if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: BASE_HEADERS });
  if (path === '/admin' || path.startsWith('/admin/')) return html(adminShell(), 200, 'no-store');
  if (path === '/robots.txt') return new Response('User-agent: *\nDisallow: /admin\nDisallow: /api/\n', { headers: { ...BASE_HEADERS, 'content-type': 'text/plain; charset=utf-8' } });

  // old .html addresses from the first version of the site
  const legacy = /^\/(index|shop|roster|accomplishments|about)\.html$/.exec(path);
  if (legacy) return Response.redirect(new URL(legacy[1] === 'index' ? '/' : `/${legacy[1]}`, url).toString(), 301);

  const content = await loadContent(env);
  const page = renderRoute(path, content);
  return page ? html(page) : html(renderNotFound(content), 404, 'no-store');
}

/* -------------------------------------------------------------------- media */
const MEDIA_ID = /^[a-f0-9]{20}\.(webp|jpg|png|gif|avif)$/;
const MEDIA_TYPES = { webp: 'image/webp', jpg: 'image/jpeg', png: 'image/png', gif: 'image/gif', avif: 'image/avif' };

async function media(request, env, id) {
  if (!env.DATA || !MEDIA_ID.test(id)) return new Response('Not found', { status: 404, headers: BASE_HEADERS });
  const body = await env.DATA.get(`media:${id}`, { type: 'arrayBuffer', cacheTtl: 3600 });
  if (!body) return new Response('Not found', { status: 404, headers: BASE_HEADERS });
  return new Response(body, {
    headers: { ...BASE_HEADERS, 'content-type': MEDIA_TYPES[id.split('.').pop()], 'cache-control': 'public, max-age=31536000, immutable', 'content-security-policy': "default-src 'none'; sandbox" },
  });
}

/** Works out the real type of an upload from its first bytes, ignoring what the browser claimed. */
function sniffImage(bytes) {
  const b = bytes;
  const ascii = (from, len) => String.fromCharCode(...b.subarray(from, from + len));
  if (b.length < 12) return '';
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b[0] === 0x89 && ascii(1, 3) === 'PNG') return 'png';
  if (ascii(0, 4) === 'GIF8') return 'gif';
  if (ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') return 'webp';
  if (ascii(4, 4) === 'ftyp' && /^(avif|avis)$/.test(ascii(8, 4))) return 'avif';
  return '';
}

async function storeImage(env, bytes, by) {
  const ext = sniffImage(bytes);
  if (!ext) return { error: 'That file is not a picture we can use. Upload a JPG, PNG, WebP, GIF or AVIF.' };
  if (bytes.length > MAX_UPLOAD) return { error: 'That picture is larger than 5 MB.' };
  const id = `${Array.from(crypto.getRandomValues(new Uint8Array(10)), (x) => x.toString(16).padStart(2, '0')).join('')}.${ext}`;
  await env.DATA.put(`media:${id}`, bytes, { metadata: { by, at: Date.now() } });
  return { path: `/media/${id}` };
}

/** Removes uploads that no saved content points at any more (and that are over a day old). */
async function tidyMedia(env, content) {
  const keep = referencedMedia(content);
  const list = await env.DATA.list({ prefix: 'media:', limit: 1000 });
  const cutoff = Date.now() - 86400000;
  await Promise.all(list.keys.filter((k) => !keep.has(k.name.slice(6)) && (k.metadata?.at || 0) < cutoff).map((k) => env.DATA.delete(k.name)));
}

/* ------------------------------------------------------------ posts from X */
/** Turns X's public post data into the fields an accomplishment uses. */
export function parsePost(data) {
  if (!data || typeof data.text !== 'string') return null;
  const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
  const text = decode(data.text).replace(/\s*https:\/\/t\.co\/\w+\s*$/g, '').trim();
  const photo = data.mediaDetails?.[0]?.media_url_https || data.photos?.[0]?.url || data.video?.poster || '';
  return {
    text,
    date: /^\d{4}-\d{2}-\d{2}/.test(data.created_at || '') ? data.created_at.slice(0, 10) : '',
    video: !!data.video || data.mediaDetails?.[0]?.type === 'video',
    image: /^https:\/\/pbs\.twimg\.com\//.test(photo) ? photo : '',
  };
}

async function fetchPost(env, link, by) {
  const m = /^https:\/\/(?:www\.)?(?:x|twitter)\.com\/[A-Za-z0-9_]{1,15}\/status\/(\d{5,25})/.exec(cleanUrl(link));
  if (!m) return { error: 'That does not look like a link to a post on X.' };
  const token = ((Number(m[1]) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '');
  let post = null;
  try {
    const res = await fetch(`https://cdn.syndication.twimg.com/tweet-result?id=${m[1]}&token=${token}&lang=en`, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; ForceEsportsSite/1.0)' } });
    if (res.ok) post = parsePost(await res.json());
  } catch {
    /* fall through to the message below */
  }
  if (!post) return { error: 'X did not return that post. You can still type the text and upload the picture yourself.' };
  const out = { text: post.text, date: post.date, video: post.video, img: '' };
  if (post.image) {
    try {
      const res = await fetch(`${post.image}?name=large`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      if (res.ok && bytes.length <= MAX_UPLOAD) out.img = (await storeImage(env, bytes, by)).path || '';
    } catch {
      /* the text is still useful without the picture */
    }
  }
  return out;
}

/* ---------------------------------------------------------------------- api */
async function readJson(request) {
  if (Number(request.headers.get('content-length') || 0) > 2_000_000) return null;
  try {
    const data = await request.json();
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null;
  }
}

/** Blocks requests that did not come from the admin panel itself. */
function sameSite(request, url) {
  if (request.headers.get('x-requested-with') !== 'force-admin') return false;
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return false;
  const site = request.headers.get('sec-fetch-site');
  return !site || site === 'same-origin' || site === 'none';
}

async function api(request, env, ctx, url, path) {
  const method = request.method;
  const secure = url.protocol === 'https:';
  if (!env.DATA) return fail(503, 'Storage is not connected yet. The site needs its KV namespace before the admin panel can work.');
  if (method !== 'GET' && !sameSite(request, url)) return fail(403, 'That request was blocked.');

  const session = await auth.currentSession(env, request);

  /* ---- before sign-in ---- */
  if (path === 'state' && method === 'GET') {
    const users = session ? session.users : await auth.loadUsers(env);
    return json({
      setupNeeded: Object.keys(users).length === 0,
      setupEnabled: !!String(env.SETUP_KEY || '').trim(),
      user: session ? auth.publicUser(session.user) : null,
      csrf: session ? session.csrf : null,
    });
  }

  if (path === 'setup' && method === 'POST') {
    const users = await auth.loadUsers(env);
    if (Object.keys(users).length) return fail(409, 'Setup has already been completed.');
    if (!String(env.SETUP_KEY || '').trim()) return fail(403, 'Setup is switched off until a SETUP_KEY is added in Cloudflare.');
    const body = await readJson(request);
    if (!body) return fail(400, 'Fill in every field.');
    if (await auth.loginBlocked(env, request)) return fail(429, 'Too many attempts. Wait 15 minutes and try again.');
    // spaces or line breaks around the key (easy to pick up when pasting) are ignored on both sides
    if (!auth.safeEqual(String(body.key || '').trim(), String(env.SETUP_KEY).trim())) {
      await auth.noteFailedLogin(env, request);
      return fail(403, 'That setup key is not right.');
    }
    const username = auth.normUsername(body.username);
    const problem = auth.checkUsername(username) || auth.checkPassword(body.password);
    if (problem) return fail(400, problem);
    const user = await auth.makeUser({ username, name: auth.cleanName(body.name), password: body.password, role: 'owner' });
    user.lastLogin = new Date().toISOString();
    await auth.saveUsers(env, { [username]: user });
    const started = await auth.startSession(env, user, secure);
    return json({ user: auth.publicUser(user), csrf: started.csrf }, 200, { 'set-cookie': started.cookie });
  }

  if (path === 'login' && method === 'POST') {
    const body = await readJson(request);
    if (!body) return fail(400, 'Enter your username and password.');
    if (await auth.loginBlocked(env, request)) return fail(429, 'Too many attempts. Wait 15 minutes and try again.');
    const users = await auth.loadUsers(env);
    const user = users[auth.normUsername(body.username)];
    const ok = user && !user.disabled ? await auth.verifyPassword(String(body.password || ''), user) : (await auth.fakeVerify(body.password), false);
    if (!ok) {
      await auth.noteFailedLogin(env, request);
      return fail(401, 'That username or password is not right.');
    }
    user.lastLogin = new Date().toISOString();
    ctx.waitUntil(Promise.all([auth.saveUsers(env, users), auth.clearFailedLogins(env, request)]));
    const started = await auth.startSession(env, user, secure);
    return json({ user: auth.publicUser(user), csrf: started.csrf }, 200, { 'set-cookie': started.cookie });
  }

  if (path === 'logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'set-cookie': await auth.endSession(env, request, secure) });
  }

  /* ---- everything below needs a signed-in account ---- */
  if (!session) return fail(401, 'Your session has ended. Sign in again.');
  if (method !== 'GET' && !auth.safeEqual(request.headers.get('x-csrf-token') || '', session.csrf)) return fail(403, 'That request was blocked. Reload the page and try again.');
  const me = session.user;
  const users = session.users;

  if (path === 'content' && method === 'GET') {
    return json({ content: await loadContent(env, { fresh: true }), schema: SCHEMA });
  }

  if (path === 'content' && method === 'PUT') {
    const body = await readJson(request);
    if (!body || typeof body.content !== 'object') return fail(400, 'Nothing to save.');
    const current = await loadContent(env, { fresh: true });
    if (body.content.rev !== current.rev) return fail(409, 'Someone else saved changes while you were editing. Reload to get their version, then make your changes again.');
    const next = cleanContent(body.content);
    next.rev = current.rev + 1;
    next.updatedAt = new Date().toISOString();
    next.updatedBy = me.username;
    await saveContent(env, next);
    ctx.waitUntil(tidyMedia(env, next).catch(() => {}));
    return json({ content: next });
  }

  if (path === 'upload' && method === 'POST') {
    if (Number(request.headers.get('content-length') || 0) > MAX_UPLOAD) return fail(413, 'That picture is larger than 5 MB.');
    const bytes = new Uint8Array(await request.arrayBuffer());
    const stored = await storeImage(env, bytes, me.username);
    return stored.error ? fail(400, stored.error) : json(stored);
  }

  if (path === 'fetch-post' && method === 'POST') {
    const body = await readJson(request);
    const result = await fetchPost(env, body && body.url, me.username);
    return result.error ? fail(422, result.error) : json(result);
  }

  if (path === 'password' && method === 'POST') {
    const body = await readJson(request);
    if (!body) return fail(400, 'Fill in both fields.');
    if (!(await auth.verifyPassword(String(body.current || ''), me))) return fail(403, 'Your current password is not right.');
    const problem = auth.checkPassword(body.next);
    if (problem) return fail(400, problem);
    Object.assign(me, await auth.hashPassword(body.next), { pwv: me.pwv + 1 });
    await auth.saveUsers(env, users);
    const started = await auth.startSession(env, me, secure); // other devices are signed out; this one stays in
    return json({ ok: true, csrf: started.csrf }, 200, { 'set-cookie': started.cookie });
  }

  /* ---- accounts: owners only ---- */
  if (path === 'users' || path.startsWith('users/')) {
    if (me.role !== 'owner') return fail(403, 'Only an owner can manage accounts.');
    const list = () => Object.values(users).sort((a, b) => a.created.localeCompare(b.created)).map(auth.publicUser);

    if (path === 'users' && method === 'GET') return json({ users: list() });

    if (path === 'users' && method === 'POST') {
      const body = await readJson(request);
      if (!body) return fail(400, 'Fill in every field.');
      const username = auth.normUsername(body.username);
      const role = auth.ROLES.includes(body.role) ? body.role : 'editor';
      const problem = auth.checkUsername(username) || auth.checkPassword(body.password);
      if (problem) return fail(400, problem);
      if (users[username]) return fail(409, 'That username is already taken.');
      if (Object.keys(users).length >= 50) return fail(400, 'There is a limit of 50 accounts.');
      users[username] = await auth.makeUser({ username, name: auth.cleanName(body.name), password: body.password, role });
      await auth.saveUsers(env, users);
      return json({ users: list() });
    }

    const target = users[auth.normUsername(decodeURIComponent(path.slice('users/'.length)))];
    if (!target) return fail(404, 'That account no longer exists.');
    const lastOwner = target.role === 'owner' && !target.disabled && auth.activeOwners(users) === 1;

    if (method === 'PATCH') {
      const body = await readJson(request);
      if (!body) return fail(400, 'Nothing to change.');
      if (body.name !== undefined) target.name = auth.cleanName(body.name) || target.username;
      if (body.role !== undefined && body.role !== target.role) {
        if (!auth.ROLES.includes(body.role)) return fail(400, 'That role does not exist.');
        if (lastOwner) return fail(400, 'There has to be at least one owner.');
        target.role = body.role;
      }
      if (body.disabled !== undefined && !!body.disabled !== !!target.disabled) {
        if (body.disabled && lastOwner) return fail(400, 'There has to be at least one owner.');
        if (body.disabled && target.username === me.username) return fail(400, 'You cannot disable your own account.');
        target.disabled = !!body.disabled;
        target.pwv += 1; // ends every session that account has open
      }
      if (body.password !== undefined) {
        const problem = auth.checkPassword(body.password);
        if (problem) return fail(400, problem);
        Object.assign(target, await auth.hashPassword(body.password), { pwv: target.pwv + 1 });
      }
      await auth.saveUsers(env, users);
      return json({ users: list() });
    }

    if (method === 'DELETE') {
      if (target.username === me.username) return fail(400, 'You cannot delete your own account.');
      if (lastOwner) return fail(400, 'There has to be at least one owner.');
      delete users[target.username];
      await auth.saveUsers(env, users);
      return json({ users: list() });
    }
  }

  return fail(404, 'Not found.');
}
