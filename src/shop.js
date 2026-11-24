// Selling on the site. Stripe's hosted checkout page takes the payment, so no card details ever touch this site.
// Stripe then calls /api/stripe/webhook with a signed message, and that message (not the thank-you page) is what
// records an order: a buyer can pay and close the tab, and the order is still stored.
import Stripe from 'stripe';

const API_VERSION = '2026-11-18.endive';
const INTEGRATION_ID = 'force_shop_checkout_kqzvmrtb';   // labels these checkouts in the Stripe dashboard
export const MAX_QTY = 10;
const FULFILMENT = ['new', 'sent', 'shipped', 'cancelled'];

const clean = (v, max) => String(v ?? '').replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
const secret = (env, name) => String(env[name] || '').trim();

/** Selling needs both the API key and the webhook signing secret: without the second, orders could not be recorded. */
export const stripeReady = (env) => !!(secret(env, 'STRIPE_SECRET_KEY') && secret(env, 'STRIPE_WEBHOOK_SECRET'));
export function shopStatus(env) {
  const key = secret(env, 'STRIPE_SECRET_KEY');
  return { key: !!key, webhook: !!secret(env, 'STRIPE_WEBHOOK_SECRET'), ready: stripeReady(env), mode: !key ? 'off' : /^(rk|sk)_live_/.test(key) ? 'live' : 'test' };
}

function client(env) {
  const opts = { apiVersion: API_VERSION, httpClient: Stripe.createFetchHttpClient(), maxNetworkRetries: 1 };
  const base = secret(env, 'STRIPE_API_BASE');   // local testing only: points the library at a stand-in for Stripe; never honoured with a live key
  if (base && !/^(rk|sk)_live_/.test(secret(env, 'STRIPE_SECRET_KEY'))) { const u = new URL(base); opts.host = u.hostname; opts.port = u.port || (u.protocol === 'https:' ? 443 : 80); opts.protocol = u.protocol.replace(':', ''); }
  return new Stripe(secret(env, 'STRIPE_SECRET_KEY'), opts);
}

/* ------------------------------------------------------------ product facts */
/** "$59.99", "59.99" or "1,299" as a whole number of cents; 0 when it is not a usable price. */
export function priceCents(text) {
  const m = /^\s*[^\d\s]{0,3}\s*(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d{1,2}))?\s*[^\d]{0,4}\s*$/.exec(String(text || ''));
  if (!m) return 0;
  const cents = Number(m[1].replace(/,/g, '')) * 100 + Number((m[2] || '0').padEnd(2, '0'));
  return cents >= 50 && cents <= 1000000 ? cents : 0;
}
export const sizesOf = (p) => [...new Set(String(p.sizes || '').split(',').map((s) => clean(s, 16)).filter(Boolean))].slice(0, 14);
export const countriesOf = (shop) => { const list = [...new Set(String((shop && shop.countries) || '').toUpperCase().split(/[\s,]+/).filter((c) => /^[A-Z]{2}$/.test(c)))].slice(0, 60); return list.length ? list : ['US']; };
export const currencyOf = (shop) => (shop && shop.currency) || 'usd';
export const money = (cents, currency) => new Intl.NumberFormat('en-US', { style: 'currency', currency: String(currency || 'usd').toUpperCase() }).format(cents / 100);
/** A product is sold here when it is switched on, has a real price, and Stripe is connected. */
export const canSell = (p, shopOn) => !!(shopOn && p && p.sell && priceCents(p.price));

/* ----------------------------------------------------------------- checkout */
async function tooMany(env, ip) {
  const key = `rl:checkout:${ip || 'unknown'}`, n = Number((await env.DATA.get(key)) || 0);
  if (n >= 20) return true;
  await env.DATA.put(key, String(n + 1), { expirationTtl: 600 });
  return false;
}

/** Starts a Stripe checkout for one product. Everything about the price comes from the saved content, never from the browser. */
export async function createCheckout(env, content, origin, body, ip) {
  if (!stripeReady(env)) return { status: 503, error: 'The shop is not taking orders yet.' };
  const p = content.products.find((x) => x.id === body.product);
  if (!canSell(p, true)) return { status: 400, error: 'That product is not on sale right now.' };
  const sizes = sizesOf(p), size = clean(body.size, 16);
  if (sizes.length && !sizes.includes(size)) return { status: 400, error: 'Choose a size.' };
  const qty = Number(body.qty);
  if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return { status: 400, error: `Choose a quantity from 1 to ${MAX_QTY}.` };
  const customText = p.custom ? clean(body.custom, 40) : '';
  if (await tooMany(env, ip)) return { status: 429, error: 'Too many checkouts were started from here. Wait a few minutes and try again.' };

  const currency = currencyOf(content.shop), shipping = priceCents(content.shop.shipping), secure = origin.startsWith('https://');
  const name = sizes.length ? `${p.name} (${size})` : p.name;
  const params = {
    mode: 'payment',
    line_items: [{
      quantity: qty,
      price_data: {
        currency,
        unit_amount: priceCents(p.price),
        product_data: { name, ...(customText ? { description: `${p.custom}: ${customText}` } : {}), ...(secure && p.img ? { images: [origin + p.img] } : {}) },
      },
    }],
    shipping_address_collection: { allowed_countries: countriesOf(content.shop) },
    ...(shipping ? { shipping_options: [{ shipping_rate_data: { type: 'fixed_amount', display_name: 'Shipping', fixed_amount: { amount: shipping, currency } } }] } : {}),
    phone_number_collection: { enabled: true },
    metadata: { product_id: p.id, product_name: p.name, size, custom_label: customText ? p.custom : '', custom_text: customText, quantity: String(qty) },
    success_url: `${origin}/shop/thanks`,
    cancel_url: `${origin}/shop/${p.id}`,
    integration_identifier: INTEGRATION_ID,
  };
  try {
    const session = await client(env).checkout.sessions.create(params);
    return session && session.url ? { url: session.url } : { status: 502, error: 'Checkout could not be started. Try again in a moment.' };
  } catch (err) {
    console.error('checkout failed:', err && err.message ? err.message : err);
    return { status: 502, error: 'Checkout could not be started. Try again in a moment.' };
  }
}

