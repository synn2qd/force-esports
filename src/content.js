// Site content: the defaults the site ships with, the schema the admin panel edits against,
// and the cleaning every save goes through before it is stored.

export const DEFAULT_CONTENT = {
  rev: 0,
  site: {
    name: 'Force Esports',
    short: 'FORCE',
    tagline: 'Creating champions since 2026',
    hashtag: '#FORCEWIN',
    founded: '2026',
    game: 'Fortnite',
    about:
      'Force is a competitive Fortnite team built to develop elite talent, compete at the highest level, and make a lasting impact in the Fortnite scene. Driven by skill, teamwork and ambition, Force brings together dedicated players and creators focused on one goal: compete, improve and dominate.',
    xUrl: 'https://x.com/ForceEsportss',
    discordUrl: 'https://discord.gg/forceesportss',
    announcement: 'Join the Force Discord',
    announcementUrl: 'https://discord.gg/forceesportss',
    discordTitle: 'Join the Force Discord',
    discordText:
      'Scrim nights, roster news and merch drops land in the Discord first. Come hang out with the players, the creators and the rest of the community.',
  },
  leadership: [
    { id: 'hxllow', name: 'Hxllow', role: 'Founder / CEO', x: 'https://x.com/hxllowz_', img: '/assets/img/people/hxllow.webp' },
    { id: 'syn', name: 'Syn', role: 'Leadership', x: 'https://x.com/synxirl', img: '/assets/img/people/syn.webp' },
    { id: 'will', name: 'Will', role: 'Leadership', x: 'https://x.com/w1llqt', img: '/assets/img/people/will.webp' },
    { id: 'pogz', name: 'Pogz', role: 'Leadership', x: 'https://x.com/pogzmgmt', img: '/assets/img/people/pogz.webp' },
    { id: 'dev', name: 'Dev', role: 'Leadership', x: 'https://x.com/Dev2kkk', img: '/assets/img/people/dev.webp' },
    { id: 'marven', name: 'Marven', role: 'Leadership', x: 'https://x.com/freakyy1x', img: '/assets/img/people/marven.webp' },
    { id: 'reflect', name: 'Reflect', role: 'Leadership', x: 'https://x.com/Reflectfn7', img: '/assets/img/people/reflect.webp' },
    { id: 'orbz', name: 'Orbz', role: 'Leadership', x: 'https://x.com/orbzfv', img: '/assets/img/people/orbz.webp' },
  ],
  rosters: [
    {
      id: 'fortnite',
      label: 'Fortnite',
      title: 'Fortnite Roster',
      blurb: 'The professional players competing for Force in Fortnite.',
      members: [
        { id: 'void', name: 'Void', role: 'Professional Fortnite Player', x: 'https://x.com/voidkbm', img: '/assets/img/people/void.webp' },
        { id: 'klixey', name: 'Klixey', role: 'Professional Fortnite Player', x: 'https://x.com/klixey7', img: '/assets/img/people/klixey.webp' },
      ],
    },
    {
      id: 'content',
      label: 'Content',
      title: 'Content Roster',
      blurb: 'The creators representing Force.',
      members: [{ id: 'regrets', name: 'Regrets', role: 'Content Creator', x: 'https://x.com/Regrrets', img: '/assets/img/people/regrets.webp' }],
    },
  ],
  products: [
    { id: 'force-jersey', name: 'Force Jersey', status: 'Coming soon', price: '', url: '', art: 'jersey', img: '', sell: false, sizes: 'S, M, L, XL, 2XL', custom: '', details: '' },
    { id: 'force-jacket', name: 'Force Jacket', status: 'Coming soon', price: '', url: '', art: 'jacket', img: '', sell: false, sizes: 'S, M, L, XL, 2XL', custom: '', details: '' },
  ],
  shop: { currency: 'usd', shipping: '', countries: 'US', note: '' },
  accomplishments: [
    {
      id: 'solo-reload-finals',
      title: 'FNCS Solo Reload Finals',
      kicker: 'Tournament',
      date: '2026-11-22',
      summary: 'Klixey and Bold1x represented Force in the FNCS Solo Reload Finals, finishing 26th and 27th.',
      body:
        'Two Force players reached the FNCS Solo Reload Finals. Klixey finished 26th and Bold1x finished 27th. It was not the finish the team expected, but both competed through the complications that came along. Next up: NA-East and Trios.',
      results: [
        { id: 'r1', place: '26th', who: 'Klixey' },
        { id: 'r2', place: '27th', who: 'Bold1x' },
      ],
      img: '/assets/img/media/solo-reload-finals.webp',
      imgAlt: 'Results poster showing Bold1x, 27th, and Klixey, 26th, at the FNCS Solo Reload Grand Finals',
      postUrl: 'https://x.com/ForceEsportss/status/2124327231287685425',
      postText:
        'Not The Finish We Expected, But We Enjoyed Watching🫠💛🖤\n\nCongrats to @klixey7 & @bold1x_ for Competing in the Fncs Solo Reload Finals Despite the complications that came along. ONTO NA-EAST & TRIOS…💫',
      postVideo: false,
      featured: true,
      heroLayout: 'tall',
    },
    {
      id: 'void-returns',
      title: 'The King Has Returned',
      kicker: 'Signing',
      date: '2026-11-08',
      summary: 'Void is back with Force as a professional Fortnite player.',
      body:
        'Force welcomed Void home. The return was announced with a video, and Void rejoins the Fortnite roster as a professional player. Powered by Risxn Tweaks.',
      results: [],
      img: '/assets/img/media/welcome-void.webp',
      imgAlt: 'Announcement graphic reading Welcome Void, with Void in a black Force hoodie',
      postUrl: 'https://x.com/ForceEsportss/status/2119506175624355979',
      postText: 'THE KING HAS RETURNED - WELCOME HOME @voidkbm\n\nPowered By @risxntweaks',
      postVideo: true,
      featured: true,
      heroLayout: 'wide',
    },
    {
      id: 'new-faces',
      title: 'New Faces of Force',
      kicker: 'Roster',
      date: '2026-10-12',
      summary: 'Out with the old, in with the new: Force unveiled its new competitive roster.',
      body:
        'Force opened a new chapter by unveiling new faces for its competitive roster, including Fortnite pro Klixey and content creator Regrets.',
      results: [],
      img: '/assets/img/media/roster-reveal.webp',
      imgAlt: 'Roster announcement graphic introducing the Force competitive roster, with three players in black and gold jerseys',
      postUrl: 'https://x.com/ForceEsportss/status/2109735988901642719',
      postText:
        'Out With The Old, In With The New… 😮‍💨\n\nUnveiling Some NEW Faces of FORCE⚡️\n\n- @klixey7\n- @Regrrets\n- @salt3xx\n\n#FORCEWIN - @FNCompetitive',
      postVideo: false,
      featured: true,
      heroLayout: 'wide',
    },
  ],
};

