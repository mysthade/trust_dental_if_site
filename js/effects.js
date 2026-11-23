/* ==========================================================================
   TRUST DENTAL — Visual Effects, Counters & Progressive Scroll Reveal (window.TD.effects)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var COUNTER_DURATION_MS = 1000;
  var isInitialized = false;
  var isRevealInitialized = false;
  var revealObserver = null;
  var pendingRevealNodes = [];
  var sweepTimer = null;
  var sweepRafId = null;
  var sweepListenersBound = false;
  var cleanupTimers = [];
  var introDoneTimer = null;

  function prefersReducedMotion() {
    return typeof TD.prefersReducedMotion === 'function' ? TD.prefersReducedMotion() : false;
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatNumber(val, decimals, suffix) {
    var formatted = decimals > 0 ? val.toFixed(decimals) : String(Math.round(val));
    return suffix ? formatted + suffix : formatted;
  }

  function animateValue(el, target, decimals, suffix) {
    var startTime = null;

    function tick(now) {
      if (startTime === null) startTime = now;
      var elapsed = now - startTime;
      var progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);
      var current = target * easeOutCubic(progress);

      el.textContent = formatNumber(current, decimals, suffix);

      if (progress < 1) {
        window.requestAnimationFrame(tick);
      } else {
        el.textContent = formatNumber(target, decimals, suffix);
      }
    }

    el.textContent = formatNumber(0, decimals, suffix);
    window.requestAnimationFrame(tick);
  }

  function runCounters(container) {
    var items = container.querySelectorAll('[data-count]');
    for (var i = 0; i < items.length; i++) {
      var el = items[i];
      var raw = el.getAttribute('data-count');
      if (raw === null) continue;

      var num = Number(raw);
      /* Skip non-numeric placeholders such as "[X]" and static zero values */
      if (!Number.isFinite(num) || num <= 0) continue;

      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      if (!Number.isFinite(decimals) || decimals < 0) decimals = 0;
      var suffix = el.getAttribute('data-suffix') || '';

      animateValue(el, num, decimals, suffix);
    }
  }

  function initCounters() {
    if (isInitialized) return;
    var statsContainer = document.getElementById('stats-card');
    if (!statsContainer) return;
    isInitialized = true;

    /* Respect reduced motion or stats already in/above the viewport on initial load */
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return;
    }

    var initialRect = statsContainer.getBoundingClientRect();
    var initialVh = window.innerHeight || document.documentElement.clientHeight || 900;
    if (initialRect.top < initialVh) {
      return;
    }

    var hasAnimated = false;
    var observer = new window.IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          if (entries[i].isIntersecting && !hasAnimated) {
            hasAnimated = true;
            observer.disconnect();
            runCounters(statsContainer);
            break;
          }
        }
      }, {
      threshold: 0.25
    }
    );

    observer.observe(statsContainer);
  }

  function applyVisibleClasses(el) {
    el.classList.remove('is-revealing', 'td-reveal-pending');
    el.style.removeProperty('--td-reveal-delay');
    el.classList.add('is-visible', 'is-revealed');
  }

  function getStaggerDelayMs(kind, batchIndex, cardCount) {
    if (kind !== 'card' || cardCount > 4) return 0;
    var vw = window.innerWidth || document.documentElement.clientWidth || 1280;
    if (vw < 640) return 0;
    if (vw < 980) return Math.min(batchIndex, 2) * 25;
    return Math.min(batchIndex, 2) * 45;
  }

  function markRevealed(el, delayMs, instant) {
    if (!el) return;
    if (instant || prefersReducedMotion()) {
      applyVisibleClasses(el);
      return;
    }

    if (delayMs > 0) {
      el.style.setProperty('--td-reveal-delay', delayMs + 'ms');
    } else {
      el.style.removeProperty('--td-reveal-delay');
    }
    el.classList.add('is-revealing');
    el.classList.remove('td-reveal-pending');
    el.classList.add('is-visible', 'is-revealed');

    var kind = el.getAttribute('data-reveal');
    var maxCleanupMs = (kind === 'deco' ? 620 : 480) + (delayMs || 0);

    var onEnd = function (ev) {
      if (ev.target !== el) return;
      if (ev.propertyName !== 'opacity' && ev.propertyName !== 'transform') return;
      window.clearTimeout(cleanupTimer);
      el.classList.remove('is-revealing');
      el.style.removeProperty('--td-reveal-delay');
      el.removeEventListener('transitionend', onEnd);
    };

    var cleanupTimer = window.setTimeout(function () {
      el.classList.remove('is-revealing');
      el.style.removeProperty('--td-reveal-delay');
      el.removeEventListener('transitionend', onEnd);
    }, maxCleanupMs);
    cleanupTimers.push(cleanupTimer);

    el.addEventListener('transitionend', onEnd);
  }

  function removePendingNode(el) {
    var idx = pendingRevealNodes.indexOf(el);
    if (idx !== -1) {
      pendingRevealNodes.splice(idx, 1);
    }
    if (revealObserver && el) {
      revealObserver.unobserve(el);
    }
    if (!pendingRevealNodes.length) {
      teardownRevealWatchers();
    }
  }

  function onSweepSchedule() {
    if (!pendingRevealNodes.length) {
      teardownRevealWatchers();
      return;
    }
    if (sweepTimer !== null || sweepRafId !== null) return;
    /* Coalesce fast scroll / scrollbar drags without running work every frame;
       execute directly when tab is hidden so background tabs do not stall on rAF */
    sweepTimer = window.setTimeout(function () {
      sweepTimer = null;
      if (!pendingRevealNodes.length) {
        teardownRevealWatchers();
        return;
      }
      if (document.hidden || typeof window.requestAnimationFrame !== 'function') {
        sweepVisibleOrPassed();
      } else {
        sweepRafId = window.requestAnimationFrame(sweepVisibleOrPassed);
      }
    }, 90);
  }

  function onImmediateCheck() {
    if (!pendingRevealNodes.length || sweepRafId !== null) return;
    if (document.hidden || typeof window.requestAnimationFrame !== 'function') {
      sweepVisibleOrPassed();
    } else {
      sweepRafId = window.requestAnimationFrame(sweepVisibleOrPassed);
    }
  }

  function onHashChange() {
    if (window.location && window.location.hash && window.location.hash.length > 1) {
      try {
        revealSectionById(window.decodeURIComponent(window.location.hash.slice(1)));
      } catch (err) {
        revealSectionById(window.location.hash.slice(1));
      }
    }
    onImmediateCheck();
  }

  function onVisibilityChange() {
    if (!document.hidden && pendingRevealNodes.length) {
      onImmediateCheck();
    }
  }

  function onFocusIn(ev) {
    if (!pendingRevealNodes.length || !ev || !ev.target || !ev.target.closest) return;
    var host = ev.target.closest('.td-reveal-pending');
    if (host) {
      markRevealed(host, 0, true);
      removePendingNode(host);
    }
  }

  function teardownRevealWatchers() {
    if (sweepTimer !== null) {
      window.clearTimeout(sweepTimer);
      sweepTimer = null;
    }
    if (sweepRafId !== null) {
      window.cancelAnimationFrame(sweepRafId);
      sweepRafId = null;
    }
    if (sweepListenersBound) {
      sweepListenersBound = false;
      window.removeEventListener('scroll', onSweepSchedule);
      window.removeEventListener('scrollend', onImmediateCheck);
      window.removeEventListener('resize', onSweepSchedule);
      window.removeEventListener('hashchange', onHashChange);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('click', onAnchorClick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    if (revealObserver) {
      revealObserver.disconnect();
      revealObserver = null;
    }
  }

  function sweepVisibleOrPassed() {
    sweepRafId = null;
    if (!pendingRevealNodes.length) {
      teardownRevealWatchers();
      return;
    }
    var vh = window.innerHeight || document.documentElement.clientHeight || 900;
    var docH = Math.max(
      document.documentElement ? document.documentElement.scrollHeight : 0,
      document.body ? document.body.scrollHeight : 0
    );
    var scrollY = window.scrollY || window.pageYOffset || 0;
    var atDocBottom = docH > 0 && scrollY + vh >= docH - 6;
    var thresholdTop = atDocBottom ? Infinity : vh + 4;
    var actions = [];
    var i;

    /* Batch reads in forward DOM order so reveal stagger flows left-to-right */
    for (i = 0; i < pendingRevealNodes.length; i++) {
      var el = pendingRevealNodes[i];
      if (!el.isConnected || el.hasAttribute('hidden') || !el.classList.contains('td-reveal-pending')) {
        actions.push({
          el: el,
          mode: 'prune'
        });
        continue;
      }
      var rect = el.getBoundingClientRect();
      if (rect.bottom <= 0) {
        actions.push({
          el: el,
          mode: 'instant'
        });
      } else if (rect.top < thresholdTop) {
        actions.push({
          el: el,
          mode: 'animate'
        });
      }
    }

    var animateCards = 0;
    for (i = 0; i < actions.length; i++) {
      if (actions[i].mode === 'animate' && actions[i].el.getAttribute('data-reveal') === 'card') {
        animateCards++;
      }
    }

    var batchIndex = 0;
    for (i = 0; i < actions.length; i++) {
      var act = actions[i];
      if (act.mode === 'prune') {
        removePendingNode(act.el);
      } else if (act.mode === 'instant') {
        markRevealed(act.el, 0, true);
        removePendingNode(act.el);
      } else {
        var kind = act.el.getAttribute('data-reveal');
        var delayMs = getStaggerDelayMs(kind, batchIndex, animateCards);
        if (kind === 'card') batchIndex++;
        markRevealed(act.el, delayMs, false);
        removePendingNode(act.el);
      }
    }
  }

  function revealAllPending() {
    for (var t = 0; t < cleanupTimers.length; t++) {
      window.clearTimeout(cleanupTimers[t]);
    }
    cleanupTimers = [];
    for (var i = 0; i < pendingRevealNodes.length; i++) {
      markRevealed(pendingRevealNodes[i], 0, true);
    }
    pendingRevealNodes = [];
    teardownRevealWatchers();
  }

  function collectRevealTargets() {
    var groups = [{
      kind: 'head',
      selector: '#services .section__head, #advantages .advantages-section__intro, #calculator .section__head, #doctors .section__head, #works .section__head, #gallery .section__head, #gallery .gallery-group__title, #reviews .section__head, #contacts .section__head'
    },
    {
      kind: 'card',
      selector: '.stats-section .stat-item, #services-grid .service-card, #services .services-calc-bar, #advantages .advantage-card, #advantages .advantages-note, #doctors .doctor-card, #works .works-carousel, #gallery .gallery-carousel, #reviews .reviews-summary, #reviews .reviews-stage, #contacts .booking-steps-card, #site-footer .site-footer__brand, #site-footer .site-footer__nav, #site-footer .site-footer__contacts, #site-footer .site-footer__bottom'
    },
    {
      kind: 'deco',
      selector: '.section .deco, .advantages-section .deco, .footer .deco'
    }
    ];

    var items = [];
    for (var g = 0; g < groups.length; g++) {
      var nodes = document.querySelectorAll(groups[g].selector);
      for (var i = 0; i < nodes.length; i++) {
        items.push({
          el: nodes[i],
          kind: groups[g].kind
        });
      }
    }
    return items;
  }

  function markAllTargetsVisibleImmediately() {
    var targets = collectRevealTargets();
    for (var i = 0; i < targets.length; i++) {
      var el = targets[i].el;
      if (!el.hasAttribute('data-reveal')) {
        el.setAttribute('data-reveal', targets[i].kind);
      }
      applyVisibleClasses(el);
    }
  }

  function revealSectionById(sectionId) {
    if (!sectionId || !pendingRevealNodes.length) return;
    var target = document.getElementById(sectionId);
    if (!target) return;
    var root =
      target.closest('.section, .advantages-section, .stats-section, .footer') || target;
    for (var i = pendingRevealNodes.length - 1; i >= 0; i--) {
      var node = pendingRevealNodes[i];
      if (node === target || root.contains(node)) {
        markRevealed(node, 0, false);
        removePendingNode(node);
      }
    }
  }

  function onAnchorClick(ev) {
    if (!pendingRevealNodes.length || !ev || !ev.target || !ev.target.closest) return;
    var link = ev.target.closest('a[href^="#"], #calc-submit');
    if (!link) return;
    var href = link.id === 'calc-submit' ? '#contacts' : link.getAttribute('href');
    if (href && href.length > 1) {
      revealSectionById(href.slice(1));
    }
  }

  function bindRevealWatchers() {
    if (sweepListenersBound) return;
    sweepListenersBound = true;
    window.addEventListener('scroll', onSweepSchedule, {
      passive: true
    });
    window.addEventListener('scrollend', onImmediateCheck, {
      passive: true
    });
    window.addEventListener('resize', onSweepSchedule, {
      passive: true
    });
    window.addEventListener('hashchange', onHashChange, {
      passive: true
    });
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('click', onAnchorClick, {
      passive: true
    });
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  function createRevealObserver() {
    if (revealObserver) return revealObserver;
    revealObserver = new window.IntersectionObserver(
      function (entries) {
        var curVh = window.innerHeight || document.documentElement.clientHeight || 900;
        var cardCount = 0;
        var e;
        for (e = 0; e < entries.length; e++) {
          var ent = entries[e];
          var passed = ent.boundingClientRect && ent.boundingClientRect.bottom <= 0;
          if ((ent.isIntersecting || passed) && !passed && ent.target.getAttribute('data-reveal') === 'card') {
            cardCount++;
          }
        }
        var batchIndex = 0;
        for (e = 0; e < entries.length; e++) {
          var entry = entries[e];
          var target = entry.target;
          if (!target.classList.contains('td-reveal-pending')) {
            removePendingNode(target);
            continue;
          }
          var passedAbove = entry.boundingClientRect && entry.boundingClientRect.bottom <= 0;
          if (!entry.isIntersecting && !passedAbove) continue;
          var kind = target.getAttribute('data-reveal');
          var delayMs = passedAbove ? 0 : getStaggerDelayMs(kind, batchIndex, cardCount);
          if (!passedAbove && kind === 'card') batchIndex++;
          markRevealed(
            target,
            delayMs,
            passedAbove && entry.boundingClientRect.top < -curVh * 0.5
          );
          removePendingNode(target);
        }
      }, {
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.08
    }
    );
    return revealObserver;
  }

  function observeTargets(isDynamicRefresh) {
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      markAllTargetsVisibleImmediately();
      return;
    }

    var targets = collectRevealTargets();
    if (!targets.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight || 900;
    var belowFoldThreshold = vh + 4;
    var hashSection = null;
    if (!isDynamicRefresh && window.location && window.location.hash && window.location.hash.length > 1) {
      try {
        var hashId = window.decodeURIComponent(window.location.hash.slice(1));
        var hashEl = document.getElementById(hashId);
        if (hashEl) {
          hashSection =
            hashEl.closest('.section, .advantages-section, .stats-section, .footer') || hashEl;
          var hashTop = hashEl.getBoundingClientRect().top;
          if (hashTop + vh + 4 > belowFoldThreshold) {
            belowFoldThreshold = hashTop + vh + 4;
          }
        }
      } catch (err) { }
    }
    var candidates = [];
    var i;

    /* Phase 1: Batch DOM reads (single layout pass, zero read-after-write thrashing) */
    for (i = 0; i < targets.length; i++) {
      var item = targets[i];
      var el = item.el;
      if (
        el.hasAttribute('hidden') ||
        el.classList.contains('is-visible') ||
        el.classList.contains('is-revealed') ||
        el.classList.contains('td-reveal-pending')
      ) {
        continue;
      }
      var inHashSection = Boolean(hashSection && (el === hashSection || hashSection.contains(el)));
      candidates.push({
        el: el,
        kind: item.kind,
        isImmediate: isDynamicRefresh || inHashSection || el.getBoundingClientRect().top < belowFoldThreshold
      });
    }

    /* Phase 2: Batch DOM writes */
    var toObserve = [];
    for (i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      candidate.el.setAttribute('data-reveal', candidate.kind);
      if (candidate.isImmediate) {
        applyVisibleClasses(candidate.el);
      } else {
        candidate.el.classList.add('td-reveal-pending');
        pendingRevealNodes.push(candidate.el);
        toObserve.push(candidate.el);
      }
    }

    if (!toObserve.length) return;

    try {
      var obs = createRevealObserver();
      for (var k = 0; k < toObserve.length; k++) {
        obs.observe(toObserve[k]);
      }
      bindRevealWatchers();
    } catch (err) {
      revealAllPending();
    }
  }

  function initReveal() {
    if (isRevealInitialized) return;
    isRevealInitialized = true;

    var root = document.documentElement;
    if ((window.scrollY || window.pageYOffset || 0) > 80 || prefersReducedMotion()) {
      root.classList.add('td-skip-intro');
    } else if (!root.classList.contains('td-skip-intro')) {
      introDoneTimer = window.setTimeout(function () {
        introDoneTimer = null;
        root.classList.add('td-intro-done');
      }, 650);
    }

    observeTargets(false);
    window.addEventListener(
      'load',
      function () {
        if ((window.scrollY || window.pageYOffset || 0) > 80) {
          root.classList.add('td-skip-intro');
        }
        onImmediateCheck();
      }, {
      once: true,
      passive: true
    }
    );

    if (TD.lifecycle && typeof TD.lifecycle.onPageHide === 'function') {
      TD.lifecycle.onPageHide(function () {
        if (introDoneTimer !== null) {
          window.clearTimeout(introDoneTimer);
          introDoneTimer = null;
        }
        for (var t = 0; t < cleanupTimers.length; t++) {
          window.clearTimeout(cleanupTimers[t]);
        }
        cleanupTimers = [];
        teardownRevealWatchers();
      });
    }

    if (TD.lifecycle && typeof TD.lifecycle.onPageShow === 'function') {
      TD.lifecycle.onPageShow(function (e) {
        if (e && e.persisted) {
          root.classList.add('td-skip-intro');
          if (pendingRevealNodes.length) {
            bindRevealWatchers();
            onImmediateCheck();
          }
        }
      });
    }

    if (typeof TD.onMediaQueryChange === 'function') {
      TD.onMediaQueryChange('(prefers-reduced-motion: reduce)', function (e) {
        if (e.matches) {
          if (introDoneTimer !== null) {
            window.clearTimeout(introDoneTimer);
            introDoneTimer = null;
          }
          root.classList.add('td-skip-intro');
          revealAllPending();
        }
      });
    }
  }

  function refreshReveal() {
    if (!isRevealInitialized) return;
    observeTargets(true);
  }

  TD.effects = {
    initCounters: initCounters,
    initReveal: initReveal,
    refreshReveal: refreshReveal,
    revealNow: revealAllPending
  };
})(window, document);