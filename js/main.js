/* ==========================================================================
   TRUST DENTAL — Entry Point (window.TD.main)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});

  function scheduleIdle(fn) {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(fn, { timeout: 1200 });
    } else {
      window.setTimeout(fn, 120);
    }
  }

  function initStage2Modules() {
    if (TD.render && typeof TD.render.init === 'function') {
      TD.render.init();
    }
    if (TD.calculator && typeof TD.calculator.init === 'function') {
      TD.calculator.init();
    }
  }

  function initNonCritical() {
    scheduleIdle(function () {
      initStage2Modules();
      if (TD.header && typeof TD.header.initScrollSpy === 'function') {
        TD.header.initScrollSpy();
      }
      if (TD.effects && typeof TD.effects.initCounters === 'function') {
        TD.effects.initCounters();
      }
    });
  }

  function init() {
    if (typeof TD.hydrateClinicData === 'function') {
      TD.hydrateClinicData();
    }
    if (TD.theme && typeof TD.theme.init === 'function') {
      TD.theme.init();
    }
    if (TD.header && typeof TD.header.initCritical === 'function') {
      TD.header.initCritical();
    }

    var hash = window.location.hash;
    if (hash === '#services' || hash === '#prices' || hash === '#calculator') {
      initStage2Modules();
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

