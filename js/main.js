/* ==========================================================================
   TRUST DENTAL — Entry Point (window.TD.main)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var isInitialized = false;

  function scheduleIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: 1200 });
    } else {
      window.setTimeout(fn, 120);
    }
  }

  function initNonCritical() {
    scheduleIdle(function () {
      if (TD.header && typeof TD.header.initScrollSpy === 'function') {
        TD.header.initScrollSpy();
      }
      if (TD.effects && typeof TD.effects.initCounters === 'function') {
        TD.effects.initCounters();
      }
    });
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    if (typeof TD.hydrateClinicData === 'function') {
      TD.hydrateClinicData();
    }
    if (TD.theme && typeof TD.theme.init === 'function') {
      TD.theme.init();
    }

    /* Perform all stage-2 DOM insertions BEFORE any layout reads (header scroll
       state & reveal viewport checks) so the browser executes a single layout
       pass before first paint instead of multiple forced layouts. */
    if (TD.render && typeof TD.render.init === 'function') {
      TD.render.init();
    }
    if (TD.calculator && typeof TD.calculator.init === 'function') {
      TD.calculator.init();
    }
    if (TD.header && typeof TD.header.initCritical === 'function') {
      TD.header.initCritical();
    }
    if (TD.effects && typeof TD.effects.initReveal === 'function') {
      TD.effects.initReveal();
    }

    if (document.readyState === 'complete') {
      initNonCritical();
    } else {
      window.addEventListener('load', initNonCritical, { once: true, passive: true });
    }
  }

  TD.main = {
    init: init
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})(window, document);

