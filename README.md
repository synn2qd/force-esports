# Force Esports website

The Force Esports site and its admin panel, running as one Cloudflare Worker.

- **Public site:** Home, Shop, Roster, Accomplishments and About, in black and gold.
- **Admin panel at `/admin`:** signed-in staff can change everything on the site (accomplishments, rosters, leadership, merch, links and text) and upload pictures. Owners can also create and remove accounts.

There is no build step and no framework. Pages are rendered from the saved content on each request.

## Putting it online

You need a free Cloudflare account. This takes about five minutes.

1. In the Cloudflare dashboard go to **Workers & Pages → Create → Import a repository**, connect GitHub and pick this repository. Keep the default settings (deploy command `npx wrangler deploy`) and press **Save and Deploy**.
   Cloudflare creates the storage the site needs (a KV namespace) on the first deploy.
2. Open the new Worker, go to **Settings → Variables and Secrets → Add**, choose type **Secret**, name it `SETUP_KEY` and give it a long random value only you know. Deploy when prompted.
3. Visit `https://<your-worker-address>/admin`. Enter the setup key, then choose the username and password for the first owner account.

After that, every push to `main` redeploys the site automatically. To use your own domain, add it under the Worker's **Settings → Domains & Routes**.

Once the owner account exists the setup key no longer does anything, and you can delete the `SETUP_KEY` secret.

If the first deploy reports that the `DATA` binding is missing, create a KV namespace under **Storage & Databases → KV**, then add it to the Worker under **Settings → Bindings** with the variable name `DATA`.

## Using the admin panel

- **Accomplishments:** add a post by pasting its X link and pressing **Fill from post**. That pulls in the post's text, date and picture; you add the title and description. Tick "Show in the home page slider" to feature it.
- **Roster:** each roster is a tab on the Roster page. Open one to add, reorder or remove members.
- **Leadership:** the people on the About page.
- **Merch:** change the badge, add a price, a product photo and a buy link when something goes on sale.
- **Site settings:** the Discord invite, X link, top bar message and the text used across the site.
- **Accounts** (owners only): create an account and send the person the sign-in details shown. *Editors* can change all site content. *Owners* can also manage accounts.

Changes go live when you press **Save changes**. The public site can take up to a minute to show them.

## How it is protected

- Passwords are stored as salted PBKDF2-SHA256 hashes, never as text.
- Sessions use an `HttpOnly`, `SameSite=Lax` cookie and last seven days. Changing or resetting a password, or disabling an account, signs that account out.
- Every change needs a signed-in session plus a per-session token, and requests from other sites are refused.
- Eight wrong passwords from one address lock sign-in for 15 minutes.
- Everything typed into the admin panel is escaped when shown, links must be `http` or `https`, and uploads are checked to be real pictures (JPG, PNG, WebP, GIF or AVIF, up to 5 MB).

Storage is Cloudflare KV, which can take up to a minute to carry a change to every location. In practice that means a newly created or disabled account, or a save made by someone else, can take that long to be seen everywhere.

## Running it on your computer

Needs Node 20 or newer.

```bash
npm install
```

```bash
echo "SETUP_KEY=local-setup-key" > .dev.vars
```

```bash
npm run dev
```

Then open <http://localhost:8787>. Local data is kept in `.wrangler/` and is separate from the live site.

## Structure

```
wrangler.jsonc            Cloudflare settings
src/worker.js             routing, admin API, uploads
src/render.js             the public pages
src/content.js            default content, the list of editable fields, and input cleaning
src/auth.js               accounts, passwords and sessions
src/admin-page.js         the empty page the admin panel loads into
public/assets/css/        site.css (public site) and admin.css (admin panel)
public/assets/js/         site.js (menu, slider, roster switch) and admin.js (admin panel)
public/assets/img/        logo, starting pictures and announcement graphics
public/assets/fonts/      Anton and Geist (SIL Open Font License, licence texts included)
```

The content the site starts with is in `src/content.js`. Once something has been saved in the admin panel, the saved version is used instead.

To add a new editable field, add it to `SCHEMA` in `src/content.js` and use it in `src/render.js`. The admin form and the input cleaning both come from that one list.