/* ------------------------------------------------------------------ schema
   One description of every editable field. The admin panel builds its forms from it and
   the server cleans saved content against it, so the two can never disagree. */

const personFields = [
  { key: 'name', label: 'Name', type: 'text', max: 40, required: true },
  { key: 'role', label: 'Role', type: 'text', max: 60, hint: 'Shown above the name, for example "Leadership".' },
  { key: 'x', label: 'X (Twitter) link', type: 'url', placeholder: 'https://x.com/username' },
  { key: 'img', label: 'Picture', type: 'image', hint: 'A square picture works best.' },
];

export const SCHEMA = [
  {
    key: 'accomplishments',
    label: 'Accomplishments',
    help: 'Results, signings and milestones. The newest date is shown first.',
    kind: 'list',
    itemName: 'accomplishment',
    titleKey: 'title',
    subKey: 'date',
    thumbKey: 'img',
    addTo: 'top',
    fields: [
      { key: 'postUrl', label: 'X post link', type: 'url', placeholder: 'https://x.com/ForceEsportss/status/…', action: 'fetchPost', hint: 'Paste the post link and press "Fill from post" to pull in its text, date and picture.' },
      { key: 'title', label: 'Title', type: 'text', max: 80, required: true },
      { key: 'kicker', label: 'Category', type: 'text', max: 30, hint: 'A one-word label such as Tournament, Signing or Roster.' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'summary', label: 'Short summary', type: 'textarea', max: 220, rows: 2, hint: 'One sentence. Shown on the home page and cards.' },
      { key: 'body', label: 'Description', type: 'textarea', max: 1200, rows: 4 },
      { key: 'img', label: 'Picture', type: 'image' },
      { key: 'imgAlt', label: 'Picture description', type: 'text', max: 200, hint: 'For visitors who cannot see the picture.' },
      { key: 'postText', label: 'Post text', type: 'textarea', max: 600, rows: 4, hint: 'The words of the X post, shown in the post card.' },
      { key: 'postVideo', label: 'The post is a video', type: 'bool' },
      {
        key: 'results', label: 'Placements', type: 'list', itemName: 'placement', titleKey: 'place', maxItems: 12, inline: true,
        fields: [
          { key: 'place', label: 'Place', type: 'text', max: 12, placeholder: '26th' },
          { key: 'who', label: 'Who', type: 'text', max: 40, placeholder: 'Klixey' },
        ],
      },
      { key: 'featured', label: 'Show in the home page slider', type: 'bool' },
      { key: 'heroLayout', label: 'Slider picture shape', type: 'select', options: [{ value: 'wide', label: 'Wide picture (fills the slide)' }, { value: 'tall', label: 'Tall picture (sits on the right)' }] },
    ],
  },
  {
    key: 'rosters',
    label: 'Roster',
    help: 'Each roster is a tab on the Roster page. Open one to edit its members.',
    kind: 'list',
    itemName: 'roster',
    titleKey: 'label',
    subKey: 'title',
    fields: [
      { key: 'label', label: 'Tab name', type: 'text', max: 24, required: true, hint: 'Short, for example "Fortnite".' },
      { key: 'title', label: 'Heading', type: 'text', max: 60 },
      { key: 'blurb', label: 'Intro line', type: 'textarea', max: 200, rows: 2 },
      { key: 'members', label: 'Members', type: 'list', itemName: 'member', titleKey: 'name', subKey: 'role', thumbKey: 'img', maxItems: 40, fields: personFields },
    ],
  },
  {
    key: 'leadership',
    label: 'Leadership',
    help: 'The people shown on the About page.',
    kind: 'list',
    itemName: 'person',
    titleKey: 'name',
    subKey: 'role',
    thumbKey: 'img',
    fields: personFields,
  },
  {
    key: 'products',
    label: 'Merch',
    help: 'Products on the Shop page. Leave the buy link empty and selling switched off while something is still coming soon.',
    kind: 'list',
    itemName: 'product',
    titleKey: 'name',
    subKey: 'status',
    thumbKey: 'img',
    fields: [
      { key: 'name', label: 'Name', type: 'text', max: 60, required: true },
      { key: 'status', label: 'Badge', type: 'text', max: 24, hint: 'For example "Coming soon", "New" or "Sold out". Leave empty for no badge.' },
      { key: 'price', label: 'Price', type: 'text', max: 20, placeholder: '$59.99' },
      { key: 'sell', label: 'Sell this on the site (card checkout)', type: 'bool', hint: 'Needs a price above, and Stripe connected (see Orders). When this is off, the buy link below is used instead.' },
      { key: 'sizes', label: 'Sizes', type: 'text', max: 120, placeholder: 'S, M, L, XL, 2XL', hint: 'Separate with commas. Leave empty if there is only one size.' },
      { key: 'custom', label: 'Ask for custom text', type: 'text', max: 40, placeholder: 'Name on the back', hint: 'Adds an optional box with this label to the product page. Leave empty to not ask.' },
      { key: 'details', label: 'Description', type: 'textarea', max: 600, rows: 3, hint: 'Shown on the product page.' },
      { key: 'url', label: 'Buy link', type: 'url', placeholder: 'https://…', hint: 'For selling through another store instead of on this site.' },
      { key: 'img', label: 'Product photo', type: 'image', hint: 'Without a photo, the outline drawing below is used.' },
      { key: 'art', label: 'Outline drawing', type: 'select', options: [{ value: 'jersey', label: 'Jersey' }, { value: 'jacket', label: 'Jacket' }, { value: 'none', label: 'Logo only' }] },
    ],
  },
  {
    key: 'shop',
    label: 'Shop settings',
    help: 'How orders placed on the site are charged and where they can be sent. Card payments are handled by Stripe.',
    kind: 'object',
    fields: [
      { key: 'currency', label: 'Currency', type: 'select', options: [{ value: 'usd', label: 'US dollars (USD)' }, { value: 'eur', label: 'Euros (EUR)' }, { value: 'gbp', label: 'British pounds (GBP)' }, { value: 'cad', label: 'Canadian dollars (CAD)' }, { value: 'aud', label: 'Australian dollars (AUD)' }] },
      { key: 'shipping', label: 'Shipping charge', type: 'text', max: 12, placeholder: '5.00', hint: 'One flat amount added to every order. Leave empty for free shipping.' },
      { key: 'countries', label: 'Countries you ship to', type: 'text', max: 200, placeholder: 'US, CA', hint: 'Two-letter country codes separated by commas, for example US, CA, GB.' },
      { key: 'note', label: 'Note under the buy button', type: 'textarea', max: 300, rows: 2, hint: 'For example "Made to order. Ships in 3 to 4 weeks."' },
    ],
  },
  {
    key: 'site',
    label: 'Site settings',
    help: 'Names, links and the text used across the site.',
    kind: 'object',
    fields: [
      { key: 'name', label: 'Organisation name', type: 'text', max: 40, required: true },
      { key: 'short', label: 'Short name', type: 'text', max: 16, hint: 'Shown next to the logo.' },
      { key: 'tagline', label: 'Tagline', type: 'text', max: 80 },
      { key: 'hashtag', label: 'Hashtag', type: 'text', max: 24, hint: 'The large word in the footer.' },
      { key: 'founded', label: 'Founded', type: 'text', max: 12 },
      { key: 'game', label: 'Game', type: 'text', max: 24 },
      { key: 'about', label: 'About text', type: 'textarea', max: 900, rows: 5 },
      { key: 'xUrl', label: 'X (Twitter) link', type: 'url' },
      { key: 'discordUrl', label: 'Discord invite link', type: 'url' },
      { key: 'announcement', label: 'Top bar text', type: 'text', max: 90, hint: 'Leave empty to hide the bar at the very top.' },
      { key: 'announcementUrl', label: 'Top bar link', type: 'url' },
      { key: 'discordTitle', label: 'Discord section heading', type: 'text', max: 60 },
      { key: 'discordText', label: 'Discord section text', type: 'textarea', max: 300, rows: 3 },
    ],
  },
];

