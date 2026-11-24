// The admin panel is a small app in public/assets/js/admin.js. This is the empty page it loads into.
export const adminShell = () => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Admin – Force Esports</title>
<link rel="icon" href="/assets/img/favicon.png" type="image/png">
<link rel="stylesheet" href="/assets/css/admin.css">
</head>
<body>
<div id="app" class="boot"><div class="boot-box"><img src="/assets/img/logo.png" alt="" width="296" height="226"><p>Loading…</p></div></div>
<noscript><p class="noscript">The admin panel needs JavaScript switched on.</p></noscript>
<script src="/assets/js/admin.js" defer></script>
</body>
</html>
`;
