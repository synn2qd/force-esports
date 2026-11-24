// Public pages, rendered from the site content on every request.
import { canSell, sizesOf, priceCents, countriesOf, currencyOf, money, MAX_QTY } from './shop.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const handleOf = (url) => '@' + String(url || '').replace(/[?#].*$/, '').replace(/\/+$/, '').split('/').pop();
const fmtDate = (iso) => (iso ? new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }) : '');
const byDate = (list) => [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const discordLabel = (url) => String(url || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');

/* ------------------------------------------------------------------ icons */
const svg = (body, extra = '') => `<svg viewBox="0 0 24 24" aria-hidden="true"${extra}>${body}</svg>`;
const stroke = (d) => svg(`<path d="${d}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICON = {
  x: svg('<path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>'),
  discord: svg('<path fill="currentColor" d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.028C.533 9.046-.32 13.58.099 18.058a.082.082 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .079.009c.12.099.246.198.373.292a.077.077 0 0 1-.007.128 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.04.107c.36.698.772 1.363 1.225 1.993a.076.076 0 0 0 .084.029 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.029ZM8.02 15.331c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.086-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.332-.946 2.418-2.157 2.418Z"/>'),
  arrow: stroke('M5 12h14M13 6l6 6-6 6'),
  up: stroke('M7 17 17 7M9 7h8v8'),
  down: stroke('m6 9 6 6 6-6'),
  prev: stroke('m15 6-6 6 6 6'),
  next: stroke('m9 6 6 6-6 6'),
  pause: svg('<path fill="currentColor" d="M7 5h3.2v14H7zm6.8 0H17v14h-3.2z"/>'),
  play: svg('<path fill="currentColor" d="M8 5.2v13.6L19 12z"/>'),
  menu: stroke('M4 8h16M4 16h16'),
  close: stroke('m6 6 12 12M18 6 6 18'),
};

const ART = {
  jersey:
    '<svg class="garment" viewBox="0 0 400 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M150 48 82 76 28 150l52 42 30-34v214h180V158l30 34 52-42-54-74-68-28c-8 26-28 40-50 40s-42-14-50-40Z"/><path d="M150 48c10 16 28 24 50 24s40-8 50-24" opacity=".55"/><path d="M110 330h180M110 346h180" opacity=".3"/><path d="M80 192 52 170M320 192l28-22" opacity=".3"/></g></svg>',
  jacket:
    '<svg class="garment" viewBox="0 0 400 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M160 44 96 70c-30 14-44 40-50 78L26 330l50 10 22-150v184h204V190l22 150 50-10-20-182c-6-38-20-64-50-78l-64-26-40 46Z"/><path d="M160 44 200 90l40-46" opacity=".55"/><path d="M200 90v284"/><path d="M98 352h204" opacity=".3"/><path d="M128 250h44M228 250h44" opacity=".3"/><path d="m46 300 46 9M354 300l-46 9" opacity=".3"/></g></svg>',
  none: '',
};

/* ---------------------------------------------------------------- buttons */
function btn(label, href, o = {}) {
  const cls = ['btn', `btn-${o.kind || 'primary'}`, o.size ? `btn-${o.size}` : '', o.block ? 'btn-block' : ''].filter(Boolean).join(' ');
  const ext = o.ext ? ' target="_blank" rel="noopener"' : '';
  const lead = o.icon ? `<i class="btn-ico">${o.icon}</i>` : '';
  const tail = o.arrow === false ? '' : `<i class="btn-arrow">${o.ext ? ICON.up : ICON.arrow}</i>`;
  return `<a class="${cls}" href="${esc(href)}"${ext}${o.attrs || ''}>${lead}<span>${esc(label)}</span>${tail}</a>`;
}
const discordBtn = (c, o = {}) => (c.site.discordUrl ? btn(o.label || 'Join the Discord', c.site.discordUrl, { ext: true, icon: ICON.discord, ...o }) : '');
const xBtn = (c, o = {}) => (c.site.xUrl ? btn(o.label || handleOf(c.site.xUrl), c.site.xUrl, { kind: 'ghost', ext: true, icon: ICON.x, ...o }) : '');

/* ----------------------------------------------------------------- layout */
function header(c, active) {
  const nav = [
    { href: '/shop', label: 'Shop', key: 'shop' },
    { href: '/roster', label: 'Roster', key: 'roster', children: c.rosters.map((r) => ({ href: `/roster#${r.id}`, label: r.label })) },
    { href: '/accomplishments', label: 'Accomplishments', key: 'accomplishments' },
    { href: '/about', label: 'About', key: 'about' },
  ];
  const items = nav
    .map((n) => {
      const cur = n.key === active ? ' aria-current="page"' : '';
      if (!n.children || n.children.length < 2) return `<li><a href="${n.href}"${cur}>${n.label}</a></li>`;
      return `<li class="has-menu"><a href="${n.href}"${cur}>${n.label}<i class="caret">${ICON.down}</i></a><ul class="menu">${n.children.map((k) => `<li><a href="${esc(k.href)}">${esc(k.label)}</a></li>`).join('')}</ul></li>`;
    })
    .join('');
  const bar = c.site.announcement
    ? `<div class="topbar">${c.site.announcementUrl ? `<a href="${esc(c.site.announcementUrl)}" target="_blank" rel="noopener">` : '<p>'}<span class="dot"></span><span>${esc(c.site.announcement)}</span>${c.site.announcementUrl ? `<i>${ICON.arrow}</i></a>` : '</p>'}</div>`
    : '';
  return `${bar}
<header class="header">
  <div class="wrap header-in">
    <a class="brand" href="/" aria-label="${esc(c.site.name)} home"><img src="/assets/img/logo.png" alt="" width="296" height="226"><span>${esc(c.site.short)}</span></a>
    <nav class="nav" id="site-nav" aria-label="Main"><ul>${items}</ul><div class="nav-extra">${discordBtn(c, { block: true })}${xBtn(c, { block: true })}</div></nav>
    <div class="header-actions">
      ${c.site.xUrl ? `<a class="icon-btn" href="${esc(c.site.xUrl)}" target="_blank" rel="noopener" aria-label="${esc(c.site.name)} on X">${ICON.x}</a>` : ''}
      ${discordBtn(c, { label: 'Join Discord', size: 'sm', arrow: false })}
      <button class="icon-btn nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu"><span class="open">${ICON.menu}</span><span class="shut">${ICON.close}</span></button>
    </div>
  </div>
</header>`;
}

function footer(c) {
  const col = (title, links) =>
    `<div class="fcol"><h2>${title}</h2><ul>${links.map(([l, h, ext]) => `<li><a href="${esc(h)}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l)}</a></li>`).join('')}</ul></div>`;
  const follow = [];
  if (c.site.discordUrl) follow.push(['Discord', c.site.discordUrl, true]);
  if (c.site.xUrl) follow.push([`X · ${handleOf(c.site.xUrl)}`, c.site.xUrl, true]);
  return `<footer class="footer">
  <div class="wrap">
    <div class="fgrid">
      <div class="fabout">
        <a class="brand" href="/"><img src="/assets/img/logo.png" alt="" width="296" height="226"><span>${esc(c.site.short)}</span></a>
        <p>${esc(c.site.name)} is a competitive ${esc(c.site.game || 'esports')} organisation. ${esc(c.site.tagline)}.</p>
        <div class="btn-row">${discordBtn(c, { size: 'sm' })}${xBtn(c, { size: 'sm' })}</div>
      </div>
      ${col('Shop', c.products.slice(0, 6).map((p) => [p.name, '/shop']))}
      ${col('Explore', [['Home', '/'], ['Roster', '/roster'], ['Accomplishments', '/accomplishments'], [`About ${c.site.short}`, '/about']])}
      ${col('Roster', c.rosters.map((r) => [r.title || r.label, `/roster#${r.id}`]))}
      ${follow.length ? col('Follow', follow) : ''}
    </div>
  </div>
  <p class="watermark" aria-hidden="true">${esc(c.site.hashtag)}</p>
  <div class="legal"><div class="wrap"><p>© <span data-year>2026</span> ${esc(c.site.name)}</p><p>${esc(c.site.tagline)}</p></div></div>
</footer>`;
}

function page(c, { title, description, active, body }) {
  const full = title ? `${title} – ${c.site.name}` : `${c.site.name} | ${c.site.tagline}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0a0a0a">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="/assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
${c.site.xUrl ? `<meta name="twitter:site" content="${esc(handleOf(c.site.xUrl))}">` : ''}
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/anton-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/geist-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(c, active)}
<main id="main">
${body}
</main>
${footer(c)}
<script src="/assets/js/site.js" defer></script>
</body>
</html>
`;
}

/* ------------------------------------------------------------- components */
const secHead = (kicker, title, action = '') =>
  `<div class="sec-head"><div>${kicker ? `<p class="kicker">${esc(kicker)}</p>` : ''}<h2>${esc(title)}</h2></div>${action}</div>`;

const productMedia = (p) => (p.img ? `<img class="product-photo" src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy">` : `<span class="product-mark" aria-hidden="true"><img src="/assets/img/logo.png" alt="" loading="lazy"></span>${ART[p.art] || ''}`);
const priceText = (c, p) => (priceCents(p.price) ? money(priceCents(p.price), currencyOf(c.shop)) : p.price);

// A product sold on the site opens its own page; one sold elsewhere opens that store; anything else is just shown.
function productCard(c, p) {
  const here = canSell(p, c.shopOn);
  const inner = `<div class="product-media${p.img ? ' has-photo' : ''}">${productMedia(p)}${p.status ? `<span class="chip">${esc(p.status)}</span>` : ''}</div>
  <div class="product-meta"><div><h3>${esc(p.name)}</h3><p>${esc(here ? priceText(c, p) : p.price || p.status || '')}</p></div>${here ? `<span class="btn btn-ghost btn-sm"><span>Buy now</span><i class="btn-arrow">${ICON.arrow}</i></span>` : p.url ? `<span class="btn btn-ghost btn-sm"><span>Shop now</span><i class="btn-arrow">${ICON.up}</i></span>` : ''}</div>`;
  if (here) return `<a class="card product" href="/shop/${esc(p.id)}">${inner}</a>`;
  return p.url ? `<a class="card product" href="${esc(p.url)}" target="_blank" rel="noopener">${inner}</a>` : `<article class="card product">${inner}</article>`;
}

const personCard = (m) => `<article class="card person">
  <div class="person-img">${m.img ? `<img src="${esc(m.img)}" alt="${esc(m.name)}" loading="lazy">` : `<span class="person-blank" aria-hidden="true">${esc((m.name || '?').slice(0, 1))}</span>`}</div>
  <div class="person-body">
    ${m.role ? `<p class="role">${esc(m.role)}</p>` : ''}
    <h3>${esc(m.name)}</h3>
    ${m.x ? `<a class="btn btn-ghost btn-social btn-block" href="${esc(m.x)}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on X, ${esc(handleOf(m.x))}"><i class="btn-ico">${ICON.x}</i><span>${esc(handleOf(m.x))}</span><i class="btn-arrow">${ICON.up}</i></a>` : ''}
  </div>
</article>`;

const newsCard = (a) => `<a class="card news" href="/accomplishments#${esc(a.id)}">
  <div class="news-img">${a.img ? `<img src="${esc(a.img)}" alt="${esc(a.imgAlt)}" loading="lazy">` : ''}${a.kicker ? `<span class="chip chip-dark">${esc(a.kicker)}</span>` : ''}</div>
  <div class="news-body">
    <time datetime="${esc(a.date)}">${fmtDate(a.date)}</time>
    <h3>${esc(a.title)}</h3>
    <p>${esc(a.summary)}</p>
    <span class="news-more">Read more<i>${ICON.arrow}</i></span>
  </div>
</a>`;

/** A post from X drawn in the site's own style: no third-party script, same look everywhere. */
function postCard(c, a) {
  if (!a.postText && !a.img) return '';
  const who = handleOf(c.site.xUrl || a.postUrl.replace(/\/status\/.*$/, ''));
  const text = esc(a.postText)
    .replace(/(^|[\s(])@([A-Za-z0-9_]{1,15})/g, (m, p, h) => `${p}<a href="https://x.com/${h}" target="_blank" rel="noopener">@${h}</a>`)
    .replace(/(^|[\s(])#([A-Za-z0-9_]{1,50})/g, (m, p, h) => `${p}<a href="https://x.com/hashtag/${h}" target="_blank" rel="noopener">#${h}</a>`);
  const media = a.img ? `<img src="${esc(a.img)}" alt="${esc(a.imgAlt)}" loading="lazy">${a.postVideo ? `<span class="post-play">${ICON.play}<b>Watch on X</b></span>` : ''}` : '';
  return `<article class="post">
  <header class="post-head">
    <img class="post-avatar" src="/assets/img/apple-touch-icon.png" alt="" width="180" height="180">
    <div class="post-who"><strong>${esc(c.site.short)}</strong><span>${esc(who)}</span></div>
    ${a.postUrl ? `<a class="icon-btn post-x" href="${esc(a.postUrl)}" target="_blank" rel="noopener" aria-label="Open this post on X">${ICON.x}</a>` : `<span class="icon-btn post-x">${ICON.x}</span>`}
  </header>
  ${a.postText ? `<p class="post-text">${text}</p>` : ''}
  ${media ? (a.postUrl ? `<a class="post-media" href="${esc(a.postUrl)}" target="_blank" rel="noopener" aria-label="Open this post on X">${media}</a>` : `<div class="post-media">${media}</div>`) : ''}
  <footer class="post-foot"><time datetime="${esc(a.date)}">${fmtDate(a.date)}</time>${a.postUrl ? `<a class="post-link" href="${esc(a.postUrl)}" target="_blank" rel="noopener">View on X<i>${ICON.up}</i></a>` : ''}</footer>
</article>`;
}

const pageHero = (kicker, title, text, img) => `<section class="phero${img ? ' phero-img' : ''}">
  ${img ? `<img class="phero-bg" src="${esc(img)}" alt="">` : ''}
  <div class="wrap phero-in"><p class="kicker">${esc(kicker)}</p><h1>${esc(title)}</h1>${text ? `<p class="lede">${esc(text)}</p>` : ''}</div>
</section>`;

const discordBand = (c) =>
  c.site.discordUrl
    ? `<section class="sec">
  <div class="wrap">
    <div class="join">
      <div class="join-text">
        <p class="kicker">Community</p>
        <h2>${esc(c.site.discordTitle || 'Join the Discord')}</h2>
        <p>${esc(c.site.discordText)}</p>
        <div class="btn-row">${discordBtn(c, { size: 'lg' })}${xBtn(c, { size: 'lg', label: `Follow ${handleOf(c.site.xUrl)}` })}</div>
      </div>
      <a class="join-badge" href="${esc(c.site.discordUrl)}" target="_blank" rel="noopener" aria-label="Open the Discord invite">${ICON.discord}<span>${esc(discordLabel(c.site.discordUrl))}</span></a>
    </div>
  </div>
</section>`
    : '';

/* ------------------------------------------------------------------ pages */
function home(c) {
  const all = byDate(c.accomplishments);
  const slides = all.filter((a) => a.featured && a.img).slice(0, 5);
  const hero = slides.length
    ? `<section class="hero" aria-roledescription="carousel" aria-label="Latest from ${esc(c.site.short)}">
  <div class="slides">
    ${slides
      .map(
        (a, i) => `<article class="slide slide-${a.heroLayout === 'tall' ? 'tall' : 'wide'}${i === 0 ? ' is-active' : ''}" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}"${i === 0 ? '' : ' aria-hidden="true"'}>
      <img class="slide-img" src="${esc(a.img)}" alt="${esc(a.imgAlt)}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>
      <div class="wrap slide-cap">
        <p class="kicker">${esc(a.kicker)}${a.kicker && a.date ? ' · ' : ''}<time datetime="${esc(a.date)}">${fmtDate(a.date)}</time></p>
        <h2>${esc(a.title)}</h2>
        <p class="slide-sum">${esc(a.summary)}</p>
        <div class="btn-row">${btn('Read more', `/accomplishments#${a.id}`, i === 0 ? {} : { attrs: ' tabindex="-1"' })}</div>
      </div>
    </article>`
      )
      .join('\n    ')}
  </div>
  ${
    slides.length > 1
      ? `<div class="wrap hero-ctrl">
    <div class="hero-bars" aria-hidden="true">${slides.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ''}><i></i></span>`).join('')}</div>
    <button class="round" type="button" data-hero="prev" aria-label="Previous slide">${ICON.prev}</button>
    <button class="round" type="button" data-hero="next" aria-label="Next slide">${ICON.next}</button>
    <button class="round" type="button" data-hero="toggle" aria-label="Pause slideshow"><span class="i-pause">${ICON.pause}</span><span class="i-play">${ICON.play}</span></button>
  </div>`
      : ''
  }
</section>`
    : pageHero(c.site.tagline, c.site.name, c.site.about);

  const ticker = [c.site.hashtag, c.site.tagline, `${c.site.game} competitive`, 'Compete · Improve · Dominate'].filter(Boolean);
  const tiles = c.rosters
    .map(
      (r) => `<a class="card tile" href="/roster#${esc(r.id)}">
  <div class="tile-img">${r.members.filter((m) => m.img).slice(0, 3).map((m) => `<img src="${esc(m.img)}" alt="" loading="lazy">`).join('')}<span class="tile-name">${esc(r.label)}</span></div>
  <div class="tile-meta"><div><h3>${esc(r.title || r.label)}</h3><p>${plural(r.members.length, 'member')}</p></div><span class="round round-sm" aria-hidden="true">${ICON.arrow}</span></div>
</a>`
    )
    .join('\n');

  return page(c, {
    title: '',
    description: `${c.site.name} is a competitive ${c.site.game} organisation. ${c.site.tagline}.`,
    active: 'home',
    body: `${hero}
<div class="ticker" aria-hidden="true"><div class="track">${Array(4).fill(ticker.map((t) => `<span>${esc(t)}</span>`).join('')).join('')}</div></div>
${
  c.products.length
    ? `<section class="sec">
  <div class="wrap">
    ${secHead('Merch', 'From the shop', btn('All products', '/shop', { kind: 'ghost', size: 'sm' }))}
    <div class="grid grid-2">${c.products.slice(0, 2).map((p) => productCard(c, p)).join('\n')}</div>
  </div>
</section>`
    : ''
}
${
  c.rosters.length
    ? `<section class="sec sec-alt">
  <div class="wrap">
    ${secHead('The team', `${c.site.short} roster`, btn('View roster', '/roster', { kind: 'ghost', size: 'sm' }))}
    <div class="grid grid-2">${tiles}</div>
  </div>
</section>`
    : ''
}
${
  all.length
    ? `<section class="sec">
  <div class="wrap">
    ${secHead('Latest', 'Accomplishments', btn('View all', '/accomplishments', { kind: 'ghost', size: 'sm' }))}
    <div class="grid grid-3">${all.slice(0, 3).map(newsCard).join('\n')}</div>
  </div>
</section>`
    : ''
}
${discordBand(c)}
<section class="sec sec-alt">
  <div class="wrap about-cta">
    <div><p class="kicker">About ${esc(c.site.short)}</p><h2>Compete. Improve. Dominate.</h2></div>
    <div><p>${esc(c.site.about)}</p><div class="btn-row">${btn('Meet the team', '/about')}${btn('See the roster', '/roster', { kind: 'ghost' })}</div></div>
  </div>
</section>`,
  });
}

function shop(c) {
  return page(c, {
    title: 'Shop',
    description: `Official ${c.site.name} merch.`,
    active: 'shop',
    body: `${pageHero('Official merch', 'Shop', `${plural(c.products.length, 'product')} in the first ${c.site.short} collection.`)}
<section class="sec">
  <div class="wrap">
    <div class="grid grid-3">
      ${c.products.map((p) => productCard(c, p)).join('\n')}
      <div class="card promo">
        <p class="kicker">Drop alerts</p>
        <h2>Be first when it lands</h2>
        <p>Release dates are announced in the Discord before anywhere else.</p>
        <div class="btn-row">${discordBtn(c)}${c.site.discordUrl ? '' : xBtn(c)}</div>
      </div>
    </div>
  </div>
</section>`,
  });
}

function roster(c) {
  const many = c.rosters.length > 1;
  return page(c, {
    title: 'Roster',
    description: `The ${c.site.name} roster.`,
    active: 'roster',
    body: `${pageHero(`${c.site.short} roster`, 'Roster', `The players competing for ${c.site.short} and the creators who represent it.`, '/assets/img/media/roster-reveal.webp')}
<section class="sec sec-tight">
  <div class="wrap">
    ${
      many
        ? `<div class="switch" role="tablist" aria-label="Choose a roster">
      ${c.rosters.map((r, i) => `<button type="button" role="tab" id="tab-${esc(r.id)}" aria-controls="panel-${esc(r.id)}" aria-selected="${i === 0}" data-roster="${esc(r.id)}"${i === 0 ? '' : ' tabindex="-1"'}><span>${esc(r.label)}</span><b>${r.members.length}</b></button>`).join('')}
    </div>`
        : ''
    }
    ${c.rosters
      .map(
        (r, i) => `<div class="rpanel" id="panel-${esc(r.id)}"${many ? ` role="tabpanel" aria-labelledby="tab-${esc(r.id)}"` : ''}${i === 0 ? '' : ' hidden'}>
      <div class="sec-head"><div><h2>${esc(r.title || r.label)}</h2>${r.blurb ? `<p class="sub">${esc(r.blurb)}</p>` : ''}</div></div>
      ${r.members.length ? `<div class="grid grid-people">${r.members.map(personCard).join('\n')}</div>` : '<p class="empty">This roster will be announced soon.</p>'}
    </div>`
      )
      .join('\n    ')}
  </div>
</section>
${discordBand(c)}`,
  });
}

function accomplishments(c) {
  const all = byDate(c.accomplishments);
  return page(c, {
    title: 'Accomplishments',
    description: `Results, signings and milestones from ${c.site.name}.`,
    active: 'accomplishments',
    body: `${pageHero(c.site.name, 'Accomplishments', `Results, signings and milestones from ${c.site.name}.`)}
<section class="sec sec-tight">
  <div class="wrap acc-list">
    ${
      all.length
        ? all
            .map(
              (a, i) => `<article class="acc" id="${esc(a.id)}">
      <div class="acc-text">
        <p class="acc-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
        <p class="kicker">${esc(a.kicker)}${a.kicker && a.date ? ' · ' : ''}<time datetime="${esc(a.date)}">${fmtDate(a.date)}</time></p>
        <h2>${esc(a.title)}</h2>
        <p class="acc-body">${esc(a.body || a.summary)}</p>
        ${a.results.length ? `<ul class="places">${a.results.map((r) => `<li><strong>${esc(r.place)}</strong><span>${esc(r.who)}</span></li>`).join('')}</ul>` : ''}
        ${a.postUrl ? `<div class="btn-row">${btn('View post on X', a.postUrl, { kind: 'ghost', ext: true, icon: ICON.x })}</div>` : ''}
      </div>
      <div class="acc-post">${postCard(c, a)}</div>
    </article>`
            )
            .join('\n    ')
        : '<p class="empty">Nothing here yet. Check back soon.</p>'
    }
  </div>
</section>
${discordBand(c)}`,
  });
}

function about(c) {
  const people = c.rosters.reduce((n, r) => n + r.members.length, 0);
  return page(c, {
    title: 'About',
    description: `About ${c.site.name} and the leadership team behind it.`,
    active: 'about',
    body: `${pageHero('About', `We are ${c.site.short}`, c.site.tagline, '/assets/img/media/welcome-void.webp')}
<section class="sec">
  <div class="wrap split">
    <div class="split-text">
      <p class="kicker">Who we are</p>
      <h2>Built to win</h2>
      <p>${esc(c.site.about)}</p>
      <ul class="facts">
        ${c.site.founded ? `<li><strong>${esc(c.site.founded)}</strong><span>Founded</span></li>` : ''}
        ${c.site.game ? `<li><strong>${esc(c.site.game)}</strong><span>Our game</span></li>` : ''}
        <li><strong>${people}</strong><span>Players and creators</span></li>
      </ul>
    </div>
    <div class="split-mark"><img src="/assets/img/logo.png" alt="${esc(c.site.name)} logo" width="296" height="226"></div>
  </div>
</section>
<section class="sec sec-alt">
  <div class="wrap">
    ${secHead(`The people running ${c.site.short}`, 'Leadership')}
    <div class="grid grid-people">${c.leadership.map(personCard).join('\n')}</div>
  </div>
</section>
${discordBand(c)}`,
  });
}

/* One product: its picture, price and, when it is sold on the site, the options and the buy button. */
function product(c, p) {
  const here = canSell(p, c.shopOn), sizes = sizesOf(p), ship = priceCents(c.shop.shipping), cur = currencyOf(c.shop);
  const options = here
    ? `<form class="buy" data-buy="${esc(p.id)}" novalidate>
        ${sizes.length ? `<fieldset class="buy-field"><legend>Size</legend><div class="sizes">${sizes.map((s, i) => `<label><input type="radio" name="size" value="${esc(s)}" id="size-${i}"><span>${esc(s)}</span></label>`).join('')}</div></fieldset>` : ''}
        ${p.custom ? `<label class="buy-field" for="buy-custom"><span>${esc(p.custom)} <em>optional</em></span><input type="text" id="buy-custom" name="custom" maxlength="40" autocomplete="off"></label>` : ''}
        <label class="buy-field buy-qty" for="buy-qty"><span>Quantity</span><select id="buy-qty" name="qty">${Array.from({ length: MAX_QTY }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}</select></label>
        <button class="btn btn-primary btn-block" type="submit"><span>Buy now</span><i class="btn-arrow">${ICON.arrow}</i></button>
        <p class="buy-error" role="alert" hidden></p>
        <p class="buy-note">Card payment is handled securely by Stripe. ${ship ? `Shipping is ${esc(money(ship, cur))} per order` : 'Shipping is free'}, to ${esc(countriesOf(c.shop).join(', '))}.${c.shop.note ? ` ${esc(c.shop.note)}` : ''}</p>
      </form>`
    : p.url
      ? `<div class="btn-row">${btn('Shop now', p.url, { ext: true })}</div>`
      : `<p class="pdp-soon">${esc(p.status || 'Not on sale yet')}</p>`;
  return page(c, {
    title: p.name,
    description: p.details || `${p.name} from ${c.site.name}.`,
    active: 'shop',
    body: `<section class="sec pdp">
  <div class="wrap pdp-in">
    <div class="product-media pdp-media${p.img ? ' has-photo' : ''}">${productMedia(p)}${p.status ? `<span class="chip">${esc(p.status)}</span>` : ''}</div>
    <div class="pdp-info">
      <p class="kicker">Official merch</p>
      <h1>${esc(p.name)}</h1>
      ${p.price ? `<p class="pdp-price">${esc(priceText(c, p))}</p>` : ''}
      ${p.details ? `<p class="pdp-text">${esc(p.details)}</p>` : ''}
      ${options}
      <p class="pdp-back"><a href="/shop">All products</a></p>
    </div>
  </div>
</section>`,
  });
}

function thanks(c) {
  return page(c, {
    title: 'Order received',
    description: 'Thank you for your order.',
    active: 'shop',
    body: `<section class="sec notfound"><div class="wrap"><p class="kicker">Order received</p><h1>Thank you</h1><p class="lede">Your payment went through and your order is in. Keep an eye on the email you entered at checkout for updates.</p><div class="btn-row">${btn('Back to the shop', '/shop')}</div></div></section>`,
  });
}

export function renderRoute(path, c) {
  if (path === '/') return home(c);
  if (path === '/shop') return shop(c);
  if (path === '/shop/thanks') return thanks(c);
  const item = /^\/shop\/([a-z0-9-]{1,60})$/.exec(path);
  if (item) { const p = c.products.find((x) => x.id === item[1]); return p ? product(c, p) : null; }
  if (path === '/roster') return roster(c);
  if (path === '/accomplishments') return accomplishments(c);
  if (path === '/about') return about(c);
  return null;
}

export function renderNotFound(c) {
  return page(c, {
    title: 'Page not found',
    description: 'That page does not exist.',
    active: '',
    body: `<section class="sec notfound"><div class="wrap"><p class="kicker">Error 404</p><h1>Page not found</h1><p class="lede">That page does not exist or has moved.</p><div class="btn-row">${btn('Back to home', '/')}</div></div></section>`,
  });
}