/* ---------------------------------------------------------------- cleaning */

const IMAGE_PATH = /^\/(assets|media)\/[A-Za-z0-9_\-./]{1,200}$/;
const slugify = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);
const randomId = () => Array.from(crypto.getRandomValues(new Uint8Array(5)), (b) => b.toString(16).padStart(2, '0')).join('');

export function cleanUrl(v) {
  const s = typeof v === 'string' ? v.trim().slice(0, 500) : '';
  if (!s) return '';
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : '';
  } catch {
    return '';
  }
}

function cleanValue(field, v) {
  switch (field.type) {
    case 'text':
    case 'textarea': {
      let s = typeof v === 'string' ? v : '';
      s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').replace(/\r\n?/g, '\n');
      if (field.type === 'text') s = s.replace(/\s+/g, ' ');
      return s.trim().slice(0, field.max || (field.type === 'text' ? 120 : 1200));
    }
    case 'url':
      return cleanUrl(v);
    case 'date':
      return typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : '';
    case 'bool':
      return v === true;
    case 'select':
      return field.options.some((o) => o.value === v) ? v : field.options[0].value;
    case 'image':
      return typeof v === 'string' && IMAGE_PATH.test(v) && !v.includes('..') ? v : '';
    case 'list':
      return cleanList(field, v);
    default:
      return '';
  }
}

