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
  var sweepRafId = null;
  var sweepListenersBound = false;
  var cleanupTimers = [];

  function prefersReducedMotion() {
    try {
      return Boolean(
        window.matchMedia &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch (e) {
      return false;
    }
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

    /* Respect reduced motion: leave rendered final values as-is */
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
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
      },
      { threshold: 0.25 }
    );

    observer.observe(statsContainer);
  }

  function markRevealed(el, delayMs, instant) {
    if (!el) return;
    if (instant || prefersReducedMotion()) {
      el.classList.remove('is-revealing');
      el.style.removeProperty('--td-reveal-delay');
      el.classList.remove('td-reveal-pending');
      el.classList.add('is-revealed');
      return;
    }

    if (delayMs > 0) {
      el.style.setProperty('--td-reveal-delay', delayMs + 'ms');
    } else {
      el.style.removeProperty('--td-reveal-delay');
    }
    el.classList.add('is-revealing');
    el.classList.remove('td-reveal-pending');
    el.classList.add('is-revealed');

    var cleanupTimer = window.setTimeout(function () {
      el.classList.remove('is-revealing');
      el.style.removeProperty('--td-reveal-delay');
    }, 580 + (delayMs || 0));
    cleanupTimers.push(cleanupTimer);

    el.addEventListener(
      'transitionend',
      function onEnd(ev) {
        if (ev.target !== el) return;
        if (ev.propertyName !== 'opacity' && ev.propertyName !== 'transform') return;
        window.clearTimeout(cleanupTimer);
        el.classList.remove('is-revealing');
        el.style.removeProperty('--td-reveal-delay');
        el.removeEventListener('transitionend', onEnd);
      }
    );
  }

  function removePendingNode(el) {
    var idx = pendingRevealNodes.indexOf(el);
    if (idx !== -1) {
      pendingRevealNodes.splice(idx, 1);
    }
    if (revealObserver) {
      revealObserver.unobserve(el);
    }
    if (!pendingRevealNodes.length) {
      teardownRevealWatchers();
    }
  }

  function onSweepSchedule() {
    if (!pendingRevealNodes.length || sweepRafId !== null) return;
    sweepRafId = window.requestAnimationFrame(sweepVisibleOrPassed);
  }

  function teardownRevealWatchers() {
    if (sweepRafId !== null) {
      window.cancelAnimationFrame(sweepRafId);
      sweepRafId = null;
    }
    if (sweepListenersBound) {
      sweepListenersBound = false;
      window.removeEventListener('scroll', onSweepSchedule);
      window.removeEventListener('resize', onSweepSchedule);
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
    var thresholdTop = vh * 0.96;
    var batchIndex = 0;

    for (var i = pendingRevealNodes.length - 1; i >= 0; i--) {
      var el = pendingRevealNodes[i];
      var rect = el.getBoundingClientRect();
      if (rect.bottom <= 0) {
        markRevealed(el, 0, true);
        removePendingNode(el);
      } else if (rect.top < thresholdTop) {
        var kind = el.getAttribute('data-reveal');
        var delayMs = kind === 'card' ? Math.min(batchIndex, 3) * 40 : 0;
        if (kind === 'card') batchIndex++;
        markRevealed(el, delayMs, false);
        removePendingNode(el);
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
    var groups = [
      {
        kind: 'head',
        selector:
          '#services .section__head, #advantages .advantages-section__intro, #prices .section__head, #prices .calc-block__head, #doctors .section__head, #works .section__head, #reviews .section__head, #contacts .section__head'
      },
      {
        kind: 'card',
        selector:
          '#services-grid .service-card, #advantages .advantage-card, #advantages .advantages-note, #prices .price-filters, #prices .price-board, #prices .calc-block, #prices .calc-summary, #doctors .doctor-card, #works .works-filters, #works .work-card, #works .works-empty, #reviews .reviews-summary, #reviews .reviews-stage, #contacts .contacts-card, #contacts .booking-steps-card, #contacts .contacts-map-card, #contacts .appointment-card'
      },
      {
        kind: 'deco',
        selector:
          '.deco--services-tooth, .deco--advantages-ribbon, .deco--advantages-arc, .deco--prices-ribbon, .deco--prices-arc, .deco--prices-wave, .deco--doctors-tooth, .deco--works-arc, .deco--works-contour, .deco--reviews-arc, .deco--reviews-wave, .deco--contacts-ribbon'
      }
    ];

    var items = [];
    for (var g = 0; g < groups.length; g++) {
      var nodes = document.querySelectorAll(groups[g].selector);
      for (var i = 0; i < nodes.length; i++) {
        items.push({ el: nodes[i], kind: groups[g].kind });
      }
    }
    return items;
  }

  function initReveal() {
    if (isRevealInitialized) return;
    isRevealInitialized = true;

    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      return;
    }

    var targets = collectRevealTargets();
    if (!targets.length) return;

    var vh = window.innerHeight || document.documentElement.clientHeight || 900;
    var belowFoldThreshold = vh * 0.96;
    var toObserve = [];

    for (var i = 0; i < targets.length; i++) {
      var item = targets[i];
      var el = item.el;
      if (el.hasAttribute('hidden') || el.classList.contains('is-revealed')) continue;
      el.setAttribute('data-reveal', item.kind);

      var rect = el.getBoundingClientRect();
      /* Never hide elements already inside or above current viewport (first paint / reload scroll restoration) */
      if (rect.top < belowFoldThreshold) {
        el.classList.add('is-revealed');
        continue;
      }

      el.classList.add('td-reveal-pending');
      pendingRevealNodes.push(el);
      toObserve.push(el);
    }

    if (!toObserve.length) return;

    revealObserver = new window.IntersectionObserver(
      function (entries) {
        var curVh = window.innerHeight || document.documentElement.clientHeight || 900;
        var batchIndex = 0;
        for (var e = 0; e < entries.length; e++) {
          var entry = entries[e];
          var passedAbove = entry.boundingClientRect && entry.boundingClientRect.bottom <= 0;
          if (!entry.isIntersecting && !passedAbove) continue;
          var target = entry.target;
          var kind = target.getAttribute('data-reveal');
          var delayMs = kind === 'card' && !passedAbove ? Math.min(batchIndex, 3) * 40 : 0;
          if (kind === 'card' && !passedAbove) batchIndex++;
          markRevealed(target, delayMs, passedAbove && entry.boundingClientRect.top < -curVh);
          removePendingNode(target);
        }
      },
      {
        rootMargin: '0px 0px -6% 0px',
        threshold: 0.04
      }
    );

    for (var k = 0; k < toObserve.length; k++) {
      revealObserver.observe(toObserve[k]);
    }

    if (!sweepListenersBound) {
      sweepListenersBound = true;
      window.addEventListener('scroll', onSweepSchedule, { passive: true });
      window.addEventListener('resize', onSweepSchedule, { passive: true });
    }

    window.addEventListener('pagehide', function () {
      for (var t = 0; t < cleanupTimers.length; t++) {
        window.clearTimeout(cleanupTimers[t]);
      }
      cleanupTimers = [];
      if (sweepRafId !== null) {
        window.cancelAnimationFrame(sweepRafId);
        sweepRafId = null;
      }
    });

    try {
      var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mq && typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', function (e) {
          if (e.matches) {
            revealAllPending();
          }
        });
      }
    } catch (err) {}
  }

  TD.effects = {
    initCounters: initCounters,
    initReveal: initReveal,
    revealNow: revealAllPending
  };
})(window, document);

