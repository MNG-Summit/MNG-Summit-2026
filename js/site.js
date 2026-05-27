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

  // Auto-populate missing modal-content blocks so any page with #involve-modal
  // can trigger any form type (speak, mentor, volunteer, contact, attend)
  // without HTML duplication. The page only needs the modal shell.
  if (mModal) {
    var MODAL_CONTENT_TEMPLATES = {
      'attend': ''
        + '<div class="modal-eyebrow">Attend Summit 2026</div>'
        + '<h2>Get on the early list</h2>'
        + '<p class="modal-lead">Three days · 100 seats · NYC · Oct 9–11, 2026. We\'ll send the ticket link to the <b>early list first</b>.</p>'
        + '<form class="modal-form">'
        +   '<label>Your name <input name="name" required /></label>'
        +   '<label>Email <input name="email" type="email" required /></label>'
        +   '<label>LinkedIn<div class="input-prefixed"><span class="input-prefix">linkedin.com/in/</span><input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" /></div></label>'
        +   '<label>City <input name="city" placeholder="e.g. New York, San Francisco, Ulaanbaatar" /></label>'
        +   '<label>Industry <input name="industry" placeholder="e.g. Finance, Tech, Design, Policy" /></label>'
        +   '<label>One thing you\'re hoping to find at the summit (optional) <textarea name="hoping" rows="2" placeholder="e.g. The right co-founder, a job, a community."></textarea></label>'
        +   '<button type="submit" class="modal-submit">Hold my spot →</button>'
        + '</form>'
        + '<div class="modal-foot">We send weekly on Wednesdays. Unsubscribe any time.</div>',
      'speak': ''
        + '<div class="modal-eyebrow">Speak on a panel</div>'
        + '<h2>Apply to speak</h2>'
        + '<p class="modal-lead">Keynote 20 min · Panel 60 min · Workshop 90 min. We close the call <b>by June 2026</b>.</p>'
        + '<form class="modal-form">'
        +   '<label>Your name <input name="name" required /></label>'
        +   '<label>Email <input name="email" type="email" required /></label>'
        +   '<label>LinkedIn<div class="input-prefixed"><span class="input-prefix">linkedin.com/in/</span><input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" required /></div></label>'
        +   '<label>Format <select name="format"><option>Keynote (20 min)</option><option>Panel (60 min)</option><option>Workshop (90 min)</option><option>Open to any</option></select></label>'
        +   '<label>Topic <input name="topic" placeholder="e.g. Building agentic AI tools in Mongolia" /></label>'
        +   '<label>1-line pitch <textarea name="pitch" rows="3" placeholder="What you\'ll say. The payoff for the audience."></textarea></label>'
        +   '<button type="submit" class="modal-submit">Apply to speak →</button>'
        + '</form>',
      'mentor': ''
        + '<div class="modal-eyebrow">Mentor someone</div>'
        + '<h2>Mentor intake</h2>'
        + '<p class="modal-lead"><b>2 hrs/month for 3 months.</b> We hand-match mentors and mentees by industry, career stage, and time-zone.</p>'
        + '<form class="modal-form">'
        +   '<label>Your name <input name="name" required /></label>'
        +   '<label>Email <input name="email" type="email" required /></label>'
        +   '<label>LinkedIn<div class="input-prefixed"><span class="input-prefix">linkedin.com/in/</span><input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" required /></div></label>'
        +   '<label>Industry <input name="industry" placeholder="e.g. Finance, Tech, Design, Policy, Health" /></label>'
        +   '<label>Career stage <select name="stage"><option>Senior (10+ years)</option><option>Mid (5–10 years)</option><option>Early (under 5 years)</option></select></label>'
        +   '<label>City / time-zone <input name="location" placeholder="e.g. NYC · ET" /></label>'
        +   '<button type="submit" class="modal-submit">Sign me up to mentor →</button>'
        + '</form>',
      'volunteer': ''
        + '<div class="modal-eyebrow">Volunteer with us</div>'
        + '<h2>Volunteer intake</h2>'
        + '<p class="modal-lead"><b>~4 hrs/week.</b> Production, content, partnerships, design, tech. Whatever you\'re great at.</p>'
        + '<form class="modal-form">'
        +   '<label>Your name <input name="name" required /></label>'
        +   '<label>Email <input name="email" type="email" required /></label>'
        +   '<label>LinkedIn<div class="input-prefixed"><span class="input-prefix">linkedin.com/in/</span><input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" required /></div></label>'
        +   '<label>Skills / areas <input name="skills" placeholder="e.g. graphic design, production, sponsor outreach, comms" /></label>'
        +   '<label>Hours per week <select name="hours"><option>2–4 hrs/week</option><option>4–8 hrs/week</option><option>8+ hrs/week</option></select></label>'
        +   '<label>Anything else we should know (optional) <textarea name="notes" rows="2"></textarea></label>'
        +   '<button type="submit" class="modal-submit">Volunteer with us →</button>'
        + '</form>',
      'contact': ''
        + '<div class="modal-eyebrow">Not sure where you fit?</div>'
        + '<h2>Email the working board</h2>'
        + '<p class="modal-lead">One reply, one human, no funnel. We answer <b>within 48 hours</b>.</p>'
        + '<form class="modal-form">'
        +   '<label>Your name <input name="name" required /></label>'
        +   '<label>Email <input name="email" type="email" required /></label>'
        +   '<label>LinkedIn (optional)<div class="input-prefixed"><span class="input-prefix">linkedin.com/in/</span><input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" /></div></label>'
        +   '<label>What\'s on your mind <textarea name="message" rows="4" required></textarea></label>'
        +   '<button type="submit" class="modal-submit">Send →</button>'
        + '</form>',
      'waitlist': ''  // alias for attend (legacy summit-2026 ticket card)
    };
    MODAL_CONTENT_TEMPLATES.waitlist = MODAL_CONTENT_TEMPLATES.attend;

    Object.keys(MODAL_CONTENT_TEMPLATES).forEach(function (key) {
      if (mModal.querySelector('.modal-content[data-content="' + key + '"]')) return;
      var node = document.createElement('div');
      node.className = 'modal-content';
      node.setAttribute('data-content', key);
      node.hidden = true;
      node.innerHTML = MODAL_CONTENT_TEMPLATES[key];
      mModal.appendChild(node);
    });
  }

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
      // Status element appended below the submit button for inline feedback
      var statusEl = form.querySelector('.modal-form-status');
      if (!statusEl) {
        statusEl = document.createElement('div');
        statusEl.className = 'modal-form-status';
        statusEl.setAttribute('role', 'status');
        statusEl.setAttribute('aria-live', 'polite');
        form.appendChild(statusEl);
      }

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        // Form type comes from the parent .modal-content[data-content]
        var content = form.closest('.modal-content');
        var formType = content ? content.getAttribute('data-content') : '';
        if (!formType) return;

        var fd = new FormData(form);
        var data = { form: formType };
        fd.forEach(function (value, key) {
          var v = String(value || '').trim();
          if (!v) return;
          // Reconstruct LinkedIn URL from handle-only input (or accept full URL paste)
          if (key === 'linkedin') {
            v = v.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
                 .replace(/^linkedin\.com\/in\//i, '')
                 .replace(/^\/+/, '')
                 .replace(/\/+$/, '');
            if (!v) return;
            v = 'https://www.linkedin.com/in/' + v;
          }
          data[key] = v;
        });
        data.referrer = document.referrer || '';
        data.source = formType + ' · ' + (document.title || location.pathname);

        if (!data.email) {
          var emailIn = form.querySelector('input[type="email"]');
          if (emailIn) emailIn.focus();
          return;
        }

        var submitBtn = form.querySelector('.modal-submit');
        var originalText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }
        statusEl.textContent = '';
        statusEl.classList.remove('is-ok', 'is-err');

        // Route the "attend" form through subscribe.mjs (it's an early-list signup),
        // everything else through apply.mjs (speak / mentor / volunteer / contact).
        var endpoint = (formType === 'attend')
          ? '/.netlify/functions/subscribe'
          : '/.netlify/functions/apply';
        // subscribe.mjs expects email + optional richer fields; apply.mjs needs form type
        var payload = (formType === 'attend')
          ? Object.assign({}, data, { source: 'early-list · ' + (document.title || location.pathname) })
          : data;

        fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
          .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
          .then(function (res) {
            if (res && res.ok) {
              statusEl.textContent = "Submitted. Check your inbox — we sent a confirmation.";
              statusEl.classList.add('is-ok');
              form.reset();
              if (submitBtn) { submitBtn.textContent = 'Sent ✓'; }
              setTimeout(function () {
                closeModal();
                if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
                statusEl.textContent = '';
                statusEl.classList.remove('is-ok', 'is-err');
              }, 2000);
            } else {
              statusEl.textContent = (res && res.error) || 'Could not submit right now. Please try again.';
              statusEl.classList.add('is-err');
              if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
            }
          })
          .catch(function () {
            statusEl.textContent = 'Network error. Please try again.';
            statusEl.classList.add('is-err');
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalText; }
          });
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

  // ---------- early-list modal · replaces every "Join early list" mailto with
  // a proper Resend-wired signup form. Modal is built once and reused. -------
  (function () {
    var modal = document.createElement('div');
    modal.className = 'early-modal';
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = ''
      + '<div class="early-modal-scrim"></div>'
      + '<div class="early-modal-panel" role="dialog" aria-modal="true" aria-label="Join the MNG Summit 2026 early list">'
      +   '<button class="early-modal-close" type="button" aria-label="Close">✕</button>'
      +   '<div class="early-modal-body">'
      +     '<div class="early-modal-eyebrow">Tickets · MNG Summit 2026</div>'
      +     '<h2 class="early-modal-title">Get on the<br/><em>early list.</em></h2>'
      +     '<p class="early-modal-lead">Three days · 100 seats · NYC · Oct 9–11, 2026. We send the ticket link to the <b>early list first</b>, before public release.</p>'
      +     '<form class="modal-form early-modal-form" novalidate>'
      +       '<label>Your name <input name="name" required autocomplete="name" /></label>'
      +       '<label>Email <input name="email" type="email" required autocomplete="email" /></label>'
      +       '<label>LinkedIn'
      +         '<div class="input-prefixed">'
      +           '<span class="input-prefix">linkedin.com/in/</span>'
      +           '<input name="linkedin" type="text" placeholder="yourhandle" autocomplete="off" />'
      +         '</div>'
      +       '</label>'
      +       '<label>City <input name="city" placeholder="e.g. New York, San Francisco, Ulaanbaatar" autocomplete="address-level2" /></label>'
      +       '<label>Industry <input name="industry" placeholder="e.g. Finance, Tech, Design, Policy" /></label>'
      +       '<label>One thing you\'re hoping to find at the summit (optional) <textarea name="hoping" rows="2" placeholder="e.g. The right co-founder, a job, a community."></textarea></label>'
      +       '<button type="submit" class="modal-submit">Hold my spot →</button>'
      +       '<div class="early-modal-status" role="status" aria-live="polite"></div>'
      +     '</form>'
      +     '<div class="early-modal-foot">We send weekly on Wednesdays. Unsubscribe any time.</div>'
      +   '</div>'
      + '</div>';
    document.body.appendChild(modal);

    var scrim = modal.querySelector('.early-modal-scrim');
    var closeBtn = modal.querySelector('.early-modal-close');
    var form = modal.querySelector('.early-modal-form');
    var submitBtn = form.querySelector('.modal-submit');
    var status = form.querySelector('.early-modal-status');

    var openModal = function () {
      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      var first = form.querySelector('input[name="name"]');
      if (first) setTimeout(function () { first.focus(); }, 100);
    };
    var closeModal = function () {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    };
    if (scrim) scrim.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });

    // Intercept legacy "Join early list" mailto links across the site.
    // (data-modal="waitlist" / "attend" go through the standard modal flow
    // instead, so they get their full intake form via apply.mjs/subscribe.mjs.)
    document.addEventListener('click', function (e) {
      var el = e.target.closest(
        'a[href*="mailto:"][href*="early"],' +
        'a[href*="mailto:"][href*="Early"]'
      );
      if (!el) return;
      e.preventDefault();
      openModal();
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(form);
      var data = {};
      fd.forEach(function (v, k) { data[k] = String(v).trim(); });
      // Reconstruct LinkedIn URL from handle-only input
      if (data.linkedin) {
        data.linkedin = data.linkedin
          .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, '')
          .replace(/^linkedin\.com\/in\//i, '')
          .replace(/^\/+/, '')
          .replace(/\/+$/, '');
        if (data.linkedin) {
          data.linkedin = 'https://www.linkedin.com/in/' + data.linkedin;
        }
      }
      data.source = 'early-list modal · ' + (document.title || location.pathname);
      data.referrer = document.referrer || '';

      if (!data.email) { form.querySelector('input[name="email"]').focus(); return; }

      var originalBtn = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      status.textContent = '';
      status.classList.remove('is-ok', 'is-err');

      fetch('/.netlify/functions/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().catch(function () { return { ok: r.ok }; }); })
        .then(function (res) {
          if (res && res.ok) {
            status.textContent = "You're on the list. Check your inbox for the welcome note.";
            status.classList.add('is-ok');
            form.reset();
            submitBtn.textContent = 'On the list ✓';
            setTimeout(function () { closeModal(); submitBtn.disabled = false; submitBtn.textContent = originalBtn; }, 1800);
          } else {
            status.textContent = (res && res.error) || 'Could not sign you up right now. Please try again.';
            status.classList.add('is-err');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtn;
          }
        })
        .catch(function () {
          status.textContent = 'Network error. Please try again.';
          status.classList.add('is-err');
          submitBtn.disabled = false;
          submitBtn.textContent = originalBtn;
        });
    });
  })();

  // ---------- auto-assign IDs to speaker-cards from data-name ----------
  // Inbound links like directory-board.html#yanjaa-munkhbat depend on this — the
  // card markup uses data-name but no explicit id. We slugify the name and set
  // it as the id so cross-page anchor links land and scroll to the right card.
  var slugify = function (s) {
    return String(s).toLowerCase()
      .replace(/[À-ÿ]/g, function (c) {
        // Strip common diacritics (cyrillic stays as-is since we lowercase later)
        return c.normalize('NFD').replace(/[̀-ͯ]/g, '');
      })
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };
  document.querySelectorAll('.speaker-card[data-name]').forEach(function (card) {
    if (card.id) return;
    var name = card.getAttribute('data-name') || '';
    var slug = slugify(name);
    if (slug) card.id = slug;
  });
  // If the page loaded with a hash matching a now-assigned speaker, re-trigger
  // the browser's scroll-to-anchor (the original anchor jump fired before the
  // ids were set, so the page didn't scroll).
  if (location.hash && location.hash.length > 1) {
    var hashId = decodeURIComponent(location.hash.slice(1));
    var target = document.getElementById(hashId);
    if (target && target.classList.contains('speaker-card')) {
      // Defer until layout settles
      setTimeout(function () {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 80);
    }
  }

})();
