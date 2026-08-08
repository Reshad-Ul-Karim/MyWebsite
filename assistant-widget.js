/* =====================================================================
   ASK RESHAD — AI portfolio assistant widget
   - Talks to the persona corpus of the enterprise-AI-document-assistant
     service (POST {API_BASE}/api/ask, corpus:"persona"). See
     docs/AI_ASSISTANT_PLAN.md secs.4-6.
   - Page-aware: resolves "this"/"here" on a project/publication page by
     sending { kind, slug, title } derived from the URL (sec.5.1).
   - Never auto-opens. One-time tooltip, then silent until clicked.
   - Transcript persists per-tab via sessionStorage so a "Read more" click
     mid-conversation doesn't lose context.
   - Theme-aware for free: consumes the site's existing CSS custom
     properties (--primary-color, --bg-primary, etc.) and [data-theme]
     toggle -- no separate dark-mode logic needed here.
   Loaded on every page (index.html directly; subpages via the same
   <script> tag pattern used for accent-theme.js). Owns ONLY this file +
   assistant-widget.css.
   ===================================================================== */
(function () {
  'use strict';

  // Local dev: if the SITE itself is being served from localhost, talk to a locally-run
  // copy of the API instead of the deployed one -- lets `python -m uvicorn src.api.main:app`
  // + a static file server prove the whole flow works before anything is deployed.
  var API_BASE = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    ? 'http://localhost:8000'
    : 'https://enterprise-ai-document-assistant-8baj.onrender.com';
  var SS_TRANSCRIPT_KEY = 'askReshad.transcript';
  var LS_TOOLTIP_KEY = 'askReshad.tooltipSeen';
  var MAX_HISTORY_TURNS = 6;
  var COLD_START_HINT_MS = 4000;

  // --- Self-locate the site root, exactly like site-shell.js does, so links
  //     to /projects/<slug>.html work whether this loads from index.html or
  //     from one level deep. ------------------------------------------------
  var selfScript = document.currentScript;
  var BASE = (selfScript && selfScript.src ? selfScript.src : '').replace(/assistant-widget\.js.*$/, '');

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // ---- 1. Page context: which page is the visitor standing on? -----------
  function pageContext() {
    var path = window.location.pathname;
    var m = path.match(/\/(projects|publications)\/([a-z0-9-]+)\.html$/);
    if (m) return { kind: m[1].slice(0, -1), slug: m[2], title: document.title };
    if (/\/(projects|publications)\/?(index\.html)?$/.test(path) && /\/(projects|publications)\//.test(path)) {
      return { kind: 'index', title: document.title };
    }
    return { kind: 'home', title: document.title };
  }

  var CHIPS = {
    home: [
      "What's his strongest research work?",
      'Does he have production LLM experience?',
      'Show me a computer-vision project',
      'Can I set up a call?'
    ],
    index: [
      "What's his strongest research?",
      'Does he have production LLM experience?'
    ],
    project: [
      'What was hardest about this?',
      'What tech does it use?',
      'What else is like this?'
    ],
    publication: [
      'Explain this paper simply',
      'What was his contribution?'
    ]
  };

  // ---- 2. Slug -> kind lookup, so citations link to the right page --------
  // Fetched once, lazily, so opening the widget never costs a request nobody
  // asked for. A citation whose doc_id isn't in either set (the resume, or
  // site-home) gets a non-link label instead of a guessed URL.
  var slugKind = null; // { [slug]: 'projects' | 'publications' }
  var slugKindPromise = null;

  function loadSlugKinds() {
    if (slugKindPromise) return slugKindPromise;
    slugKindPromise = Promise.all([
      fetch(BASE + 'data/projects.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; }),
      fetch(BASE + 'data/publications.json').then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; })
    ]).then(function (results) {
      var map = {};
      (results[0] || []).forEach(function (p) { map[p.slug] = 'projects'; });
      (results[1] || []).forEach(function (p) { map[p.slug] = 'publications'; });
      slugKind = map;
      return map;
    });
    return slugKindPromise;
  }

  // ---- 3. Transcript persistence (sessionStorage; see header) -------------
  function loadTranscript() {
    try {
      var raw = sessionStorage.getItem(SS_TRANSCRIPT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTranscript(turns) {
    try {
      sessionStorage.setItem(SS_TRANSCRIPT_KEY, JSON.stringify(turns.slice(-MAX_HISTORY_TURNS)));
    } catch (e) { /* storage unavailable or full -- history just resets, not fatal */ }
  }

  // ---- 4. DOM construction -------------------------------------------------
  var fab, panel, messagesEl, formEl, inputEl, chipsEl, sendBtn;
  var isOpen = false;
  var lastFocused = null;

  function buildFab() {
    fab = document.createElement('button');
    fab.type = 'button';
    fab.id = 'ask-reshad-fab';
    fab.className = 'ask-fab';
    fab.innerHTML = '<i class="fas fa-robot" aria-hidden="true"></i>';
    fab.setAttribute('aria-label', "Ask Reshad's AI assistant");
    fab.setAttribute('aria-haspopup', 'dialog');
    fab.setAttribute('aria-expanded', 'false');
    document.body.appendChild(fab);

    applyStoredPosition();
    initDrag();
    initHoverPopover();
  }

  // ---- Drag + snap-to-side -------------------------------------------------
  var LS_POSITION_KEY = 'askReshad.position'; // { side: 'left'|'right', bottom: px }
  var DRAG_THRESHOLD = 6;
  var fabSide = 'right';

  function loadStoredPosition() {
    try {
      var raw = localStorage.getItem(LS_POSITION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function saveStoredPosition(pos) {
    try { localStorage.setItem(LS_POSITION_KEY, JSON.stringify(pos)); } catch (e) {}
  }

  function clampBottom(bottom) {
    var min = 12;
    var max = window.innerHeight - fab.offsetHeight - 12;
    return Math.max(min, Math.min(max, bottom));
  }

  // Other fixed controls the FAB must not land on top of when dropped -- the scroll-progress
  // ring on the left (bottom:88px, 48px tall), and the theme-toggle + accent-switcher stack
  // on the right (bottom:20-84px and 84-134px). Bands are approximate on purpose (with
  // margin) since exact pixel-matching isn't the point, just not visually overlapping.
  var EXCLUSION_ZONES = {
    left: [[68, 148]],
    right: [[64, 214]]
  };

  function resolveBottom(side, bottom) {
    var zones = EXCLUSION_ZONES[side] || [];
    for (var i = 0; i < zones.length; i++) {
      var lo = zones[i][0], hi = zones[i][1];
      if (bottom > lo - 12 && bottom < hi + 12) {
        var toBelow = Math.abs(bottom - (lo - 16));
        var toAbove = Math.abs(bottom - (hi + 16));
        bottom = toBelow < toAbove ? Math.max(12, lo - 16) : hi + 16;
      }
    }
    return clampBottom(bottom);
  }

  function applySide(side, bottom) {
    fabSide = side;
    fab.classList.toggle('ask-fab--left', side === 'left');
    fab.style.left = side === 'left' ? '20px' : '';
    fab.style.right = side === 'left' ? '' : '20px';
    if (bottom != null) fab.style.bottom = clampBottom(bottom) + 'px';
    if (panel) panel.classList.toggle('ask-panel--left', side === 'left');
    var tip = document.querySelector('.ask-fab-tooltip');
    if (tip) tip.classList.toggle('ask-fab-tooltip--left', side === 'left');
  }

  function applyStoredPosition() {
    var pos = loadStoredPosition();
    if (pos) applySide(pos.side, resolveBottom(pos.side, pos.bottom));
  }

  function initDrag() {
    var dragging = false;
    var justDragged = false;
    var startX, startY, startBottom;

    fab.addEventListener('pointerdown', function (ev) {
      if (ev.button != null && ev.button !== 0) return; // left click / primary touch only
      dragging = false;
      startX = ev.clientX;
      startY = ev.clientY;
      startBottom = window.innerHeight - fab.getBoundingClientRect().bottom;
      fab.setPointerCapture(ev.pointerId);
    });

    fab.addEventListener('pointermove', function (ev) {
      if (startX == null) return;
      var dx = ev.clientX - startX;
      var dy = ev.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      if (!dragging) {
        dragging = true;
        justDragged = true;
        fab.classList.add('ask-fab--dragging');
        hideHoverPopover();
      }
      // Free-follow the pointer vertically (and briefly horizontally) while dragging; the
      // snap back to a side happens on release, not live, so it doesn't fight the drag.
      fab.style.bottom = clampBottom(startBottom - dy) + 'px';
      var followX = ev.clientX < window.innerWidth / 2;
      fab.style.left = followX ? Math.max(12, ev.clientX - fab.offsetWidth / 2) + 'px' : '';
      fab.style.right = followX ? '' : Math.max(12, window.innerWidth - ev.clientX - fab.offsetWidth / 2) + 'px';
    });

    function endDrag(ev) {
      if (startX == null) return;
      startX = null;
      if (!dragging) return;
      dragging = false;
      fab.classList.remove('ask-fab--dragging');
      var side = ev.clientX < window.innerWidth / 2 ? 'left' : 'right';
      var bottom = resolveBottom(side, window.innerHeight - fab.getBoundingClientRect().bottom);
      applySide(side, bottom);
      saveStoredPosition({ side: side, bottom: bottom });
      window.setTimeout(function () { justDragged = false; }, 50);
    }

    fab.addEventListener('pointerup', endDrag);
    fab.addEventListener('pointercancel', endDrag);

    fab.addEventListener('click', function (ev) {
      if (justDragged) { ev.preventDefault(); return; }
      dismissTooltip();
      hideHoverPopover();
      setOpen(!isOpen);
    });

    window.addEventListener('resize', function () {
      fab.style.bottom = clampBottom(parseFloat(fab.style.bottom) || 20) + 'px';
    });
  }

  function buildTooltip() {
    var seen;
    try { seen = localStorage.getItem(LS_TOOLTIP_KEY); } catch (e) { seen = '1'; }
    if (seen) return;
    var tip = document.createElement('div');
    tip.className = 'ask-fab-tooltip' + (fabSide === 'left' ? ' ask-fab-tooltip--left' : '');
    tip.textContent = 'Ask me about Reshad';
    tip.setAttribute('role', 'status');
    document.body.appendChild(tip);
    window.setTimeout(function () {
      tip.classList.add('ask-fab-tooltip--visible');
    }, 800);
    window.setTimeout(dismissTooltip, 8000);
  }

  function dismissTooltip() {
    try { localStorage.setItem(LS_TOOLTIP_KEY, '1'); } catch (e) {}
    var tip = document.querySelector('.ask-fab-tooltip');
    if (tip && tip.parentNode) tip.parentNode.removeChild(tip);
  }

  // ---- Hover popover: a rotating hint, every hover (not one-time like the tooltip above) --
  // "It's an intelligent assistant" -- hovering should feel a little alive, not just show a
  // static label once and go silent forever after.
  var HOVER_HINTS = [
    '🧠 Ask about his strongest research',
    '⚡ Try: "What did he use in the assistive vision agent?"',
    '🔍 I only answer from his real CV & projects',
    '💬 Ask if he’s free for a call',
    '🎯 Try: "Does he have production LLM experience?"'
  ];

  function initHoverPopover() {
    fab.addEventListener('pointerenter', function () {
      if (isOpen) return;
      var seen;
      try { seen = localStorage.getItem(LS_TOOLTIP_KEY); } catch (e) { seen = '1'; }
      if (!seen) return; // let the one-time onboarding tooltip have the floor first
      showHoverPopover(HOVER_HINTS[Math.floor(Math.random() * HOVER_HINTS.length)]);
    });
    fab.addEventListener('pointerleave', hideHoverPopover);
  }

  var hoverPopoverEl = null;

  function showHoverPopover(text) {
    hideHoverPopover();
    hoverPopoverEl = document.createElement('div');
    hoverPopoverEl.className = 'ask-fab-tooltip ask-hover-popover' + (fabSide === 'left' ? ' ask-fab-tooltip--left' : '');
    hoverPopoverEl.textContent = text;
    document.body.appendChild(hoverPopoverEl);
    requestAnimationFrame(function () {
      if (hoverPopoverEl) hoverPopoverEl.classList.add('ask-fab-tooltip--visible');
    });
  }

  function hideHoverPopover() {
    if (hoverPopoverEl && hoverPopoverEl.parentNode) hoverPopoverEl.parentNode.removeChild(hoverPopoverEl);
    hoverPopoverEl = null;
  }

  function buildPanel() {
    panel = document.createElement('div');
    panel.id = 'ask-reshad-panel';
    panel.className = 'ask-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', "Ask Reshad's AI assistant");
    panel.hidden = true;

    var header = document.createElement('div');
    header.className = 'ask-panel-header';
    header.innerHTML =
      '<div class="ask-panel-heading">' +
      '<span class="ask-panel-title">Ask Reshad</span>' +
      '</div>';
    var headerActions = document.createElement('div');
    headerActions.className = 'ask-panel-actions';

    // The transcript persists per-TAB (sessionStorage) until the tab closes, by design --
    // navigating to a project page mid-conversation shouldn't lose context. That means nothing
    // resets it automatically on its own; this is the manual reset for "start over".
    var clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ask-panel-clear';
    clearBtn.innerHTML = '<i class="fas fa-rotate-left" aria-hidden="true"></i>';
    clearBtn.setAttribute('aria-label', 'Clear conversation');
    clearBtn.setAttribute('title', 'Clear conversation');
    clearBtn.addEventListener('click', function () {
      saveTranscript([]);
      messagesEl.innerHTML = '';
      renderChips();
    });
    headerActions.appendChild(clearBtn);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ask-panel-close';
    closeBtn.innerHTML = '<i class="fas fa-xmark" aria-hidden="true"></i>';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.addEventListener('click', function () { setOpen(false); });
    headerActions.appendChild(closeBtn);

    header.appendChild(headerActions);

    messagesEl = document.createElement('div');
    messagesEl.className = 'ask-messages';
    messagesEl.setAttribute('role', 'log');
    messagesEl.setAttribute('aria-live', 'polite');
    messagesEl.setAttribute('aria-relevant', 'additions');

    chipsEl = document.createElement('div');
    chipsEl.className = 'ask-chips';

    formEl = document.createElement('form');
    formEl.className = 'ask-form';
    inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'ask-input';
    inputEl.placeholder = 'Ask about his work…';
    inputEl.maxLength = 1000;
    inputEl.setAttribute('aria-label', 'Your question');
    sendBtn = document.createElement('button');
    sendBtn.type = 'submit';
    sendBtn.className = 'ask-send';
    sendBtn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    sendBtn.setAttribute('aria-label', 'Send');
    formEl.appendChild(inputEl);
    formEl.appendChild(sendBtn);
    formEl.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var q = inputEl.value.trim();
      if (!q) return;
      inputEl.value = '';
      handleAsk(q);
    });

    panel.appendChild(header);
    panel.appendChild(messagesEl);
    panel.appendChild(chipsEl);
    panel.appendChild(formEl);
    document.body.appendChild(panel);

    panel.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        ev.stopPropagation();
        setOpen(false);
        return;
      }
      if (ev.key === 'Tab') trapFocus(ev);
    });
  }

  function trapFocus(ev) {
    var focusable = panel.querySelectorAll(
      'button, input, [href], textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (ev.shiftKey && document.activeElement === first) {
      ev.preventDefault();
      last.focus();
    } else if (!ev.shiftKey && document.activeElement === last) {
      ev.preventDefault();
      first.focus();
    }
  }

  function setOpen(open) {
    isOpen = open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
    if (open) {
      lastFocused = document.activeElement;
      panel.classList.add('ask-panel--open');
      renderChips();
      window.setTimeout(function () { inputEl.focus(); }, prefersReducedMotion() ? 0 : 150);
    } else {
      panel.classList.remove('ask-panel--open');
      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }
  }

  // ---- 5. Rendering --------------------------------------------------------
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function renderChips() {
    chipsEl.innerHTML = '';
    if (loadTranscript().length) { chipsEl.hidden = true; return; } // only on empty state
    var ctx = pageContext();
    var list = CHIPS[ctx.kind] || CHIPS.home;
    chipsEl.hidden = false;
    list.forEach(function (label) {
      var chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'ask-chip';
      chip.textContent = label;
      chip.addEventListener('click', function () { handleAsk(label); });
      chipsEl.appendChild(chip);
    });
  }

  function citationHref(citation) {
    if (!slugKind) return null;
    var kind = slugKind[citation.doc_id];
    if (kind === 'projects') return BASE + 'projects/' + citation.doc_id + '.html';
    if (kind === 'publications') return BASE + 'publications/' + citation.doc_id + '.html';
    return null;
  }

  function citationLabel(citation) {
    if (citation.doc_kind === 'resume') {
      return citation.section_title ? 'Résumé — ' + citation.section_title : 'Résumé';
    }
    if (citation.doc_id === 'site-home') {
      return citation.section_title ? 'reshadulkarim.me — ' + citation.section_title : 'reshadulkarim.me';
    }
    if (citation.section_title) return citation.doc_title + ' — ' + citation.section_title;
    return citation.doc_title + ' — p.' + citation.printed_page;
  }

  function renderCitations(container, citations) {
    if (!citations || !citations.length) return;
    var wrap = document.createElement('div');
    wrap.className = 'ask-citations';
    citations.forEach(function (c) {
      var href = citationHref(c);
      var el = document.createElement(href ? 'a' : 'span');
      el.className = 'ask-citation-chip';
      el.textContent = citationLabel(c);
      if (href) {
        el.href = href;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
      }
      wrap.appendChild(el);
    });
    container.appendChild(wrap);
    // Citation destinations depend on data/projects.json + data/publications.json,
    // which are not loaded until the first answer needs them -- backfill hrefs once
    // that resolves, since it's plausible the map arrives after this render.
    loadSlugKinds().then(function () {
      Array.prototype.forEach.call(wrap.children, function (el, i) {
        var href = citationHref(citations[i]);
        if (href && el.tagName === 'SPAN') {
          var a = document.createElement('a');
          a.className = el.className;
          a.textContent = el.textContent;
          a.href = href;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          wrap.replaceChild(a, el);
        }
      });
    });
  }

  // <<BOOK>> is stripped from the displayed text and rendered as a card,
  // never left as literal text a visitor would see (see persona.md).
  var BOOK_MARKER_RE = /<<BOOK>>\s*$/;

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // The model writes real markdown (persona.md never tells it not to) -- **bold**,
  // occasional links, inline `code`. Rendering it as literal asterisks was the bug; this is
  // deliberately a small, fixed allow-list of patterns over ESCAPED text, not a markdown
  // library, since the only content ever passed through it is our own server's answer text.
  function renderMarkdown(text) {
    var html = escapeHtml(text);
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    html = html.replace(/`([^`\n]+)`/g, '<code>$1</code>');
    return html
      .split(/\n{2,}/)
      .map(function (para) { return '<p>' + para.replace(/\n/g, '<br>') + '</p>'; })
      .join('');
  }

  function renderMessage(role, text, citations) {
    var row = document.createElement('div');
    row.className = 'ask-message ask-message--' + role;
    var bubble = document.createElement('div');
    bubble.className = 'ask-bubble';

    var wantsBooking = role === 'assistant' && BOOK_MARKER_RE.test(text);
    var clean = wantsBooking ? text.replace(BOOK_MARKER_RE, '').trim() : text;
    if (role === 'assistant') {
      bubble.innerHTML = renderMarkdown(clean);
    } else {
      bubble.textContent = clean;
    }
    row.appendChild(bubble);

    if (role === 'assistant') renderCitations(row, citations);
    if (wantsBooking) row.appendChild(buildBookingCard());

    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  function renderTyping() {
    var row = document.createElement('div');
    row.className = 'ask-message ask-message--assistant ask-message--typing';
    row.innerHTML =
      '<div class="ask-bubble ask-typing-wrap">' +
      '<div class="ask-typing-dots"><span></span><span></span><span></span></div>' +
      '</div>';
    messagesEl.appendChild(row);
    scrollToBottom();
    return row;
  }

  // ---- 6. Booking card (see docs/AI_ASSISTANT_PLAN.md sec.6) ---------------
  function buildBookingCard() {
    var card = document.createElement('form');
    card.className = 'ask-booking-card';
    card.innerHTML =
      '<p class="ask-booking-title">Set up a conversation with Reshad</p>' +
      '<label>Name<input type="text" name="name" required></label>' +
      '<label>Email<input type="email" name="email" required></label>' +
      '<label>What would you like to talk about?<textarea name="purpose" rows="2" required></textarea></label>' +
      '<label>Preferred times (optional)<input type="text" name="preferred_times"></label>' +
      // Honeypot: real visitors never see or fill this (see CSS); a bot filling every
      // field on the form will fill this one too.
      '<label class="ask-booking-honeypot" aria-hidden="true">Leave blank<input type="text" name="website" tabindex="-1" autocomplete="off"></label>' +
      '<button type="submit" class="ask-booking-submit">Send</button>' +
      '<p class="ask-booking-status" aria-live="polite"></p>';

    card.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var status = card.querySelector('.ask-booking-status');
      var submitBtn = card.querySelector('.ask-booking-submit');
      var payload = {
        name: card.name.value.trim(),
        email: card.email.value.trim(),
        purpose: card.purpose.value.trim(),
        preferred_times: card.preferred_times.value.trim(),
        website: card.website.value, // honeypot
        page: pageContext(),
        recent_history: loadTranscript().slice(-3)
      };
      submitBtn.disabled = true;
      status.textContent = 'Sending…';
      fetch(API_BASE + '/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error('bad status');
        status.textContent = "Sent — Reshad will follow up by email.";
        card.querySelectorAll('input, textarea, button').forEach(function (el) { el.disabled = true; });
      }).catch(function () {
        submitBtn.disabled = false;
        status.textContent = 'Something went wrong — try again, or email him directly.';
      });
    });
    return card;
  }

  // ---- 7. Ask -> POST /api/ask ---------------------------------------------
  function handleAsk(question) {
    chipsEl.hidden = true;
    renderMessage('user', question, null);
    var transcript = loadTranscript();

    var typingRow = renderTyping();
    var coldStartTimer = window.setTimeout(function () {
      var wrap = typingRow.querySelector('.ask-typing-wrap');
      // Appended NEXT TO the dots, not instead of them -- the animation is the whole point
      // of a loading state, and losing it the moment a wait gets long is backwards.
      if (wrap && !wrap.querySelector('.ask-cold-start-label')) {
        var label = document.createElement('div');
        label.className = 'ask-cold-start-label';
        label.textContent = 'Waking up the assistant — first request can take a bit…';
        wrap.appendChild(label);
      }
    }, COLD_START_HINT_MS);

    fetch(API_BASE + '/api/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: question,
        corpus: 'persona',
        page: pageContext(),
        history: transcript.map(function (t) { return { question: t.question, answer: t.answer }; })
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('bad status ' + res.status);
        return res.json();
      })
      .then(function (data) {
        window.clearTimeout(coldStartTimer);
        typingRow.parentNode.removeChild(typingRow);
        renderMessage('assistant', data.answer, data.citations);
        // Stored (and later emailed via /api/book's recent_history, and sent back as history
        // on the NEXT ask) with the <<BOOK>> marker stripped -- it's UI instruction syntax,
        // not part of the answer, and leaking it into a booking email read by an actual
        // human is a real, visible bug, not a cosmetic one. Same regex the display path uses.
        transcript.push({ question: question, answer: data.answer.replace(BOOK_MARKER_RE, '').trim() });
        saveTranscript(transcript);
      })
      .catch(function () {
        window.clearTimeout(coldStartTimer);
        typingRow.parentNode.removeChild(typingRow);
        renderMessage(
          'assistant',
          "Having trouble reaching the assistant right now. Try again in a moment, or reach Reshad directly.",
          null
        );
      });
  }

  function restoreTranscript() {
    var transcript = loadTranscript();
    transcript.forEach(function (turn) {
      renderMessage('user', turn.question, null);
      renderMessage('assistant', turn.answer, null); // citations aren't persisted; re-shown minus chips
    });
  }

  // ---- 8. Init --------------------------------------------------------------
  function init() {
    if (document.getElementById('ask-reshad-fab')) return;
    buildFab();
    buildPanel();
    restoreTranscript();
    buildTooltip();
    loadSlugKinds();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
