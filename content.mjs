// All editable site content lives here. Change it, then run:  node build.mjs
// Profile pictures are in assets/img/people/<img>.webp (square, 480x480).

export const site = {
  name: 'Force Esports',
  short: 'FORCE',
  tagline: 'Creating champions since 2026',
  hashtag: '#FORCEWIN',
  xUrl: 'https://x.com/ForceEsportss',
  xHandle: '@ForceEsportss',
  announcement: '#FORCEWIN · Creating champions since 2026',
  about:
    'Force is a competitive Fortnite team built to develop elite talent, compete at the highest level, and make a lasting impact in the Fortnite scene. Driven by skill, teamwork and ambition, Force brings together dedicated players and creators focused on one goal: compete, improve and dominate.',
};

// Shown on the About page, in this order.
export const leadership = [
  { name: 'Hxllow', role: 'Founder / CEO', x: 'https://x.com/hxllowz_', img: 'hxllow' },
  { name: 'Syn', role: 'Leadership', x: 'https://x.com/synxirl', img: 'syn' },
  { name: 'Will', role: 'Leadership', x: 'https://x.com/w1llqt', img: 'will' },
  { name: 'Pogz', role: 'Leadership', x: 'https://x.com/pogzmgmt', img: 'pogz' },
  { name: 'Dev', role: 'Leadership', x: 'https://x.com/Dev2kkk', img: 'dev' },
  { name: 'Marven', role: 'Leadership', x: 'https://x.com/freakyy1x', img: 'marven' },
  { name: 'Reflect', role: 'Leadership', x: 'https://x.com/Reflectfn7', img: 'reflect' },
  { name: 'Orbz', role: 'Leadership', x: 'https://x.com/orbzfv', img: 'orbz' },
];

// The Roster page switches between these. The key is also the link: roster.html#fortnite
export const rosters = {
  fortnite: {
    label: 'Fortnite',
    title: 'Fortnite Roster',
    blurb: 'The professional players competing for Force in Fortnite.',
    members: [
      { name: 'Void', role: 'Professional Fortnite Player', x: 'https://x.com/voidkbm', img: 'void' },
      { name: 'Klixey', role: 'Professional Fortnite Player', x: 'https://x.com/klixey7', img: 'klixey' },
    ],
  },
  content: {
    label: 'Content',
    title: 'Content Roster',
    blurb: 'The creators representing Force.',
    members: [{ name: 'Regrets', role: 'Content Creator', x: 'https://x.com/Regrrets', img: 'regrets' }],
  },
};

// Merch. status is shown on the badge and under the name. art picks the placeholder drawing (jersey | jacket).
export const products = [
  { name: 'Force Jersey', art: 'jersey', status: 'Coming soon' },
  { name: 'Force Jacket', art: 'jacket', status: 'Coming soon' },
];

// Newest first. tweetId is the number at the end of the post's link.
// tweetText is shown only if the embed cannot load (blocked script, no JavaScript).
export const accomplishments = [
  {
    slug: 'solo-reload-finals',
    date: '2026-11-22',
    kicker: 'Tournament',
    title: 'FNCS Solo Reload Finals',
    summary: 'Klixey and Bold1x represented Force in the FNCS Solo Reload Finals, finishing 26th and 27th.',
    body:
      'Two Force players reached the FNCS Solo Reload Finals. Klixey finished 26th and Bold1x finished 27th. It was not the finish the team expected, but both competed through the complications that came along. Next up: NA-East and Trios.',
    img: 'solo-reload-finals.webp',
    imgAlt: 'Results poster showing Bold1x, 27th, and Klixey, 26th, at the FNCS Solo Reload Grand Finals',
    tweetId: '2124327231287685425',
    tweetText:
      'Not The Finish We Expected, But We Enjoyed Watching. Congrats to @klixey7 & @bold1x_ for Competing in the Fncs Solo Reload Finals Despite the complications that came along. ONTO NA-EAST & TRIOS…',
    results: [
      { place: '26th', who: 'Klixey' },
      { place: '27th', who: 'Bold1x' },
    ],
  },
  {
    slug: 'void-returns',
    date: '2026-11-08',
    kicker: 'Signing',
    title: 'The King Has Returned',
    summary: 'Void is back with Force as a professional Fortnite player.',
    body:
      'Force welcomed Void home. The return was announced with a video, and Void rejoins the Fortnite roster as a professional player. Powered by Risxn Tweaks.',
    img: 'welcome-void.webp',
    imgAlt: 'Announcement graphic reading Welcome Void, with Void in a black Force hoodie',
    tweetId: '2119506175624355979',
    tweetText: 'THE KING HAS RETURNED - WELCOME HOME @voidkbm. Powered By @risxntweaks',
  },
  {
    slug: 'new-faces',
    date: '2026-10-12',
    kicker: 'Roster',
    title: 'New Faces of Force',
    summary: 'Out with the old, in with the new: Force unveiled its new competitive roster.',
    body:
      'Force opened a new chapter by unveiling new faces for its competitive roster, including Fortnite pro Klixey and content creator Regrets.',
    img: 'roster-reveal.webp',
    imgAlt: 'Roster announcement graphic introducing the Force competitive roster, with three players in black and gold jerseys',
    tweetId: '2109735988901642719',
    tweetText:
      'Out With The Old, In With The New… Unveiling Some NEW Faces of FORCE: @klixey7, @Regrrets, @salt3xx. #FORCEWIN',
  },
];

// Home page hero slider. layout: "cover" fills the slide with the image; "split" puts a tall image on the right.
export const slides = [
  { accomplishment: 'void-returns', layout: 'cover', position: 'center 30%' },
  { accomplishment: 'new-faces', layout: 'cover', position: 'center 35%' },
  { accomplishment: 'solo-reload-finals', layout: 'split', position: 'center 18%' },
];
