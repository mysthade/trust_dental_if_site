/* ==========================================================================
   TRUST DENTAL — Header, Scroll-Spy & Mobile Drawer (window.TD.header)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var FOCUSABLE_SELECTOR =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  var isDrawerOpen = false;
  var lastFocusedEl = null;
  var closeTimer = null;

  function initScrollState() {
    var header = document.getElementById('site-header');
    var sentinel = document.getElementById('header-sentinel');
    if (!header || !sentinel || !('IntersectionObserver' in window)) return;

    var observer = new window.IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry) return;
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      },
      { threshold: 0 }
    );

    observer.observe(sentinel);
  }

  function initDrawer() {
    var burgerBtn = document.getElementById('burger-btn');
    var drawer = document.getElementById('mobile-drawer');
    var backdrop = document.getElementById('drawer-backdrop');
    var closeBtn = document.getElementById('drawer-close');
    if (!burgerBtn || !drawer || !backdrop) return;

    var inertTargets = [
      document.querySelector('.skip-link'),
      document.getElementById('site-header'),
      document.getElementById('main-content'),
      document.getElementById('site-footer')
    ].filter(Boolean);

    function setBackgroundInert(state) {
      for (var i = 0; i < inertTargets.length; i++) {
        inertTargets[i].inert = state;
      }
    }

    function getFocusable() {
      var list = drawer.querySelectorAll(FOCUSABLE_SELECTOR);
      var visible = [];
      for (var i = 0; i < list.length; i++) {
        if (!list[i].hasAttribute('hidden') && list[i].offsetParent !== null) {
          visible.push(list[i]);
        }
      }
      return visible;
    }

    function onKeyDown(e) {
      if (!isDrawerOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer(true);
        return;
      }

      if (e.key === 'Tab') {
        var focusable = getFocusable();
        if (!focusable.length) {
          e.preventDefault();
          return;
        }
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !drawer.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !drawer.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    function openDrawer() {
      if (isDrawerOpen) return;
      if (closeTimer) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }

      isDrawerOpen = true;
      lastFocusedEl = document.activeElement;

      drawer.hidden = false;
      backdrop.hidden = false;

      /* Force transition start on next animation frame without layout read */
      window.requestAnimationFrame(function () {
        drawer.classList.add('is-open');
        backdrop.classList.add('is-open');
      });

      document.documentElement.classList.add('is-drawer-open');
      setBackgroundInert(true);

      burgerBtn.setAttribute('aria-expanded', 'true');
      burgerBtn.setAttribute('aria-label', 'Закрити меню навігації');
      document.addEventListener('keydown', onKeyDown);

      window.requestAnimationFrame(function () {
        if (closeBtn) {
          closeBtn.focus();
        } else {
          var focusable = getFocusable();
          if (focusable[0]) focusable[0].focus();
        }
      });
    }

    function closeDrawer(restoreFocus) {
      if (!isDrawerOpen) return;
      isDrawerOpen = false;

      drawer.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.documentElement.classList.remove('is-drawer-open');
      setBackgroundInert(false);

      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.setAttribute('aria-label', 'Відкрити меню навігації');
      document.removeEventListener('keydown', onKeyDown);

      var reduced = false;
      try {
        reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch (e) {
        reduced = false;
      }

      var hideAfter = reduced ? 0 : 280;
      closeTimer = window.setTimeout(function () {
        if (!isDrawerOpen) {
          drawer.hidden = true;
          backdrop.hidden = true;
        }
        closeTimer = null;
      }, hideAfter);

      if (restoreFocus) {
        if (lastFocusedEl && typeof lastFocusedEl.focus === 'function') {
          lastFocusedEl.focus();
        } else {
          burgerBtn.focus();
        }
      }
      lastFocusedEl = null;
    }

    burgerBtn.addEventListener('click', function () {
      if (isDrawerOpen) {
        closeDrawer(true);
      } else {
        openDrawer();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeDrawer(true);
      });
    }

    backdrop.addEventListener('click', function () {
      closeDrawer(true);
    });

    var drawerLinks = drawer.querySelectorAll('a[href^="#"]');
    for (var i = 0; i < drawerLinks.length; i++) {
      drawerLinks[i].addEventListener('click', function () {
        closeDrawer(false);
      });
    }

    /* Automatically close drawer if resized to desktop width */
    try {
      var desktopMq = window.matchMedia('(min-width: 980px)');
      var onDesktop = function (e) {
        if (e.matches && isDrawerOpen) {
          closeDrawer(false);
        }
      };
      if (typeof desktopMq.addEventListener === 'function') {
        desktopMq.addEventListener('change', onDesktop);
      } else if (typeof desktopMq.addListener === 'function') {
        desktopMq.addListener(onDesktop);
      }
    } catch (e) {
      /* Ignore older browsers */
    }

    TD.header.openDrawer = openDrawer;
    TD.header.closeDrawer = closeDrawer;
  }

  function initScrollSpy() {
    if (!('IntersectionObserver' in window)) return;

    var navLinks = document.querySelectorAll('[data-nav-target]');
    if (!navLinks.length) return;

    var sectionIds = [];
    var seen = Object.create(null);
    for (var i = 0; i < navLinks.length; i++) {
      var id = navLinks[i].getAttribute('data-nav-target');
      if (id && !seen[id]) {
        seen[id] = true;
        sectionIds.push(id);
      }
    }

    var sections = [];
    for (var j = 0; j < sectionIds.length; j++) {
      var sec = document.getElementById(sectionIds[j]);
      if (sec) sections.push(sec);
    }

    var hero = document.getElementById('top');
    if (!sections.length) return;

    var ratios = Object.create(null);
    var heroHeight = 1;
    var currentId = null;

    function setActiveLink(id) {
      if (id === currentId) return;
      currentId = id;
      for (var k = 0; k < navLinks.length; k++) {
        var link = navLinks[k];
        var match = id !== null && link.getAttribute('data-nav-target') === id;
        link.classList.toggle('is-active', match);
        if (match) {
          link.setAttribute('aria-current', 'location');
        } else {
          link.removeAttribute('aria-current');
        }
      }
    }

    function pickActive() {
      var bestId = null;
      var bestHeight = 0;

      for (var k = 0; k < sectionIds.length; k++) {
        var sid = sectionIds[k];
        var h = ratios[sid] || 0;
        if (h > bestHeight) {
          bestHeight = h;
          bestId = sid;
        }
      }

      if (bestId && bestHeight > heroHeight) {
        setActiveLink(bestId);
      } else if (heroHeight > 0 && bestHeight <= heroHeight) {
        setActiveLink(null);
      } else if (bestId) {
        setActiveLink(bestId);
      }
    }

    var sectionObserver = new window.IntersectionObserver(
      function (entries) {
        for (var e = 0; e < entries.length; e++) {
          var entry = entries[e];
          var eid = entry.target.id;
          var visH = entry.isIntersecting ? entry.intersectionRect.height : 0;
          if (eid === 'top') {
            heroHeight = visH;
          } else {
            ratios[eid] = visH;
          }
        }
        pickActive();
      },
      {
        rootMargin: '-100px 0px -25% 0px',
        threshold: [0, 0.15, 0.35, 0.6, 0.85, 1]
      }
    );

    if (hero) sectionObserver.observe(hero);
    for (var m = 0; m < sections.length; m++) {
      sectionObserver.observe(sections[m]);
    }
  }

  TD.header = {
    initCritical: function () {
      initScrollState();
      initDrawer();
    },
    initScrollSpy: initScrollSpy
  };
})(window, document);
