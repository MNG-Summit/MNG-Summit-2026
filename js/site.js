// MNG Summit — site JS
(function () {
  // Inject the SVG ink-grain filter used by headline rules.
  // Just a soft turbulence + tiny displacement — gives the text a barely-
  // there hand-printed edge without punching interior holes. Subtle.
  var grainSvg = document.createElement('div');
  grainSvg.setAttribute('aria-hidden', 'true');
  grainSvg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  grainSvg.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<filter id="text-grain">' +
        '<feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" seed="3"/>' +
        '<feDisplacementMap in="SourceGraphic" scale="0.7"/>' +
      '</filter>' +
    '</svg>';
  document.body.insertBefore(grainSvg, document.body.firstChild);

  // Header scroll state
  var header = document.querySelector('.header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile nav toggle
  var toggle = document.querySelector('.nav-toggle');
  var navList = document.querySelector('.nav-list');
  if (toggle && navList) {
    toggle.addEventListener('click', function () {
      var open = navList.classList.toggle('is-open');
      toggle.textContent = open ? 'Close' : 'Menu';
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navList.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        navList.classList.remove('is-open');
        toggle.textContent = 'Menu';
      }
    });
  }

  // Reveal on scroll
  var reveals = document.querySelectorAll('[data-rev]');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // Countdown to Oct 11, 2026
  var cd = document.querySelector('[data-countdown]');
  if (cd) {
    var target = new Date('2026-10-11T09:00:00-04:00').getTime();
    var update = function () {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 86400000);
      var h = Math.floor((diff % 86400000) / 3600000);
      var m = Math.floor((diff % 3600000) / 60000);
      cd.querySelectorAll('[data-cd-d]').forEach(function (n) { n.textContent = String(d); });
      cd.querySelectorAll('[data-cd-h]').forEach(function (n) { n.textContent = String(h).padStart(2, '0'); });
      cd.querySelectorAll('[data-cd-m]').forEach(function (n) { n.textContent = String(m).padStart(2, '0'); });
    };
    update();
    setInterval(update, 30000);
  }

  // Multi-step intake wizard
  document.querySelectorAll('[data-intake]').forEach(function (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll('.intake-step'));
    var bars = form.querySelectorAll('.intake-bar span');
    var done = form.querySelector('.intake-done');
    var i = 0;
    var render = function () {
      steps.forEach(function (s, n) { s.classList.toggle('is-active', n === i); });
      bars.forEach(function (b, n) { b.classList.toggle('is-done', n <= i); });
      var back = steps[i].querySelector('.intake-back');
      if (back) back.classList.toggle('is-hidden', i === 0);
      var f = steps[i].querySelector('input, select, textarea');
      if (f) setTimeout(function () { f.focus(); }, 60);
    };
    form.addEventListener('click', function (e) {
      if (e.target.closest('[data-next]')) {
        var f = steps[i].querySelector('input[required], textarea[required]');
        if (f && !f.value.trim()) { f.focus(); f.style.borderBottomColor = '#E0243B'; return; }
        if (i < steps.length - 1) { i++; render(); }
      } else if (e.target.closest('[data-back]') && i > 0) {
        i--; render();
      }
    });
    form.addEventListener('input', function (e) {
      e.target.style.borderBottomColor = '';
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var finish = function () {
        if (!done) return;
        var bar = form.querySelector('.intake-bar');
        if (bar) bar.style.display = 'none';
        steps.forEach(function (s) { s.classList.remove('is-active'); });
        done.classList.add('is-active');
      };
      var payload = { form: form.getAttribute('data-intake') || 'application' };
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (f.id) payload[f.id] = f.value;
      });
      var submit = form.querySelector('[type="submit"]');
      if (submit) submit.disabled = true;
      fetch('/.netlify/functions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(finish, finish);
    });
    render();
  });
})();
