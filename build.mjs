// Builds the static pages from content.mjs.  Usage:  node build.mjs
// No dependencies. Output: index.html, shop.html, roster.html, accomplishments.html, about.html, 404.html
import { writeFileSync } from 'node:fs';
import { site, leadership, rosters, products, accomplishments, slides } from './content.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const handle = (url) => '@' + url.replace(/\/+$/, '').split('/').pop();
const fmtDate = (iso) => new Date(iso + 'T12:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const bySlug = Object.fromEntries(accomplishments.map((a) => [a.slug, a]));

/* ------------------------------------------------------------------ icons */
const icon = {
  x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="m9 5 7 7-7 7"/></svg>',
  down: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="m5 9 7 7 7-7"/></svg>',
  prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="m15 5-7 7 7 7"/></svg>',
  pause: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg>',
  play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="M3 7h18M3 12h18M3 17h18"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square" d="m5 5 14 14M19 5 5 19"/></svg>',
};

/* placeholder drawings for products that have no photo yet */
const art = {
  jersey:
    '<svg class="garment" viewBox="0 0 400 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M150 48 82 76 28 150l52 42 30-34v214h180V158l30 34 52-42-54-74-68-28c-8 26-28 40-50 40s-42-14-50-40Z"/><path d="M150 48c10 16 28 24 50 24s40-8 50-24" opacity=".55"/><path d="M110 330h180M110 346h180" opacity=".3"/><path d="M80 192 52 170M320 192l28-22" opacity=".3"/></g></svg>',
  jacket:
    '<svg class="garment" viewBox="0 0 400 420" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="3" stroke-linejoin="round"><path d="M160 44 96 70c-30 14-44 40-50 78L26 330l50 10 22-150v184h204V190l22 150 50-10-20-182c-6-38-20-64-50-78l-64-26-40 46Z"/><path d="M160 44 200 90l40-46" opacity=".55"/><path d="M200 90v284"/><path d="M98 352h204" opacity=".3"/><path d="M128 250h44M228 250h44" opacity=".3"/><path d="m46 300 46 9M354 300l-46 9" opacity=".3"/></g></svg>',
};

/* ---------------------------------------------------------------- layout */
const NAV = [
  { href: 'shop.html', label: 'Shop', key: 'shop' },
  {
    href: 'roster.html', label: 'Roster', key: 'roster',
    children: Object.entries(rosters).map(([k, r]) => ({ href: `roster.html#${k}`, label: r.label })),
  },
  { href: 'accomplishments.html', label: 'Accomplishments', key: 'accomplishments' },
  { href: 'about.html', label: 'About', key: 'about' },
];

function header(active) {
  const items = NAV.map((n) => {
    const cur = n.key === active ? ' aria-current="page"' : '';
    if (!n.children) return `<li><a href="${n.href}"${cur}>${n.label}</a></li>`;
    return `<li class="has-menu"><a href="${n.href}"${cur}>${n.label}<span class="caret">${icon.down}</span></a><ul class="menu">${n.children
      .map((c) => `<li><a href="${c.href}">${esc(c.label)}</a></li>`)
      .join('')}</ul></li>`;
  }).join('');
  return `<div class="announce"><p>${esc(site.announcement)}</p></div>
<header class="site-header">
  <a class="brand" href="index.html" aria-label="${esc(site.name)} home"><img src="assets/img/logo.png" alt="" width="296" height="226"><span>${esc(site.short)}</span></a>
  <nav class="nav" id="site-nav" aria-label="Main"><ul>${items}</ul></nav>
  <div class="actions">
    <a class="icon-btn" href="${site.xUrl}" target="_blank" rel="noopener" aria-label="${esc(site.name)} on X">${icon.x}</a>
    <button class="icon-btn nav-toggle" type="button" aria-controls="site-nav" aria-expanded="false" aria-label="Open menu"><span class="open">${icon.menu}</span><span class="shut">${icon.close}</span></button>
  </div>
</header>`;
}

function footer() {
  const col = (title, links) => `<div class="fcol"><h2>${title}</h2><ul>${links.map(([l, h, ext]) => `<li><a href="${h}"${ext ? ' target="_blank" rel="noopener"' : ''}>${esc(l)}</a></li>`).join('')}</ul></div>`;
  return `<footer class="site-footer">
  <div class="fgrid">
    <div class="fabout">
      <img src="assets/img/logo.png" alt="" width="296" height="226">
      <p>${esc(site.name)} is a competitive Fortnite organisation. ${esc(site.tagline)}.</p>
      <a class="btn btn-line" href="${site.xUrl}" target="_blank" rel="noopener">${icon.x}<span>${esc(site.xHandle)}</span></a>
    </div>
    ${col('Shop', products.map((p) => [p.name, 'shop.html']))}
    ${col('Explore', [['Home', 'index.html'], ['Roster', 'roster.html'], ['Accomplishments', 'accomplishments.html'], ['About Force', 'about.html']])}
    ${col('Roster', Object.entries(rosters).map(([k, r]) => [r.title, `roster.html#${k}`]))}
    ${col('Follow', [[`X · ${site.xHandle}`, site.xUrl, true]])}
  </div>
  <p class="watermark" aria-hidden="true">${esc(site.hashtag)}</p>
  <div class="legal"><p>© <span data-year>2026</span>, ${esc(site.name.toUpperCase())}</p><p>${esc(site.tagline)}</p></div>
</footer>`;
}

function page({ file, title, description, active, body, scripts = '' }) {
  const full = title ? `${title} – ${site.name}` : `${site.name} | ${site.tagline}`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#0b0b0b">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="assets/img/og.jpg">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="${esc(site.xHandle)}">
<link rel="icon" href="assets/img/favicon.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="preload" href="assets/fonts/anton-400.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="assets/fonts/geist-variable.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="assets/css/site.css">
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
${header(active)}
<main id="main">
${body}
</main>
${footer()}
<script src="assets/js/site.js" defer></script>
${scripts}
</body>
</html>
`;
  writeFileSync(new URL(file, import.meta.url), html);
  console.log('wrote', file);
}

/* ------------------------------------------------------------ components */
const sectionHead = (title, link) =>
  `<div class="shead"><h2>${title}</h2>${link ? `<a class="more" href="${link[1]}">${link[0]}${icon.chevron}</a>` : ''}</div>`;

const productCard = (p, big = false) => `<article class="product${big ? ' product-lg' : ''}">
  <div class="pmedia">
    <span class="pmark" aria-hidden="true"><img src="assets/img/logo.png" alt="" loading="lazy"></span>
    ${art[p.art] || ''}
    <span class="badge">${esc(p.status)}</span>
  </div>
  <div class="pmeta"><h3>${esc(p.name)}</h3><p>${esc(p.status)}</p></div>
</article>`;

const personCard = (m) => `<article class="person">
  <div class="pimg"><img src="assets/img/people/${m.img}.webp" alt="${esc(m.name)}" width="480" height="480" loading="lazy"></div>
  <div class="pbody">
    <p class="role">${esc(m.role)}</p>
    <h3>${esc(m.name)}</h3>
    <a class="btn btn-line btn-block" href="${m.x}" target="_blank" rel="noopener" aria-label="${esc(m.name)} on X, ${handle(m.x)}">${icon.x}<span>${handle(m.x)}</span></a>
  </div>
</article>`;

const newsCard = (a) => `<a class="news" href="accomplishments.html#${a.slug}">
  <div class="nimg"><img src="assets/img/media/${a.img}" alt="${esc(a.imgAlt)}" loading="lazy"></div>
  <h3>${esc(a.title)}</h3>
  <p class="nsum">${esc(a.summary)}</p>
  <time datetime="${a.date}">${fmtDate(a.date)}</time>
</a>`;

const pageHero = (kicker, title, text, img) => `<section class="phero${img ? ' phero-img' : ''}">
  ${img ? `<img src="assets/img/media/${img.src}" alt="" style="object-position:${img.position || 'center'}">` : ''}
  <div class="phero-in"><p class="kicker">${kicker}</p><h1>${title}</h1>${text ? `<p class="lede">${esc(text)}</p>` : ''}</div>
</section>`;

/* ------------------------------------------------------------------ home */
const hero = `<section class="hero" aria-roledescription="carousel" aria-label="Latest from Force">
  <div class="slides">
    ${slides.map((s, i) => {
      const a = bySlug[s.accomplishment];
      return `<article class="slide slide-${s.layout}${i === 0 ? ' is-active' : ''}" aria-roledescription="slide" aria-label="${i + 1} of ${slides.length}"${i === 0 ? '' : ' aria-hidden="true"'}>
      <img class="simg" src="assets/img/media/${a.img}" alt="${esc(a.imgAlt)}" style="object-position:${s.position}"${i === 0 ? ' fetchpriority="high"' : ' loading="lazy"'}>
      <div class="scap">
        <p class="kicker">${esc(a.kicker)} · <time datetime="${a.date}">${fmtDate(a.date)}</time></p>
        <h2>${esc(a.title)}</h2>
        <p class="ssum">${esc(a.summary)}</p>
        <a class="btn btn-gold" href="accomplishments.html#${a.slug}"${i === 0 ? '' : ' tabindex="-1"'}>Read more${icon.chevron}</a>
      </div>
    </article>`;
    }).join('\n    ')}
  </div>
  <div class="hctrl">
    <div class="hbars" aria-hidden="true">${slides.map((_, i) => `<span${i === 0 ? ' class="is-active"' : ''}><i></i></span>`).join('')}</div>
    <button class="sq" type="button" data-hero="prev" aria-label="Previous slide">${icon.prev}</button>
    <button class="sq" type="button" data-hero="next" aria-label="Next slide">${icon.chevron}</button>
    <button class="sq" type="button" data-hero="toggle" aria-label="Pause slideshow"><span class="i-pause">${icon.pause}</span><span class="i-play">${icon.play}</span></button>
  </div>
</section>`;

const tickerItems = [site.hashtag, site.tagline, 'Fortnite competitive', 'Compete · Improve · Dominate'];
const ticker = `<div class="ticker" aria-hidden="true"><div class="track">${Array(4).fill(tickerItems.map((t) => `<span>${esc(t)}</span>`).join('')).join('')}</div></div>`;

const rosterTiles = Object.entries(rosters).map(([k, r]) => `<a class="tile" href="roster.html#${k}">
  <div class="timg">${r.members.slice(0, 3).map((m) => `<img src="assets/img/people/${m.img}.webp" alt="" loading="lazy">`).join('')}<span class="tname">${esc(r.label)}</span></div>
  <p><strong>${esc(r.title)}</strong><span>${r.members.length} ${r.members.length === 1 ? 'member' : 'members'}</span></p>
</a>`).join('\n');

page({
  file: 'index.html',
  title: '',
  description: `${site.name} is a competitive Fortnite organisation. ${site.tagline}.`,
  active: 'home',
  body: `${hero}
${ticker}
<section class="band">
  ${sectionHead('From the shop', ['All products', 'shop.html'])}
  <div class="cells cells-2">${products.map((p) => productCard(p, true)).join('\n')}</div>
</section>
<section class="band band-alt">
  ${sectionHead('Force roster', ['View roster', 'roster.html'])}
  <div class="cells cells-2 tiles">${rosterTiles}</div>
</section>
<section class="band">
  ${sectionHead('Latest accomplishments', ['View all', 'accomplishments.html'])}
  <div class="cells cells-3">${accomplishments.slice(0, 3).map(newsCard).join('\n')}</div>
</section>
<section class="band band-alt cta">
  <div><p class="kicker">About Force</p><h2>Compete. Improve. Dominate.</h2><p>${esc(site.about)}</p><a class="btn btn-gold" href="about.html">Meet the team${icon.chevron}</a></div>
</section>`,
});

/* ------------------------------------------------------------------ shop */
page({
  file: 'shop.html',
  title: 'Shop',
  description: `Official ${site.name} merch. The Force Jersey and Force Jacket are coming soon.`,
  active: 'shop',
  body: `<section class="ptitle"><h1>Products</h1><p>${products.length} products · Coming soon</p></section>
<section class="band band-flush">
  <div class="cells cells-3 shopgrid">${products.map((p) => productCard(p)).join('\n')}
    <div class="promo"><p class="kicker">Drop alerts</p><h2>Be first when it lands</h2><p>The first Force collection is on the way. Follow ${esc(site.xHandle)} on X for the release date.</p><a class="btn btn-gold" href="${site.xUrl}" target="_blank" rel="noopener">${icon.x}<span>Follow ${esc(site.xHandle)}</span></a></div>
  </div>
</section>`,
});

/* ---------------------------------------------------------------- roster */
const keys = Object.keys(rosters);
page({
  file: 'roster.html',
  title: 'Roster',
  description: `The ${site.name} Fortnite roster and content roster.`,
  active: 'roster',
  body: `${pageHero('Force roster', 'Roster', 'Professional Fortnite players and the creators who represent Force.', { src: 'roster-reveal.webp', position: 'center 30%' })}
<div class="switchbar">
  <div class="switch" role="tablist" aria-label="Choose a roster">
    ${keys.map((k, i) => `<button type="button" role="tab" id="tab-${k}" aria-controls="panel-${k}" aria-selected="${i === 0}" data-roster="${k}"${i === 0 ? '' : ' tabindex="-1"'}>${esc(rosters[k].label)}<span>${rosters[k].members.length}</span></button>`).join('')}
  </div>
</div>
${keys.map((k, i) => {
  const r = rosters[k];
  return `<section class="band band-flush rpanel" id="panel-${k}" role="tabpanel" aria-labelledby="tab-${k}"${i === 0 ? '' : ' hidden'}>
  <div class="shead"><h2>${esc(r.title)}</h2><p class="sub">${esc(r.blurb)}</p></div>
  <div class="cells cells-4 people">${r.members.map(personCard).join('\n')}</div>
</section>`;
}).join('\n')}
<section class="band band-alt">
  ${sectionHead('Accomplishments', ['View all', 'accomplishments.html'])}
  <div class="cells cells-3">${accomplishments.slice(0, 3).map(newsCard).join('\n')}</div>
</section>`,
});

/* ------------------------------------------------------- accomplishments */
const tweetBlock = (a) => `<blockquote class="twitter-tweet" data-theme="dark" data-dnt="true" data-align="center">
      <p lang="en" dir="ltr">${esc(a.tweetText)}</p>
      &mdash; FORCE (${esc(site.xHandle)}) <a href="https://twitter.com/${site.xHandle.slice(1)}/status/${a.tweetId}">${fmtDate(a.date)}</a>
    </blockquote>`;

page({
  file: 'accomplishments.html',
  title: 'Accomplishments',
  description: `Results, signings and milestones from ${site.name}.`,
  active: 'accomplishments',
  body: `${pageHero('Force Esports', 'Accomplishments', 'Results, signings and milestones, straight from the Force timeline.')}
<section class="band band-flush">
  <ol class="acc">
    ${accomplishments.map((a, i) => `<li class="acc-row" id="${a.slug}">
    <div class="acc-text">
      <p class="acc-n" aria-hidden="true">${String(i + 1).padStart(2, '0')}</p>
      <p class="kicker">${esc(a.kicker)} · <time datetime="${a.date}">${fmtDate(a.date)}</time></p>
      <h2>${esc(a.title)}</h2>
      <p>${esc(a.body)}</p>
      ${a.results ? `<ul class="places">${a.results.map((r) => `<li><strong>${esc(r.place)}</strong><span>${esc(r.who)}</span></li>`).join('')}</ul>` : ''}
      <a class="btn btn-line" href="https://x.com/${site.xHandle.slice(1)}/status/${a.tweetId}" target="_blank" rel="noopener">${icon.x}<span>View post on X</span></a>
    </div>
    <div class="acc-embed">
      <a class="acc-fallback" href="https://x.com/${site.xHandle.slice(1)}/status/${a.tweetId}" target="_blank" rel="noopener"><img src="assets/img/media/${a.img}" alt="${esc(a.imgAlt)}" loading="lazy"></a>
    ${tweetBlock(a)}
    </div>
  </li>`).join('\n    ')}
  </ol>
</section>`,
  scripts: '<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>',
});

/* ----------------------------------------------------------------- about */
page({
  file: 'about.html',
  title: 'About',
  description: `About ${site.name} and the leadership team behind it.`,
  active: 'about',
  body: `${pageHero('About', 'We are Force', '', { src: 'welcome-void.webp', position: 'center 35%' })}
<section class="split">
  <div class="split-text"><p class="kicker">${esc(site.tagline)}</p><h2>Built to win</h2><p>${esc(site.about)}</p>
    <ul class="facts"><li><strong>2026</strong><span>Founded</span></li><li><strong>Fortnite</strong><span>Our game</span></li><li><strong>${rosters.fortnite.members.length + rosters.content.members.length}</strong><span>Players and creators</span></li></ul>
  </div>
  <div class="split-mark"><img src="assets/img/logo.png" alt="${esc(site.name)} logo" width="296" height="226"></div>
</section>
<section class="band band-flush">
  <div class="shead"><h2>Leadership</h2><p class="sub">The people running Force.</p></div>
  <div class="cells cells-4 people">${leadership.map(personCard).join('\n')}</div>
</section>
<section class="band band-alt cta">
  <div><p class="kicker">The roster</p><h2>Meet the players</h2><p>See the Fortnite roster and the creators representing Force.</p><a class="btn btn-gold" href="roster.html">View roster${icon.chevron}</a></div>
</section>`,
});

/* ------------------------------------------------------------------- 404 */
page({
  file: '404.html',
  title: 'Page not found',
  description: 'That page does not exist.',
  active: '',
  body: `<section class="band cta notfound"><div><p class="kicker">Error 404</p><h1>Page not found</h1><p>That page does not exist or has moved.</p><a class="btn btn-gold" href="index.html">Back to home${icon.chevron}</a></div></section>`,
});
