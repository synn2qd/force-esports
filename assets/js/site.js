/* Force Esports — small behaviours: mobile menu, hero slider, roster switch. No dependencies. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ---------------------------------------------------------- mobile menu */
  var toggle = document.querySelector('.nav-toggle');
  var announce = document.querySelector('.announce');
  function setAnnounceHeight() {
    // the menu opens below the header; the gold bar above it scrolls away, so measure what is still visible
    var h = announce ? Math.max(0, announce.getBoundingClientRect().bottom) : 0;
    document.documentElement.style.setProperty('--announce-h', h + 'px');
  }
  function closeMenu() {
    document.body.classList.remove('nav-open');
    if (toggle) { toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Open menu'); }
  }
  if (toggle) {
    toggle.addEventListener('click', function () {
      setAnnounceHeight();
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    document.querySelectorAll('.nav a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) closeMenu(); });
  }

  /* ---------------------------------------------------------- hero slider */
  var hero = document.querySelector('.hero');
  if (hero) {
    var slides = [].slice.call(hero.querySelectorAll('.slide'));
    var bars = [].slice.call(hero.querySelectorAll('.hbars span'));
    var btn = hero.querySelector('[data-hero="toggle"]');
    var DELAY = 6500, index = 0, timer = null, playing = false;
    hero.style.setProperty('--hero-ms', DELAY + 'ms');

    function show(n) {
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
    }
    function schedule() { clearTimeout(timer); if (playing) timer = setTimeout(function () { show(index + 1); schedule(); }, DELAY); }
    function play() { playing = true; hero.classList.add('is-playing'); btn.setAttribute('aria-label', 'Pause slideshow'); show(index); schedule(); }
    function pause() { playing = false; hero.classList.remove('is-playing'); btn.setAttribute('aria-label', 'Play slideshow'); clearTimeout(timer); }

    hero.querySelector('[data-hero="prev"]').addEventListener('click', function () { show(index - 1); schedule(); });
    hero.querySelector('[data-hero="next"]').addEventListener('click', function () { show(index + 1); schedule(); });
    btn.addEventListener('click', function () { if (playing) pause(); else play(); });
    document.addEventListener('visibilitychange', function () { if (document.hidden) clearTimeout(timer); else schedule(); });
    if (slides.length > 1 && !reduce) play(); else pause();
  }

  /* ------------------------------------------- accomplishments: X embeds */
  // If the X script is blocked or slow, show our own picture of the post above the quoted text instead.
  var embeds = [].slice.call(document.querySelectorAll('.acc-embed'));
  if (embeds.length) {
    setTimeout(function () {
      embeds.forEach(function (el) { if (!el.querySelector('iframe')) el.classList.add('no-embed'); });
    }, 4000);
  }

  /* -------------------------------------------------------- roster switch */
  var tabs = [].slice.call(document.querySelectorAll('.switch [role="tab"]'));
  if (tabs.length) {
    var select = function (key, focus) {
      var found = false;
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-roster') === key;
        if (on) found = true;
      });
      if (!found) key = tabs[0].getAttribute('data-roster');
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
      t.addEventListener('click', function () {
        var key = select(t.getAttribute('data-roster'));
        history.replaceState(null, '', '#' + key);
      });
      t.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        var next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
        history.replaceState(null, '', '#' + select(next.getAttribute('data-roster'), true));
      });
    });
    var fromHash = function () { select(location.hash.replace('#', '')); };
    window.addEventListener('hashchange', fromHash);
    fromHash();
  }
})();
