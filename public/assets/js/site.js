/* Force Esports — small behaviours: copy deterrents, mobile menu, hero slider, roster switch, buy button. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ------------------------------------------------------ copy deterrents */
  // Closes the casual routes to the page's source and pictures: the right-click menu, the view-source, save and
  // developer-tools shortcuts, and dragging a picture out. It is a deterrent, not a lock: whatever a browser can
  // show, the person using it can still save through the browser's own menus.
  document.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  document.addEventListener('dragstart', function (e) { if (e.target && e.target.nodeName === 'IMG') e.preventDefault(); });
  document.addEventListener('keydown', function (e) {
    var c = e.code, mod = e.ctrlKey || e.metaKey, tool = c === 'KeyI' || c === 'KeyJ' || c === 'KeyC';
    if (c === 'F12' || (mod && !e.shiftKey && !e.altKey && (c === 'KeyU' || c === 'KeyS')) || (mod && e.shiftKey && tool) || (e.metaKey && e.altKey && (tool || c === 'KeyU'))) e.preventDefault();
  }, true);

  /* ---------------------------------------------------------- mobile menu */
  var toggle = document.querySelector('.nav-toggle');
  var bar = document.querySelector('.topbar');
  function measureBar() {
    // the menu opens under the header; the gold bar above it scrolls away, so measure what is still showing
    var h = bar ? Math.max(0, bar.getBoundingClientRect().bottom) : 0;
    document.documentElement.style.setProperty('--bar-h', h + 'px');
  }
  function closeMenu() {
    document.body.classList.remove('nav-open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      measureBar();
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });
  }

  /* ---------------------------------------------------------- hero slider */
  var hero = document.querySelector('.hero');
  var btn = hero && hero.querySelector('[data-hero="toggle"]');
  if (hero && btn) {
    var slides = [].slice.call(hero.querySelectorAll('.slide'));
    var bars = [].slice.call(hero.querySelectorAll('.hero-bars span'));
    var DELAY = 6500, index = 0, timer = null, playing = false;
    hero.style.setProperty('--hero-ms', DELAY + 'ms');

    var show = function (n) {
      index = (n + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var on = i === index;
        s.classList.toggle('is-active', on);
        if (on) s.removeAttribute('aria-hidden'); else s.setAttribute('aria-hidden', 'true');
        s.querySelectorAll('a').forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
      });
      bars.forEach(function (b, i) {
        b.classList.remove('is-active');
        if (i === index) { void b.offsetWidth; b.classList.add('is-active'); } // restart the progress animation
      });
    };
    var schedule = function () { clearTimeout(timer); if (playing) timer = setTimeout(function () { show(index + 1); schedule(); }, DELAY); };
    var play = function () { playing = true; hero.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause slideshow'); show(index); schedule(); };
    var pause = function () { playing = false; hero.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play slideshow'); clearTimeout(timer); };

    hero.querySelector('[data-hero="prev"]').addEventListener('click', function () { show(index - 1); schedule(); });
    hero.querySelector('[data-hero="next"]').addEventListener('click', function () { show(index + 1); schedule(); });
    btn.addEventListener('click', function () { if (playing) pause(); else play(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    if (!reduce) play(); else pause();
  }

  /* ------------------------------------------------------------ buy button */
  // The form asks this site to start a checkout, then hands the buyer to Stripe's payment page.
  var buy = document.querySelector('form[data-buy]');
  if (buy) {
    var buyErr = buy.querySelector('.buy-error'), buyBtn = buy.querySelector('button[type="submit"]'), buyLabel = buyBtn.querySelector('span');
    var buyFail = function (msg) { buyErr.textContent = msg; buyErr.hidden = false; buyBtn.disabled = false; buyLabel.textContent = 'Buy now'; };
    buy.addEventListener('submit', function (e) {
      e.preventDefault();
      var size = buy.querySelector('input[name="size"]:checked'), custom = buy.querySelector('input[name="custom"]');
      if (buy.querySelector('input[name="size"]') && !size) return buyFail('Choose a size.');
      buyErr.hidden = true; buyBtn.disabled = true; buyLabel.textContent = 'Opening checkout…';
      fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product: buy.getAttribute('data-buy'), size: size ? size.value : '', qty: Number(buy.querySelector('select[name="qty"]').value), custom: custom ? custom.value : '' }) })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (d) { if (res.ok && d.url) window.location.assign(d.url); else buyFail(d.error || 'Checkout could not be started. Try again in a moment.'); }); })
        .catch(function () { buyFail('Could not reach the shop. Check your connection and try again.'); });
    });
    window.addEventListener('pageshow', function () { buyBtn.disabled = false; buyLabel.textContent = 'Buy now'; });   // coming back from checkout with the Back button
  }

  /* -------------------------------------------------------- roster switch */
  var tabs = [].slice.call(document.querySelectorAll('.switch [role="tab"]'));
  if (tabs.length) {
    var select = function (key, focus) {
      if (!tabs.some(function (t) { return t.getAttribute('data-roster') === key; })) key = tabs[0].getAttribute('data-roster');
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-roster') === key;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !on;
        if (on && focus) t.focus();
      });
      return key;
    };
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { history.replaceState(null, '', '#' + select(t.getAttribute('data-roster'))); });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        history.replaceState(null, '', '#' + select(next.getAttribute('data-roster'), true));
      });
    });
    var fromHash = function () { select(decodeURIComponent(location.hash.replace('#', ''))); };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }
})();
