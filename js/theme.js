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

    if (animate) {
      var reduced = false;
      try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        reduced = false;
      }

      if (!reduced) {
        if (switchTimer) {
          window.clearTimeout(switchTimer);
        }
        root.classList.add(SWITCH_CLASS);
        switchTimer = window.setTimeout(function () {
          root.classList.remove(SWITCH_CLASS);
          switchTimer = null;
        }, SWITCH_DURATION_MS);
      }
    }

    root.setAttribute('data-theme', normalized);
    root.style.colorScheme = normalized;
    syncToggleButtons(normalized);
  }

  function toggleTheme() {
    var next = getCurrentTheme() === 'dark' ? 'light' : 'dark';
    saveTheme(next);
    applyTheme(next, true);
  }

  function init() {
    var initial = readSavedTheme() || getCurrentTheme() || getSystemTheme();
    applyTheme(initial, false);

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
  }

  TD.theme = {
    init: init,
    toggle: toggleTheme,
    apply: applyTheme,
    get: getCurrentTheme
  };
})(window, document);

