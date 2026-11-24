/* Force Esports — admin panel. Plain JavaScript, no dependencies.
   Forms are built from the schema the server sends, so every editable field is defined in one place (src/content.js). */
(function () {
  'use strict';

  var app = document.getElementById('app');
  var state = { user: null, csrf: null, content: null, schema: null, saved: '', open: new WeakSet(), users: null };

  /* ---------------------------------------------------------------- helpers */
  function h(tag, props) {
    var el = document.createElement(tag);
    props = props || {};
    Object.keys(props).forEach(function (k) {
      var v = props[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'icon') el.innerHTML = ICONS[v] || '';
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked' || k === 'disabled' || k === 'hidden' || k === 'selected') el[k] = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    });
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) child.forEach(function (c) { add(el, c); });
    else el.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
  function svg(d) { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'; }
  var ICONS = {
    up: svg('m6 15 6-6 6 6'), down: svg('m6 9 6 6 6-6'), trash: svg('M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3'),
    plus: svg('M12 5v14M5 12h14'), image: svg('M4 5h16v14H4zM4 16l4.5-4.5 3.5 3.5 3-3 5 5M9 9.5h.01'), out: svg('M15 4h4v16h-4M10 16l4-4-4-4M14 12H4'),
    eye: svg('M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'),
    accomplishments: svg('M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3'),
    rosters: svg('M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.9M15.5 4.2a3.5 3.5 0 0 1 0 6.6'),
    leadership: svg('M12 3l2.6 5.3 5.9.9-4.2 4.1 1 5.8-5.3-2.8-5.3 2.8 1-5.8-4.2-4.1 5.9-.9z'),
    products: svg('M6 7h12l1 13H5zM9 7V6a3 3 0 0 1 6 0v1'), site: svg('M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M11 16v4'),
    accounts: svg('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1'), key: svg('M6 11h12v9H6zM9 11V8a3 3 0 0 1 6 0v3M12 15v2'),
    copy: svg('M9 9h11v11H9zM5 15H4V4h11v1'), spark: svg('M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6'),
  };

  function api(method, path, body) {
    var headers = { 'X-Requested-With': 'force-admin' };
    if (state.csrf) headers['X-CSRF-Token'] = state.csrf;
    var payload;
    if (body instanceof Blob) { headers['Content-Type'] = body.type || 'application/octet-stream'; payload = body; }
    else if (body !== undefined) { headers['Content-Type'] = 'application/json'; payload = JSON.stringify(body); }
    return fetch('/api/admin/' + path, { method: method, headers: headers, body: payload, credentials: 'same-origin' }).then(function (res) {
      return res.json().catch(function () { return null; }).then(function (data) {
        if (res.ok) return data;
        var err = new Error((data && data.error) || 'Something went wrong (' + res.status + '). Try again.');
        err.status = res.status;
        throw err;
      });
    }, function () { throw new Error('Could not reach the site. Check your connection and try again.'); });
  }

  var toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
  function toast(msg, kind) {
    if (!toastBox.parentNode) document.body.appendChild(toastBox);
    var t = h('div', { class: 'toast ' + (kind || ''), text: msg });
    toastBox.appendChild(t);
    setTimeout(function () { t.remove(); }, kind === 'bad' ? 7000 : 4200);
  }

  /** A small dialog. Resolves with true/false, or with the value returned by `build`'s reader. */
  function dialog(opts) {
    return new Promise(function (resolve) {
      var read = null;
      var box = h('div', { class: 'dialog', role: 'dialog', 'aria-modal': 'true' }, h('h2', { text: opts.title }), opts.text ? h('p', { text: opts.text }) : null);
      if (opts.build) read = opts.build(box);
      var veil = h('div', { class: 'veil' }, box);
      function done(v) { document.removeEventListener('keydown', onKey); veil.remove(); resolve(v); }
      function onKey(e) { if (e.key === 'Escape') done(false); }
      var ok = h('button', { class: 'btn ' + (opts.danger ? 'btn-danger' : 'btn-primary'), type: 'button', text: opts.ok || 'OK', onclick: function () { done(read ? read() : true); } });
      box.appendChild(h('div', { class: 'dialog-actions' }, opts.cancel === false ? null : h('button', { class: 'btn btn-ghost', type: 'button', text: opts.cancel || 'Cancel', onclick: function () { done(false); } }), ok));
      veil.addEventListener('mousedown', function (e) { if (e.target === veil) done(false); });
      document.addEventListener('keydown', onKey);
      document.body.appendChild(veil);
      (box.querySelector('input') || ok).focus();
    });
  }
  function confirmBox(title, text, ok, danger) { return dialog({ title: title, text: text, ok: ok, danger: danger }); }

  function field(label, control, hint, cls) {
    var id = 'f' + Math.random().toString(36).slice(2, 9);
    control.id = id;
    return h('div', { class: 'field ' + (cls || '') }, h('label', { for: id, text: label }), control, hint ? h('p', { class: 'hint', text: hint }) : null);
  }
  function busy(btn, on, label) {
    if (on) { btn.dataset.label = btn.textContent; btn.textContent = label || 'Working…'; btn.disabled = true; }
    else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
  }
  function randomPassword() {
    var set = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    var out = '';
    crypto.getRandomValues(new Uint8Array(16)).forEach(function (b) { out += set[b % set.length]; });
    return out.replace(/(.{4})(?=.)/g, '$1-');
  }
  function copy(text) {
    return navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(function () { toast('Copied.', 'ok'); }, function () { toast('Could not copy. Select it and copy by hand.', 'bad'); }) : Promise.resolve(toast('Select it and copy by hand.'));
  }

  /* --------------------------------------------------------- sign-in screens */
  function authScreen(title, sub, body) {
    clear(app).className = 'auth';
    app.appendChild(h('div', { class: 'auth-card' }, h('img', { src: '/assets/img/logo.png', alt: '' }), h('h1', { text: title }), sub ? h('p', { class: 'sub', text: sub }) : null, body, h('a', { class: 'back', href: '/', text: '← Back to the site' })));
    var first = app.querySelector('input');
    if (first) first.focus();
  }
  function formWithError(fields, label, onSubmit) {
    var err = h('div', { class: 'error', role: 'alert', hidden: true });
    var btn = h('button', { class: 'btn btn-primary btn-block', type: 'submit', text: label });
    var form = h('form', { novalidate: true, onsubmit: function (e) {
      e.preventDefault(); err.hidden = true; busy(btn, true, 'One moment…');
      onSubmit().catch(function (ex) { err.textContent = ex.message; err.hidden = false; busy(btn, false); });
    } }, err, fields, btn);
    return form;
  }

  function viewLogin(message) {
    var u = h('input', { type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false' });
    var p = h('input', { type: 'password', autocomplete: 'current-password' });
    authScreen('Sign in', 'Force Esports admin', [message ? h('div', { class: 'note', text: message }) : null, formWithError([field('Username', u), field('Password', p)], 'Sign in', function () {
      return api('POST', 'login', { username: u.value, password: p.value }).then(function (r) { state.user = r.user; state.csrf = r.csrf; return startApp(); });
    })]);
  }

  function viewSetup(enabled) {
    if (!enabled) {
      return authScreen('Set up the admin', 'One step is left before the first account can be created.', h('div', {},
        h('ol', { class: 'steps' },
          h('li', {}, 'In the Cloudflare dashboard, open this Worker and go to ', h('b', { text: 'Settings → Variables and Secrets' }), '.'),
          h('li', {}, 'Add a secret named ', h('code', { text: 'SETUP_KEY' }), ' with a long random value only you know.'),
          h('li', {}, 'Come back here and reload this page.'))));
    }
    var k = h('input', { type: 'password', autocomplete: 'off' });
    var n = h('input', { type: 'text', autocomplete: 'name' });
    var u = h('input', { type: 'text', autocomplete: 'username', autocapitalize: 'none', spellcheck: 'false' });
    var p = h('input', { type: 'password', autocomplete: 'new-password' });
    authScreen('Create the owner', 'This first account can add everyone else.', formWithError([
      field('Setup key', k, 'The SETUP_KEY secret you added in Cloudflare.'), field('Your name', n), field('Username', u, '3 to 24 letters, numbers, dots, dashes or underscores.'), field('Password', p, 'At least 10 characters.'),
    ], 'Create account', function () {
      return api('POST', 'setup', { key: k.value, name: n.value, username: u.value, password: p.value }).then(function (r) { state.user = r.user; state.csrf = r.csrf; return startApp(); });
    }));
  }

  /* -------------------------------------------------------------------- app */
  var main, sideNav, saveBar;
  function isDirty() { return JSON.stringify(state.content) !== state.saved; }
  function changed() {
    var dirty = isDirty();
    saveBar.hidden = !dirty;
    state.schema.forEach(function (s) {
      var em = sideNav.querySelector('[data-count="' + s.key + '"]');
      if (em) em.textContent = state.content[s.key].length;
    });
  }
  function sectionDef(key) { return state.schema.filter(function (s) { return s.key === key; })[0]; }

  function startApp() {
    return api('GET', 'content').then(function (r) {
      state.content = r.content; state.schema = r.schema; state.saved = JSON.stringify(r.content); state.shop = r.shop || null;
      renderShell();
      if (!state.wired) {
        state.wired = true;
        window.addEventListener('hashchange', renderRoute);
        window.addEventListener('beforeunload', function (e) { if (state.user && isDirty()) { e.preventDefault(); e.returnValue = ''; } });
      }
      renderRoute();
    });
  }

  function renderShell() {
    clear(app).className = 'shell';
    var link = function (key, label, icon, count) {
      return h('a', { class: 'nav-item', href: '#' + key, 'data-key': key }, h('span', { icon: icon }), h('span', { text: label }), count === undefined ? null : h('em', { 'data-count': key, text: String(count) }));
    };
    sideNav = h('nav', { 'aria-label': 'Admin sections' },
      state.schema.map(function (s) { return link(s.key, s.label, ICONS[s.key] ? s.key : 'site', s.kind === 'list' ? state.content[s.key].length : undefined); }));
    var side = h('aside', { class: 'side' },
      h('a', { class: 'side-brand', href: '#' + state.schema[0].key }, h('img', { src: '/assets/img/logo.png', alt: '' }), h('b', { text: 'FORCE' }), h('span', { text: 'Admin' })),
      h('p', { class: 'side-label', text: 'Content' }), sideNav,
      state.user.role === 'owner' ? h('p', { class: 'side-label', text: 'Shop' }) : null,
      state.user.role === 'owner' ? link('orders', 'Orders', 'products') : null,
      h('p', { class: 'side-label', text: 'Access' }),
      state.user.role === 'owner' ? link('accounts', 'Accounts', 'accounts') : null,
      link('password', 'My password', 'key'),
      h('div', { class: 'side-foot' },
        h('div', { class: 'who' }, h('i', { text: (state.user.name || state.user.username).slice(0, 1) }), h('div', {}, h('b', { text: state.user.name || state.user.username }), h('span', { text: state.user.role }))),
        h('a', { class: 'btn btn-ghost btn-sm', href: '/', target: '_blank', rel: 'noopener' }, h('span', { icon: 'eye' }), 'View site'),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: signOut }, h('span', { icon: 'out' }), 'Sign out')));
    main = h('div', { class: 'main-in' });
    var saveBtn = h('button', { class: 'btn btn-primary btn-sm', type: 'button', text: 'Save changes', onclick: function () { save(saveBtn); } });
    saveBar = h('div', { class: 'savebar', hidden: true }, h('span', { text: 'Unsaved changes' }), h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Discard', onclick: discard }), saveBtn);
    app.appendChild(side); app.appendChild(h('main', { class: 'main' }, main)); app.appendChild(saveBar);
  }

  function renderRoute() {
    if (!state.user) return;
    var key = location.hash.replace('#', '') || state.schema[0].key;
    if ((key === 'accounts' || key === 'orders') && state.user.role !== 'owner') key = state.schema[0].key;
    [].forEach.call(app.querySelectorAll('.nav-item'), function (a) { a.classList.toggle('on', a.getAttribute('data-key') === key); });
    clear(main);
    if (key === 'accounts') return viewAccounts();
    if (key === 'orders') return viewOrders();
    if (key === 'password') return viewPassword();
    var def = sectionDef(key) || state.schema[0];
    viewSection(def);
  }

  function head(title, help, action) {
    main.appendChild(h('div', { class: 'main-head' }, h('div', {}, h('h1', { text: title }), help ? h('p', { text: help }) : null), action || null));
  }

  /* --------------------------------------------------------------- sections */
  function viewSection(def) {
    if (def.kind === 'object') {
      head(def.label, def.help);
      main.appendChild(h('div', { class: 'card' }, h('div', { class: 'form form-2' }, def.fields.map(function (f) { return fieldFor(f, state.content[def.key]); }))));
      return;
    }
    var list = state.content[def.key];
    var holder = h('div', {});
    var draw = function () { clear(holder).appendChild(listEditor(def, list, draw)); changed(); };
    head(def.label, def.help, h('button', { class: 'btn btn-primary', type: 'button', onclick: function () { addItem(def, list); draw(); } }, h('span', { icon: 'plus' }), 'Add ' + def.itemName));
    main.appendChild(holder);
    draw();
  }

  function blank(def) {
    var o = { id: '' };
    def.fields.forEach(function (f) { o[f.key] = f.type === 'bool' ? false : f.type === 'list' ? [] : f.type === 'select' ? f.options[0].value : ''; });
    return o;
  }
  function addItem(def, list) {
    var item = blank(def);
    if (def.addTo === 'top') list.unshift(item); else list.push(item);
    state.open.add(item);
  }

  function listEditor(def, list, redraw) {
    if (!list.length) return h('div', { class: 'emptybox', text: 'Nothing here yet. Add the first ' + def.itemName + '.' });
    return h('div', { class: 'items' }, list.map(function (item, i) {
      var open = state.open.has(item);
      var title = h('b', {}), sub = h('span', {}), thumb = h('span', { class: 'item-thumb' });
      var refresh = function () {
        var t = item[def.titleKey];
        title.textContent = t || 'New ' + def.itemName; title.className = t ? '' : 'blank';
        sub.textContent = def.subKey ? item[def.subKey] || '' : '';
        clear(thumb);
        if (def.thumbKey && item[def.thumbKey]) thumb.appendChild(h('img', { src: item[def.thumbKey], alt: '' }));
        else thumb.textContent = (t || '+').slice(0, 1);
      };
      refresh();
      var body = open ? h('div', { class: 'item-body' }, h('div', { class: 'form form-2' }, def.fields.map(function (f) { return fieldFor(f, item, refresh, redraw); }))) : null;
      var move = function (d) { list.splice(i, 1); list.splice(i + d, 0, item); redraw(); };
      return h('div', { class: 'item' + (open ? ' open' : '') },
        h('div', { class: 'item-head' },
          h('button', { class: 'item-toggle', type: 'button', 'aria-expanded': String(open), onclick: function () { if (open) state.open.delete(item); else state.open.add(item); redraw(); } }, def.thumbKey ? thumb : null, h('span', { class: 'item-title' }, title, sub)),
          h('div', { class: 'item-tools' },
            h('button', { class: 'iconbtn', type: 'button', icon: 'up', title: 'Move up', 'aria-label': 'Move up', disabled: i === 0, onclick: function () { move(-1); } }),
            h('button', { class: 'iconbtn', type: 'button', icon: 'down', title: 'Move down', 'aria-label': 'Move down', disabled: i === list.length - 1, onclick: function () { move(1); } }),
            h('button', { class: 'iconbtn danger', type: 'button', icon: 'trash', title: 'Delete', 'aria-label': 'Delete', onclick: function () {
              confirmBox('Delete this ' + def.itemName + '?', (item[def.titleKey] || 'This ' + def.itemName) + ' will be removed when you save.', 'Delete', true).then(function (yes) { if (yes) { list.splice(i, 1); redraw(); } });
            } }),
            h('button', { class: 'iconbtn chev', type: 'button', icon: 'down', 'aria-label': open ? 'Close' : 'Open', onclick: function () { if (open) state.open.delete(item); else state.open.add(item); redraw(); } }))),
        body);
    }));
  }

  /** One form control bound to obj[f.key]. `refresh` updates the item header; `redraw` rebuilds the list. */
  function fieldFor(f, obj, refresh, redraw) {
    var set = function (v) { obj[f.key] = v; if (refresh) refresh(); changed(); };
    var wide = f.type === 'textarea' || f.type === 'list' || f.type === 'image' || f.action;

    if (f.type === 'bool') {
      var box = h('input', { type: 'checkbox', checked: !!obj[f.key], onchange: function () { set(box.checked); } });
      return h('div', { class: 'field' }, h('span', { class: 'label', text: ' ' }), h('label', { class: 'check' }, box, f.label), f.hint ? h('p', { class: 'hint', text: f.hint }) : null);
    }
    if (f.type === 'select') {
      var sel = h('select', { onchange: function () { set(sel.value); } }, f.options.map(function (o) { return h('option', { value: o.value, text: o.label, selected: obj[f.key] === o.value }); }));
      return field(f.label, sel, f.hint);
    }
    if (f.type === 'image') return h('div', { class: 'field wide' }, h('span', { class: 'label', text: f.label }), imagePicker(obj, f.key, set), f.hint ? h('p', { class: 'hint', text: f.hint }) : null);
    if (f.type === 'list') {
      var holder = h('div', {}), count = h('b', {});
      var draw = function () {
        clear(holder);
        count.textContent = f.label + ' (' + obj[f.key].length + ')';
        if (f.inline) holder.appendChild(inlineList(f, obj[f.key], draw));
        else holder.appendChild(listEditor(f, obj[f.key], draw));
        if (refresh) refresh();
        changed();
      };
      draw();
      return h('div', { class: 'field wide' }, h('div', { class: 'sub-list' },
        h('div', { class: 'sub-head' }, count, h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { addItem(f, obj[f.key]); draw(); } }, h('span', { icon: 'plus' }), 'Add ' + f.itemName)),
        holder));
    }
    var input = f.type === 'textarea'
      ? h('textarea', { rows: f.rows || 3, maxlength: f.max || 1200, placeholder: f.placeholder })
      : h('input', { type: f.type === 'date' ? 'date' : f.type === 'url' ? 'url' : 'text', maxlength: f.max || (f.type === 'url' ? 500 : 120), placeholder: f.placeholder, spellcheck: f.type === 'url' ? 'false' : null });
    input.value = obj[f.key] || '';
    input.addEventListener('input', function () { set(input.value); });
    if (!f.action) return field(f.label, input, f.hint, wide ? 'wide' : '');

    // "Fill from post": asks the server to read the post from X and fills the related fields
    var go = h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () {
      if (!input.value.trim()) return toast('Paste the link to the post first.', 'bad');
      busy(go, true, 'Reading…');
      api('POST', 'fetch-post', { url: input.value.trim() }).then(function (r) {
        if (r.text) obj.postText = r.text;
        if (r.date) obj.date = r.date;
        if (r.img) obj.img = r.img;
        obj.postVideo = !!r.video;
        toast('Filled in from the post. Check the title and description.', 'ok');
        changed(); redraw();
      }).catch(function (ex) { toast(ex.message, 'bad'); busy(go, false); });
    } }, h('span', { icon: 'spark' }), 'Fill from post');
    var wrap = field(f.label, input, f.hint, 'wide');
    wrap.insertBefore(h('div', { class: 'row' }, h('div', { class: 'grow' }, input), go), wrap.children[1]);
    return wrap;
  }

  function inlineList(def, list, redraw) {
    if (!list.length) return h('p', { class: 'hint', text: 'None added.' });
    return h('div', {}, list.map(function (item, i) {
      return h('div', { class: 'inline-row' }, def.fields.map(function (f) { return fieldFor(f, item); }),
        h('button', { class: 'iconbtn danger', type: 'button', icon: 'trash', 'aria-label': 'Remove', onclick: function () { list.splice(i, 1); redraw(); } }));
    }));
  }

  /* ----------------------------------------------------------------- images */
  function shrink(file) {
    // big photos are scaled down in the browser so pages stay fast; animated GIFs are left alone
    if (file.type === 'image/gif' || !window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file).then(function (bmp) {
      var scale = Math.min(1, 1920 / Math.max(bmp.width, bmp.height));
      if (scale === 1 && file.size <= 700 * 1024) return file;
      var c = document.createElement('canvas');
      c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
      c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
      return new Promise(function (res) { c.toBlob(function (b) { res(b && b.size < file.size ? b : file); }, 'image/webp', 0.86); });
    }).catch(function () { return file; });
  }

  function imagePicker(obj, key, set) {
    var thumb = h('div', { class: 'picker-thumb' });
    var note = h('p', {});
    var file = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp,image/gif,image/avif', hidden: true });
    var remove = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Remove', onclick: function () { set(''); draw(); } });
    var pick = h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Upload', onclick: function () { file.click(); } });
    var draw = function () {
      clear(thumb);
      if (obj[key]) thumb.appendChild(h('img', { src: obj[key], alt: '' })); else thumb.innerHTML = ICONS.image;
      remove.hidden = !obj[key];
      pick.textContent = obj[key] ? 'Replace' : 'Upload';
      note.textContent = obj[key] ? 'Picture set.' : 'JPG, PNG, WebP or GIF, up to 5 MB. You can also drop a file here.';
    };
    var upload = function (f) {
      if (!f) return;
      if (!/^image\//.test(f.type)) return toast('That file is not a picture.', 'bad');
      busy(pick, true, 'Uploading…');
      shrink(f).then(function (blob) {
        if (blob.size > 5 * 1024 * 1024) throw new Error('That picture is larger than 5 MB.');
        return api('POST', 'upload', blob);
      }).then(function (r) { set(r.path); }).catch(function (ex) { toast(ex.message, 'bad'); }).then(function () { busy(pick, false); draw(); file.value = ''; });
    };
    file.addEventListener('change', function () { upload(file.files[0]); });
    var el = h('div', { class: 'picker' }, thumb, h('div', { class: 'picker-side' }, note, h('div', { class: 'picker-actions' }, pick, remove)), file);
    el.addEventListener('dragover', function (e) { e.preventDefault(); el.classList.add('drag'); });
    el.addEventListener('dragleave', function () { el.classList.remove('drag'); });
    el.addEventListener('drop', function (e) { e.preventDefault(); el.classList.remove('drag'); upload(e.dataTransfer.files[0]); });
    draw();
    return el;
  }

  /* ---------------------------------------------------------- save / discard */
  function firstMissing() {
    // returns the first required field left empty, with every item on the way to it so they can be opened
    function scan(fields, rows, trail) {
      for (var i = 0; i < rows.length; i++) {
        var path = trail.concat([rows[i]]);
        for (var k = 0; k < fields.length; k++) {
          var f = fields[k];
          if (f.required && !String(rows[i][f.key] || '').trim()) return { path: path, field: f };
          if (f.type === 'list') { var inner = scan(f.fields, rows[i][f.key], path); if (inner) return inner; }
        }
      }
      return null;
    }
    for (var s = 0; s < state.schema.length; s++) {
      var def = state.schema[s];
      var hit = scan(def.fields, def.kind === 'list' ? state.content[def.key] : [state.content[def.key]], []);
      if (hit) { hit.def = def; return hit; }
    }
    return null;
  }
  function save(btn) {
    var miss = firstMissing();
    if (miss) {
      miss.path.forEach(function (item) { state.open.add(item); });
      if (location.hash !== '#' + miss.def.key) location.hash = miss.def.key; else renderRoute();
      return toast(miss.def.label + ': "' + miss.field.label + '" cannot be empty.', 'bad');
    }
    busy(btn, true, 'Saving…');
    api('PUT', 'content', { content: state.content }).then(function (r) {
      state.content = r.content; state.saved = JSON.stringify(r.content); state.open = new WeakSet();
      renderRoute(); changed();
      toast('Saved. The live site updates within about a minute.', 'ok');
    }).catch(function (ex) {
      if (ex.status === 401) return expired();
      if (ex.status !== 409) return toast(ex.message, 'bad');
      dialog({ title: 'Someone else saved first', text: ex.message, ok: 'Reload their version', cancel: 'Keep editing' }).then(function (yes) { if (yes) reload(); });
    }).then(function () { busy(btn, false); });
  }
  function reload() {
    return api('GET', 'content').then(function (r) { state.content = r.content; state.saved = JSON.stringify(r.content); state.open = new WeakSet(); renderRoute(); changed(); });
  }
  function discard() {
    confirmBox('Discard your changes?', 'Everything you changed since the last save will be lost.', 'Discard', true).then(function (yes) {
      if (!yes) return;
      state.content = JSON.parse(state.saved); state.open = new WeakSet(); renderRoute(); changed();
    });
  }
  function expired() { state.user = null; state.csrf = null; viewLogin('Your session ended. Sign in again to continue.'); }
  function signOut() {
    var go = function () { api('POST', 'logout').catch(function () {}).then(function () { state.user = null; state.csrf = null; location.hash = ''; viewLogin(); }); };
    if (!isDirty()) return go();
    confirmBox('Sign out without saving?', 'You have changes that are not saved yet.', 'Sign out', true).then(function (yes) { if (yes) go(); });
  }

  /* --------------------------------------------------------------- accounts */
  function passwordField(value) {
    var input = h('input', { type: 'text', value: value || randomPassword(), autocomplete: 'off', spellcheck: 'false' });
    var el = h('div', { class: 'secret' }, input,
      h('button', { class: 'btn btn-ghost', type: 'button', title: 'Make a new one', onclick: function () { input.value = randomPassword(); } }, h('span', { icon: 'spark' }), 'New'),
      h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { copy(input.value); } }, h('span', { icon: 'copy' }), 'Copy'));
    return { el: el, input: input };
  }

  function viewAccounts() {
    head('Accounts', 'Everyone here can sign in and edit the whole site. Owners can also add and remove accounts.');
    var listBox = h('div', { class: 'users' });
    var name = h('input', { type: 'text', maxlength: 40, autocomplete: 'off' });
    var user = h('input', { type: 'text', maxlength: 24, autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false' });
    var role = h('select', {}, h('option', { value: 'editor', text: 'Editor: can change all site content' }), h('option', { value: 'owner', text: 'Owner: content plus managing accounts' }));
    var pw = passwordField();
    var create = h('button', { class: 'btn btn-primary', type: 'button', onclick: function () {
      busy(create, true, 'Creating…');
      var creds = { username: user.value.trim().toLowerCase(), password: pw.input.value };
      api('POST', 'users', { name: name.value, username: creds.username, role: role.value, password: creds.password }).then(function (r) {
        draw(r.users); name.value = ''; user.value = ''; pw.input.value = randomPassword();
        shareDetails('Account created', creds);
      }).catch(function (ex) { toast(ex.message, 'bad'); }).then(function () { busy(create, false); });
    } }, h('span', { icon: 'plus' }), 'Create account');

    main.appendChild(h('div', { class: 'card' }, h('h2', { text: 'New account' }), h('p', { class: 'lead', text: 'Create the account, then send the person their username and password. They can change the password after signing in.' }),
      h('div', { class: 'form form-2' }, field('Name', name), field('Username', user, 'Letters, numbers, dots, dashes or underscores.'), field('Role', role), h('div', { class: 'field' }, h('span', { class: 'label', text: 'Password' }), pw.el), h('div', { class: 'wide' }, create))));
    main.appendChild(h('div', { class: 'card' }, h('h2', { text: 'People with access' }), h('p', { class: 'lead', text: 'Disable an account to block sign-in without deleting it.' }), listBox));

    function patch(u, body, done) { return api('PATCH', 'users/' + encodeURIComponent(u.username), body).then(function (r) { draw(r.users); if (done) done(); }).catch(function (ex) { toast(ex.message, 'bad'); draw(state.users); }); }
    function draw(users) {
      state.users = users;
      clear(listBox);
      users.forEach(function (u) {
        var me = u.username === state.user.username;
        var roleSel = h('select', { 'aria-label': 'Role for ' + u.username, onchange: function () { patch(u, { role: roleSel.value }, function () { toast('Role updated.', 'ok'); }); } },
          h('option', { value: 'editor', text: 'Editor', selected: u.role === 'editor' }), h('option', { value: 'owner', text: 'Owner', selected: u.role === 'owner' }));
        listBox.appendChild(h('div', { class: 'user' + (u.disabled ? ' off' : '') },
          h('div', { class: 'user-main' }, h('i', { text: (u.name || u.username).slice(0, 1) }),
            h('div', {}, h('b', {}, u.name || u.username, me ? h('span', { class: 'tag tag-you', text: 'You' }) : null, u.disabled ? h('span', { class: 'tag tag-off', text: 'Disabled' }) : null),
              h('span', { text: '@' + u.username + ' · ' + (u.lastLogin ? 'last signed in ' + new Date(u.lastLogin).toLocaleDateString() : 'has not signed in yet') }))),
          h('div', { class: 'user-tools' }, roleSel,
            h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: 'Reset password', onclick: function () {
              var f;
              dialog({ title: 'Reset password for ' + (u.name || u.username), text: 'They will be signed out everywhere and need this new password.', ok: 'Set password', build: function (box) { f = passwordField(); box.appendChild(f.el); return function () { return f.input.value; }; } }).then(function (value) {
                if (value) patch(u, { password: value }, function () { shareDetails('Password changed', { username: u.username, password: value }); });
              });
            } }),
            me ? null : h('button', { class: 'btn btn-ghost btn-sm', type: 'button', text: u.disabled ? 'Enable' : 'Disable', onclick: function () { patch(u, { disabled: !u.disabled }, function () { toast(u.disabled ? 'Account enabled.' : 'Account disabled.', 'ok'); }); } }),
            me ? null : h('button', { class: 'btn btn-danger btn-sm', type: 'button', text: 'Delete', onclick: function () {
              confirmBox('Delete ' + (u.name || u.username) + '?', 'This account will no longer be able to sign in. This cannot be undone.', 'Delete account', true).then(function (yes) {
                if (yes) api('DELETE', 'users/' + encodeURIComponent(u.username)).then(function (r) { draw(r.users); toast('Account deleted.', 'ok'); }).catch(function (ex) { toast(ex.message, 'bad'); });
              });
            } }))));
      });
    }
    api('GET', 'users').then(function (r) { draw(r.users); }).catch(function (ex) { if (ex.status === 401) expired(); else toast(ex.message, 'bad'); });
  }

  /* ----------------------------------------------------------------- orders */
  var PAY = { paid: 'Paid', awaiting_payment: 'Awaiting payment', payment_failed: 'Payment failed' };
  var STAGES = [['new', 'New'], ['sent', 'Sent to supplier'], ['shipped', 'Shipped'], ['cancelled', 'Cancelled']];
  function cash(cents, cur) { try { return new Intl.NumberFormat('en-US', { style: 'currency', currency: String(cur || 'usd').toUpperCase() }).format(cents / 100); } catch (e) { return (cents / 100).toFixed(2); } }
  // spreadsheet programs run cells that start with = + - @ as formulas, so those are written as plain text
  function csvCell(v) { v = String(v === null || v === undefined ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
  function exportCsv(orders) {
    var rows = [['Order', 'Date', 'Payment', 'Progress', 'Item', 'Size', 'Custom text', 'Quantity', 'Total', 'Currency', 'Name', 'Email', 'Phone', 'Ship to', 'Address 1', 'Address 2', 'City', 'State', 'Postcode', 'Country', 'Note']];
    orders.forEach(function (o) { rows.push([o.number, o.created, PAY[o.status] || o.status, o.fulfilment, o.item.name, o.item.size, o.item.customText, o.item.quantity, (o.total / 100).toFixed(2), String(o.currency).toUpperCase(), o.customer.name, o.customer.email, o.customer.phone, o.shipTo.name, o.shipTo.line1, o.shipTo.line2, o.shipTo.city, o.shipTo.state, o.shipTo.postcode, o.shipTo.country, o.note]); });
    var url = URL.createObjectURL(new Blob([rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n')], { type: 'text/csv' }));
    var a = h('a', { href: url, download: 'force-orders-' + new Date().toISOString().slice(0, 10) + '.csv' }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  function viewOrders() {
    var setup = h('div', {}), box = h('div', { class: 'orders' });
    var exportBtn = h('button', { class: 'btn btn-ghost', type: 'button', disabled: true, onclick: function () { exportCsv(state.orders || []); } }, h('span', { icon: 'copy' }), 'Export CSV');
    head('Orders', 'Every order placed on the site, newest first. Only owners can see this page, because it holds customers\u2019 names and addresses.', exportBtn);
    main.appendChild(setup); main.appendChild(box);
    box.appendChild(h('p', { class: 'orders-empty', text: 'Loading\u2026' }));
    api('GET', 'orders').then(function (r) { state.orders = r.orders; drawSetup(r.shop); draw(r.more); }).catch(function (ex) { clear(box).appendChild(h('div', { class: 'error', text: ex.message })); });

    function drawSetup(s) {
      clear(setup);
      if (s.ready) { setup.appendChild(h('div', { class: 'card shop-state ' + (s.mode === 'live' ? 'is-live' : 'is-test') }, h('b', { text: s.mode === 'live' ? 'Stripe is connected and taking real payments.' : 'Stripe is connected in test mode. No real money moves until live keys are added.' }))); return; }
      setup.appendChild(h('div', { class: 'card shop-state is-off' }, h('b', { text: 'The shop is not taking orders yet.' }),
        h('p', { text: 'Two secrets have to be added in Cloudflare (Workers & Pages, force-esports, Settings, Variables and Secrets) before anything can be sold on the site:' }),
        h('ul', {}, h('li', { text: 'STRIPE_SECRET_KEY: ' + (s.key ? 'added' : 'missing') }), h('li', { text: 'STRIPE_WEBHOOK_SECRET: ' + (s.webhook ? 'added' : 'missing') })),
        h('p', { text: 'The README in the repository lists the steps. After that, switch on \u201cSell this on the site\u201d for a product under Merch.' })));
    }
    function draw(more) {
      var orders = state.orders; clear(box); exportBtn.disabled = !orders.length;
      if (!orders.length) { box.appendChild(h('p', { class: 'orders-empty', text: 'No orders yet. They appear here as soon as a payment goes through.' })); return; }
      orders.forEach(function (o) {
        var stage = h('select', { id: 'stage-' + o.number, onchange: function () { patch(o, { fulfilment: stage.value }, 'Progress updated.'); } }, STAGES.map(function (s) { return h('option', { value: s[0], text: s[1], selected: o.fulfilment === s[0] }); }));
        var note = h('input', { type: 'text', id: 'note-' + o.number, maxlength: 300, value: o.note || '', placeholder: 'Tracking number, supplier reference\u2026', onchange: function () { patch(o, { note: note.value }, 'Note saved.'); } });
        var a = o.shipTo, lines = [a.name, a.line1, a.line2, [a.city, a.state, a.postcode].filter(Boolean).join(', '), a.country].filter(Boolean);
        box.appendChild(h('div', { class: 'card order' },
          h('div', { class: 'order-top' },
            h('div', { class: 'order-id' }, h('b', { text: '#' + o.number }), h('span', { text: new Date(o.created).toLocaleString() })),
            h('span', { class: 'tag tag-' + o.status, text: PAY[o.status] || o.status }), o.live ? null : h('span', { class: 'tag tag-test', text: 'Test' }),
            h('b', { class: 'order-total', text: cash(o.total, o.currency) })),
          h('div', { class: 'order-body' },
            h('div', {}, h('span', { class: 'label', text: 'Item' }), h('p', { text: o.item.quantity + ' \u00d7 ' + o.item.name + (o.item.size ? ' (' + o.item.size + ')' : '') }), o.item.customText ? h('p', { class: 'dim', text: o.item.customLabel + ': ' + o.item.customText }) : null),
            h('div', {}, h('span', { class: 'label', text: 'Customer' }), h('p', { text: o.customer.name || 'No name given' }), h('p', { class: 'dim', text: [o.customer.email, o.customer.phone].filter(Boolean).join(' \u00b7 ') })),
            h('div', {}, h('span', { class: 'label', text: 'Ship to' }), lines.map(function (l) { return h('p', { text: l }); }))),
          h('div', { class: 'order-foot' }, field('Progress', stage), field('Note', note),
            h('button', { class: 'iconbtn danger', type: 'button', title: 'Delete order', 'aria-label': 'Delete order ' + o.number, icon: 'trash', onclick: function () {
              confirmBox('Delete this order?', 'Order #' + o.number + ' and the customer details stored with it are removed from the site for good. The payment itself stays in Stripe.', 'Delete order', true).then(function (ok) {
                if (!ok) return;
                api('DELETE', 'orders/' + encodeURIComponent(o.key)).then(function () { state.orders = state.orders.filter(function (x) { return x.key !== o.key; }); draw(more); toast('Order deleted.', 'ok'); }).catch(function (ex) { toast(ex.message, 'bad'); });
              });
            } }))));
      });
      if (more) box.appendChild(h('p', { class: 'orders-empty', text: 'Showing the newest 200 orders.' }));
    }
    function patch(o, body, done) {
      api('PATCH', 'orders/' + encodeURIComponent(o.key), body).then(function (r) { Object.assign(o, r.order); toast(done, 'ok'); }).catch(function (ex) { toast(ex.message, 'bad'); });
    }
  }

  function shareDetails(title, creds) {
    var text = 'Force Esports admin\n' + location.origin + '/admin\nUsername: ' + creds.username + '\nPassword: ' + creds.password;
    dialog({ title: title, text: 'Send these sign-in details to the person. The password is not shown again.', ok: 'Done', cancel: false, build: function (box) {
      box.appendChild(h('textarea', { class: 'input', rows: 4, readonly: true, text: text }));
      box.appendChild(h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { copy(text); } }, h('span', { icon: 'copy' }), 'Copy details'));
    } });
  }

  function viewPassword() {
    head('My password', 'Changing it signs you out on every other device.');
    var cur = h('input', { type: 'password', autocomplete: 'current-password' });
    var next = h('input', { type: 'password', autocomplete: 'new-password' });
    var again = h('input', { type: 'password', autocomplete: 'new-password' });
    var btn = h('button', { class: 'btn btn-primary', type: 'submit', text: 'Change password' });
    main.appendChild(h('div', { class: 'card' }, h('form', { class: 'form', novalidate: true, onsubmit: function (e) {
      e.preventDefault();
      if (next.value !== again.value) return toast('The two new passwords do not match.', 'bad');
      busy(btn, true, 'Changing…');
      api('POST', 'password', { current: cur.value, next: next.value }).then(function (r) {
        state.csrf = r.csrf; cur.value = next.value = again.value = ''; toast('Password changed.', 'ok');
      }).catch(function (ex) { if (ex.status === 401) expired(); else toast(ex.message, 'bad'); }).then(function () { busy(btn, false); });
    } }, field('Current password', cur), field('New password', next, 'At least 10 characters.'), field('New password again', again), h('div', {}, btn))));
  }

  /* ------------------------------------------------------------------- boot */
  api('GET', 'state').then(function (s) {
    if (s.setupNeeded) return viewSetup(s.setupEnabled);
    if (!s.user) return viewLogin();
    state.user = s.user; state.csrf = s.csrf;
    return startApp();
  }).catch(function (ex) {
    authScreen('Admin unavailable', '', h('div', { class: 'error', text: ex.message }));
  });
})();