/* ------------------------------------------------------------------- orders */
const orderKey = (session) => `order:${String(9999999999 - Number(session.created || 0)).padStart(10, '0')}:${session.id}`;   // newest first when listed
const summary = (o) => ({ created: o.created, status: o.status, fulfilment: o.fulfilment, total: o.total, currency: o.currency, item: `${o.item.name}${o.item.size ? ` (${o.item.size})` : ''}`.slice(0, 80), qty: o.item.quantity, customer: (o.customer.name || '').slice(0, 60) });
const saveOrder = (env, key, o) => env.DATA.put(key, JSON.stringify(o), { metadata: summary(o) });

/** Writes or updates the order for a checkout session. Running it twice for the same session changes nothing that staff set. */
async function recordOrder(env, session, status) {
  const meta = session.metadata || {};
  if (!meta.product_id) return;   // not a checkout this site started
  const key = orderKey(session), old = await env.DATA.get(key, { type: 'json' });
  if (old && old.status === 'paid' && status !== 'paid') return;   // a late or repeated message never downgrades a paid order
  const ship = (session.collected_information && session.collected_information.shipping_details) || session.shipping_details || {}, addr = ship.address || {}, who = session.customer_details || {};
  await saveOrder(env, key, {
    id: session.id,
    number: String(session.id).slice(-8).toUpperCase(),
    created: new Date(Number(session.created || 0) * 1000).toISOString(),
    status,
    fulfilment: old ? old.fulfilment : 'new',
    note: old ? old.note : '',
    live: !!session.livemode,
    item: { id: clean(meta.product_id, 60), name: clean(meta.product_name, 60), size: clean(meta.size, 16), customLabel: clean(meta.custom_label, 40), customText: clean(meta.custom_text, 40), quantity: Number(meta.quantity) || 1 },
    total: Number(session.amount_total) || 0,
    shipping: Number((session.total_details && session.total_details.amount_shipping) || 0),
    currency: clean(session.currency, 3) || 'usd',
    customer: { name: clean(who.name || ship.name, 80), email: clean(who.email, 120), phone: clean(who.phone, 30) },
    shipTo: { name: clean(ship.name || who.name, 80), line1: clean(addr.line1, 120), line2: clean(addr.line2, 120), city: clean(addr.city, 80), state: clean(addr.state, 40), postcode: clean(addr.postal_code, 20), country: clean(addr.country, 2) },
    payment: clean(typeof session.payment_intent === 'string' ? session.payment_intent : '', 80),
    updated: new Date().toISOString(),
  });
}

/** Stripe's messages. Each one is checked against the signing secret before anything in it is trusted. */
export async function webhook(request, env) {
  const reply = (status, text) => new Response(text, { status, headers: { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' } });
  if (request.method !== 'POST') return reply(405, 'Method not allowed');
  if (!stripeReady(env) || !env.DATA) return reply(503, 'Not set up');
  const signature = request.headers.get('stripe-signature') || '', raw = await request.text();
  let event;
  try {
    event = await client(env).webhooks.constructEventAsync(raw, signature, secret(env, 'STRIPE_WEBHOOK_SECRET'), undefined, Stripe.createSubtleCryptoProvider());
  } catch {
    return reply(400, 'Signature check failed');
  }
  const session = event.data && event.data.object;
  if (session && session.object === 'checkout.session') {
    // paid straight away for cards; slower methods arrive as "completed" while unpaid, then succeed or fail later
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await recordOrder(env, session, session.payment_status === 'unpaid' ? 'awaiting_payment' : 'paid');
    else if (event.type === 'checkout.session.async_payment_failed') await recordOrder(env, session, 'payment_failed');
  }
  return reply(200, 'ok');
}

export async function listOrders(env) {
  const page = await env.DATA.list({ prefix: 'order:', limit: 200 });
  const orders = (await Promise.all(page.keys.map((k) => env.DATA.get(k.name, { type: 'json' }).then((o) => (o ? { key: k.name.slice(6), ...o } : null))))).filter(Boolean);
  return { orders, more: !page.list_complete };
}
export async function updateOrder(env, key, body) {
  if (!/^\d{10}:cs_[A-Za-z0-9_]{6,200}$/.test(key)) return null;
  const o = await env.DATA.get(`order:${key}`, { type: 'json' });
  if (!o) return null;
  if (FULFILMENT.includes(body.fulfilment)) o.fulfilment = body.fulfilment;
  if (body.note !== undefined) o.note = clean(body.note, 300);
  o.updated = new Date().toISOString();
  await saveOrder(env, `order:${key}`, o);
  return { key, ...o };
}
export async function deleteOrder(env, key) {
  if (!/^\d{10}:cs_[A-Za-z0-9_]{6,200}$/.test(key)) return false;
  await env.DATA.delete(`order:${key}`);
  return true;
}
