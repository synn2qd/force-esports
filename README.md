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

## Selling on the site (Stripe)

Products can be sold directly on the site. Stripe's hosted checkout page takes the payment, so card details never touch this site, and Stripe then sends the site a signed message that records the order under **Orders** in the admin panel. Until the two secrets below are added, nothing is for sale and the shop works as before (badges and outside buy links).

1. **Create a Stripe account** at <https://dashboard.stripe.com/register> and, while setting up, work in a **sandbox** (Stripe's test environment) so no real money moves.
2. **Create a restricted key.** In Stripe go to **Developers → API keys → Create restricted key**, give it *Write* access to **Checkout Sessions** only, and copy it (it starts with `rk_`).
3. **Add the endpoint Stripe reports to.** In Stripe go to **Developers → Webhooks → Add destination**, enter `https://YOUR-SITE-ADDRESS/api/stripe/webhook`, and select these three events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`. Copy its **signing secret** (it starts with `whsec_`).
4. **Add both to Cloudflare** under **Workers & Pages → force-esports → Settings → Variables and Secrets**, as type **Secret**:
   - `STRIPE_SECRET_KEY`: the restricted key from step 2
   - `STRIPE_WEBHOOK_SECRET`: the signing secret from step 3
5. **Set up the shop in `/admin`.** Under **Shop settings** choose the currency, the shipping charge and the countries you ship to. Under **Merch**, give a product a price and sizes and switch on **Sell this on the site**.
6. **Place a test order.** On the product page press **Buy now** and pay with Stripe's test card `4242 4242 4242 4242` (any future date, any CVC). The order should appear under **Orders** within a few seconds.
7. **Go live.** Repeat steps 2 to 4 in live mode (a live restricted key and a live webhook destination) and replace the two secrets.

Things to know:

- **Keys are secrets.** Never put them in the code, a commit, or a chat. If one leaks, roll it in Stripe straight away.
- **Sales tax is not collected.** Stripe can calculate tax, but only once you are registered where you owe it; ask an accountant before switching that on.
- **Receipts.** Turn on customer emails for successful payments in Stripe (**Settings → Business → Customer emails**) so buyers get a receipt.
- **Refunds and disputes** are handled in the Stripe dashboard.
- **Orders hold personal details** (name, address, email, phone), so only owners can see them. Delete an order from the Orders page once you no longer need it.

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
src/shop.js               selling: Stripe checkout, the signed webhook, and stored orders
src/admin-page.js         the empty page the admin panel loads into
public/assets/css/        site.css (public site) and admin.css (admin panel)
public/assets/js/         site.js (copy deterrents, menu, slider, roster switch) and admin.js (admin panel)
public/assets/img/        logo, starting pictures and announcement graphics
public/assets/fonts/      Anton and Geist (SIL Open Font License, licence texts included)
public/_headers           stops other sites loading files from /assets
scripts/build.mjs         copies public/ to dist/ and minifies the stylesheets and scripts
```

`dist/` is what goes live. It is rebuilt by itself before every `npm run dev` and every deploy, so edit the files in `public/`, never the ones in `dist/`.

The content the site starts with is in `src/content.js`. Once something has been saved in the admin panel, the saved version is used instead.

## Copy protection

No website can stop a determined person from saving what their browser shows them. What this one does is close the easy routes:

- right-click, the view-source, save-page and developer-tools shortcuts, and dragging pictures out are switched off on the public pages (the admin panel is left alone)
- the live stylesheets and scripts are minified, with comments removed
- other websites cannot load this site's pictures, fonts, styles or scripts from `/assets`
- programs made for downloading whole websites (HTTrack, wget and similar) are refused; search engines and link previews are not
- the admin code, accounts and saved content run on Cloudflare and are never sent to visitors

The source in this repository is the readable version of everything, so keep the repository **private** (GitHub → Settings → General → Danger Zone → Change repository visibility). Deploys keep working with a private repository.

To add a new editable field, add it to `SCHEMA` in `src/content.js` and use it in `src/render.js`. The admin form and the input cleaning both come from that one list.