function cleanObject(fields, obj) {
  const src = obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : {};
  const out = {};
  for (const f of fields) out[f.key] = cleanValue(f, src[f.key]);
  return out;
}

function cleanList(def, v) {
  const items = Array.isArray(v) ? v.slice(0, def.maxItems || 80) : [];
  const seen = new Set();
  return items.map((item) => {
    const out = cleanObject(def.fields, item);
    let id = item && typeof item.id === 'string' && /^[a-z0-9-]{1,60}$/.test(item.id) ? item.id : '';
    if (!id) id = slugify(out[def.titleKey] || '') || randomId();
    const base = id;
    for (let n = 2; seen.has(id); n++) id = `${base}-${n}`;
    seen.add(id);
    return { id, ...out };
  });
}

/** Returns a complete, safe content object no matter what was passed in. */
export function cleanContent(input) {
  const src = input && typeof input === 'object' ? input : {};
  const out = { rev: Number.isInteger(src.rev) && src.rev >= 0 ? src.rev : 0 };
  for (const section of SCHEMA) {
    const value = src[section.key] === undefined ? DEFAULT_CONTENT[section.key] : src[section.key];
    out[section.key] = section.kind === 'list' ? cleanList(section, value) : cleanObject(section.fields, value);
  }
  if (!out.site.name) out.site.name = DEFAULT_CONTENT.site.name;
  if (!out.site.short) out.site.short = out.site.name.split(' ')[0].toUpperCase();
  if (typeof src.updatedAt === 'string') out.updatedAt = src.updatedAt.slice(0, 40);
  if (typeof src.updatedBy === 'string') out.updatedBy = src.updatedBy.slice(0, 40);
  return out;
}

/** Every /media/ path the content still points at (used to tidy up unused uploads). */
export function referencedMedia(content) {
  const found = new Set();
  JSON.stringify(content, (key, value) => {
    if (typeof value === 'string' && value.startsWith('/media/')) found.add(value.slice(7));
    return value;
  });
  return found;
}

/* ------------------------------------------------------------------ storage */

export async function loadContent(env, { fresh = false } = {}) {
  if (!env.DATA) return cleanContent(DEFAULT_CONTENT);
  const stored = await env.DATA.get('content', fresh ? { type: 'json' } : { type: 'json', cacheTtl: 60 });
  return cleanContent(stored || DEFAULT_CONTENT);
}

export async function saveContent(env, content) {
  await env.DATA.put('content', JSON.stringify(content));
}
