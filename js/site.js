// MNG Summit — site JS
(function () {
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
})();
