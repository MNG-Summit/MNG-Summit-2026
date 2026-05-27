// MNG Summit · Experiment build · App-shell JS
(function () {

  // ---------- countdown (compact: days only) ----------
  var dayTargets = document.querySelectorAll('[data-countdown-days]');
  if (dayTargets.length) {
    var target = new Date('2026-10-09T09:00:00-04:00').getTime();
    var update = function () {
      var diff = Math.max(0, target - Date.now());
      var d = Math.floor(diff / 86400000);
      dayTargets.forEach(function (n) { n.textContent = String(d); });
    };
    update();
    setInterval(update, 60000);
  }

  // ---------- day tabs (schedule view) ----------
  var dayTabs = document.querySelectorAll('.day-tab');
  var schedules = document.querySelectorAll('[data-schedule]');
  if (dayTabs.length && schedules.length) {
    dayTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var day = tab.getAttribute('data-day');
        dayTabs.forEach(function (t) { t.classList.toggle('is-active', t === tab); });
        schedules.forEach(function (s) {
          if (s.getAttribute('data-schedule') === day) s.removeAttribute('hidden');
          else s.setAttribute('hidden', '');
        });
      });
    });
  }

  // ---------- filter chips (track filter) ----------
  // Helper: hide a session AND the .schedule-time label immediately before it
  // (otherwise the grid auto-flow pulls leftover time labels into the session column).
  var setSessionVisible = function (s, show) {
    s.style.display = show ? '' : 'none';
    var prev = s.previousElementSibling;
    if (prev && prev.classList.contains('schedule-time')) {
      prev.style.display = show ? '' : 'none';
    }
  };

  var chips = document.querySelectorAll('.app-filterbar .chip');
  var sessions = document.querySelectorAll('.session');
  if (chips.length) {
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var track = chip.getAttribute('data-track');
        chips.forEach(function (c) { c.classList.toggle('is-on', c === chip); });
        sessions.forEach(function (s) {
          setSessionVisible(s, track === 'all' || s.classList.contains(track));
        });
      });
    });
  }

  // ---------- search (live filter sessions) ----------
  var searchInput = document.getElementById('schedule-search');
  if (searchInput) {
    searchInput.addEventListener('input', function () {
      var q = searchInput.value.trim().toLowerCase();
      sessions.forEach(function (s) {
        if (!q) { setSessionVisible(s, true); return; }
        var hay = s.textContent.toLowerCase();
        setSessionVisible(s, hay.indexOf(q) > -1);
      });
    });
  }

  // ---------- drawer (session detail) ----------
  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('drawer-scrim');
  var closeBtn = document.getElementById('drawer-close');
  var drawerTop = document.getElementById('drawer-top');
  var drawerTitle = document.getElementById('drawer-title');
  var drawerMeta = document.getElementById('drawer-meta');
  var drawerBody = document.getElementById('drawer-body');

  var openDrawer = function (data) {
    if (!drawer) return;
    drawerTop.textContent = data.track || 'Session';
    drawerTitle.textContent = data.title || '';
    drawerMeta.innerHTML = '';
    (data.meta || []).forEach(function (pair) {
      var dt = document.createElement('dt'); dt.textContent = pair[0];
      var dd = document.createElement('dd'); dd.textContent = pair[1];
      drawerMeta.appendChild(dt); drawerMeta.appendChild(dd);
    });
    drawerBody.innerHTML = data.body || '';
    drawer.classList.add('is-open');
    scrim.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  };
  var closeDrawer = function () {
    if (!drawer) return;
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };
  if (scrim) scrim.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  // Wire sessions to the drawer
  sessions.forEach(function (s) {
    s.addEventListener('click', function (e) {
      e.preventDefault();
      var title = s.querySelector('.session-title') ? s.querySelector('.session-title').textContent.trim() : '';
      var track = s.querySelector('.session-track') ? s.querySelector('.session-track').textContent.trim() : 'Session';
      var time = s.querySelector('.session-top span:last-child') ? s.querySelector('.session-top span:last-child').textContent.trim() : '';
      var speakers = s.querySelector('.session-speakers') ? s.querySelector('.session-speakers').innerHTML : '';
      var metaSpans = s.querySelectorAll('.session-meta span');
      var meta = [['Time', time]];
      metaSpans.forEach(function (m, i) {
        meta.push([i === 0 ? 'Venue / Format' : 'Notes', m.textContent.trim()]);
      });
      openDrawer({
        track: track,
        title: title,
        meta: meta,
        body: '<p>' + speakers + '</p><p style="color:var(--mute);font-size:13px;margin-top:18px;">Full speaker list and read-ahead materials will publish closer to the event. Join the early list to be notified.</p>'
      });
    });
  });

  // ---------- modal popup (intake forms) ----------
  var mScrim = document.getElementById('modal-scrim');
  var mModal = document.getElementById('involve-modal');
  if (mScrim && mModal) {
    var mClose = document.getElementById('modal-close');
    var mContents = mModal.querySelectorAll('.modal-content');

    var openModal = function (name) {
      mContents.forEach(function (c) {
        c.hidden = c.getAttribute('data-content') !== name;
      });
      mModal.classList.add('is-open');
      mModal.setAttribute('aria-hidden', 'false');
      mScrim.classList.add('is-open');
      document.body.style.overflow = 'hidden';
      var first = mModal.querySelector('.modal-content:not([hidden]) input, .modal-content:not([hidden]) select, .modal-content:not([hidden]) textarea');
      if (first) setTimeout(function () { first.focus(); }, 150);
    };

    var closeModal = function () {
      mModal.classList.remove('is-open');
      mModal.setAttribute('aria-hidden', 'true');
      mScrim.classList.remove('is-open');
      document.body.style.overflow = '';
    };

    document.querySelectorAll('[data-modal]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openModal(el.getAttribute('data-modal'));
      });
    });

    if (mClose) mClose.addEventListener('click', closeModal);
    mScrim.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mModal.classList.contains('is-open')) closeModal();
    });

    // Form submissions → pre-filled mailto so user reviews + sends from their own client
    mModal.querySelectorAll('.modal-form').forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var subject = form.getAttribute('data-subject') || 'MNG Summit inquiry';
        var parts = [];
        var data = new FormData(form);
        data.forEach(function (value, key) {
          if (!value) return;
          var label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
          parts.push(label + ':\n' + value);
        });
        var body = parts.join('\n\n') + '\n\n— Sent via mngsummit.org';
        var href = 'mailto:contact@mngsummit.org?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
        window.location.href = href;
      });
    });
  }

  // ---------- footer newsletter: live validation + POST to Resend subscribe function ----------
  var nlForm = document.getElementById('footer-newsletter');
  if (nlForm) {
    var nlInput = nlForm.querySelector('input[type="email"]');
    var nlBtn = nlForm.querySelector('.l-footer-newsletter-btn');
    // Status element appended below the form for inline feedback
    var nlStatus = nlForm.querySelector('.l-footer-newsletter-status');
    if (!nlStatus) {
      nlStatus = document.createElement('div');
      nlStatus.className = 'l-footer-newsletter-status';
      nlStatus.setAttribute('role', 'status');
      nlStatus.setAttribute('aria-live', 'polite');
      nlForm.appendChild(nlStatus);
    }
    if (nlInput && nlBtn) {
      var update = function () {
        var v = nlInput.value.trim();
        nlBtn.disabled = !(v.length > 3 && v.indexOf('@') > 0 && v.indexOf('.') > -1);
      };
      nlInput.addEventListener('input', update);
      update();
    }
    nlForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!nlInput) return;
      var email = nlInput.value.trim();
      if (!email) { nlInput.focus(); return; }
      // Lock UI while sending
      nlBtn.disabled = true;
      var originalBtnText = nlBtn.textContent;
      nlBtn.textContent = 'Sending…';
      nlStatus.textContent = '';
      nlStatus.classList.remove('is-ok', 'is-err');
      fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          source: 'footer · ' + (document.title || location.pathname),
          referrer: document.referrer || ''
        })
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && res.ok) {
            nlStatus.textContent = "You're on the list. Check your inbox for a welcome note.";
            nlStatus.classList.add('is-ok');
            nlInput.value = '';
            nlBtn.textContent = 'Subscribed ✓';
            // Re-enable after a beat so they can subscribe another address if they want
            setTimeout(function () {
              nlBtn.textContent = originalBtnText;
              nlBtn.disabled = true;
            }, 2400);
          } else {
            var msg = (res && res.error) || 'Could not subscribe right now. Please try again.';
            nlStatus.textContent = msg;
            nlStatus.classList.add('is-err');
            nlBtn.textContent = originalBtnText;
            nlBtn.disabled = false;
          }
        })
        .catch(function () {
          nlStatus.textContent = 'Network error. Please try again.';
          nlStatus.classList.add('is-err');
          nlBtn.textContent = originalBtnText;
          nlBtn.disabled = false;
        });
    });
  }

  // ---------- mobile nav toggle ----------
  var navToggle = document.querySelector('.app-nav-toggle');
  var navTier2 = document.querySelector('.app-nav-tier2');
  if (navToggle && navTier2) {
    navToggle.addEventListener('click', function () {
      document.body.classList.toggle('nav-open');
      navToggle.textContent = document.body.classList.contains('nav-open') ? '✕' : '≡';
    });
    // close on any nav link click
    navTier2.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        document.body.classList.remove('nav-open');
        navToggle.textContent = '≡';
      }
    });
  }

  // ---------- search button → inline overlay ----------
  var searchBtns = document.querySelectorAll('.app-nav-pill--icon');
  if (searchBtns.length) {
    // Build the overlay once and reuse
    var overlay = document.createElement('div');
    overlay.className = 'site-search-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = ''
      + '<div class="site-search-scrim"></div>'
      + '<div class="site-search-panel" role="dialog" aria-modal="true" aria-label="Search">'
      +   '<form class="site-search-form" autocomplete="off">'
      +     '<span class="site-search-ico" aria-hidden="true">⌕</span>'
      +     '<input type="search" class="site-search-input" placeholder="Search speakers, board, programs, summits…" aria-label="Search the site" />'
      +     '<button type="button" class="site-search-close" aria-label="Close search">✕</button>'
      +   '</form>'
      +   '<div class="site-search-hint">'
      +     '<span>Try:</span>'
      +     '<a href="directory-speakers.html" class="site-search-chip">All speakers</a>'
      +     '<a href="directory-board.html" class="site-search-chip">Board</a>'
      +     '<a href="programs.html" class="site-search-chip">Programs</a>'
      +     '<a href="archive.html" class="site-search-chip">Past summits</a>'
      +     '<a href="summit-2026.html" class="site-search-chip">Summit 2026</a>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(overlay);

    var sScrim = overlay.querySelector('.site-search-scrim');
    var sForm = overlay.querySelector('.site-search-form');
    var sInput = overlay.querySelector('.site-search-input');
    var sClose = overlay.querySelector('.site-search-close');

    var openSearch = function () {
      overlay.classList.add('is-open');
      overlay.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Also close the burger if open
      if (document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        var nt = document.querySelector('.app-nav-toggle');
        if (nt) nt.textContent = '≡';
      }
      setTimeout(function () { sInput.focus(); }, 80);
    };
    var closeSearch = function () {
      overlay.classList.remove('is-open');
      overlay.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      sInput.value = '';
    };

    searchBtns.forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        openSearch();
      });
    });
    if (sScrim) sScrim.addEventListener('click', closeSearch);
    if (sClose) sClose.addEventListener('click', closeSearch);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('is-open')) closeSearch();
    });
    sForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var q = sInput.value.trim();
      if (!q) { sInput.focus(); return; }
      window.location.href = 'directory-speakers.html#q=' + encodeURIComponent(q);
    });
  }

})();
