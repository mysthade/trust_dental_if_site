/* ==========================================================================
   TRUST DENTAL — Safe DOM Renderer: Services, Works, Reviews & Contacts
   Namespace: window.TD.render (zero innerHTML from untrusted data)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var isInitialized = false;
  var activeModalWorkId = null;
  var activeGalleryModal = {
    group: null,
    id: null
  };
  var lightboxControllers = {
    work: {
      closeTimer: null,
      lastTrigger: null
    },
    gallery: {
      closeTimer: null,
      lastTrigger: null
    }
  };
  var activeFetchControllers = {
    reviews: null,
    appointment: null
  };
  var galleryResizeRaf = null;
  var galleryGroupsState = {
    inside: {
      currentIndex: 0,
      perView: 3,
      maxIndex: 0,
      totalSlides: 0
    },
    outside: {
      currentIndex: 0,
      perView: 3,
      maxIndex: 0,
      totalSlides: 0
    }
  };

  function prefersReducedMotion() {
    return typeof TD.prefersReducedMotion === 'function' ? TD.prefersReducedMotion() : false;
  }

  function isSafeHttpUrl(url) {
    if (typeof TD.isSafeHttpUrl === 'function') {
      return TD.isSafeHttpUrl(url, false);
    }
    return /^https?:\/\/[^\s/@]+(?:\/[^\s]*)?$/i.test(String(url || '').trim());
  }

  function isSafeEndpointUrl(url) {
    if (typeof TD.isSafeHttpUrl === 'function') {
      return TD.isSafeHttpUrl(url, true);
    }
    var clean = String(url || '').trim();
    if (!clean) return false;
    if (clean.charAt(0) === '/') return clean.length === 1 || (clean.charAt(1) !== '/' && clean.charAt(1) !== '\\');
    return isSafeHttpUrl(clean);
  }

  function isSameOriginUrl(url) {
    return typeof TD.isSameOriginUrl === 'function' ? TD.isSameOriginUrl(url) : false;
  }

  function sanitizeExternalText(val, maxLen) {
    var clean = String(val || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();
    return maxLen && clean.length > maxLen ? clean.slice(0, maxLen) : clean;
  }

  function abortActiveFetch(key) {
    var ctrl = activeFetchControllers[key];
    if (ctrl && typeof ctrl.abort === 'function') {
      try {
        ctrl.abort();
      } catch (e) { }
    }
    activeFetchControllers[key] = null;
  }

  function fetchWithTimeout(url, fetchOpts, timeoutMs, controllerKey) {
    if (typeof window.fetch !== 'function') {
      return Promise.reject(new Error('Fetch API is unavailable'));
    }

    var ctrl = typeof window.AbortController === 'function' ? new window.AbortController() : null;
    if (controllerKey && ctrl) {
      abortActiveFetch(controllerKey);
      activeFetchControllers[controllerKey] = ctrl;
    }

    var timerId = null;
    var timedOut = false;
    var opts = {};
    if (fetchOpts && typeof fetchOpts === 'object') {
      for (var key in fetchOpts) {
        if (Object.prototype.hasOwnProperty.call(fetchOpts, key)) {
          opts[key] = fetchOpts[key];
        }
      }
    }
    if (ctrl) {
      opts.signal = ctrl.signal;
    }

    if (timeoutMs > 0) {
      timerId = window.setTimeout(function () {
        timedOut = true;
        if (ctrl) ctrl.abort();
      }, timeoutMs);
    }

    return window.fetch(url, opts).then(
      function (resp) {
        if (timerId !== null) window.clearTimeout(timerId);
        if (controllerKey && activeFetchControllers[controllerKey] === ctrl) {
          activeFetchControllers[controllerKey] = null;
        }
        return resp;
      },
      function (err) {
        if (timerId !== null) window.clearTimeout(timerId);
        if (controllerKey && activeFetchControllers[controllerKey] === ctrl) {
          activeFetchControllers[controllerKey] = null;
        }
        if (timedOut) {
          throw new Error('Request timeout');
        }
        throw err;
      }
    );
  }

  function scrollToTarget(el) {
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start'
      });
    }
  }

  function bindHorizontalSwipe(el, onNext, onPrev, opts) {
    if (!el || el.dataset.tdSwipeBound) return;
    el.dataset.tdSwipeBound = '1';
    var threshold = (opts && opts.threshold) || 40;
    var ignoreSelector = opts && opts.ignoreSelector;
    var onSwipe = opts && opts.onSwipe;
    var startX = 0;
    var startY = 0;
    var isSwiping = false;

    el.addEventListener(
      'touchstart',
      function (e) {
        if (!e.touches || e.touches.length !== 1) {
          isSwiping = false;
          return;
        }
        if (ignoreSelector && e.target && e.target.closest && e.target.closest(ignoreSelector)) {
          isSwiping = false;
          return;
        }
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
      }, {
      passive: true
    }
    );

    el.addEventListener(
      'touchend',
      function (e) {
        if (!isSwiping || !e.changedTouches || !e.changedTouches.length) {
          isSwiping = false;
          return;
        }
        isSwiping = false;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.2) {
          if (dx < 0) onNext();
          else onPrev();
          if (typeof onSwipe === 'function') onSwipe();
        }
      }, {
      passive: true
    }
    );

    el.addEventListener(
      'touchcancel',
      function () {
        isSwiping = false;
      }, {
      passive: true
    }
    );
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined && text !== null) el.textContent = text;
    return el;
  }

  function setSlideInteractivity(slide, isActive) {
    slide.classList.toggle('is-active', isActive);
    slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
    slide.inert = !isActive;
    var interactive = slide.querySelectorAll('button, a[href]');
    for (var i = 0; i < interactive.length; i++) {
      interactive[i].tabIndex = isActive ? 0 : -1;
    }
  }

  function syncTabDotsState(dotsWrap, dotSelector, activeIdx) {
    if (!dotsWrap) return;
    var dots = dotsWrap.querySelectorAll(dotSelector);
    for (var i = 0; i < dots.length; i++) {
      var isActive = i === activeIdx;
      dots[i].classList.toggle('is-active', isActive);
      dots[i].setAttribute('aria-selected', isActive ? 'true' : 'false');
      dots[i].tabIndex = isActive ? 0 : -1;
    }
  }

  function applyTrackTransform(track, transformVal, instant) {
    if (track.style.transform === transformVal) return;
    if (instant && track.style.transform) {
      track.style.transition = 'none';
      track.style.transform = transformVal;
      track.getBoundingClientRect();
      track.style.transition = '';
    } else {
      track.style.transform = transformVal;
    }
  }

  function bindTablistKeyNav(dotsWrap, dotSelector, getCurIdx, onSelect) {
    if (!dotsWrap) return;
    dotsWrap.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') {
        return;
      }
      var dots = dotsWrap.querySelectorAll(dotSelector);
      if (!dots.length) return;
      var cur = typeof getCurIdx === 'function' ?
        getCurIdx() :
        Array.prototype.indexOf.call(dots, document.activeElement);
      if (cur < 0) return;

      e.preventDefault();
      var nextIdx = cur;
      if (key === 'ArrowRight') nextIdx = (cur + 1) % dots.length;
      else if (key === 'ArrowLeft') nextIdx = (cur - 1 + dots.length) % dots.length;
      else if (key === 'Home') nextIdx = 0;
      else if (key === 'End') nextIdx = dots.length - 1;
      onSelect(nextIdx);
      if (dots[nextIdx]) dots[nextIdx].focus();
    });
  }

  function bindCarouselArrowsKey(carousel, dotsWrap, onPrev, onNext) {
    if (!carousel) return;
    carousel.addEventListener('keydown', function (e) {
      if (dotsWrap && dotsWrap.contains(e.target)) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
    });
  }

  function createSvgUse(iconId, className) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var use = document.createElementNS(SVG_NS, 'use');
    use.setAttribute('href', '#' + iconId);
    svg.appendChild(use);
    return svg;
  }

  function createArrowSvg(className) {
    var svg = createSvgUse('td-icon-arrow', className);
    svg.setAttribute('viewBox', '0 0 20 20');
    return svg;
  }

  function bindLazyImageReady(img, container, onFallback) {
    var settled = false;

    function finishLoaded() {
      if (settled) return;
      settled = true;
      container.classList.add('is-loaded');
      container.classList.remove('is-fallback');
    }

    function finishFallback() {
      if (settled) return;
      settled = true;
      if (typeof onFallback === 'function') {
        onFallback();
      } else {
        container.classList.add('is-fallback');
        container.classList.remove('is-loaded');
      }
    }

    function handleLoad() {
      if (settled) return;
      if (img.naturalWidth <= 0) {
        finishFallback();
        return;
      }
      if (typeof img.decode === 'function') {
        img.decode().then(
          function () {
            if (!prefersReducedMotion() && typeof window.requestAnimationFrame === 'function') {
              window.requestAnimationFrame(finishLoaded);
            } else {
              finishLoaded();
            }
          },
          finishLoaded
        );
      } else {
        finishLoaded();
      }
    }

    img.addEventListener('load', handleLoad, {
      once: true
    });
    img.addEventListener('error', finishFallback, {
      once: true
    });

    if (img.complete && img.naturalWidth > 0) {
      finishLoaded();
    } else if (img.complete && img.isConnected && img.currentSrc) {
      finishFallback();
    }
  }

  function initHeroImageReady() {
    var media = document.querySelector('.hero__media');
    var img = media ? media.querySelector('.hero__img') : null;
    if (!media || !img || img.dataset.heroImgBound) return;
    img.dataset.heroImgBound = '1';

    /* Do not hide hero LCP image while JS modules load; only track ready/fallback state */
    bindLazyImageReady(img, media, function () {
      media.classList.remove('is-loaded');
      media.classList.add('is-fallback');
    });
  }

  function initFooterLogoReady() {
    var logos = document.querySelectorAll('.site-footer__logo-img');
    for (var i = 0; i < logos.length; i++) {
      var img = logos[i];
      if (img.dataset.footerImgBound) continue;
      img.dataset.footerImgBound = '1';
      bindLazyImageReady(img, img);
    }
  }

  /* ------------------------------------------------------------------------
     1. Services Cards (#services-grid)
     ------------------------------------------------------------------------ */
  function createServiceMedia(svc) {
    var wrap = document.createElement('div');
    wrap.className = 'service-card__media';

    var fallback = document.createElement('div');
    fallback.className = 'service-card__fallback';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.appendChild(createSvgUse(svc.icon, 'service-card__icon'));
    wrap.appendChild(fallback);

    function markFallback() {
      wrap.classList.add('is-fallback');
      wrap.classList.remove('is-loaded');
    }

    if (svc.iconImg) {
      var basePath = svc.iconImg.indexOf('/') === -1 ?
        'img/services/' + svc.iconImg :
        svc.iconImg;
      var pic = document.createElement('picture');
      pic.className = 'service-card__picture';

      var img = document.createElement('img');
      img.className = 'service-card__img';
      img.src = basePath + '.png';
      img.width = 160;
      img.height = 160;
      img.decoding = 'async';
      img.alt = '';

      pic.appendChild(img);
      wrap.appendChild(pic);

      bindLazyImageReady(img, wrap, markFallback);
    } else {
      markFallback();
    }

    return wrap;
  }

  var lastAddedServiceTitle = '';
  var expandedServiceIds = Object.create(null);

  function syncServiceCardsWithCalculator(addedTitle) {
    if (typeof addedTitle === 'string') {
      lastAddedServiceTitle = addedTitle;
    }

    var cards = document.querySelectorAll('#services-grid .service-card');
    var isCalcReady = Boolean(
      TD.calculator && typeof TD.calculator.isItemSelected === 'function'
    );

    for (var i = 0; i < cards.length; i++) {
      var card = cards[i];
      var calcItemId = card.getAttribute('data-calc-item-id');
      if (!calcItemId) continue;

      var serviceId = card.getAttribute('data-service-id');
      var svc =
        typeof TD.findServiceById === 'function' ?
          TD.findServiceById(serviceId) :
          null;
      var svcTitle = svc && svc.title ? svc.title : '';
      var isSelected = isCalcReady && TD.calculator.isItemSelected(calcItemId);

      card.classList.toggle('is-selected', isSelected);

      var btn = card.querySelector('.service-card__add-to-calc[data-calc-item-id]');
      if (btn) {
        btn.classList.toggle('is-selected', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.setAttribute(
          'aria-label',
          isSelected ?
            'Послугу «' + svcTitle + '» вже додано до попереднього розрахунку' :
            'Додати послугу «' + svcTitle + '» до попереднього розрахунку'
        );

        var iconEl = btn.querySelector('.service-card__add-icon');
        var labelEl = btn.querySelector('.service-card__add-label');
        if (iconEl) iconEl.textContent = isSelected ? '✓' : '+';
        if (labelEl) labelEl.textContent = isSelected ? 'Вибрано' : 'Додати до розрахунку';
      }
    }

    var bar = document.getElementById('services-calc-bar');
    var statusEl = document.getElementById('services-calc-status');
    if (!bar || !statusEl) return;

    var selection =
      TD.calculator && typeof TD.calculator.getSelection === 'function' ?
        TD.calculator.getSelection() :
        TD.state && TD.state.calcSelection ?
          TD.state.calcSelection :
          null;

    var count = selection && Array.isArray(selection.items) ? selection.items.length : 0;
    if (count > 0) {
      bar.classList.add('is-active');
      var word =
        typeof TD.pluralizeUk === 'function' ?
          TD.pluralizeUk(count, 'послуга', 'послуги', 'послуг') :
          'послуг';
      var prefixText = lastAddedServiceTitle ?
        'Послугу «' + lastAddedServiceTitle + '» додано до розрахунку · ' :
        'У попередньому розрахунку: ';
      statusEl.textContent =
        prefixText + count + '\u00A0' + word + ' на суму ' + selection.formattedTotal;
    } else {
      lastAddedServiceTitle = '';
      bar.classList.remove('is-active');
      statusEl.textContent =
        'Оберіть потрібні послуги на картках вище, щоб додати їх до попереднього розрахунку вартості.';
    }
  }

  function renderServices() {
    var container = document.getElementById('services-grid');
    if (!container || !Array.isArray(TD.SERVICES)) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < TD.SERVICES.length; i++) {
      var svc = TD.SERVICES[i];
      var calcItem =
        svc.calcItemId && typeof TD.findCalcItemById === 'function' ?
          TD.findCalcItemById(svc.calcItemId) :
          null;

      var card = createEl('article', 'service-card');
      card.setAttribute('data-service-id', svc.id);
      if (calcItem) {
        card.setAttribute('data-calc-item-id', calcItem.id);
      }

      var title = createEl('h3', 'service-card__title', svc.title);
      var desc = createEl('p', 'service-card__desc', svc.description);
      var footer = createEl('div', 'service-card__footer');
      var priceWrap = createEl('div', 'service-card__price-wrap');

      if (calcItem) {
        priceWrap.appendChild(createEl('span', 'service-card__price', TD.formatPrice(calcItem.price, calcItem.prefix, 'грн')));
        if (calcItem.note) {
          priceWrap.appendChild(createEl('span', 'service-card__price-meta', calcItem.note));
        }
      } else {
        priceWrap.appendChild(createEl('span', 'service-card__price service-card__price--consult', 'Уточнити вартість'));
        priceWrap.appendChild(createEl('span', 'service-card__price-meta service-card__price-note', 'індивідуально після огляду'));
      }

      /* Expandable block: "Що входить у вартість" */
      var isIncludesOpen = Boolean(expandedServiceIds[svc.id]);
      var includesWrap = createEl('div', 'service-card__includes' + (isIncludesOpen ? ' is-open' : ''));

      var panelId = 'service-includes-' + svc.id;
      var includesBtn = createEl('button', 'service-card__includes-btn');
      includesBtn.type = 'button';
      includesBtn.setAttribute('data-service-includes-toggle', svc.id);
      includesBtn.setAttribute('aria-expanded', isIncludesOpen ? 'true' : 'false');
      includesBtn.setAttribute('aria-controls', panelId);

      var includesLabel = createEl('span', 'service-card__includes-label', 'Що входить у вартість');

      var includesIcon = createSvgUse('td-icon-chevron-right', 'service-card__includes-icon');
      includesIcon.setAttribute('viewBox', '0 0 20 20');

      includesBtn.appendChild(includesLabel);
      includesBtn.appendChild(includesIcon);

      var includesPanel = createEl('div', 'service-card__includes-panel');
      includesPanel.id = panelId;
      includesPanel.setAttribute('role', 'region');
      includesPanel.setAttribute('aria-label', 'Що входить у вартість: ' + svc.title);
      includesPanel.setAttribute('aria-hidden', isIncludesOpen ? 'false' : 'true');

      var includesInner = createEl('div', 'service-card__includes-inner');

      if (Array.isArray(svc.includedItems) && svc.includedItems.length > 0) {
        var includesList = createEl('ul', 'service-card__includes-list');
        for (var m = 0; m < svc.includedItems.length; m++) {
          includesList.appendChild(createEl('li', 'service-card__includes-item', svc.includedItems[m]));
        }
        includesInner.appendChild(includesList);
      } else {
        includesInner.appendChild(createEl('p', 'service-card__includes-note', svc.includedFallback || 'Склад послуги уточнюється лікарем після огляду.'));
      }

      includesPanel.appendChild(includesInner);
      includesWrap.appendChild(includesBtn);
      includesWrap.appendChild(includesPanel);

      var actionBtn = createEl('button', 'service-card__add-to-calc');
      actionBtn.type = 'button';
      actionBtn.setAttribute('data-service-id', svc.id);

      var iconSpan = createEl('span', 'service-card__add-icon');
      iconSpan.setAttribute('aria-hidden', 'true');

      var labelSpan = createEl('span', 'service-card__add-label');

      if (calcItem) {
        actionBtn.setAttribute('data-calc-item-id', calcItem.id);
        actionBtn.setAttribute('aria-pressed', 'false');
        actionBtn.setAttribute(
          'aria-label',
          'Додати послугу «' + svc.title + '» до попереднього розрахунку'
        );
        iconSpan.textContent = '+';
        labelSpan.textContent = 'Додати до розрахунку';
      } else {
        actionBtn.classList.add('service-card__add-to-calc--consult');
        actionBtn.setAttribute('data-service-consult', svc.id);
        actionBtn.setAttribute(
          'aria-label',
          'Уточнити вартість послуги «' + svc.title + '» — перейти до форми запису'
        );
        iconSpan.textContent = '→';
        labelSpan.textContent = 'Уточнити вартість';
      }

      actionBtn.appendChild(iconSpan);
      actionBtn.appendChild(labelSpan);

      footer.appendChild(priceWrap);
      footer.appendChild(includesWrap);
      footer.appendChild(actionBtn);

      card.appendChild(createServiceMedia(svc));
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(footer);
      frag.appendChild(card);
    }

    container.textContent = '';
    container.appendChild(frag);
    syncServiceCardsWithCalculator(null);

    var servicesSection = document.getElementById('services');
    var bindRoot = servicesSection || container;

    if (!bindRoot.dataset.serviceCalcBound) {
      bindRoot.dataset.serviceCalcBound = '1';
      bindRoot.addEventListener('click', function (e) {
        var includesToggle = e.target.closest('[data-service-includes-toggle]');
        if (includesToggle) {
          var toggleSvcId = includesToggle.getAttribute('data-service-includes-toggle');
          var wrapEl = includesToggle.closest('.service-card__includes');
          var panelEl = toggleSvcId ?
            document.getElementById('service-includes-' + toggleSvcId) :
            null;
          if (toggleSvcId && wrapEl) {
            var nextOpen = !wrapEl.classList.contains('is-open');
            expandedServiceIds[toggleSvcId] = nextOpen;
            wrapEl.classList.toggle('is-open', nextOpen);
            includesToggle.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
            if (panelEl) {
              panelEl.setAttribute('aria-hidden', nextOpen ? 'false' : 'true');
            }
          }
          return;
        }

        var addBtn = e.target.closest('.service-card__add-to-calc[data-calc-item-id]');
        if (addBtn && !addBtn.disabled) {
          var calcId = addBtn.getAttribute('data-calc-item-id');
          var svcId = addBtn.getAttribute('data-service-id');
          var svcObj =
            typeof TD.findServiceById === 'function' ? TD.findServiceById(svcId) : null;
          if (calcId && TD.calculator && typeof TD.calculator.addItem === 'function') {
            lastAddedServiceTitle = svcObj && svcObj.title ? svcObj.title : '';
            TD.calculator.addItem(calcId);
            syncServiceCardsWithCalculator(lastAddedServiceTitle);
          }
          return;
        }

        var consultBtn = e.target.closest('.service-card__add-to-calc[data-service-consult]');
        if (consultBtn && !consultBtn.disabled) {
          var consultSvcId = consultBtn.getAttribute('data-service-consult');
          var serviceSelect = document.getElementById('appointment-service');
          if (serviceSelect && consultSvcId) {
            for (var o = 0; o < serviceSelect.options.length; o++) {
              if (serviceSelect.options[o].value === consultSvcId) {
                serviceSelect.value = consultSvcId;
                break;
              }
            }
          }
          scrollToTarget(document.getElementById('contacts'));
          focusContactsTarget('form');
          return;
        }

        var jumpBtn = e.target.closest('[data-calc-jump]');
        if (jumpBtn) {
          scrollToTarget(document.getElementById('calculator'));
          var calcHeading = document.getElementById('heading-calculator');
          if (calcHeading && typeof calcHeading.focus === 'function') {
            calcHeading.setAttribute('tabindex', '-1');
            calcHeading.focus({
              preventScroll: true
            });
          }
        }
      });
    }

    if (!document.body.dataset.tdServiceCalcSyncBound) {
      document.body.dataset.tdServiceCalcSyncBound = '1';
      document.addEventListener('td:calc-change', function () {
        syncServiceCardsWithCalculator();
      });
    }
  }

  /* ------------------------------------------------------------------------
     2. Doctor Media Fallbacks
     ------------------------------------------------------------------------ */
  function initDoctorMediaFallbacks() {
    var images = document.querySelectorAll('.doctor-card__img');
    for (var i = 0; i < images.length; i++) {
      (function (img) {
        var wrap = img.closest('.doctor-card__media');
        if (!wrap) return;

        if (img.dataset.doctorBound) return;
        img.dataset.doctorBound = '1';

        bindLazyImageReady(img, wrap);
      })(images[i]);
    }
  }

  /* ------------------------------------------------------------------------
     4. Clinical Works Carousel (#works-carousel, #works-track, #work-modal)
     ------------------------------------------------------------------------ */
  var worksCarouselState = {
    currentIndex: 0,
    totalSlides: 0
  };

  function findWorkById(id) {
    if (!id || !Array.isArray(TD.WORKS)) return null;
    for (var i = 0; i < TD.WORKS.length; i++) {
      if (TD.WORKS[i].id === id) return TD.WORKS[i];
    }
    return null;
  }

  function createWorkFigure(item, kind, isEager) {
    var fig = document.createElement('figure');
    fig.className = 'work-slide__figure work-card__figure';

    var slot = document.createElement('div');
    slot.className = 'work-slide__media work-card__slot';

    var src = '';
    var fallbackSrc = '';
    var altText = '';
    var captionLabel = '';
    var iconId = 'td-work-before';
    var hintLabel = '';

    if (kind === 'before') {
      src = item.beforeImage || '';
      fallbackSrc = item.beforeFallback || '';
      altText = item.beforeAlt || ('Стан до лікування: ' + item.title);
      captionLabel = 'До';
      iconId = 'td-work-before';
      hintLabel = 'Фото «до»';
    } else {
      src = item.afterImage || '';
      fallbackSrc = item.afterFallback || '';
      altText = item.afterAlt || ('Стан після лікування: ' + item.title);
      captionLabel = 'Після';
      iconId = 'td-work-after';
      hintLabel = 'Фото «після»';
    }

    var fallback = createEl('div', 'work-card__fallback');
    fallback.setAttribute('aria-hidden', 'true');
    fallback.appendChild(createSvgUse(iconId, 'work-card__fallback-svg'));
    fallback.appendChild(createEl('span', 'work-card__fallback-label', hintLabel));
    slot.appendChild(fallback);

    var useRealImage = item.status !== 'placeholder' && Boolean(src);

    if (useRealImage) {
      var pic = document.createElement('picture');
      pic.className = 'work-card__picture';

      var isWebp = /\.webp(?:\?.*)?$/i.test(src);
      if (isWebp && fallbackSrc) {
        var source = document.createElement('source');
        source.type = 'image/webp';
        source.srcset = src;
        pic.appendChild(source);
      }

      var img = document.createElement('img');
      img.className = 'work-card__img';
      img.src = (isWebp && fallbackSrc) ? fallbackSrc : src;
      img.width = 720;
      img.height = 540;
      img.loading = isEager ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.alt = altText;

      pic.appendChild(img);
      slot.appendChild(pic);

      bindLazyImageReady(img, slot);
    } else {
      slot.classList.add('is-fallback');
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', altText + ' (нейтральний макет прикладу)');
    }

    var caption = document.createElement('figcaption');
    caption.className =
      'work-slide__caption work-card__caption' + (kind === 'after' ? ' is-after' : '');
    caption.textContent = captionLabel;

    fig.appendChild(slot);
    fig.appendChild(caption);
    return fig;
  }

  function createWorkSlide(item, index, total) {
    var slide = document.createElement('article');
    slide.id = 'work-slide-' + item.id;
    slide.className = 'work-slide work-card';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute('aria-label', (index + 1) + ' із ' + total + ': ' + item.title);
    slide.setAttribute('data-work-id', item.id);
    slide.setAttribute('data-category', item.category || '');
    slide.setAttribute('data-slide-index', String(index));

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'work-slide__trigger work-card__trigger';
    trigger.setAttribute('data-work-open', item.id);
    trigger.setAttribute(
      'aria-label',
      'Відкрити порівняння «До і Після» у збільшеному вигляді: ' + item.title
    );

    var isFirst = index === 0;
    var comp = document.createElement('div');
    comp.className = 'work-slide__comparison work-card__comparison';
    comp.appendChild(createWorkFigure(item, 'before', isFirst));
    comp.appendChild(createWorkFigure(item, 'after', isFirst));
    trigger.appendChild(comp);

    var content = createEl('div', 'work-slide__content work-card__body');
    var info = createEl('div', 'work-slide__info');
    var meta = createEl('div', 'work-slide__meta');

    meta.appendChild(createEl('span', 'work-slide__category work-card__category', item.categoryLabel || 'Клінічний приклад'));
    meta.appendChild(createEl('span', 'work-slide__step', 'Приклад ' + (index + 1) + ' із ' + total));

    info.appendChild(meta);
    info.appendChild(createEl('h3', 'work-slide__title work-card__title', item.title));
    info.appendChild(createEl('p', 'work-slide__description work-card__description', item.description));

    var ctaBtn = createEl('button', 'btn btn--outline work-slide__open work-card__link');
    ctaBtn.type = 'button';
    ctaBtn.setAttribute('data-work-open', item.id);
    ctaBtn.setAttribute('aria-label', 'Переглянути приклад детальніше: ' + item.title);
    ctaBtn.appendChild(createEl('span', null, 'Переглянути приклад'));
    ctaBtn.appendChild(createArrowSvg('btn__arrow'));

    content.appendChild(info);
    content.appendChild(ctaBtn);

    slide.appendChild(trigger);
    slide.appendChild(content);
    return slide;
  }

  function syncWorksCarouselUI() {
    var track = document.getElementById('works-track');
    var dotsWrap = document.getElementById('works-dots');
    var counterEl = document.getElementById('works-counter');
    var prevBtn = document.getElementById('works-prev');
    var nextBtn = document.getElementById('works-next');
    if (!track) return;

    var total = worksCarouselState.totalSlides;
    var idx = worksCarouselState.currentIndex;
    if (total <= 0) return;

    track.style.transform = 'translate3d(' + (-idx * 100) + '%, 0, 0)';

    var slides = track.querySelectorAll('.work-slide');
    for (var i = 0; i < slides.length; i++) {
      setSlideInteractivity(slides[i], i === idx);
    }

    syncTabDotsState(dotsWrap, '.works-carousel__dot', idx);

    if (counterEl) {
      counterEl.textContent = (idx + 1) + ' / ' + total;
    }

    var disableNav = total <= 1;
    if (prevBtn) prevBtn.disabled = disableNav;
    if (nextBtn) nextBtn.disabled = disableNav;
  }

  function goToWorkSlide(targetIndex) {
    var total = worksCarouselState.totalSlides;
    if (total <= 0) return;
    var normalized = ((targetIndex % total) + total) % total;
    worksCarouselState.currentIndex = normalized;
    syncWorksCarouselUI();
  }

  function renderWorksCarousel() {
    var carousel = document.getElementById('works-carousel');
    var viewport = document.getElementById('works-viewport');
    var track = document.getElementById('works-track');
    var dotsWrap = document.getElementById('works-dots');
    var prevBtn = document.getElementById('works-prev');
    var nextBtn = document.getElementById('works-next');
    if (!track || !Array.isArray(TD.WORKS)) return;

    var list = TD.WORKS.slice(0, 3);
    worksCarouselState.totalSlides = list.length;
    if (worksCarouselState.currentIndex >= list.length) {
      worksCarouselState.currentIndex = 0;
    }

    var trackFrag = document.createDocumentFragment();
    var dotsFrag = document.createDocumentFragment();

    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      trackFrag.appendChild(createWorkSlide(item, i, list.length));

      if (dotsWrap) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.id = 'works-dot-' + i;
        dot.className = 'works-carousel__dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('data-work-dot', String(i));
        dot.setAttribute('aria-controls', 'work-slide-' + item.id);
        dot.setAttribute('aria-selected', i === worksCarouselState.currentIndex ? 'true' : 'false');
        dot.setAttribute(
          'aria-label',
          'Приклад ' + (i + 1) + ': ' + (item.categoryLabel ? item.categoryLabel + ' — ' : '') + item.title
        );
        dotsFrag.appendChild(dot);
      }
    }

    track.textContent = '';
    track.appendChild(trackFrag);

    if (dotsWrap) {
      dotsWrap.textContent = '';
      dotsWrap.appendChild(dotsFrag);
    }

    syncWorksCarouselUI();

    if (prevBtn && !prevBtn.dataset.worksPrevBound) {
      prevBtn.dataset.worksPrevBound = '1';
      prevBtn.addEventListener('click', function () {
        goToWorkSlide(worksCarouselState.currentIndex - 1);
      });
    }

    if (nextBtn && !nextBtn.dataset.worksNextBound) {
      nextBtn.dataset.worksNextBound = '1';
      nextBtn.addEventListener('click', function () {
        goToWorkSlide(worksCarouselState.currentIndex + 1);
      });
    }

    if (dotsWrap && !dotsWrap.dataset.worksDotsBound) {
      dotsWrap.dataset.worksDotsBound = '1';
      dotsWrap.addEventListener('click', function (e) {
        var dotBtn = e.target.closest('[data-work-dot]');
        if (!dotBtn) return;
        var idx = parseInt(dotBtn.getAttribute('data-work-dot'), 10);
        if (!isNaN(idx)) {
          goToWorkSlide(idx);
        }
      });

      bindTablistKeyNav(
        dotsWrap,
        '.works-carousel__dot',
        function () {
          return worksCarouselState.currentIndex;
        },
        goToWorkSlide
      );
    }

    if (carousel && !carousel.dataset.worksKeyBound) {
      carousel.dataset.worksKeyBound = '1';
      bindCarouselArrowsKey(
        carousel,
        dotsWrap,
        function () {
          goToWorkSlide(worksCarouselState.currentIndex - 1);
        },
        function () {
          goToWorkSlide(worksCarouselState.currentIndex + 1);
        }
      );
    }

    if (viewport) {
      bindHorizontalSwipe(
        viewport,
        function () {
          goToWorkSlide(worksCarouselState.currentIndex + 1);
        },
        function () {
          goToWorkSlide(worksCarouselState.currentIndex - 1);
        }
      );
    }

    if (!track.dataset.workModalBound) {
      track.dataset.workModalBound = '1';
      track.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-work-open]');
        if (!trigger) return;
        var workId = trigger.getAttribute('data-work-open');
        if (workId) {
          openWorkModal(workId, trigger);
        }
      });
    }
  }

  /* ------------------------------------------------------------------------
     5. Shared Lightbox Helpers & Works Detail Modal (#work-modal)
     ------------------------------------------------------------------------ */
  function setModalBackgroundInert(state) {
    var targets = [
      document.querySelector('.skip-link'),
      document.getElementById('site-header'),
      document.getElementById('main-content'),
      document.getElementById('site-footer')
    ];
    for (var i = 0; i < targets.length; i++) {
      if (targets[i]) targets[i].inert = state;
    }
    if (state) {
      var mobileBar = document.getElementById('mobile-action-bar');
      if (mobileBar) mobileBar.inert = true;
    }
  }

  function getModalFocusable(dialog) {
    var sel = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    var nodes = dialog.querySelectorAll(sel);
    var visible = [];
    for (var i = 0; i < nodes.length; i++) {
      if (!nodes[i].hasAttribute('hidden') && nodes[i].offsetParent !== null) {
        visible.push(nodes[i]);
      }
    }
    return visible;
  }

  function handleLightboxKeyDown(e, cfg) {
    var modal = document.getElementById(cfg.modalId);
    if (!modal || modal.hidden) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      cfg.close(true);
      return;
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      cfg.step(-1);
      return;
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      cfg.step(1);
      return;
    }
    if (e.key === 'Tab') {
      var dialog = modal.querySelector(cfg.dialogSelector);
      if (!dialog) return;
      var focusable = getModalFocusable(dialog);
      if (!focusable.length) {
        e.preventDefault();
        return;
      }
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first || !dialog.contains(document.activeElement)) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last || !dialog.contains(document.activeElement)) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  function openLightboxModal(cfg, triggerEl, renderFn) {
    var modal = document.getElementById(cfg.modalId);
    if (!modal) return;
    var ctrl = lightboxControllers[cfg.stateKey];

    if (ctrl.closeTimer) {
      window.clearTimeout(ctrl.closeTimer);
      ctrl.closeTimer = null;
    }

    var sibling = cfg.siblingId ? document.getElementById(cfg.siblingId) : null;
    if (sibling && !sibling.hidden && typeof cfg.closeSibling === 'function') {
      cfg.closeSibling(false);
    }

    ctrl.lastTrigger = triggerEl || document.activeElement;
    if (typeof renderFn === 'function') {
      renderFn();
    }

    modal.hidden = false;
    document.documentElement.classList.add('is-modal-open');
    setModalBackgroundInert(true);
    if (TD.header && typeof TD.header.syncMobileActionBar === 'function') {
      TD.header.syncMobileActionBar();
    }

    window.requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var closeBtn = document.getElementById(cfg.closeId);
      var dialog = modal.querySelector(cfg.dialogSelector);
      if (closeBtn) {
        closeBtn.focus({
          preventScroll: true
        });
      } else if (dialog) {
        dialog.focus({
          preventScroll: true
        });
      }
    });

    document.addEventListener('keydown', cfg.onKeyDown);
  }

  function closeLightboxModal(cfg, restoreFocus) {
    var modal = document.getElementById(cfg.modalId);
    if (!modal || modal.hidden) return;
    var ctrl = lightboxControllers[cfg.stateKey];

    modal.classList.remove('is-open');
    document.documentElement.classList.remove('is-modal-open');
    setModalBackgroundInert(false);
    if (TD.header && typeof TD.header.syncMobileActionBar === 'function') {
      TD.header.syncMobileActionBar();
    }
    document.removeEventListener('keydown', cfg.onKeyDown);

    var hideAfter = prefersReducedMotion() ? 0 : 220;
    ctrl.closeTimer = window.setTimeout(function () {
      if (!modal.classList.contains('is-open')) {
        modal.hidden = true;
      }
      ctrl.closeTimer = null;
    }, hideAfter);

    if (restoreFocus && ctrl.lastTrigger && typeof ctrl.lastTrigger.focus === 'function') {
      ctrl.lastTrigger.focus({
        preventScroll: true
      });
    }
    ctrl.lastTrigger = null;
    if (typeof cfg.onClose === 'function') {
      cfg.onClose();
    }
  }

  function bindLightboxControls(cfg) {
    var modal = document.getElementById(cfg.modalId);
    if (!modal || modal.dataset[cfg.boundAttr]) return false;
    modal.dataset[cfg.boundAttr] = '1';

    var backdrop = document.getElementById(cfg.backdropId);
    var closeBtn = document.getElementById(cfg.closeId);
    var prevBtn = document.getElementById(cfg.prevId);
    var nextBtn = document.getElementById(cfg.nextId);

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        cfg.close(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        cfg.close(true);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        cfg.step(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        cfg.step(1);
      });
    }
    return true;
  }

  function getModalList() {
    return Array.isArray(TD.WORKS) ? TD.WORKS.slice(0, 3) : [];
  }

  function renderWorkModalContent(item) {
    var catEl = document.getElementById('work-modal-category');
    var titleEl = document.getElementById('work-modal-title');
    var descEl = document.getElementById('work-modal-desc');
    var mediaEl = document.getElementById('work-modal-media');
    var noteEl = document.getElementById('work-modal-note');
    var counterEl = document.getElementById('work-modal-counter');
    var prevBtn = document.getElementById('work-modal-prev');
    var nextBtn = document.getElementById('work-modal-next');

    if (catEl) catEl.textContent = item.categoryLabel || 'Клінічний приклад';
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;

    if (mediaEl) {
      var frag = document.createDocumentFragment();
      frag.appendChild(createWorkFigure(item, 'before', true));
      frag.appendChild(createWorkFigure(item, 'after', true));
      mediaEl.textContent = '';
      mediaEl.appendChild(frag);
    }

    if (noteEl) {
      noteEl.textContent = item.note || '';
      noteEl.hidden = !item.note;
    }

    var list = getModalList();
    var idx = -1;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === item.id) {
        idx = i;
        break;
      }
    }
    var disableNav = list.length <= 1;
    if (prevBtn) prevBtn.disabled = disableNav;
    if (nextBtn) nextBtn.disabled = disableNav;
    if (counterEl) {
      counterEl.textContent = idx >= 0 ? (idx + 1) + ' / ' + list.length : '';
    }
  }

  function stepWorkModal(delta) {
    var list = getModalList();
    if (list.length <= 1) return;
    var idx = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === activeModalWorkId) {
        idx = i;
        break;
      }
    }
    var nextIdx = (idx + delta + list.length) % list.length;
    var nextItem = list[nextIdx];
    activeModalWorkId = nextItem.id;
    goToWorkSlide(nextIdx);
    renderWorkModalContent(nextItem);
  }

  var WORK_MODAL_CFG = {
    modalId: 'work-modal',
    siblingId: 'gallery-modal',
    closeSibling: function (restore) {
      closeGalleryModal(restore);
    },
    closeId: 'work-modal-close',
    backdropId: 'work-modal-backdrop',
    prevId: 'work-modal-prev',
    nextId: 'work-modal-next',
    dialogSelector: '.work-modal__dialog',
    stateKey: 'work',
    boundAttr: 'modalBound',
    step: stepWorkModal,
    close: closeWorkModal,
    onKeyDown: onWorkModalKeyDown,
    onClose: function () {
      activeModalWorkId = null;
    }
  };

  function onWorkModalKeyDown(e) {
    handleLightboxKeyDown(e, WORK_MODAL_CFG);
  }

  function openWorkModal(workId, triggerEl) {
    var item = findWorkById(workId);
    if (!item) return;
    openLightboxModal(WORK_MODAL_CFG, triggerEl, function () {
      activeModalWorkId = item.id;
      renderWorkModalContent(item);
    });
  }

  function closeWorkModal(restoreFocus) {
    closeLightboxModal(WORK_MODAL_CFG, restoreFocus);
  }

  function bindWorkModal() {
    if (!bindLightboxControls(WORK_MODAL_CFG)) return;
    var ctaLink = document.getElementById('work-modal-cta');
    if (ctaLink) {
      ctaLink.addEventListener('click', function () {
        closeWorkModal(false);
      });
    }
  }

  /* ------------------------------------------------------------------------
     5b. Clinic Photo Gallery (#gallery, #gallery-modal)
     ------------------------------------------------------------------------ */
  var GALLERY_GROUP_META = {
    inside: {
      label: 'Всередині',
      fallbackIcon: 'td-gallery-inside',
      fallbackLabel: 'Фото інтер’єру'
    },
    outside: {
      label: 'Зовні',
      fallbackIcon: 'td-gallery-outside',
      fallbackLabel: 'Фото фасаду'
    }
  };

  function getGalleryGroupItems(group) {
    if (!TD.GALLERY || !Array.isArray(TD.GALLERY[group])) return [];
    return TD.GALLERY[group];
  }

  function findGalleryItemById(group, id) {
    var list = getGalleryGroupItems(group);
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === id) return list[i];
    }
    return null;
  }

  function getGalleryPerView(total) {
    if (total <= 1) return 1;
    var w = window.innerWidth || document.documentElement.clientWidth || 1280;
    if (w < 640) return 1;
    if (w < 980) return Math.min(2, total);
    return Math.min(3, total);
  }

  function createGalleryMediaNode(item, group, index, total, isModal) {
    var meta = GALLERY_GROUP_META[group] || GALLERY_GROUP_META.inside;
    var wrap = createEl('div', isModal ? 'gallery-modal__frame' : 'gallery-card__media');
    var fallback = createEl('div', 'gallery-card__fallback');
    fallback.setAttribute('aria-hidden', 'true');
    fallback.appendChild(createSvgUse(meta.fallbackIcon, 'gallery-card__fallback-svg'));
    fallback.appendChild(createEl('span', 'gallery-card__fallback-label', meta.fallbackLabel));
    wrap.appendChild(fallback);

    var useReal = item.status !== 'placeholder' && Boolean(item.src);
    var w = item.width || 1200;
    var h = item.height || 900;
    var sizesStr = isModal ?
      '(max-width: 767px) 94vw, 860px' :
      item.sizes || '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw';
    var placeholderUrl = item.placeholderSrc || ('img/gallery/' + group + '-01.svg');

    var pic = document.createElement('picture');
    pic.className = isModal ? 'gallery-modal__picture' : 'gallery-card__picture';

    if (useReal && item.srcSet) {
      var source = document.createElement('source');
      source.type = 'image/webp';
      source.srcset = item.srcSet;
      source.sizes = sizesStr;
      pic.appendChild(source);
    }

    var img = document.createElement('img');
    img.className = isModal ? 'gallery-modal__img' : 'gallery-card__img';
    img.width = w;
    img.height = h;
    img.loading = isModal ? 'eager' : 'lazy';
    img.decoding = 'async';
    img.sizes = sizesStr;
    img.src = useReal ? item.src : placeholderUrl;
    img.srcset = useReal ? (item.srcSet || item.src + ' ' + w + 'w') : placeholderUrl + ' ' + w + 'w';
    img.alt = isModal ?
      item.alt || (meta.fallbackLabel + ' (' + (index + 1) + ' з ' + total + ')') :
      item.alt || '';

    pic.appendChild(img);
    wrap.appendChild(pic);

    bindLazyImageReady(img, wrap);

    return wrap;
  }

  function renderGalleryDots(group, positionsCount) {
    var dotsWrap = document.getElementById('gallery-dots-' + group);
    if (!dotsWrap) return;

    var meta = GALLERY_GROUP_META[group] || GALLERY_GROUP_META.inside;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < positionsCount; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.id = 'gallery-' + group + '-dot-' + i;
      dot.className = 'gallery-carousel__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('data-gallery-dot', String(i));
      dot.setAttribute('aria-controls', 'gallery-track-' + group);
      dot.setAttribute(
        'aria-label',
        meta.label + ': позиція ' + (i + 1) + ' з ' + positionsCount
      );
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.tabIndex = i === 0 ? 0 : -1;
      frag.appendChild(dot);
    }

    dotsWrap.textContent = '';
    dotsWrap.appendChild(frag);
    dotsWrap.hidden = positionsCount <= 1;
  }

  function syncGalleryCarouselUI(group, instant) {
    var track = document.getElementById('gallery-track-' + group);
    var dotsWrap = document.getElementById('gallery-dots-' + group);
    var counterEl = document.getElementById('gallery-counter-' + group);
    var prevBtn = document.getElementById('gallery-prev-' + group);
    var nextBtn = document.getElementById('gallery-next-' + group);
    var state = galleryGroupsState[group];
    if (!track || !state) return;

    var total = track.children.length;
    state.totalSlides = total;
    if (total <= 0) return;

    var perView = getGalleryPerView(total);
    state.perView = perView;
    track.style.setProperty('--gallery-per-view', String(perView));

    var maxIndex = Math.max(0, total - perView);
    state.maxIndex = maxIndex;
    if (state.currentIndex > maxIndex) {
      state.currentIndex = maxIndex;
    }

    var positionsCount = maxIndex + 1;
    var idx = state.currentIndex;

    if (dotsWrap && dotsWrap.children.length !== positionsCount) {
      renderGalleryDots(group, positionsCount);
    }

    var cards = track.children;
    var offsetPx = idx > 0 && idx < cards.length ? cards[idx].offsetLeft : 0;
    var nextTransform = offsetPx > 0 ? 'translate3d(-' + offsetPx + 'px, 0, 0)' : 'translate3d(0, 0, 0)';

    applyTrackTransform(track, nextTransform, instant);

    for (var i = 0; i < cards.length; i++) {
      var isActive = i >= idx && i < idx + perView;
      setSlideInteractivity(cards[i], isActive);
      if (isActive) {
        var revealCard = cards[i].querySelector('.gallery-card.td-reveal-pending');
        if (revealCard) {
          revealCard.classList.remove('td-reveal-pending', 'is-revealing');
          revealCard.classList.add('is-visible', 'is-revealed');
        }
        if (!instant) {
          var lazyImgs = cards[i].querySelectorAll('img[loading="lazy"]');
          for (var m = 0; m < lazyImgs.length; m++) {
            lazyImgs[m].loading = 'eager';
          }
        }
      }
    }

    syncTabDotsState(dotsWrap, '.gallery-carousel__dot', idx);

    if (counterEl) {
      counterEl.textContent = (idx + 1) + ' / ' + positionsCount;
    }

    var disableNav = maxIndex <= 0;
    if (prevBtn) prevBtn.disabled = disableNav;
    if (nextBtn) nextBtn.disabled = disableNav;
  }

  function goToGallerySlide(group, targetIndex, instant) {
    var state = galleryGroupsState[group];
    if (!state || state.totalSlides <= 0) return;
    var positionsCount = state.maxIndex + 1;
    if (positionsCount <= 1) {
      state.currentIndex = 0;
      syncGalleryCarouselUI(group, Boolean(instant));
      return;
    }
    state.currentIndex = ((targetIndex % positionsCount) + positionsCount) % positionsCount;
    syncGalleryCarouselUI(group, Boolean(instant));
  }

  function createGallerySlide(item, group, index, total) {
    var meta = GALLERY_GROUP_META[group] || GALLERY_GROUP_META.inside;
    var slide = document.createElement('article');
    slide.id = 'gallery-slide-' + item.id;
    slide.className = 'gallery-slide';
    slide.setAttribute('role', 'group');
    slide.setAttribute('aria-roledescription', 'slide');
    slide.setAttribute(
      'aria-label',
      meta.label + ' ' + (index + 1) + ' з ' + total + (item.caption ? ': ' + item.caption : '')
    );
    slide.setAttribute('data-gallery-id', item.id);
    slide.setAttribute('data-gallery-group', group);
    slide.setAttribute('data-slide-index', String(index));

    var card = document.createElement('figure');
    card.className = 'gallery-card';

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'gallery-card__trigger';
    trigger.setAttribute('data-gallery-open', item.id);
    trigger.setAttribute('data-gallery-group', group);
    trigger.setAttribute(
      'aria-label',
      'Відкрити ' +
      meta.fallbackLabel.toLowerCase() +
      ' (' +
      (index + 1) +
      ' з ' +
      total +
      ') у збільшеному вигляді' +
      (item.caption ? ': ' + item.caption : '')
    );

    trigger.appendChild(createGalleryMediaNode(item, group, index, total, false));
    card.appendChild(trigger);

    var caption = document.createElement('figcaption');
    caption.className = 'gallery-card__caption muted';
    if (item.caption) {
      caption.textContent = item.caption;
      caption.title = item.caption;
    } else {
      caption.hidden = true;
    }
    card.appendChild(caption);

    slide.appendChild(card);
    return slide;
  }

  function renderGalleryCarousel(group) {
    var carousel = document.getElementById('gallery-carousel-' + group);
    var viewport = document.getElementById('gallery-viewport-' + group);
    var track = document.getElementById('gallery-track-' + group);
    var dotsWrap = document.getElementById('gallery-dots-' + group);
    var prevBtn = document.getElementById('gallery-prev-' + group);
    var nextBtn = document.getElementById('gallery-next-' + group);
    var list = getGalleryGroupItems(group);
    if (!track || !list.length) return;

    var trackFrag = document.createDocumentFragment();
    for (var i = 0; i < list.length; i++) {
      trackFrag.appendChild(createGallerySlide(list[i], group, i, list.length));
    }

    track.textContent = '';
    track.appendChild(trackFrag);

    if (dotsWrap) {
      dotsWrap.textContent = '';
    }

    syncGalleryCarouselUI(group, true);

    if (prevBtn && !prevBtn.dataset.galleryPrevBound) {
      prevBtn.dataset.galleryPrevBound = '1';
      prevBtn.addEventListener('click', function () {
        goToGallerySlide(group, galleryGroupsState[group].currentIndex - 1);
      });
    }

    if (nextBtn && !nextBtn.dataset.galleryNextBound) {
      nextBtn.dataset.galleryNextBound = '1';
      nextBtn.addEventListener('click', function () {
        goToGallerySlide(group, galleryGroupsState[group].currentIndex + 1);
      });
    }

    if (dotsWrap && !dotsWrap.dataset.galleryDotsBound) {
      dotsWrap.dataset.galleryDotsBound = '1';
      dotsWrap.addEventListener('click', function (e) {
        var dotBtn = e.target.closest('[data-gallery-dot]');
        if (!dotBtn) return;
        var idx = parseInt(dotBtn.getAttribute('data-gallery-dot'), 10);
        if (!isNaN(idx)) {
          goToGallerySlide(group, idx);
        }
      });

      bindTablistKeyNav(
        dotsWrap,
        '.gallery-carousel__dot',
        function () {
          return galleryGroupsState[group].currentIndex;
        },
        function (nextIdx) {
          goToGallerySlide(group, nextIdx);
        }
      );
    }

    if (carousel && !carousel.dataset.galleryKeyBound) {
      carousel.dataset.galleryKeyBound = '1';
      bindCarouselArrowsKey(
        carousel,
        dotsWrap,
        function () {
          goToGallerySlide(group, galleryGroupsState[group].currentIndex - 1);
        },
        function () {
          goToGallerySlide(group, galleryGroupsState[group].currentIndex + 1);
        }
      );
    }

    if (viewport) {
      bindHorizontalSwipe(
        viewport,
        function () {
          goToGallerySlide(group, galleryGroupsState[group].currentIndex + 1);
        },
        function () {
          goToGallerySlide(group, galleryGroupsState[group].currentIndex - 1);
        }
      );
    }

    if (!track.dataset.galleryModalBound) {
      track.dataset.galleryModalBound = '1';
      track.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-gallery-open]');
        if (!trigger) return;
        var galleryId = trigger.getAttribute('data-gallery-open');
        var itemGroup = trigger.getAttribute('data-gallery-group') || group;
        if (galleryId) {
          openGalleryModal(itemGroup, galleryId, trigger);
        }
      });
    }
  }

  function renderGalleryModalContent(group, item) {
    var catEl = document.getElementById('gallery-modal-category');
    var titleEl = document.getElementById('gallery-modal-title');
    var descEl = document.getElementById('gallery-modal-desc');
    var mediaEl = document.getElementById('gallery-modal-media');
    var counterEl = document.getElementById('gallery-modal-counter');
    var prevBtn = document.getElementById('gallery-modal-prev');
    var nextBtn = document.getElementById('gallery-modal-next');

    var meta = GALLERY_GROUP_META[group] || GALLERY_GROUP_META.inside;
    var list = getGalleryGroupItems(group);
    var idx = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === item.id) {
        idx = i;
        break;
      }
    }

    if (catEl) catEl.textContent = meta.label;
    if (titleEl) {
      titleEl.textContent = item.caption || (meta.fallbackLabel + ' ' + (idx + 1));
    }
    if (descEl) {
      descEl.textContent =
        item.alt ||
        (meta.label + ': ' + meta.fallbackLabel.toLowerCase() + ', слайд ' + (idx + 1) + ' з ' + list.length + '.');
    }

    if (mediaEl) {
      var frame = createGalleryMediaNode(item, group, idx, list.length, true);
      mediaEl.textContent = '';
      mediaEl.appendChild(frame);
    }

    var disableNav = list.length <= 1;
    if (prevBtn) prevBtn.disabled = disableNav;
    if (nextBtn) nextBtn.disabled = disableNav;
    if (counterEl) {
      counterEl.textContent = (idx + 1) + ' / ' + list.length;
    }
  }

  function syncCarouselWindowToSlide(group, slideIdx) {
    var state = galleryGroupsState[group];
    if (!state || state.maxIndex <= 0) return;
    if (slideIdx < state.currentIndex) {
      goToGallerySlide(group, slideIdx);
    } else if (slideIdx >= state.currentIndex + state.perView) {
      goToGallerySlide(group, slideIdx - state.perView + 1);
    }
  }

  function stepGalleryModal(delta) {
    var group = activeGalleryModal.group;
    var list = getGalleryGroupItems(group);
    if (list.length <= 1) return;

    var idx = 0;
    for (var i = 0; i < list.length; i++) {
      if (list[i].id === activeGalleryModal.id) {
        idx = i;
        break;
      }
    }

    var nextIdx = (idx + delta + list.length) % list.length;
    var nextItem = list[nextIdx];
    activeGalleryModal.id = nextItem.id;
    syncCarouselWindowToSlide(group, nextIdx);
    renderGalleryModalContent(group, nextItem);
  }

  var GALLERY_MODAL_CFG = {
    modalId: 'gallery-modal',
    siblingId: 'work-modal',
    closeSibling: function (restore) {
      closeWorkModal(restore);
    },
    closeId: 'gallery-modal-close',
    backdropId: 'gallery-modal-backdrop',
    prevId: 'gallery-modal-prev',
    nextId: 'gallery-modal-next',
    dialogSelector: '.gallery-modal__dialog',
    stateKey: 'gallery',
    boundAttr: 'galleryModalBound',
    step: stepGalleryModal,
    close: closeGalleryModal,
    onKeyDown: onGalleryModalKeyDown,
    onClose: function () {
      activeGalleryModal.group = null;
      activeGalleryModal.id = null;
    }
  };

  function onGalleryModalKeyDown(e) {
    handleLightboxKeyDown(e, GALLERY_MODAL_CFG);
  }

  function openGalleryModal(group, galleryId, triggerEl) {
    var targetGroup = group === 'outside' ? 'outside' : 'inside';
    var item = findGalleryItemById(targetGroup, galleryId);
    if (!item) return;

    openLightboxModal(GALLERY_MODAL_CFG, triggerEl, function () {
      activeGalleryModal.group = targetGroup;
      activeGalleryModal.id = item.id;
      renderGalleryModalContent(targetGroup, item);
    });
  }

  function closeGalleryModal(restoreFocus) {
    closeLightboxModal(GALLERY_MODAL_CFG, restoreFocus);
  }

  function bindGalleryModal() {
    if (!bindLightboxControls(GALLERY_MODAL_CFG)) return;
    var mediaEl = document.getElementById('gallery-modal-media');
    if (mediaEl) {
      bindHorizontalSwipe(
        mediaEl,
        function () {
          stepGalleryModal(1);
        },
        function () {
          stepGalleryModal(-1);
        }
      );
    }
  }

  function initGallery() {
    var gallerySection = document.getElementById('gallery');
    if (!gallerySection) return;

    renderGalleryCarousel('inside');
    renderGalleryCarousel('outside');
    bindGalleryModal();

    if (!window.__tdGalleryResizeBound) {
      window.__tdGalleryResizeBound = true;
      window.addEventListener('resize', function () {
        if (galleryResizeRaf) return;
        galleryResizeRaf = window.requestAnimationFrame(function () {
          galleryResizeRaf = null;
          syncGalleryCarouselUI('inside', true);
          syncGalleryCarouselUI('outside', true);
        });
      }, {
        passive: true
      });
    }
  }

  /* ------------------------------------------------------------------------
     6. Google Business Profile Reviews Adapter & Accessible Slider (#reviews)
     ------------------------------------------------------------------------ */
  var activeReviewsMeta = null;
  var reviewsSliderState = {
    currentIndex: 0,
    perView: 3,
    maxIndex: 0,
    totalSlides: 0,
    userPaused: false,
    hoverPaused: false,
    focusPaused: false,
    expandedPaused: false,
    hiddenPaused: false,
    reducedMotion: false,
    autoplayTimer: null,
    resumeTimer: null,
    resizeRaf: null
  };

  function isAllowedAvatarSrc(url) {
    var clean = String(url || '').trim();
    return isSafeHttpUrl(clean) || /^(\/)?img\/[^?\s#]+$/i.test(clean);
  }

  function getReviewsMeta(overrideMeta) {
    var src = overrideMeta || TD.REVIEWS_META || {};
    var clinic = TD.CLINIC || {};
    var fallbackUrl = clinic.GOOGLE_MAPS_URL || '';
    var googleUrl = isSafeHttpUrl(src.googleUrl) ?
      String(src.googleUrl).trim() :
      isSafeHttpUrl(fallbackUrl) ?
        String(fallbackUrl).trim() :
        '';

    var summaryVerified = Boolean(src.summaryVerified === true);
    var rawRating =
      src.rating !== undefined && src.rating !== null && src.rating !== '' ?
        Number(src.rating) :
        NaN;
    var hasValidRating =
      summaryVerified && isFinite(rawRating) && rawRating > 0 && rawRating <= 5;
    var ratingDisplay = hasValidRating ?
      src.ratingDisplay ?
        String(src.ratingDisplay) :
        rawRating.toFixed(1) :
      '';

    var rawCountSource =
      src.userRatingCount !== undefined ? src.userRatingCount : src.reviewsCount;
    var rawCount =
      rawCountSource !== undefined && rawCountSource !== null && rawCountSource !== '' ?
        Number(rawCountSource) :
        NaN;
    var hasValidCount = summaryVerified && isFinite(rawCount) && rawCount > 0;

    var autoplayMs = Number(src.autoplayDelayMs);
    var resumeMs = Number(src.resumeDelayMs);

    return {
      sourceLabel: src.sourceLabel ? String(src.sourceLabel) : 'Google',
      sourceName: src.sourceName ? String(src.sourceName) : 'Google Business Profile',
      placeId: src.placeId ? String(src.placeId) : clinic.GOOGLE_PLACE_ID || '',
      googleUrl: googleUrl,
      summaryVerified: summaryVerified,
      rating: hasValidRating ? rawRating : null,
      ratingDisplay: ratingDisplay,
      userRatingCount: hasValidCount ? Math.round(rawCount) : null,
      autoplayDelayMs: isFinite(autoplayMs) && autoplayMs >= 4000 ? autoplayMs : 6000,
      resumeDelayMs: isFinite(resumeMs) && resumeMs >= 4000 ? resumeMs : 9000,
      state: src.state || 'ready',
      errorMessage: src.errorMessage ? String(src.errorMessage) : '',
      endpoint: src.endpoint ? String(src.endpoint).trim() : '',
      sourceNote: src.sourceNote ? String(src.sourceNote) : ''
    };
  }

  function normalizeSingleReview(raw, fallbackUrl, isFromVerifiedSource) {
    if (!raw || typeof raw !== 'object') return null;
    if (raw.verified === false) return null;
    if (!isFromVerifiedSource && raw.verified !== true) return null;

    var stableId =
      raw.id !== undefined && raw.id !== null ? sanitizeExternalText(raw.id, 120) : '';
    var author = raw.author ? sanitizeExternalText(raw.author, 120) : '';
    var text = raw.text ? sanitizeExternalText(raw.text, 4000) : '';
    if (!stableId || !author || !text) return null;

    var rawRating =
      raw.rating !== undefined && raw.rating !== null && raw.rating !== '' ?
        Number(raw.rating) :
        NaN;
    var normalizedRating =
      isFinite(rawRating) && rawRating >= 1 && rawRating <= 5 ?
        Math.round(rawRating * 10) / 10 :
        null;

    var relativeDate = raw.relativeDate ?
      sanitizeExternalText(raw.relativeDate, 80) :
      raw.date ?
        sanitizeExternalText(raw.date, 80) :
        '';
    var publishedAt = raw.publishedAt ? sanitizeExternalText(raw.publishedAt, 64) : '';
    var ownerReply = raw.ownerReply ? sanitizeExternalText(raw.ownerReply, 2000) : '';
    var authorPhotoRaw = raw.authorPhoto ? String(raw.authorPhoto).trim() : '';
    var authorPhoto = isAllowedAvatarSrc(authorPhotoRaw) ? authorPhotoRaw : '';
    var googleUrl = isSafeHttpUrl(raw.googleUrl) ? String(raw.googleUrl).trim() : fallbackUrl;

    return Object.freeze({
      id: stableId,
      source: raw.source ? sanitizeExternalText(raw.source, 60) : 'Google',
      author: author,
      authorInitials: raw.authorInitials ? sanitizeExternalText(raw.authorInitials, 4) : '',
      authorPhoto: authorPhoto,
      rating: normalizedRating,
      relativeDate: relativeDate,
      publishedAt: publishedAt,
      text: text,
      ownerReply: ownerReply,
      googleUrl: googleUrl,
      verified: true
    });
  }

  function normalizeReviewsList(list, fallbackUrl, isFromVerifiedSource) {
    if (!Array.isArray(list)) return [];
    var seenIds = Object.create(null);
    var result = [];

    for (var i = 0; i < list.length; i++) {
      var normalized = normalizeSingleReview(list[i], fallbackUrl, isFromVerifiedSource);
      if (!normalized) continue;
      if (seenIds[normalized.id]) continue;
      seenIds[normalized.id] = true;
      result.push(normalized);
    }

    return result;
  }

  function normalizeBackendResponse(payload, baseMeta) {
    if (!payload || typeof payload !== 'object') {
      throw new Error('Invalid reviews response format');
    }

    var metaBase = baseMeta || getReviewsMeta();
    var listRaw = Array.isArray(payload) ?
      payload :
      Array.isArray(payload.reviews) ?
        payload.reviews :
        [];
    var payloadMeta = !Array.isArray(payload) && payload.meta && typeof payload.meta === 'object' ?
      payload.meta :
      payload;

    var mergedMeta = {
      sourceLabel: payloadMeta.source || metaBase.sourceLabel,
      sourceName: metaBase.sourceName,
      placeId: payloadMeta.placeId || metaBase.placeId,
      googleUrl: isSafeHttpUrl(payloadMeta.googleUrl) ?
        payloadMeta.googleUrl :
        metaBase.googleUrl,
      rating: payloadMeta.rating !== undefined && payloadMeta.rating !== null ?
        Number(payloadMeta.rating) :
        metaBase.rating,
      userRatingCount: payloadMeta.userRatingCount !== undefined && payloadMeta.userRatingCount !== null ?
        Number(payloadMeta.userRatingCount) :
        payloadMeta.reviewsCount !== undefined && payloadMeta.reviewsCount !== null ?
          Number(payloadMeta.reviewsCount) :
          metaBase.userRatingCount,
      summaryVerified: (payloadMeta.rating !== undefined &&
        payloadMeta.rating !== null &&
        Number(payloadMeta.rating) > 0 &&
        Number(payloadMeta.rating) <= 5) ||
        (payloadMeta.userRatingCount !== undefined &&
          payloadMeta.userRatingCount !== null &&
          Number(payloadMeta.userRatingCount) > 0) ||
        Boolean(payloadMeta.summaryVerified === true),
      autoplayDelayMs: metaBase.autoplayDelayMs,
      resumeDelayMs: metaBase.resumeDelayMs,
      endpoint: metaBase.endpoint,
      sourceNote: payloadMeta.sourceNote || metaBase.sourceNote
    };

    var reviews = normalizeReviewsList(
      listRaw,
      mergedMeta.googleUrl || metaBase.googleUrl,
      true
    );

    return {
      meta: getReviewsMeta(mergedMeta),
      reviews: reviews
    };
  }

  TD.reviewsSource = {
    normalizeReview: function (item, fallbackUrl) {
      return normalizeSingleReview(
        item,
        fallbackUrl || (TD.CLINIC && TD.CLINIC.GOOGLE_MAPS_URL) || '',
        true
      );
    },
    normalizeReviews: function (list, fallbackUrl) {
      return normalizeReviewsList(
        list,
        fallbackUrl || (TD.CLINIC && TD.CLINIC.GOOGLE_MAPS_URL) || '',
        false
      );
    },
    normalizeResponse: function (payload) {
      return normalizeBackendResponse(payload, getReviewsMeta());
    },
    load: function (endpointOverride) {
      var meta = getReviewsMeta();
      var url = endpointOverride ? String(endpointOverride).trim() : meta.endpoint;

      if (!url || !isSafeEndpointUrl(url)) {
        return Promise.resolve({
          meta: meta,
          reviews: normalizeReviewsList(TD.REVIEWS, meta.googleUrl, false)
        });
      }

      return fetchWithTimeout(
        url, {
        headers: {
          Accept: 'application/json'
        },
        cache: 'no-store',
        credentials: isSameOriginUrl(url) ? 'same-origin' : 'omit'
      },
        10000,
        'reviews'
      )
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          var ctype =
            resp.headers && typeof resp.headers.get === 'function' ?
              resp.headers.get('content-type') || '' :
              '';
          if (ctype && !/json/i.test(ctype)) {
            throw new Error('Unexpected reviews content-type');
          }
          return resp.json();
        })
        .then(function (payload) {
          return normalizeBackendResponse(payload, meta);
        });
    }
  };

  function getReviewInitials(name, explicit) {
    var cleanExplicit = String(explicit || '').trim();
    if (cleanExplicit) return cleanExplicit.slice(0, 2).toUpperCase();
    var parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return 'П';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  function splitReviewExcerpt(text, maxChars) {
    var clean = String(text || '').replace(/\s+/g, ' ').trim();
    var limit = maxChars || 210;
    if (clean.length <= limit) {
      return {
        isTruncated: false,
        excerpt: clean,
        full: clean
      };
    }
    var minBreak = Math.floor(limit * 0.55);
    var breakIdx = clean.lastIndexOf(' ', limit);
    if (breakIdx < minBreak) {
      breakIdx = clean.indexOf(' ', limit);
    }
    if (breakIdx === -1) {
      return {
        isTruncated: false,
        excerpt: clean,
        full: clean
      };
    }
    var trimmed = clean.slice(0, breakIdx).replace(/[.,;:!?—-]+$/, '');
    return {
      isTruncated: true,
      excerpt: trimmed + '…',
      full: clean
    };
  }

  function createStarRow(ratingValue, ariaLabelText, starClass, rowClass) {
    var filledCount = Math.max(0, Math.min(5, Math.round(Number(ratingValue) || 0)));
    var row = document.createElement('span');
    row.className = rowClass;
    row.setAttribute('role', 'img');
    row.setAttribute('aria-label', ariaLabelText);

    for (var i = 0; i < 5; i++) {
      var star = createSvgUse(
        'td-star',
        starClass + (i < filledCount ? ' is-filled' : ' is-empty')
      );
      row.appendChild(star);
    }
    return row;
  }

  function formatReviewCountLabel(count) {
    var word =
      typeof TD.pluralizeUk === 'function' ?
        TD.pluralizeUk(count, 'відгук', 'відгуки', 'відгуків') :
        'відгуків';
    return count + ' ' + word;
  }

  function renderReviewsSummary(meta, visibleReviewsCount) {
    var container = document.getElementById('reviews-summary');
    if (!container) return;

    var m = meta || getReviewsMeta();
    var frag = document.createDocumentFragment();

    var main = document.createElement('div');
    main.className = 'reviews-summary__main';

    var brand = document.createElement('div');
    brand.className = 'reviews-summary__brand';

    var logoWrap = document.createElement('span');
    logoWrap.className = 'reviews-summary__logo-wrap';
    logoWrap.setAttribute('aria-hidden', 'true');
    logoWrap.appendChild(createSvgUse('td-google-logo', 'reviews-summary__logo'));

    var labelBlock = document.createElement('div');
    labelBlock.className = 'reviews-summary__titles';

    var heading = document.createElement('p');
    heading.className = 'reviews-summary__heading';
    heading.textContent = 'Відгуки пацієнтів у Google Business Profile';
    labelBlock.appendChild(heading);

    var metrics = document.createElement('div');
    metrics.className = 'reviews-summary__metrics';

    if (m.rating !== null) {
      var scoreEl = document.createElement('span');
      scoreEl.className = 'reviews-summary__score';
      scoreEl.textContent = m.ratingDisplay;

      var starsEl = createStarRow(
        m.rating,
        'Середня оцінка у Google: ' + m.ratingDisplay + ' із 5',
        'reviews-summary__star',
        'reviews-summary__stars'
      );

      var ratingText = document.createElement('span');
      ratingText.className = 'reviews-summary__meta-label';
      ratingText.textContent = 'Рейтинг у Google';

      metrics.appendChild(scoreEl);
      metrics.appendChild(starsEl);
      metrics.appendChild(ratingText);
    }

    if (m.userRatingCount !== null) {
      var countEl = document.createElement('span');
      countEl.className = 'reviews-summary__count';
      countEl.textContent = formatReviewCountLabel(m.userRatingCount);
      metrics.appendChild(countEl);
    }

    if (!metrics.childNodes.length) {
      var unverifiedBadge = document.createElement('span');
      unverifiedBadge.className = 'reviews-summary__count';
      unverifiedBadge.textContent = 'Перевірити актуальний рейтинг у Google';
      metrics.appendChild(unverifiedBadge);
    }

    labelBlock.appendChild(metrics);

    var noteEl = document.createElement('p');
    noteEl.className = 'reviews-summary__source-note';
    if (visibleReviewsCount > 0) {
      noteEl.textContent =
        m.sourceNote || 'Джерело: офіційний профіль клініки у Google Business Profile.';
    } else {
      noteEl.textContent =
        'Офіційний профіль клініки TRUST DENTAL у Google. Картки відгуків відображаються лише після підключення підтверджених записів Google.';
    }
    labelBlock.appendChild(noteEl);

    brand.appendChild(logoWrap);
    brand.appendChild(labelBlock);
    main.appendChild(brand);

    if (m.googleUrl) {
      var cta = document.createElement('a');
      cta.className = 'btn btn--primary reviews-summary__cta';
      cta.setAttribute('data-clinic', 'maps-link');
      cta.href = m.googleUrl;
      cta.target = '_blank';
      cta.rel = 'noopener noreferrer';
      cta.setAttribute(
        'aria-label',
        'Перевірити актуальний рейтинг та відгуки TRUST DENTAL в Google (відкриється у новій вкладці)'
      );
      var ctaSpan = document.createElement('span');
      ctaSpan.textContent = 'Відкрити профіль Google';
      cta.appendChild(ctaSpan);
      cta.appendChild(createArrowSvg('btn__arrow'));
      main.appendChild(cta);
    }

    frag.appendChild(main);
    container.textContent = '';
    container.appendChild(frag);
  }

  function clearSliderTimers() {
    if (reviewsSliderState.autoplayTimer) {
      window.clearTimeout(reviewsSliderState.autoplayTimer);
      reviewsSliderState.autoplayTimer = null;
    }
    if (reviewsSliderState.resumeTimer) {
      window.clearTimeout(reviewsSliderState.resumeTimer);
      reviewsSliderState.resumeTimer = null;
    }
  }

  function syncSliderPauseButton() {
    var pauseBtn = document.getElementById('reviews-pause');
    if (!pauseBtn) return;

    if (reviewsSliderState.reducedMotion) {
      pauseBtn.disabled = true;
      pauseBtn.setAttribute('aria-pressed', 'true');
      pauseBtn.setAttribute(
        'aria-label',
        'Автоматичне перемикання вимкнено через налаштування зменшення руху'
      );
      pauseBtn.textContent = 'Автовимкнено';
      pauseBtn.classList.add('is-paused');
      return;
    }

    pauseBtn.disabled = reviewsSliderState.maxIndex <= 0;
    pauseBtn.setAttribute(
      'aria-pressed',
      reviewsSliderState.userPaused ? 'true' : 'false'
    );
    pauseBtn.setAttribute(
      'aria-label',
      reviewsSliderState.userPaused ?
        'Відновити автоматичне перемикання' :
        'Призупинити автоматичне перемикання'
    );
    pauseBtn.textContent = reviewsSliderState.userPaused ? 'Продовжити' : 'Пауза';
    pauseBtn.classList.toggle('is-paused', reviewsSliderState.userPaused);
  }

  function canRunSliderAutoplay() {
    var slider = document.getElementById('reviews-slider');
    return Boolean(
      slider &&
      !slider.hidden &&
      reviewsSliderState.maxIndex > 0 &&
      !reviewsSliderState.reducedMotion &&
      !reviewsSliderState.userPaused &&
      !reviewsSliderState.hoverPaused &&
      !reviewsSliderState.focusPaused &&
      !reviewsSliderState.expandedPaused &&
      !reviewsSliderState.hiddenPaused &&
      !reviewsSliderState.resumeTimer
    );
  }

  function scheduleSliderAutoplay() {
    if (reviewsSliderState.autoplayTimer) {
      window.clearTimeout(reviewsSliderState.autoplayTimer);
      reviewsSliderState.autoplayTimer = null;
    }
    if (!canRunSliderAutoplay()) return;

    var delay =
      (activeReviewsMeta && activeReviewsMeta.autoplayDelayMs) || 6000;
    reviewsSliderState.autoplayTimer = window.setTimeout(function () {
      reviewsSliderState.autoplayTimer = null;
      if (!canRunSliderAutoplay()) return;
      stepReviewsSlider(1, {
        manual: false,
        announce: false
      });
      scheduleSliderAutoplay();
    }, delay);
  }

  function pauseSliderAfterInteraction() {
    clearSliderTimers();
    if (
      reviewsSliderState.userPaused ||
      reviewsSliderState.reducedMotion ||
      reviewsSliderState.maxIndex <= 0
    ) {
      return;
    }
    var resumeMs =
      (activeReviewsMeta && activeReviewsMeta.resumeDelayMs) || 9000;
    reviewsSliderState.resumeTimer = window.setTimeout(function () {
      reviewsSliderState.resumeTimer = null;
      scheduleSliderAutoplay();
    }, resumeMs);
  }

  function collapseExpandedCardsInTrack() {
    var track = document.getElementById('reviews-slider-track');
    if (!track) return;
    var btns = track.querySelectorAll('.review-card__expand[aria-expanded="true"]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].click();
    }
    reviewsSliderState.expandedPaused = false;
  }

  function updateSliderExpandedPauseState() {
    var track = document.getElementById('reviews-slider-track');
    if (!track) return;
    reviewsSliderState.expandedPaused = Boolean(
      track.querySelector('.review-card__expand[aria-expanded="true"]')
    );
    if (reviewsSliderState.expandedPaused) {
      clearSliderTimers();
    } else {
      scheduleSliderAutoplay();
    }
  }

  function renderSliderDots(count) {
    var dotsEl = document.getElementById('reviews-dots');
    if (!dotsEl) return;

    dotsEl.hidden = !(count > 0);
    if (!(count > 0)) {
      dotsEl.textContent = '';
      return;
    }

    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++) {
      var dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'reviews-slider__dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('data-slide-to', String(i));
      dot.setAttribute('aria-label', 'Відгук: позиція ' + (i + 1) + ' з ' + count);
      dot.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
      dot.tabIndex = i === 0 ? 0 : -1;
      frag.appendChild(dot);
    }

    dotsEl.textContent = '';
    dotsEl.appendChild(frag);
  }

  function updateSliderDomPosition(instant) {
    var track = document.getElementById('reviews-slider-track');
    var dotsEl = document.getElementById('reviews-dots');
    var prevBtn = document.getElementById('reviews-prev');
    var nextBtn = document.getElementById('reviews-next');
    if (!track) return;

    var cards = track.children;
    var idx = reviewsSliderState.currentIndex;
    var offsetPx = 0;
    if (cards.length > 0 && idx > 0 && idx < cards.length) {
      offsetPx = cards[idx].offsetLeft;
    }
    var nextTransform = offsetPx > 0 ? 'translate3d(-' + offsetPx + 'px, 0, 0)' : 'translate3d(0, 0, 0)';

    applyTrackTransform(track, nextTransform, instant);

    syncTabDotsState(dotsEl, '[role="tab"]', idx);

    var noNav = reviewsSliderState.maxIndex <= 0;
    if (prevBtn) prevBtn.disabled = noNav;
    if (nextBtn) nextBtn.disabled = noNav;
  }

  function goToSliderIndex(targetIndex, opts) {
    var positionsCount = reviewsSliderState.maxIndex + 1;
    if (positionsCount <= 0) return;

    var wrapped =
      ((targetIndex % positionsCount) + positionsCount) % positionsCount;
    reviewsSliderState.currentIndex = wrapped;

    if (opts && opts.manual) {
      collapseExpandedCardsInTrack();
    }

    updateSliderDomPosition(Boolean(opts && opts.instant));

    if (opts && opts.announce) {
      var liveSlide = document.getElementById('reviews-slider-status');
      if (liveSlide) {
        liveSlide.textContent =
          'Позиція ' + (wrapped + 1) + ' з ' + positionsCount + ' у стрічці відгуків.';
      }
    }
  }

  function stepReviewsSlider(delta, opts) {
    goToSliderIndex(reviewsSliderState.currentIndex + delta, opts);
  }

  function computePerViewForViewport() {
    var total = reviewsSliderState.totalSlides;
    if (total <= 1) return 1;
    var w = window.innerWidth || document.documentElement.clientWidth || 1280;
    if (w < 768) return 1;
    if (w < 1024) return Math.min(2, total);
    return Math.min(3, total);
  }

  function syncSliderLayout(instant) {
    var slider = document.getElementById('reviews-slider');
    var track = document.getElementById('reviews-slider-track');
    var controls = document.getElementById('reviews-slider-controls');
    if (!slider || !track || slider.hidden) return;

    var total = track.children.length;
    reviewsSliderState.totalSlides = total;
    reviewsSliderState.reducedMotion = prefersReducedMotion();

    var perView = computePerViewForViewport();
    reviewsSliderState.perView = perView;
    track.style.setProperty('--reviews-per-view', String(perView));

    var maxIndex = Math.max(0, total - perView);
    var prevDotsCount =
      (document.getElementById('reviews-dots') &&
        document.getElementById('reviews-dots').children.length) ||
      0;

    reviewsSliderState.maxIndex = maxIndex;
    if (reviewsSliderState.currentIndex > maxIndex) {
      reviewsSliderState.currentIndex = maxIndex;
    }

    if (controls) {
      controls.hidden = maxIndex <= 0;
    }

    if (maxIndex > 0) {
      var desiredDots = maxIndex + 1;
      if (prevDotsCount !== desiredDots) {
        renderSliderDots(desiredDots);
      }
    } else {
      var dotsEl = document.getElementById('reviews-dots');
      if (dotsEl) dotsEl.textContent = '';
    }

    updateSliderDomPosition(Boolean(instant));
    syncSliderPauseButton();
  }

  function bindReviewsSliderEvents() {
    var slider = document.getElementById('reviews-slider');
    if (!slider) return;

    if (!slider.dataset.sliderBound) {
      slider.dataset.sliderBound = '1';

      var prevBtn = document.getElementById('reviews-prev');
      var nextBtn = document.getElementById('reviews-next');
      var dotsEl = document.getElementById('reviews-dots');
      var pauseBtn = document.getElementById('reviews-pause');
      var viewport = document.getElementById('reviews-slider-viewport');

      if (prevBtn) {
        prevBtn.addEventListener('click', function () {
          stepReviewsSlider(-1, {
            manual: true,
            announce: true
          });
          pauseSliderAfterInteraction();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stepReviewsSlider(1, {
            manual: true,
            announce: true
          });
          pauseSliderAfterInteraction();
        });
      }

      if (dotsEl) {
        dotsEl.addEventListener('click', function (e) {
          var tab = e.target.closest('[role="tab"]');
          if (!tab) return;
          var idx = Number(tab.getAttribute('data-slide-to'));
          if (!isFinite(idx)) return;
          goToSliderIndex(idx, {
            manual: true,
            announce: true
          });
          pauseSliderAfterInteraction();
        });

        bindTablistKeyNav(
          dotsEl,
          '[role="tab"]',
          null,
          function (nextIdx) {
            goToSliderIndex(nextIdx, {
              manual: true,
              announce: true
            });
            pauseSliderAfterInteraction();
          }
        );
      }

      if (pauseBtn) {
        pauseBtn.addEventListener('click', function () {
          if (reviewsSliderState.reducedMotion) return;
          reviewsSliderState.userPaused = !reviewsSliderState.userPaused;
          clearSliderTimers();
          syncSliderPauseButton();

          var liveSlide = document.getElementById('reviews-slider-status');
          if (liveSlide) {
            liveSlide.textContent = reviewsSliderState.userPaused ?
              'Автоматичне перемикання призупинено.' :
              'Автоматичне перемикання відновлено.';
          }

          if (!reviewsSliderState.userPaused) {
            scheduleSliderAutoplay();
          }
        });
      }

      slider.addEventListener('mouseenter', function () {
        reviewsSliderState.hoverPaused = true;
        clearSliderTimers();
      });

      slider.addEventListener('mouseleave', function () {
        reviewsSliderState.hoverPaused = false;
        scheduleSliderAutoplay();
      });

      slider.addEventListener('focusin', function () {
        reviewsSliderState.focusPaused = true;
        clearSliderTimers();
      });

      slider.addEventListener('focusout', function (e) {
        if (!e.relatedTarget || !slider.contains(e.relatedTarget)) {
          reviewsSliderState.focusPaused = false;
          scheduleSliderAutoplay();
        }
      });

      if (viewport) {
        bindHorizontalSwipe(
          viewport,
          function () {
            stepReviewsSlider(1, {
              manual: true,
              announce: true
            });
          },
          function () {
            stepReviewsSlider(-1, {
              manual: true,
              announce: true
            });
          }, {
          threshold: 42,
          ignoreSelector: 'button, a, [role="tab"]',
          onSwipe: pauseSliderAfterInteraction
        }
        );
      }
    }

    if (!slider.dataset.globalSliderBound) {
      slider.dataset.globalSliderBound = '1';

      window.addEventListener('resize', function () {
        if (reviewsSliderState.resizeRaf) {
          window.cancelAnimationFrame(reviewsSliderState.resizeRaf);
        }
        reviewsSliderState.resizeRaf = window.requestAnimationFrame(function () {
          reviewsSliderState.resizeRaf = null;
          syncSliderLayout(true);
        });
      });

      document.addEventListener('visibilitychange', function () {
        reviewsSliderState.hiddenPaused = Boolean(document.hidden);
        if (reviewsSliderState.hiddenPaused) {
          clearSliderTimers();
        } else {
          scheduleSliderAutoplay();
        }
      });

      if (TD.lifecycle && typeof TD.lifecycle.onPageShow === 'function') {
        TD.lifecycle.onPageShow(function (e) {
          if (e && e.persisted) {
            reviewsSliderState.hiddenPaused = Boolean(document.hidden);
            scheduleSliderAutoplay();
          }
        });
      }

      if (typeof TD.onMediaQueryChange === 'function') {
        TD.onMediaQueryChange('(prefers-reduced-motion: reduce)', function (e) {
          reviewsSliderState.reducedMotion = Boolean(e.matches);
          if (reviewsSliderState.reducedMotion) {
            clearSliderTimers();
          } else {
            scheduleSliderAutoplay();
          }
          syncSliderPauseButton();
        });
      }
    }
  }

  function createReviewCard(item, index, fallbackUrl) {
    var card = createEl('article', 'review-card');
    if (item.id) card.setAttribute('data-review-id', item.id);

    var head = createEl('header', 'review-card__head');
    var authorBox = createEl('div', 'review-card__author');
    var avatar = createEl('div', 'review-card__avatar');
    var initials = createEl('span', 'review-card__initials', getReviewInitials(item.author, item.authorInitials));
    initials.setAttribute('aria-hidden', 'true');
    avatar.appendChild(initials);

    var photoUrl = item.authorPhoto ? String(item.authorPhoto).trim() : '';
    if (photoUrl) {
      var img = document.createElement('img');
      img.className = 'review-card__avatar-img';
      img.src = photoUrl;
      img.width = 46;
      img.height = 46;
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('referrerpolicy', 'no-referrer');
      img.alt = 'Фото автора відгуку: ' + item.author;

      avatar.appendChild(img);
      bindLazyImageReady(img, avatar);
    } else {
      avatar.classList.add('is-fallback');
      avatar.setAttribute('aria-hidden', 'true');
    }

    var identity = createEl('div', 'review-card__identity');
    identity.appendChild(createEl('h3', 'review-card__name', item.author));
    var dateDisplay = item.relativeDate || item.publishedAt || '';
    identity.appendChild(createEl('p', 'review-card__meta', dateDisplay ? item.source + ' · ' + dateDisplay : item.source));

    authorBox.appendChild(avatar);
    authorBox.appendChild(identity);

    var sourceBadge = createEl('span', 'review-card__source');
    sourceBadge.setAttribute('aria-label', 'Відгук із Google');
    sourceBadge.appendChild(createSvgUse('td-google-logo', 'review-card__source-icon'));
    sourceBadge.appendChild(createEl('span', null, item.source));

    head.appendChild(authorBox);
    head.appendChild(sourceBadge);
    card.appendChild(head);

    if (item.rating !== null) {
      var ratingWrap = document.createElement('div');
      ratingWrap.className = 'review-card__rating';
      ratingWrap.appendChild(
        createStarRow(
          item.rating,
          'Оцінка ' + Math.round(item.rating) + ' із 5 у Google',
          'review-card__star',
          'review-card__stars'
        )
      );
      var ratingNum = document.createElement('span');
      ratingNum.className = 'review-card__rating-num';
      ratingNum.setAttribute('aria-hidden', 'true');
      ratingNum.textContent = item.rating.toFixed(1);
      ratingWrap.appendChild(ratingNum);
      card.appendChild(ratingWrap);
    }

    var textId = 'review-text-' + index;
    var parsedText = splitReviewExcerpt(item.text, 210);
    var bodyWrap = document.createElement('div');
    bodyWrap.className = 'review-card__body';

    var textEl = document.createElement('p');
    textEl.id = textId;
    textEl.className = 'review-card__text';
    textEl.textContent = parsedText.isTruncated ? parsedText.excerpt : parsedText.full;
    bodyWrap.appendChild(textEl);

    if (parsedText.isTruncated) {
      var expandBtn = document.createElement('button');
      expandBtn.type = 'button';
      expandBtn.className = 'review-card__expand';
      expandBtn.setAttribute('aria-expanded', 'false');
      expandBtn.setAttribute('aria-controls', textId);
      expandBtn.textContent = 'Читати повністю';
      expandBtn.addEventListener('click', function () {
        var expanded = expandBtn.getAttribute('aria-expanded') === 'true';
        var next = !expanded;
        expandBtn.setAttribute('aria-expanded', next ? 'true' : 'false');
        expandBtn.textContent = next ? 'Згорнути' : 'Читати повністю';
        textEl.textContent = next ? parsedText.full : parsedText.excerpt;
        card.classList.toggle('is-expanded', next);
        updateSliderExpandedPauseState();
      });
      bodyWrap.appendChild(expandBtn);
    }

    card.appendChild(bodyWrap);

    if (item.ownerReply) {
      var replyBox = createEl('div', 'review-card__reply');
      replyBox.appendChild(createEl('strong', 'review-card__reply-title', 'Відповідь власника'));
      replyBox.appendChild(createEl('p', 'review-card__reply-text', item.ownerReply));
      card.appendChild(replyBox);
    }

    var targetUrl = isSafeHttpUrl(item.googleUrl) ? item.googleUrl : fallbackUrl;
    if (targetUrl) {
      var foot = document.createElement('div');
      foot.className = 'review-card__foot';
      var link = document.createElement('a');
      link.className = 'btn btn--outline review-card__link';
      link.href = targetUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute(
        'aria-label',
        'Переглянути відгук автора ' + item.author + ' в Google (відкриється у новій вкладці)'
      );
      var linkLabel = document.createElement('span');
      linkLabel.textContent = 'Переглянути в Google';
      link.appendChild(linkLabel);
      link.appendChild(createArrowSvg('btn__arrow'));
      foot.appendChild(link);
      card.appendChild(foot);
    }

    return card;
  }

  function setReviewsState(stateName, reviewsList, overrideMeta) {
    clearSliderTimers();
    reviewsSliderState.currentIndex = 0;
    reviewsSliderState.expandedPaused = false;
    reviewsSliderState.hoverPaused = false;
    reviewsSliderState.focusPaused = false;

    var meta = getReviewsMeta(overrideMeta);
    activeReviewsMeta = meta;

    var slider = document.getElementById('reviews-slider');
    var track = document.getElementById('reviews-slider-track');
    var loadingEl = document.getElementById('reviews-loading');
    var errorEl = document.getElementById('reviews-error');
    var errorTextEl = document.getElementById('reviews-error-text');
    var retryBtn = document.getElementById('reviews-retry');
    var emptyEl = document.getElementById('reviews-empty');
    var liveEl = document.getElementById('reviews-live');
    if (!slider || !track) return;

    var rawList = Array.isArray(reviewsList) ? reviewsList : TD.REVIEWS;
    var isFromTrustedArg = Array.isArray(reviewsList);
    var normalized = normalizeReviewsList(
      rawList,
      meta.googleUrl,
      isFromTrustedArg && !(overrideMeta && overrideMeta.enforceVerifiedFlag)
    );
    var resolved = stateName || meta.state || 'ready';
    if (resolved === 'ready' && !normalized.length) {
      resolved = 'empty';
    }

    renderReviewsSummary(meta, resolved === 'ready' ? normalized.length : 0);

    if (loadingEl) loadingEl.hidden = resolved !== 'loading';
    if (errorEl) errorEl.hidden = resolved !== 'error';
    if (emptyEl) emptyEl.hidden = resolved !== 'empty';
    slider.hidden = resolved !== 'ready';

    if (errorEl && resolved === 'error') {
      if (errorTextEl) {
        errorTextEl.textContent =
          meta.errorMessage ||
          'Не вдалося завантажити відгуки. Перегляньте актуальні відгуки безпосередньо в профілі клініки на Google.';
      }
      if (retryBtn) {
        retryBtn.hidden = !meta.endpoint;
      }
    }

    if (resolved === 'ready') {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < normalized.length; i++) {
        frag.appendChild(createReviewCard(normalized[i], i + 1, meta.googleUrl));
      }
      track.textContent = '';
      track.appendChild(frag);
      bindReviewsSliderEvents();
      syncSliderLayout(true);
      scheduleSliderAutoplay();

      if (liveEl) {
        liveEl.textContent =
          'Показано перевірених відгуків із Google: ' + normalized.length + '.';
      }
    } else {
      track.textContent = '';
      var dotsEl = document.getElementById('reviews-dots');
      if (dotsEl) dotsEl.textContent = '';
      if (liveEl) {
        if (resolved === 'loading') {
          liveEl.textContent = 'Завантаження відгуків пацієнтів із Google…';
        } else if (resolved === 'error') {
          liveEl.textContent =
            meta.errorMessage || 'Помилка завантаження відгуків із Google.';
        } else {
          liveEl.textContent =
            'Пряме посилання на офіційний профіль клініки у Google Business Profile.';
        }
      }
    }
  }

  function loadReviewsFromAdapter(endpointOverride) {
    var meta = getReviewsMeta();
    var targetEndpoint = endpointOverride ?
      String(endpointOverride).trim() :
      meta.endpoint;

    if (!targetEndpoint) {
      setReviewsState(meta.state, TD.REVIEWS, meta);
      return Promise.resolve({
        meta: meta,
        reviews: normalizeReviewsList(TD.REVIEWS, meta.googleUrl, false)
      });
    }

    setReviewsState('loading', null, meta);
    return TD.reviewsSource
      .load(targetEndpoint)
      .then(function (result) {
        var nextMeta = result.meta || meta;
        var items = result.reviews || [];
        setReviewsState(items.length ? 'ready' : 'empty', items, nextMeta);
        return result;
      })
      .catch(function () {
        setReviewsState('error', null, meta);
        return {
          meta: meta,
          reviews: []
        };
      });
  }

  function bindReviewsActions() {
    var retryBtn = document.getElementById('reviews-retry');
    if (retryBtn && !retryBtn.dataset.reviewsRetryBound) {
      retryBtn.dataset.reviewsRetryBound = '1';
      retryBtn.addEventListener('click', function () {
        loadReviewsFromAdapter();
      });
    }
  }

  function renderReviews() {
    bindReviewsActions();
    var meta = getReviewsMeta();
    if (meta.endpoint) {
      loadReviewsFromAdapter(meta.endpoint);
      return;
    }
    setReviewsState(meta.state, TD.REVIEWS, meta);
  }

  /* ------------------------------------------------------------------------
     7. Contacts Section, Appointment Form, Calculator Sync & Footer (#contacts)
     ------------------------------------------------------------------------ */
  var appointmentTimer = null;
  var isSubmittingAppointment = false;
  var activeCalcSelection = null;

  function clearAppointmentTimer() {
    if (appointmentTimer) {
      window.clearTimeout(appointmentTimer);
      appointmentTimer = null;
    }
  }

  function mapCalcItemToServiceValue(item) {
    var hay = ((item.id || '') + ' ' + (item.title || '')).toLowerCase();
    if (/консульт|діагност|приціл/.test(hay)) return 'consultation';
    if (/гігієн|чист/.test(hay)) return 'hygiene';
    if (/видален|хірург|п.?єзо/.test(hay)) return 'surgery';
    if (/брекет|ортодонт/.test(hay)) return 'braces';
    if (/імплант/.test(hay)) return 'implantation';
    if (/корон|вінір|циркон|ортопед/.test(hay)) return 'orthopedics';
    if (/дитяч/.test(hay)) return 'pediatric';
    if (/карієс|канал|пломб|реставр|терап|ендо/.test(hay)) return 'therapy';
    return 'calc-bundle';
  }

  function syncContactsStaticLists() {
    var cfg = TD.APPOINTMENT_CONFIG || {};
    var stepsEl = document.getElementById('booking-steps-list');
    if (stepsEl && Array.isArray(cfg.bookingSteps) && cfg.bookingSteps.length) {
      var stepsFrag = document.createDocumentFragment();
      for (var i = 0; i < cfg.bookingSteps.length; i++) {
        var stepData = cfg.bookingSteps[i];
        var li = document.createElement('li');
        li.className = 'booking-steps__item';
        var num = document.createElement('span');
        num.className = 'booking-steps__num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = (i < 9 ? '0' : '') + (i + 1);
        li.appendChild(num);

        if (stepData && typeof stepData === 'object' && stepData.title) {
          var bodyDiv = document.createElement('div');
          bodyDiv.className = 'booking-steps__body';
          var headStrong = document.createElement('strong');
          headStrong.className = 'booking-steps__heading';
          headStrong.textContent = String(stepData.title);
          bodyDiv.appendChild(headStrong);
          if (stepData.text) {
            var subSpan = document.createElement('span');
            subSpan.className = 'booking-steps__text';
            subSpan.textContent = String(stepData.text);
            bodyDiv.appendChild(subSpan);
          }
          li.appendChild(bodyDiv);
        } else {
          var txt = document.createElement('span');
          txt.className = 'booking-steps__text';
          txt.textContent = String(stepData);
          li.appendChild(txt);
        }
        stepsFrag.appendChild(li);
      }
      stepsEl.textContent = '';
      stepsEl.appendChild(stepsFrag);
    }

    var methodSel = document.getElementById('appointment-contact-method');
    if (methodSel && Array.isArray(cfg.contactMethods) && cfg.contactMethods.length) {
      var prevMethod = methodSel.value;
      var mFrag = document.createDocumentFragment();
      for (var m = 0; m < cfg.contactMethods.length; m++) {
        var optM = document.createElement('option');
        optM.value = cfg.contactMethods[m].id;
        optM.textContent = cfg.contactMethods[m].label;
        mFrag.appendChild(optM);
      }
      methodSel.textContent = '';
      methodSel.appendChild(mFrag);
      if (prevMethod) methodSel.value = prevMethod;
    }

    var serviceSel = document.getElementById('appointment-service');
    if (serviceSel && Array.isArray(TD.APPOINTMENT_SERVICES) && TD.APPOINTMENT_SERVICES.length) {
      var prevSvc = serviceSel.value;
      var sFrag = document.createDocumentFragment();
      for (var s = 0; s < TD.APPOINTMENT_SERVICES.length; s++) {
        var optS = document.createElement('option');
        optS.value = TD.APPOINTMENT_SERVICES[s].id;
        optS.textContent = TD.APPOINTMENT_SERVICES[s].label;
        sFrag.appendChild(optS);
      }
      serviceSel.textContent = '';
      serviceSel.appendChild(sFrag);
      if (prevSvc) serviceSel.value = prevSvc;
    }
  }

  function initContactsMapCard() {
    var container = document.getElementById('contacts-map-container');
    var cfg = TD.APPOINTMENT_CONFIG || {};
    var clinic = TD.CLINIC || {};
    if (!container) return;

    var embedUrl =
      (cfg.mapEmbedUrl && String(cfg.mapEmbedUrl).trim()) ||
      (clinic.GOOGLE_MAPS_EMBED_URL && String(clinic.GOOGLE_MAPS_EMBED_URL).trim()) ||
      '';
    if (!isSafeHttpUrl(embedUrl)) return;

    var existingIframe = container.querySelector('iframe.contact-map__iframe, iframe.contacts-map__iframe');
    if (existingIframe) {
      if (existingIframe.getAttribute('src') !== embedUrl) {
        existingIframe.setAttribute('src', embedUrl);
      }
      container.dataset.mapEmbedMounted = '1';
      return;
    }

    if (container.dataset.mapEmbedMounted) return;
    container.dataset.mapEmbedMounted = '1';

    var frameWrap =
      container.querySelector('.contact-map__frame') || document.createElement('div');
    if (!frameWrap.parentNode) {
      frameWrap.className = 'contact-map__frame';
      container.insertBefore(frameWrap, container.firstChild);
    }

    var iframe = document.createElement('iframe');
    iframe.id = 'contacts-map-iframe';
    iframe.className = 'contact-map__iframe contacts-map__iframe';
    iframe.src = embedUrl;
    iframe.title =
      'Розташування TRUST DENTAL на карті — м. Івано-Франківськ, вул. Галицька, 51а';
    iframe.width = '640';
    iframe.height = '236';
    iframe.loading = 'lazy';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    iframe.setAttribute('allowfullscreen', '');
    frameWrap.textContent = '';
    frameWrap.appendChild(iframe);
  }

  function syncPrivacySlots() {
    var cfg = TD.APPOINTMENT_CONFIG || {};
    var url = cfg.privacyPolicyUrl ? String(cfg.privacyPolicyUrl).trim() : '';
    if (!isSafeEndpointUrl(url)) return;

    var formSlot = document.getElementById('appointment-privacy-slot');
    if (formSlot && !formSlot.dataset.privacyBound) {
      formSlot.dataset.privacyBound = '1';
      formSlot.textContent = 'Ознайомитися з ';
      var fLink = document.createElement('a');
      fLink.href = url;
      fLink.target = '_blank';
      fLink.rel = 'noopener noreferrer';
      fLink.textContent = 'політикою конфіденційності';
      formSlot.appendChild(fLink);
      formSlot.appendChild(document.createTextNode('.'));
    }

    var footerSlot = document.getElementById('footer-privacy-slot');
    if (footerSlot && !footerSlot.dataset.privacyBound) {
      footerSlot.dataset.privacyBound = '1';
      footerSlot.textContent = '';
      var ftLink = document.createElement('a');
      ftLink.className = 'site-footer__contact-link';
      ftLink.href = url;
      ftLink.target = '_blank';
      ftLink.rel = 'noopener noreferrer';
      ftLink.textContent = 'Політика конфіденційності';
      footerSlot.appendChild(ftLink);
    }
  }

  function updateMessageCounter() {
    var msgEl = document.getElementById('appointment-message');
    var countEl = document.getElementById('appointment-message-count');
    if (!msgEl || !countEl) return;
    countEl.textContent = msgEl.value.length + ' / 600';
  }

  function applyCalcSelectionToForm(selection) {
    var box = document.getElementById('appointment-calc-box');
    var listEl = document.getElementById('appointment-calc-list');
    var totalEl = document.getElementById('appointment-calc-total');
    var serviceSel = document.getElementById('appointment-service');
    var msgEl = document.getElementById('appointment-message');

    var hasItems = Boolean(
      selection && Array.isArray(selection.items) && selection.items.length > 0
    );

    if (!hasItems) {
      activeCalcSelection = null;
      if (box) box.hidden = true;
      if (listEl) listEl.textContent = '';
      if (totalEl) totalEl.textContent = '0\u00A0грн';
      if (msgEl && msgEl.dataset.calcAutofill === '1') {
        msgEl.value = '';
        delete msgEl.dataset.calcAutofill;
        updateMessageCounter();
      }
      return;
    }

    activeCalcSelection = selection;

    if (listEl) {
      var frag = document.createDocumentFragment();
      for (var i = 0; i < selection.items.length; i++) {
        var it = selection.items[i];
        var li = document.createElement('li');
        li.className = 'appointment-calc-box__item';
        var labelText = it.unitLabel ? it.title + ' (' + it.unitLabel + ')' : it.title;
        var nameSpan = document.createElement('span');
        nameSpan.textContent = labelText;
        var valSpan = document.createElement('strong');
        valSpan.textContent =
          typeof TD.formatPrice === 'function' ?
            TD.formatPrice(it.subtotal, it.prefix, 'грн') :
            String(it.subtotal) + ' грн';
        li.appendChild(nameSpan);
        li.appendChild(valSpan);
        frag.appendChild(li);
      }
      listEl.textContent = '';
      listEl.appendChild(frag);
    }

    if (totalEl) {
      totalEl.textContent = selection.formattedTotal || '0\u00A0грн';
    }
    if (box) {
      box.hidden = false;
    }

    if (serviceSel) {
      var nextService =
        selection.items.length === 1 ?
          mapCalcItemToServiceValue(selection.items[0]) :
          'calc-bundle';
      serviceSel.value = nextService;
    }

    if (msgEl && (!msgEl.value.trim() || msgEl.dataset.calcAutofill === '1')) {
      var summaryStr = selection.summaryText ?
        'Попередній розрахунок (орієнтовно): ' + selection.summaryText :
        '';
      msgEl.value = summaryStr.slice(0, 600);
      msgEl.dataset.calcAutofill = '1';
      updateMessageCounter();
    }
  }

  function setAppointmentFieldError(inputEl, errorEl, message) {
    if (inputEl) {
      if (message) {
        inputEl.setAttribute('aria-invalid', 'true');
      } else {
        inputEl.removeAttribute('aria-invalid');
      }
      var wrap = inputEl.closest('.form-field, .form-consent-wrap');
      if (wrap) wrap.classList.toggle('has-error', Boolean(message));
    }
    if (errorEl) {
      errorEl.textContent = message || '';
    }
  }

  function validateAppointmentName(val) {
    var clean = String(val || '').trim();
    if (!clean) return 'Вкажіть ваше ім’я.';
    if (clean.length < 2) return 'Ім’я повинно містити щонайменше 2 символи.';
    if (clean.length > 80) return 'Ім’я не має перевищувати 80 символів.';
    if (/^[\d\s+\-()]+$/.test(clean)) return 'Введіть ім’я літерами.';
    return '';
  }

  function validateAppointmentPhone(val) {
    var clean = String(val || '').trim();
    if (!clean) return 'Вкажіть номер телефону.';
    if (/[a-zA-Zа-яА-ЯіІїЇєЄґҐ]/.test(clean)) {
      return 'Номер телефону не може містити літери.';
    }
    var digits = clean.replace(/\D/g, '');
    if (digits.indexOf('380') === 0) {
      if (digits.length !== 12) {
        return 'Вкажіть повний номер формату +38 (0XX) XXX-XX-XX.';
      }
      return '';
    }
    if (digits.charAt(0) === '0') {
      if (digits.length !== 10) {
        return 'Вкажіть 10 цифр номера (наприклад, 050 050 08 21).';
      }
      return '';
    }
    if (digits.length < 9 || digits.length > 15) {
      return 'Перевірте коректність номера телефону.';
    }
    return '';
  }

  function validateAppointmentPreferredTime(val) {
    var clean = String(val || '').trim();
    if (clean.length > 80) {
      return 'Поле дати/часу не повинно перевищувати 80 символів.';
    }
    return '';
  }

  function validateAppointmentMessage(val) {
    var clean = String(val || '');
    if (clean.length > 600) {
      return 'Коментар не повинен перевищувати 600 символів.';
    }
    return '';
  }

  function validateAppointmentConsent(checked) {
    if (!checked) {
      return 'Підтвердьте згоду на обробку персональних даних для зв’язку щодо запису.';
    }
    return '';
  }

  function setAppointmentFormState(stateName, headingText, detailText) {
    var form = document.getElementById('appointment-form');
    var submitBtn = document.getElementById('appointment-submit');
    var submitLabel = document.getElementById('appointment-submit-label');
    var statusEl = document.getElementById('appointment-status');
    if (!form) return;

    var cfg = TD.APPOINTMENT_CONFIG || {};
    var hasEndpoint = Boolean(cfg.endpoint && String(cfg.endpoint).trim());
    var isLoading = stateName === 'loading';
    isSubmittingAppointment = isLoading;

    if (submitBtn) {
      submitBtn.disabled = isLoading;
      submitBtn.classList.toggle('is-loading', isLoading);
    }
    if (submitLabel) {
      submitLabel.textContent = isLoading ?
        hasEndpoint ?
          'Надсилання заявки…' :
          'Перевірка заявки…' :
        'Записатися на консультацію';
    }
    form.setAttribute('aria-busy', isLoading ? 'true' : 'false');

    if (!statusEl) return;

    statusEl.classList.remove('is-loading', 'is-success', 'is-error');
    if (stateName === 'idle') {
      statusEl.hidden = true;
      statusEl.textContent = '';
      return;
    }

    statusEl.hidden = false;
    if (stateName === 'loading') {
      statusEl.classList.add('is-loading');
    } else if (stateName === 'success') {
      statusEl.classList.add('is-success');
    } else if (stateName === 'error') {
      statusEl.classList.add('is-error');
    }

    var frag = document.createDocumentFragment();
    var pMain = document.createElement('p');
    pMain.className = 'form-status__title';
    pMain.textContent =
      headingText ||
      (stateName === 'success' ?
        'Дякуємо! Ми зв’яжемося з вами для підтвердження запису.' :
        stateName === 'error' ?
          'Не вдалося завершити надсилання заявки.' :
          hasEndpoint ?
            'Надсилаємо дані заявки…' :
            'Перевіряємо заповнені дані…');
    frag.appendChild(pMain);

    if (detailText) {
      var pDetail = document.createElement('p');
      pDetail.className = 'form-status__detail';
      pDetail.textContent = detailText;
      frag.appendChild(pDetail);
    }

    statusEl.textContent = '';
    statusEl.appendChild(frag);
  }

  function validateEntireAppointmentForm() {
    var nameEl = document.getElementById('appointment-name');
    var phoneEl = document.getElementById('appointment-phone');
    var timeEl = document.getElementById('appointment-preferred-time');
    var msgEl = document.getElementById('appointment-message');
    var consentEl = document.getElementById('appointment-consent');

    var checks = [{
      el: nameEl,
      errEl: document.getElementById('appointment-name-error'),
      msg: validateAppointmentName(nameEl ? nameEl.value : '')
    },
    {
      el: phoneEl,
      errEl: document.getElementById('appointment-phone-error'),
      msg: validateAppointmentPhone(phoneEl ? phoneEl.value : '')
    },
    {
      el: timeEl,
      errEl: document.getElementById('appointment-preferred-time-error'),
      msg: validateAppointmentPreferredTime(timeEl ? timeEl.value : '')
    },
    {
      el: msgEl,
      errEl: document.getElementById('appointment-message-error'),
      msg: validateAppointmentMessage(msgEl ? msgEl.value : '')
    },
    {
      el: consentEl,
      errEl: document.getElementById('appointment-consent-error'),
      msg: validateAppointmentConsent(Boolean(consentEl && consentEl.checked))
    }
    ];

    var firstInvalid = null;
    for (var i = 0; i < checks.length; i++) {
      setAppointmentFieldError(checks[i].el, checks[i].errEl, checks[i].msg);
      if (checks[i].msg && !firstInvalid && checks[i].el) {
        firstInvalid = checks[i].el;
      }
    }

    return firstInvalid;
  }

  function focusContactsTarget(targetKind) {
    var heading = document.getElementById('heading-contacts');
    var nameInput = document.getElementById('appointment-name');
    var target = targetKind === 'form' && nameInput ? nameInput : heading;
    if (target && typeof target.focus === 'function') {
      window.requestAnimationFrame(function () {
        target.focus({
          preventScroll: true
        });
      });
    }
  }

  function bindAppointmentForm() {
    var form = document.getElementById('appointment-form');
    var clearCalcBtn = document.getElementById('appointment-calc-clear');
    var msgEl = document.getElementById('appointment-message');

    if (clearCalcBtn && !clearCalcBtn.dataset.clearCalcBound) {
      clearCalcBtn.dataset.clearCalcBound = '1';
      clearCalcBtn.addEventListener('click', function () {
        applyCalcSelectionToForm(null);
        if (TD.state) TD.state.calcSelection = null;
        var serviceSel = document.getElementById('appointment-service');
        if (serviceSel && serviceSel.value === 'calc-bundle') {
          serviceSel.value = 'consultation';
        }
      });
    }

    if (msgEl && !msgEl.dataset.msgBound) {
      msgEl.dataset.msgBound = '1';
      msgEl.addEventListener('input', function () {
        if (msgEl.dataset.calcAutofill === '1') {
          delete msgEl.dataset.calcAutofill;
        }
        updateMessageCounter();
      });
      updateMessageCounter();
    }

    if (!form || form.dataset.appointmentBound) return;
    form.dataset.appointmentBound = '1';

    var fieldPairs = [{
      el: document.getElementById('appointment-name'),
      errId: 'appointment-name-error',
      fn: function (el) {
        return validateAppointmentName(el.value);
      }
    },
    {
      el: document.getElementById('appointment-phone'),
      errId: 'appointment-phone-error',
      fn: function (el) {
        return validateAppointmentPhone(el.value);
      }
    },
    {
      el: document.getElementById('appointment-preferred-time'),
      errId: 'appointment-preferred-time-error',
      fn: function (el) {
        return validateAppointmentPreferredTime(el.value);
      }
    },
    {
      el: document.getElementById('appointment-message'),
      errId: 'appointment-message-error',
      fn: function (el) {
        return validateAppointmentMessage(el.value);
      }
    },
    {
      el: document.getElementById('appointment-consent'),
      errId: 'appointment-consent-error',
      fn: function (el) {
        return validateAppointmentConsent(el.checked);
      }
    }
    ];

    for (var i = 0; i < fieldPairs.length; i++) {
      (function (pair) {
        if (!pair.el) return;
        var evtName = pair.el.type === 'checkbox' ? 'change' : 'input';
        pair.el.addEventListener(evtName, function () {
          var errEl = document.getElementById(pair.errId);
          if (pair.el.getAttribute('aria-invalid') === 'true') {
            var nextMsg = pair.fn(pair.el);
            setAppointmentFieldError(pair.el, errEl, nextMsg);
          }
          var statusEl = document.getElementById('appointment-status');
          if (statusEl && statusEl.classList.contains('is-error')) {
            setAppointmentFormState('idle');
          }
        });
      })(fieldPairs[i]);
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (isSubmittingAppointment) return;

      var firstInvalid = validateEntireAppointmentForm();
      if (firstInvalid) {
        setAppointmentFormState(
          'error',
          'Перевірте виділені поля форми.',
          'Будь ласка, заповніть коректно обов’язкові поля та підтвердіть згоду.'
        );
        firstInvalid.focus();
        return;
      }

      var cfg = TD.APPOINTMENT_CONFIG || {};
      var endpoint = cfg.endpoint ? String(cfg.endpoint).trim() : '';
      var clinic = TD.CLINIC || {};

      var nameEl = document.getElementById('appointment-name');
      var phoneEl = document.getElementById('appointment-phone');
      var methodEl = document.getElementById('appointment-contact-method');
      var serviceEl = document.getElementById('appointment-service');
      var timeEl = document.getElementById('appointment-preferred-time');

      var payload = {
        clinic: clinic.NAME || 'TRUST DENTAL',
        placeId: clinic.GOOGLE_PLACE_ID || '',
        name: nameEl ? nameEl.value.trim() : '',
        phone: phoneEl ? phoneEl.value.trim() : '',
        contactMethod: methodEl ? methodEl.value : 'phone',
        service: serviceEl ? serviceEl.value : 'consultation',
        preferredTime: timeEl ? timeEl.value.trim() : '',
        message: msgEl ? msgEl.value.trim() : '',
        calcSelection: activeCalcSelection ?
          {
            total: activeCalcSelection.total,
            formattedTotal: activeCalcSelection.formattedTotal,
            summaryText: activeCalcSelection.summaryText,
            items: activeCalcSelection.items
          } :
          null,
        consent: true
      };

      clearAppointmentTimer();
      setAppointmentFormState('loading');

      if (endpoint && isSafeEndpointUrl(endpoint)) {
        fetchWithTimeout(
          endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          cache: 'no-store',
          credentials: isSameOriginUrl(endpoint) ? 'same-origin' : 'omit',
          body: JSON.stringify(payload)
        },
          12000,
          'appointment'
        )
          .then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            setAppointmentFormState(
              'success',
              'Дякуємо! Ми зв’яжемося з вами для підтвердження запису.'
            );
          })
          .catch(function (err) {
            if (err && err.message === 'Fetch API is unavailable') {
              setAppointmentFormState(
                'error',
                'Браузер не підтримує автоматичне надсилання.',
                'Зателефонуйте нам за номером ' + (clinic.PHONE_DISPLAY || '') + '.'
              );
              return;
            }
            setAppointmentFormState(
              'error',
              'Не вдалося надіслати заявку на сервер.',
              'Перевірте з’єднання або зателефонуйте напряму: ' +
              (clinic.PHONE_DISPLAY || '+38 (050) 050-08-21') +
              '.'
            );
          });
        return;
      }

      appointmentTimer = window.setTimeout(function () {
        appointmentTimer = null;
        var calcNote = activeCalcSelection ?
          ' Попередній розрахунок (' + activeCalcSelection.formattedTotal + ') додано до заявки.' :
          '';
        setAppointmentFormState(
          'success',
          'Дякуємо! Ми зв’яжемося з вами для підтвердження запису.',
          'Локальна перевірка форми пройшла успішно. Сервер приймання заявок ще не підключений, тому дані не передавалися на сервер — для швидкого запису зателефонуйте: ' +
          (clinic.PHONE_DISPLAY || '+38 (050) 050-08-21') +
          '.' +
          calcNote
        );
      }, 150);
    });
  }

  function onRenderPageHideCleanup() {
    clearAppointmentTimer();
    abortActiveFetch('reviews');
    abortActiveFetch('appointment');
    if (isSubmittingAppointment) {
      setAppointmentFormState('idle');
    }
    clearSliderTimers();
    if (reviewsSliderState.resizeRaf) {
      window.cancelAnimationFrame(reviewsSliderState.resizeRaf);
      reviewsSliderState.resizeRaf = null;
    }
    var modalKeys = ['work', 'gallery'];
    for (var i = 0; i < modalKeys.length; i++) {
      var ctrl = lightboxControllers[modalKeys[i]];
      if (ctrl && ctrl.closeTimer) {
        window.clearTimeout(ctrl.closeTimer);
        ctrl.closeTimer = null;
      }
    }
    if (galleryResizeRaf) {
      window.cancelAnimationFrame(galleryResizeRaf);
      galleryResizeRaf = null;
    }
  }

  function bindContactsAndCalcListeners() {
    if (!document.body.dataset.tdContactsGlobalBound) {
      document.body.dataset.tdContactsGlobalBound = '1';

      document.addEventListener('td:calc-select', function (e) {
        if (e && e.detail) {
          applyCalcSelectionToForm(e.detail);
          focusContactsTarget('form');
        }
      });

      document.addEventListener('click', function (e) {
        var link = e.target.closest('a[href="#contacts"], a[href="#top"]');
        if (!link) return;
        var href = link.getAttribute('href');

        if (href === '#contacts') {
          var contacts = document.getElementById('contacts');
          if (!contacts) return;
          e.preventDefault();
          scrollToTarget(contacts);
          var isBookingCta = !link.hasAttribute('data-nav-target');
          focusContactsTarget(isBookingCta ? 'form' : 'heading');
        } else if (href === '#top') {
          e.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: prefersReducedMotion() ? 'auto' : 'smooth'
          });
          var skip = document.querySelector('.skip-link');
          if (skip && typeof skip.focus === 'function') {
            skip.focus({
              preventScroll: true
            });
          }
        }
      });

      if (TD.lifecycle && typeof TD.lifecycle.onPageHide === 'function') {
        TD.lifecycle.onPageHide(onRenderPageHideCleanup);
      } else {
        window.addEventListener('pagehide', onRenderPageHideCleanup);
      }
    }
  }

  function initContactsSection() {
    syncContactsStaticLists();
    initContactsMapCard();
    syncPrivacySlots();
    bindAppointmentForm();
    bindContactsAndCalcListeners();

    if (TD.state && TD.state.calcSelection) {
      applyCalcSelectionToForm(TD.state.calcSelection);
    }
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    initHeroImageReady();
    initFooterLogoReady();
    renderServices();
    renderWorksCarousel();
    bindWorkModal();
    initGallery();
    renderReviews();
    initContactsSection();
    initDoctorMediaFallbacks();
  }

  TD.contacts = {
    init: initContactsSection,
    applyCalcSelection: applyCalcSelectionToForm,
    setFormState: setAppointmentFormState,
    validateForm: validateEntireAppointmentForm
  };

  TD.gallery = {
    init: initGallery,
    goToSlide: function (group, index) {
      if (!isInitialized) init();
      goToGallerySlide(group, index);
    },
    openModal: function (group, id, triggerEl) {
      if (!isInitialized) init();
      openGalleryModal(group, id, triggerEl);
    },
    closeModal: closeGalleryModal,
    getState: function (group) {
      var st = galleryGroupsState[group];
      return st ?
        {
          currentIndex: st.currentIndex,
          perView: st.perView,
          maxIndex: st.maxIndex,
          totalSlides: st.totalSlides
        } :
        null;
    }
  };

  TD.render = {
    init: init,
    goToWorkSlide: function (index) {
      if (!isInitialized) init();
      goToWorkSlide(index);
    },
    getWorksCarouselState: function () {
      return {
        currentIndex: worksCarouselState.currentIndex,
        totalSlides: worksCarouselState.totalSlides
      };
    },
    setReviewsState: function (stateName, list, metaOverride) {
      if (!isInitialized) init();
      setReviewsState(stateName, list, metaOverride);
    },
    loadReviews: function (endpointOverride) {
      if (!isInitialized) init();
      return loadReviewsFromAdapter(endpointOverride);
    },
    getReviewsSliderState: function () {
      return {
        currentIndex: reviewsSliderState.currentIndex,
        perView: reviewsSliderState.perView,
        maxIndex: reviewsSliderState.maxIndex,
        totalSlides: reviewsSliderState.totalSlides,
        userPaused: reviewsSliderState.userPaused,
        hoverPaused: reviewsSliderState.hoverPaused,
        focusPaused: reviewsSliderState.focusPaused,
        expandedPaused: reviewsSliderState.expandedPaused,
        hiddenPaused: reviewsSliderState.hiddenPaused,
        reducedMotion: reviewsSliderState.reducedMotion,
        hasAutoplayTimer: Boolean(reviewsSliderState.autoplayTimer),
        hasResumeTimer: Boolean(reviewsSliderState.resumeTimer)
      };
    },
    openWorkModal: openWorkModal,
    closeWorkModal: closeWorkModal
  };
})(window, document);