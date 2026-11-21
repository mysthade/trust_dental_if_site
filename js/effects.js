/* ==========================================================================
   TRUST DENTAL — Visual Effects & Counters (window.TD.effects)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var COUNTER_DURATION_MS = 1000;
  var isInitialized = false;

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

  TD.effects = {
    initCounters: initCounters
  };
})(window, document);

