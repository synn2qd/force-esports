# Force Esports website

The official Force Esports site: black and gold, static HTML, no framework and no build tooling beyond one small Node script.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Home: hero slider, shop preview, roster tiles, latest accomplishments |
| `shop.html` | Merch. The jersey and jacket are shown as "Coming soon" |
| `roster.html` | Fortnite roster and Content roster, with a switch between them (`roster.html#fortnite`, `roster.html#content`) |
| `accomplishments.html` | Results, signings and milestones, each with its embedded X post |
| `about.html` | About Force and the leadership team |
| `404.html` | Not-found page |

## Editing content

All names, roles, X links, products, accomplishments and hero slides live in **`content.mjs`**. Do not edit the `.html` files by hand: they are generated and will be overwritten.

1. Edit `content.mjs`.
2. Run the build (needs Node 18 or newer, no install step):

   ```bash
   node build.mjs
   ```

3. Commit the changed `.html` files along with `content.mjs`.

Common changes:

- **Add or remove a person:** add an entry to `leadership` or to a roster's `members`, and put a square picture at `assets/img/people/<img>.webp` (480x480 works well).
- **Add a roster:** add another key to `rosters`. It appears in the switch, the menu and the home page automatically.
- **Launch a product:** change its `status` in `products`. Real product photos are not wired up yet; the cards currently draw a placeholder outline.
- **Add an accomplishment:** add an entry to the top of `accomplishments`. `tweetId` is the number at the end of the post's link, and `img` is a file in `assets/img/media/`.

## Preview locally

Open the folder through a local web server (fonts do not load from `file://`):

```bash
python3 -m http.server 8000
```

Then visit <http://localhost:8000>.

## Deploying

The site is plain static files at the repository root, so any static host works.

**GitHub Pages:** repository Settings → Pages → Build and deployment → Source "Deploy from a branch" → Branch `main`, folder `/ (root)`. The `.nojekyll` file tells Pages to serve the files as they are.

## Structure

```
content.mjs            all editable content
build.mjs              turns content.mjs into the .html pages
assets/css/site.css    styles
assets/js/site.js      mobile menu, hero slider, roster switch
assets/img/            logo, people, announcement graphics
assets/fonts/          Anton and Geist (SIL Open Font License, licence texts included)
```

## Notes

- The posts on the Accomplishments page are official X embeds loaded from `platform.twitter.com`. If a visitor's browser blocks that script, the page shows the announcement graphic and the post text instead, with a link to the post.
- No analytics, cookies or third-party scripts are used anywhere else.
