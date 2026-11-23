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
  var isScrollStateBound = false;
  var isDrawerBound = false;
  var isScrollSpyBound = false;
  var isMobileActionBarBound = false;
  var syncMobileActionBarVisibility = function () { };

  function initScrollState() {
    if (isScrollStateBound) return;
    var header = document.getElementById('site-header');
    var sentinel = document.getElementById('header-sentinel');
    if (!header || !sentinel) return;
    isScrollStateBound = true;

    function syncScrolledInstant() {
      var scrolled = (window.scrollY || window.pageYOffset || 0) > 16;
      if (scrolled && !header.classList.contains('is-scrolled')) {
        header.classList.add('is-scroll-sync', 'is-scrolled');
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(function () {
            header.classList.remove('is-scroll-sync');
          });
        } else {
          window.setTimeout(function () {
            header.classList.remove('is-scroll-sync');
          }, 0);
        }
      } else {
        header.classList.toggle('is-scrolled', scrolled);
      }
    }

    syncScrolledInstant();
    window.addEventListener('load', syncScrolledInstant, {
      once: true,
      passive: true
    });

    if (TD.lifecycle && typeof TD.lifecycle.onPageShow === 'function') {
      TD.lifecycle.onPageShow(syncScrolledInstant);
    }

    if (!('IntersectionObserver' in window)) return;

    var observer = new window.IntersectionObserver(
      function (entries) {
        var entry = entries[0];
        if (!entry) return;
        header.classList.toggle('is-scrolled', !entry.isIntersecting);
      }, {
      threshold: 0
    }
    );

    observer.observe(sentinel);
  }

  function initDrawer() {
    if (isDrawerBound) return;
    var burgerBtn = document.getElementById('burger-btn');
    var drawer = document.getElementById('mobile-drawer');
    var backdrop = document.getElementById('drawer-backdrop');
    var closeBtn = document.getElementById('drawer-close');
    if (!burgerBtn || !drawer || !backdrop) return;
    isDrawerBound = true;

    var inertTargets = [
      document.querySelector('.skip-link'),
      document.getElementById('site-header'),
      document.getElementById('main-content'),
      document.getElementById('site-footer'),
      document.getElementById('mobile-action-bar')
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

      /* Double rAF ensures browser commits initial hidden transform/opacity
         before adding .is-open so drawer and staggered items always animate */
      window.requestAnimationFrame(function () {
        if (!isDrawerOpen) return;
        window.requestAnimationFrame(function () {
          if (!isDrawerOpen) return;
          drawer.classList.add('is-open');
          backdrop.classList.add('is-open');
        });
      });

      document.documentElement.classList.add('is-drawer-open');
      setBackgroundInert(true);
      syncMobileActionBarVisibility();

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
      syncMobileActionBarVisibility();

      burgerBtn.setAttribute('aria-expanded', 'false');
      burgerBtn.setAttribute('aria-label', 'Відкрити меню навігації');
      document.removeEventListener('keydown', onKeyDown);

      var reduced =
        typeof TD.prefersReducedMotion === 'function' ? TD.prefersReducedMotion() : false;

      var hideAfter = reduced ? 0 : 350;
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
    if (typeof TD.onMediaQueryChange === 'function') {
      TD.onMediaQueryChange('(min-width: 980px)', function (e) {
        if (e.matches && isDrawerOpen) {
          closeDrawer(false);
        }
      });
    }

    if (TD.lifecycle && typeof TD.lifecycle.onPageHide === 'function') {
      TD.lifecycle.onPageHide(function () {
        if (closeTimer) {
          window.clearTimeout(closeTimer);
          closeTimer = null;
        }
        if (isDrawerOpen) {
          closeDrawer(false);
          drawer.hidden = true;
          backdrop.hidden = true;
        }
      });
    }

    TD.header.openDrawer = openDrawer;
    TD.header.closeDrawer = closeDrawer;
  }

  function initScrollSpy() {
    if (isScrollSpyBound || !('IntersectionObserver' in window)) return;

    var navLinks = document.querySelectorAll('[data-nav-target]');
    if (!navLinks.length) return;
    isScrollSpyBound = true;

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
      } else {
        setActiveLink(null);
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
      }, {
      rootMargin: '-100px 0px -25% 0px',
      threshold: [0, 0.15, 0.35, 0.6, 0.85, 1]
    }
    );

    if (hero) sectionObserver.observe(hero);
    for (var m = 0; m < sections.length; m++) {
      sectionObserver.observe(sections[m]);
    }
  }

  function initMobileActionBar() {
    if (isMobileActionBarBound) return;
    var bar = document.getElementById('mobile-action-bar');
    var heroCta =
      document.querySelector('[data-primary-hero-actions]') || document.getElementById('hero-cta');
    var contactsSection = document.getElementById('contacts');
    var footerSection = document.getElementById('site-footer');
    if (!bar || !heroCta || !('IntersectionObserver' in window)) return;
    isMobileActionBarBound = true;

    var heroCtaIntersecting = true;
    var heroCtaAboveViewport = false;
    var contactsIntersecting = false;
    var footerIntersecting = false;
    var isBarVisible = false;

    function isMobileViewport() {
      try {
        return window.matchMedia('(max-width: 979px)').matches;
      } catch (e) {
        return (window.innerWidth || document.documentElement.clientWidth || 1280) <= 979;
      }
    }

    function updateBarVisibility() {
      var vh = window.innerHeight || document.documentElement.clientHeight || 800;
      var ctaRect = heroCta.getBoundingClientRect();
      heroCtaIntersecting = ctaRect.bottom > 12 && ctaRect.top < vh;
      heroCtaAboveViewport = ctaRect.bottom <= 12;

      if (contactsSection) {
        var cRect = contactsSection.getBoundingClientRect();
        contactsIntersecting = cRect.top < vh - 24 && cRect.bottom > 24;
      }
      if (footerSection) {
        var fRect = footerSection.getBoundingClientRect();
        footerIntersecting = fRect.top < vh && fRect.bottom > 0;
      }

      var modalOpen = document.documentElement.classList.contains('is-modal-open');
      var shouldShow =
        isMobileViewport() &&
        !isDrawerOpen &&
        !modalOpen &&
        !heroCtaIntersecting &&
        heroCtaAboveViewport &&
        !contactsIntersecting &&
        !footerIntersecting;

      if (shouldShow === isBarVisible) {
        bar.inert = !shouldShow;
        return;
      }

      isBarVisible = shouldShow;
      bar.classList.toggle('is-visible', shouldShow);
      bar.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
      bar.inert = !shouldShow;
    }

    syncMobileActionBarVisibility = updateBarVisibility;
    bar.inert = true;

    var observer = new window.IntersectionObserver(
      function (entries) {
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.target === heroCta) {
            heroCtaIntersecting = entry.isIntersecting;
            heroCtaAboveViewport = !entry.isIntersecting && entry.boundingClientRect.bottom <= 16;
          } else if (entry.target === contactsSection) {
            contactsIntersecting = entry.isIntersecting;
          } else if (entry.target === footerSection) {
            footerIntersecting = entry.isIntersecting;
          }
        }
        updateBarVisibility();
      }, {
      rootMargin: '0px 0px 0px 0px',
      threshold: [0, 0.05]
    }
    );

    observer.observe(heroCta);
    if (contactsSection) observer.observe(contactsSection);
    if (footerSection) observer.observe(footerSection);

    if (typeof TD.onMediaQueryChange === 'function') {
      TD.onMediaQueryChange('(max-width: 979px)', function () {
        var rect = heroCta.getBoundingClientRect();
        heroCtaIntersecting = rect.bottom > 0 && rect.top < window.innerHeight;
        heroCtaAboveViewport = rect.bottom <= 16;
        updateBarVisibility();
      });
    }

    TD.header.syncMobileActionBar = updateBarVisibility;

    if (TD.lifecycle && typeof TD.lifecycle.onPageShow === 'function') {
      TD.lifecycle.onPageShow(function () {
        updateBarVisibility();
      });
    }
  }

  TD.header = {
    initCritical: function () {
      initScrollState();
      initDrawer();
      initMobileActionBar();
    },
    initScrollSpy: initScrollSpy,
    syncMobileActionBar: function () {
      syncMobileActionBarVisibility();
    }
  };
})(window, document);