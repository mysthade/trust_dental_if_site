/* ==========================================================================
   TRUST DENTAL — Theme Manager (window.TD.theme)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var STORAGE_KEY = 'td-theme';
  var SWITCH_CLASS = 'is-theme-switching';
  var SWITCH_DURATION_MS = 320;
  var switchTimer = null;
  var activeTransition = null;
  var isInitialized = false;

  function prefersReducedMotion() {
    try {
      return Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch (e) {
      return false;
    }
  }

  function clearSwitchTransition() {
    if (switchTimer) {
      window.clearTimeout(switchTimer);
      switchTimer = null;
    }
    if (activeTransition && typeof activeTransition.skipTransition === 'function') {
      try {
        activeTransition.skipTransition();
      } catch (e) {}
    }
    activeTransition = null;
    document.documentElement.classList.remove(SWITCH_CLASS);
  }

  function commitThemeDom(theme) {
    var root = document.documentElement;
    var normalized = theme === 'dark' ? 'dark' : 'light';

    root.setAttribute('data-theme', normalized);
    root.style.colorScheme = normalized;

    var themeColor = document.querySelector('meta[data-theme-color]');
    if (themeColor) {
      var targetColor = normalized === 'dark' ? '#0F1217' : '#EEF0F2';
      if (themeColor.getAttribute('content') !== targetColor) {
        themeColor.setAttribute('content', targetColor);
      }
    }

    syncToggleButtons(normalized);
  }

  function readSavedTheme() {
    try {
      var val = window.localStorage.getItem(STORAGE_KEY);
      return val === 'dark' || val === 'light' ? val : null;
    } catch (e) {
      return null;
    }
  }

  function saveTheme(theme) {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      /* Storage unavailable (private mode / blocked) — fail silently */
    }
  }

  function getSystemTheme() {
    try {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      /* Fallback to light */
    }
    return 'light';
  }

  function getCurrentTheme() {
    var attr = document.documentElement.getAttribute('data-theme');
    return attr === 'dark' ? 'dark' : 'light';
  }

  function syncToggleButtons(theme) {
    var isDark = theme === 'dark';
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      btn.setAttribute(
        'aria-label',
        isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'
      );
      btn.setAttribute(
        'title',
        isDark ? 'Світла тема' : 'Темна тема'
      );
    }
  }

  function applyTheme(theme, animate) {
    var root = document.documentElement;
    var normalized = theme === 'dark' ? 'dark' : 'light';
    var current = getCurrentTheme();

    if (!animate || normalized === current || prefersReducedMotion() || document.hidden) {
      clearSwitchTransition();
      commitThemeDom(normalized);
      return;
    }

    /* Cancel any pending CSS timer or overlapping View Transition on rapid double toggle */
    clearSwitchTransition();
    root.classList.add('td-intro-done');

    /* Progressive enhancement: full-page GPU cross-dissolve via View Transitions API */
    if (typeof document.startViewTransition === 'function') {
      try {
        var vt = document.startViewTransition(function () {
          commitThemeDom(normalized);
        });
        activeTransition = vt;
        if (vt && vt.finished && typeof vt.finished.then === 'function') {
          vt.finished.then(
            function () {
              if (activeTransition === vt) activeTransition = null;
            },
            function () {
              if (activeTransition === vt) activeTransition = null;
            }
          );
        }
        return;
      } catch (e) {
        activeTransition = null;
      }
    }

    /* Fallback when View Transitions API is unavailable: temporary root CSS class */
    root.classList.add(SWITCH_CLASS);
    void root.offsetWidth;
    commitThemeDom(normalized);
    switchTimer = window.setTimeout(clearSwitchTransition, SWITCH_DURATION_MS);
  }

  function toggleTheme() {
    var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next, true);
  }

  function init() {
    var initial = readSavedTheme() || getCurrentTheme() || getSystemTheme();
    applyTheme(initial, false);

    if (isInitialized) return;
    isInitialized = true;

    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].addEventListener('click', toggleTheme);
    }

    /* Follow OS changes only when user has not saved an explicit choice */
    try {
      if (window.matchMedia) {
        var mq = window.matchMedia('(prefers-color-scheme: dark)');
        var onSystemChange = function (e) {
          if (!readSavedTheme()) {
            applyTheme(e.matches ? 'dark' : 'light', true);
          }
        };
        if (typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', onSystemChange);
        } else if (typeof mq.addListener === 'function') {
          mq.addListener(onSystemChange);
        }
      }
    } catch (e) {
      /* Ignore unsupported matchMedia listeners */
    }

    if (TD.lifecycle && typeof TD.lifecycle.onPageHide === 'function') {
      TD.lifecycle.onPageHide(clearSwitchTransition);
    }

    try {
      if (window.matchMedia) {
        var rmq = window.matchMedia('(prefers-reduced-motion: reduce)');
        var onMotionChange = function (e) {
          if (e.matches) clearSwitchTransition();
        };
        if (typeof rmq.addEventListener === 'function') {
          rmq.addEventListener('change', onMotionChange);
        } else if (typeof rmq.addListener === 'function') {
          rmq.addListener(onMotionChange);
        }
      }
    } catch (e) {}
  }

  TD.theme = {
    init: init,
    toggle: toggleTheme,
    apply: applyTheme,
    get: getCurrentTheme
  };
})(window, document);

