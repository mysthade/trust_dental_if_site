/* ==========================================================================
   TRUST DENTAL — Safe DOM Renderer: Services & Filterable Prices
   Namespace: window.TD.render (zero innerHTML from untrusted data)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var SVG_NS = 'http://www.w3.org/2000/svg';
  var isInitialized = false;
  var activeCategory = 'all';
  var activeWorkCategory = 'all';
  var activeModalWorkId = null;
  var lastModalTriggerEl = null;
  var modalCloseTimer = null;

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
      var basePath = svc.iconImg.indexOf('/') === -1
        ? 'img/services/' + svc.iconImg
        : svc.iconImg;
      var pic = document.createElement('picture');
      pic.className = 'service-card__picture';

      var source = document.createElement('source');
      source.type = 'image/webp';
      source.srcset = basePath + '.webp';

      var img = document.createElement('img');
      img.className = 'service-card__img';
      img.src = basePath + '.png';
      img.width = 160;
      img.height = 160;
      img.decoding = 'async';
      img.alt = '';

      function markLoaded() {
        if (img.naturalWidth > 0) {
          wrap.classList.add('is-loaded');
          wrap.classList.remove('is-fallback');
        } else {
          markFallback();
        }
      }

      img.addEventListener('load', markLoaded);
      img.addEventListener('error', markFallback);

      pic.appendChild(source);
      pic.appendChild(img);
      wrap.appendChild(pic);

      if (img.complete) {
        markLoaded();
      }
    } else {
      markFallback();
    }

    return wrap;
  }

  var lastAddedServiceTitle = '';

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
        typeof TD.findServiceById === 'function'
          ? TD.findServiceById(serviceId)
          : null;
      var svcTitle = svc && svc.title ? svc.title : '';
      var isSelected = isCalcReady && TD.calculator.isItemSelected(calcItemId);

      card.classList.toggle('is-selected', isSelected);

      var btn = card.querySelector('.service-card__add-to-calc[data-calc-item-id]');
      if (btn) {
        btn.classList.toggle('is-selected', isSelected);
        btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        btn.setAttribute(
          'aria-label',
          isSelected
            ? 'Послугу «' + svcTitle + '» вже додано до попереднього розрахунку'
            : 'Додати послугу «' + svcTitle + '» до попереднього розрахунку'
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
      TD.calculator && typeof TD.calculator.getSelection === 'function'
        ? TD.calculator.getSelection()
        : TD.state && TD.state.calcSelection
          ? TD.state.calcSelection
          : null;

    var count = selection && Array.isArray(selection.items) ? selection.items.length : 0;
    if (count > 0) {
      bar.classList.add('is-active');
      var word =
        typeof TD.pluralizeUk === 'function'
          ? TD.pluralizeUk(count, 'послуга', 'послуги', 'послуг')
          : 'послуг';
      var prefixText = lastAddedServiceTitle
        ? 'Послугу «' + lastAddedServiceTitle + '» додано до розрахунку · '
        : 'У попередньому розрахунку: ';
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
        svc.calcItemId && typeof TD.findCalcItemById === 'function'
          ? TD.findCalcItemById(svc.calcItemId)
          : null;

      var card = document.createElement('article');
      card.className = 'service-card';
      card.setAttribute('data-service-id', svc.id);
      if (calcItem) {
        card.setAttribute('data-calc-item-id', calcItem.id);
      }

      var title = document.createElement('h3');
      title.className = 'service-card__title';
      title.textContent = svc.title;

      var desc = document.createElement('p');
      desc.className = 'service-card__desc';
      desc.textContent = svc.description;

      var footer = document.createElement('div');
      footer.className = 'service-card__footer';

      var priceWrap = document.createElement('div');
      priceWrap.className = 'service-card__price-wrap';

      if (calcItem) {
        var priceVal = document.createElement('span');
        priceVal.className = 'service-card__price';
        priceVal.textContent = TD.formatPrice(calcItem.price, calcItem.prefix, 'грн');
        priceWrap.appendChild(priceVal);

        if (calcItem.note) {
          var priceMeta = document.createElement('span');
          priceMeta.className = 'service-card__price-meta';
          priceMeta.textContent = calcItem.note;
          priceWrap.appendChild(priceMeta);
        }
      } else {
        var priceNote = document.createElement('span');
        priceNote.className = 'service-card__price-note';
        priceNote.textContent = 'Ця послуга потребує індивідуального розрахунку';
        priceWrap.appendChild(priceNote);
      }

      var actionBtn = document.createElement('button');
      actionBtn.type = 'button';
      actionBtn.className = 'service-card__add-to-calc';
      actionBtn.setAttribute('data-service-id', svc.id);

      var iconSpan = document.createElement('span');
      iconSpan.className = 'service-card__add-icon';
      iconSpan.setAttribute('aria-hidden', 'true');

      var labelSpan = document.createElement('span');
      labelSpan.className = 'service-card__add-label';

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
          var contactsEl = document.getElementById('contacts');
          if (contactsEl && typeof contactsEl.scrollIntoView === 'function') {
            contactsEl.scrollIntoView({
              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
              block: 'start'
            });
          }
          focusContactsTarget('form');
          return;
        }

        var jumpBtn = e.target.closest('[data-calc-jump]');
        if (jumpBtn) {
          var calcEl = document.getElementById('calculator');
          if (calcEl && typeof calcEl.scrollIntoView === 'function') {
            calcEl.scrollIntoView({
              behavior: prefersReducedMotion() ? 'auto' : 'smooth',
              block: 'start'
            });
          }
          var calcHeading = document.getElementById('heading-calculator');
          if (calcHeading && typeof calcHeading.focus === 'function') {
            calcHeading.setAttribute('tabindex', '-1');
            calcHeading.focus({ preventScroll: true });
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
     2. Price Filters (#price-filters) & Price Rows (#price-list)
     ------------------------------------------------------------------------ */
  function getCategoryLabel(catId) {
    if (!catId || !Array.isArray(TD.PRICE_FILTERS)) return '';
    for (var i = 0; i < TD.PRICE_FILTERS.length; i++) {
      if (TD.PRICE_FILTERS[i].id === catId) return TD.PRICE_FILTERS[i].label;
    }
    return '';
  }

  function renderPriceFilters() {
    var container = document.getElementById('price-filters');
    if (!container || !Array.isArray(TD.PRICE_FILTERS)) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < TD.PRICE_FILTERS.length; i++) {
      var filter = TD.PRICE_FILTERS[i];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-pill' + (filter.id === activeCategory ? ' is-active' : '');
      btn.setAttribute('data-filter', filter.id);
      btn.setAttribute('aria-pressed', filter.id === activeCategory ? 'true' : 'false');
      btn.textContent = filter.label;
      frag.appendChild(btn);
    }

    container.textContent = '';
    container.appendChild(frag);

    if (!container.dataset.priceFilterBound) {
      container.dataset.priceFilterBound = '1';
      container.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-filter]');
        if (!btn) return;
        var cat = btn.getAttribute('data-filter');
        if (cat && cat !== activeCategory) {
          applyPriceFilter(cat, true);
        }
      });

      bindRovingPillKeys(container, '[data-filter]');
    }
  }

  function bindRovingPillKeys(container, selector) {
    /* Arrow-key convenience alongside standard Tab navigation */
    container.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') {
        return;
      }
      var buttons = container.querySelectorAll(selector);
      if (!buttons.length) return;
      var idx = Array.prototype.indexOf.call(buttons, document.activeElement);
      if (idx === -1) return;

      e.preventDefault();
      var nextIdx = idx;
      if (key === 'ArrowRight') nextIdx = (idx + 1) % buttons.length;
      else if (key === 'ArrowLeft') nextIdx = (idx - 1 + buttons.length) % buttons.length;
      else if (key === 'Home') nextIdx = 0;
      else if (key === 'End') nextIdx = buttons.length - 1;
      buttons[nextIdx].focus();
    });
  }

  function renderPriceList() {
    var container = document.getElementById('price-list');
    if (!container || !Array.isArray(TD.PRICES)) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < TD.PRICES.length; i++) {
      var item = TD.PRICES[i];
      var row = document.createElement('li');
      row.className = 'price-row';
      row.setAttribute('data-category', item.category || '');
      row.setAttribute('data-price-id', item.id);

      var info = document.createElement('div');
      info.className = 'price-row__info';

      var title = document.createElement('span');
      title.className = 'price-row__title';
      title.textContent = item.title;
      info.appendChild(title);

      var catLabel = getCategoryLabel(item.category);
      if (catLabel || item.note) {
        var meta = document.createElement('div');
        meta.className = 'price-row__meta';
        if (catLabel) {
          var badge = document.createElement('span');
          badge.className = 'price-row__cat';
          badge.textContent = catLabel;
          meta.appendChild(badge);
        }
        if (item.note) {
          var note = document.createElement('span');
          note.className = 'price-row__note';
          note.textContent = item.note;
          meta.appendChild(note);
        }
        info.appendChild(meta);
      }

      var cost = document.createElement('span');
      cost.className = 'price-row__cost';
      cost.textContent = TD.formatPrice(item.price, item.prefix, item.unit);

      row.appendChild(info);
      row.appendChild(cost);
      frag.appendChild(row);
    }

    container.textContent = '';
    container.appendChild(frag);
    updatePriceStatus(TD.PRICES.length, 'all');
  }

  function updatePriceStatus(visibleCount, categoryId) {
    var status = document.getElementById('price-status');
    if (!status || !Array.isArray(TD.PRICES)) return;
    var label = getCategoryLabel(categoryId) || 'Всі';
    var word = TD.pluralizeUk(visibleCount, 'позиція', 'позиції', 'позицій');
    status.textContent =
      'Категорія «' + label + '»: ' + visibleCount + ' ' + word + ' із ' + TD.PRICES.length;
  }

  function applyPriceFilter(categoryId, animate) {
    var valid = false;
    for (var i = 0; i < TD.PRICE_FILTERS.length; i++) {
      if (TD.PRICE_FILTERS[i].id === categoryId) {
        valid = true;
        break;
      }
    }
    var target = valid ? categoryId : 'all';
    activeCategory = target;

    var filterBtns = document.querySelectorAll('#price-filters [data-filter]');
    for (var b = 0; b < filterBtns.length; b++) {
      var isMatch = filterBtns[b].getAttribute('data-filter') === target;
      filterBtns[b].classList.toggle('is-active', isMatch);
      filterBtns[b].setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    }

    var rows = document.querySelectorAll('#price-list .price-row');
    var visibleCount = 0;
    var shouldAnimate = Boolean(animate) && !prefersReducedMotion();

    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var rowCat = row.getAttribute('data-category');
      var matches = target === 'all' || (rowCat !== '' && rowCat === target);

      if (matches) {
        visibleCount++;
        row.hidden = false;
        row.classList.remove('is-filtered-out', 'td-reveal-pending', 'is-revealing');
        row.classList.add('is-visible', 'is-revealed');
        if (shouldAnimate) {
          row.classList.add('is-entering');
        }
      } else {
        row.classList.remove('is-entering');
        row.classList.add('is-filtered-out');
        row.hidden = true;
      }
    }

    if (shouldAnimate) {
      var clearEnteringRows = function () {
        for (var j = 0; j < rows.length; j++) {
          rows[j].classList.remove('is-entering');
        }
      };
      if (document.hidden || typeof window.requestAnimationFrame !== 'function') {
        window.setTimeout(clearEnteringRows, 16);
      } else {
        window.requestAnimationFrame(clearEnteringRows);
      }
    }

    updatePriceStatus(visibleCount, target);
  }

  function initDoctorMediaFallbacks() {
    var images = document.querySelectorAll('.doctor-card__img');
    for (var i = 0; i < images.length; i++) {
      (function (img) {
        var wrap = img.closest('.doctor-card__media');
        if (!wrap) return;

        if (img.dataset.doctorBound) return;
        img.dataset.doctorBound = '1';

        function onLoad() {
          if (img.naturalWidth > 0) {
            wrap.classList.add('is-loaded');
            wrap.classList.remove('is-fallback');
          } else {
            wrap.classList.add('is-fallback');
            wrap.classList.remove('is-loaded');
          }
        }

        function onError() {
          wrap.classList.add('is-fallback');
          wrap.classList.remove('is-loaded');
        }

        img.addEventListener('load', onLoad);
        img.addEventListener('error', onError);

        if (img.complete) {
          onLoad();
        }
      })(images[i]);
    }
  }

  /* ------------------------------------------------------------------------
     4. Clinical Works Showcase (#works-filters, #works-grid, #work-modal)
     ------------------------------------------------------------------------ */
  function getWorkFilterLabel(catId) {
    if (!catId || !Array.isArray(TD.WORK_FILTERS)) return '';
    for (var i = 0; i < TD.WORK_FILTERS.length; i++) {
      if (TD.WORK_FILTERS[i].id === catId) return TD.WORK_FILTERS[i].label;
    }
    return '';
  }

  function getFilteredWorks(catId) {
    if (!Array.isArray(TD.WORKS)) return [];
    if (!catId || catId === 'all') return TD.WORKS.slice();
    var out = [];
    for (var i = 0; i < TD.WORKS.length; i++) {
      if (TD.WORKS[i].category === catId) out.push(TD.WORKS[i]);
    }
    return out;
  }

  function findWorkById(id) {
    if (!id || !Array.isArray(TD.WORKS)) return null;
    for (var i = 0; i < TD.WORKS.length; i++) {
      if (TD.WORKS[i].id === id) return TD.WORKS[i];
    }
    return null;
  }

  function createWorkFigure(item, kind, isModal) {
    var fig = document.createElement('figure');
    fig.className = 'work-card__figure';

    var slot = document.createElement('div');
    slot.className = 'work-card__slot';

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
    } else if (kind === 'after') {
      src = item.afterImage || '';
      fallbackSrc = item.afterFallback || '';
      altText = item.afterAlt || ('Стан після лікування: ' + item.title);
      captionLabel = 'Після';
      iconId = 'td-work-after';
      hintLabel = 'Фото «після»';
    } else {
      src = item.coverImage || '';
      fallbackSrc = item.coverFallback || '';
      altText = item.coverAlt || ('Приклад лікування: ' + item.title);
      captionLabel = 'Клінічний випадок';
      iconId = 'td-work-after';
      hintLabel = 'Приклад лікування';
    }

    var fallback = document.createElement('div');
    fallback.className = 'work-card__fallback';
    fallback.setAttribute('aria-hidden', 'true');
    fallback.appendChild(createSvgUse(iconId, 'work-card__fallback-svg'));
    var hintSpan = document.createElement('span');
    hintSpan.className = 'work-card__fallback-label';
    hintSpan.textContent = hintLabel;
    fallback.appendChild(hintSpan);
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
      img.loading = isModal ? 'eager' : 'lazy';
      img.decoding = 'async';
      img.alt = altText;

      function onWorkImgLoad() {
        if (img.naturalWidth > 0) {
          slot.classList.add('is-loaded');
          slot.classList.remove('is-fallback');
        } else {
          slot.classList.add('is-fallback');
          slot.classList.remove('is-loaded');
        }
      }

      function onWorkImgError() {
        slot.classList.add('is-fallback');
        slot.classList.remove('is-loaded');
      }

      img.addEventListener('load', onWorkImgLoad);
      img.addEventListener('error', onWorkImgError);

      pic.appendChild(img);
      slot.appendChild(pic);

      if (img.complete) {
        onWorkImgLoad();
      }
    } else {
      slot.classList.add('is-fallback');
      slot.setAttribute('role', 'img');
      slot.setAttribute('aria-label', altText + ' (очікує завантаження фото)');
    }

    var caption = document.createElement('figcaption');
    caption.className = 'work-card__caption' + (kind === 'after' ? ' is-after' : '');
    caption.textContent = captionLabel;

    fig.appendChild(slot);
    fig.appendChild(caption);
    return fig;
  }

  function createWorkCard(item) {
    var card = document.createElement('article');
    card.className = 'work-card';
    card.setAttribute('data-work-id', item.id);
    card.setAttribute('data-category', item.category || '');

    var trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'work-card__trigger';
    trigger.setAttribute('data-work-open', item.id);
    trigger.setAttribute('aria-label', 'Переглянути приклад лікування: ' + item.title);

    var hasPair = Boolean(item.beforeImage && item.afterImage);
    if (hasPair) {
      var comp = document.createElement('div');
      comp.className = 'work-card__comparison';
      comp.appendChild(createWorkFigure(item, 'before', false));
      comp.appendChild(createWorkFigure(item, 'after', false));
      trigger.appendChild(comp);
    } else {
      var single = document.createElement('div');
      single.className = 'work-card__media';
      single.appendChild(createWorkFigure(item, 'cover', false));
      trigger.appendChild(single);
    }

    var body = document.createElement('div');
    body.className = 'work-card__body';

    var cat = document.createElement('span');
    cat.className = 'work-card__category';
    cat.textContent = item.categoryLabel || getWorkFilterLabel(item.category);

    var title = document.createElement('h3');
    title.className = 'work-card__title';
    title.textContent = item.title;

    var desc = document.createElement('p');
    desc.className = 'work-card__description';
    desc.textContent = item.description;

    var ctaBtn = document.createElement('button');
    ctaBtn.type = 'button';
    ctaBtn.className = 'btn btn--outline work-card__link';
    ctaBtn.setAttribute('data-work-open', item.id);
    ctaBtn.setAttribute('aria-label', 'Переглянути приклад: ' + item.title);

    var ctaLabel = document.createElement('span');
    ctaLabel.textContent = 'Переглянути приклад';
    ctaBtn.appendChild(ctaLabel);
    ctaBtn.appendChild(createArrowSvg('btn__arrow'));

    body.appendChild(cat);
    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(ctaBtn);

    card.appendChild(trigger);
    card.appendChild(body);
    return card;
  }

  function updateWorksStatus(count, categoryId) {
    var status = document.getElementById('works-status');
    if (!status || !Array.isArray(TD.WORKS)) return;
    var label = getWorkFilterLabel(categoryId) || 'Усі';
    if (count === 0) {
      status.textContent =
        'Категорія «' + label + '»: приклади для цієї категорії будуть додані пізніше.';
      return;
    }
    var word = TD.pluralizeUk(count, 'приклад', 'приклади', 'прикладів');
    status.textContent =
      'Категорія «' + label + '»: ' + count + ' ' + word + ' із ' + TD.WORKS.length;
  }

  function renderWorkFilters() {
    var container = document.getElementById('works-filters');
    if (!container || !Array.isArray(TD.WORK_FILTERS)) return;

    var frag = document.createDocumentFragment();
    for (var i = 0; i < TD.WORK_FILTERS.length; i++) {
      var filter = TD.WORK_FILTERS[i];
      var isActive = filter.id === activeWorkCategory;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter-pill' + (isActive ? ' is-active' : '');
      btn.setAttribute('data-work-filter', filter.id);
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      btn.textContent = filter.label;
      frag.appendChild(btn);
    }

    container.textContent = '';
    container.appendChild(frag);

    if (!container.dataset.workFilterBound) {
      container.dataset.workFilterBound = '1';
      container.addEventListener('click', function (e) {
        var btn = e.target.closest('[data-work-filter]');
        if (!btn) return;
        var cat = btn.getAttribute('data-work-filter');
        if (cat && cat !== activeWorkCategory) {
          applyWorkFilter(cat);
        }
      });

      bindRovingPillKeys(container, '[data-work-filter]');
    }
  }

  function renderWorksGrid(animate) {
    var grid = document.getElementById('works-grid');
    var empty = document.getElementById('works-empty');
    if (!grid) return;

    var list = getFilteredWorks(activeWorkCategory);

    if (!list.length) {
      grid.textContent = '';
      grid.hidden = true;
      if (empty) empty.hidden = false;
      updateWorksStatus(0, activeWorkCategory);
      return;
    }

    var shouldAnimate = Boolean(animate) && !prefersReducedMotion();
    var frag = document.createDocumentFragment();
    var cards = [];
    for (var i = 0; i < list.length; i++) {
      var card = createWorkCard(list[i]);
      card.setAttribute('data-reveal', 'card');
      card.classList.add('is-visible', 'is-revealed');
      if (shouldAnimate) {
        card.classList.add('is-entering');
      }
      cards.push(card);
      frag.appendChild(card);
    }

    grid.textContent = '';
    grid.hidden = false;
    grid.appendChild(frag);
    if (empty) empty.hidden = true;

    if (shouldAnimate && cards.length) {
      var clearEnteringCards = function () {
        for (var j = 0; j < cards.length; j++) {
          cards[j].classList.remove('is-entering');
        }
      };
      if (document.hidden || typeof window.requestAnimationFrame !== 'function') {
        window.setTimeout(clearEnteringCards, 16);
      } else {
        window.requestAnimationFrame(clearEnteringCards);
      }
    }

    updateWorksStatus(list.length, activeWorkCategory);

    if (!grid.dataset.workModalBound) {
      grid.dataset.workModalBound = '1';
      grid.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-work-open]');
        if (!trigger) return;
        var workId = trigger.getAttribute('data-work-open');
        if (workId) {
          openWorkModal(workId, trigger);
        }
      });
    }
  }

  function applyWorkFilter(categoryId) {
    var valid = false;
    if (Array.isArray(TD.WORK_FILTERS)) {
      for (var i = 0; i < TD.WORK_FILTERS.length; i++) {
        if (TD.WORK_FILTERS[i].id === categoryId) {
          valid = true;
          break;
        }
      }
    }
    var target = valid ? categoryId : 'all';
    activeWorkCategory = target;

    var filterBtns = document.querySelectorAll('#works-filters [data-work-filter]');
    for (var b = 0; b < filterBtns.length; b++) {
      var isMatch = filterBtns[b].getAttribute('data-work-filter') === target;
      filterBtns[b].classList.toggle('is-active', isMatch);
      filterBtns[b].setAttribute('aria-pressed', isMatch ? 'true' : 'false');
    }

    renderWorksGrid(true);
  }

  /* ------------------------------------------------------------------------
     5. Works Lightbox / Detail Modal (#work-modal)
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
  }

  function getModalList() {
    var filtered = getFilteredWorks(activeWorkCategory);
    if (filtered.length) return filtered;
    return Array.isArray(TD.WORKS) ? TD.WORKS.slice() : [];
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

    if (catEl) catEl.textContent = item.categoryLabel || getWorkFilterLabel(item.category);
    if (titleEl) titleEl.textContent = item.title;
    if (descEl) descEl.textContent = item.description;

    if (mediaEl) {
      var frag = document.createDocumentFragment();
      if (item.beforeImage && item.afterImage) {
        mediaEl.classList.remove('is-single');
        frag.appendChild(createWorkFigure(item, 'before', true));
        frag.appendChild(createWorkFigure(item, 'after', true));
      } else {
        mediaEl.classList.add('is-single');
        frag.appendChild(createWorkFigure(item, 'cover', true));
      }
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
    renderWorkModalContent(nextItem);
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

  function onWorkModalKeyDown(e) {
    var modal = document.getElementById('work-modal');
    if (!modal || modal.hidden) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeWorkModal(true);
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      stepWorkModal(-1);
      return;
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      stepWorkModal(1);
      return;
    }

    if (e.key === 'Tab') {
      var dialog = modal.querySelector('.work-modal__dialog');
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

  function openWorkModal(workId, triggerEl) {
    var modal = document.getElementById('work-modal');
    var item = findWorkById(workId);
    if (!modal || !item) return;

    if (modalCloseTimer) {
      window.clearTimeout(modalCloseTimer);
      modalCloseTimer = null;
    }

    activeModalWorkId = item.id;
    lastModalTriggerEl = triggerEl || document.activeElement;
    renderWorkModalContent(item);

    modal.hidden = false;
    document.documentElement.classList.add('is-modal-open');
    setModalBackgroundInert(true);

    window.requestAnimationFrame(function () {
      modal.classList.add('is-open');
      var closeBtn = document.getElementById('work-modal-close');
      var dialog = modal.querySelector('.work-modal__dialog');
      if (closeBtn) {
        closeBtn.focus({ preventScroll: true });
      } else if (dialog) {
        dialog.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', onWorkModalKeyDown);
  }

  function closeWorkModal(restoreFocus) {
    var modal = document.getElementById('work-modal');
    if (!modal || modal.hidden) return;

    modal.classList.remove('is-open');
    document.documentElement.classList.remove('is-modal-open');
    setModalBackgroundInert(false);
    document.removeEventListener('keydown', onWorkModalKeyDown);

    var hideAfter = prefersReducedMotion() ? 0 : 220;
    modalCloseTimer = window.setTimeout(function () {
      if (!modal.classList.contains('is-open')) {
        modal.hidden = true;
      }
      modalCloseTimer = null;
    }, hideAfter);

    if (restoreFocus && lastModalTriggerEl && typeof lastModalTriggerEl.focus === 'function') {
      lastModalTriggerEl.focus({ preventScroll: true });
    }
    lastModalTriggerEl = null;
    activeModalWorkId = null;
  }

  function bindWorkModal() {
    var modal = document.getElementById('work-modal');
    var resetEmptyBtn = document.getElementById('works-reset-filter');

    if (resetEmptyBtn && !resetEmptyBtn.dataset.worksResetBound) {
      resetEmptyBtn.dataset.worksResetBound = '1';
      resetEmptyBtn.addEventListener('click', function () {
        applyWorkFilter('all');
      });
    }

    if (!modal || modal.dataset.modalBound) return;
    modal.dataset.modalBound = '1';

    var backdrop = document.getElementById('work-modal-backdrop');
    var closeBtn = document.getElementById('work-modal-close');
    var prevBtn = document.getElementById('work-modal-prev');
    var nextBtn = document.getElementById('work-modal-next');
    var ctaLink = document.getElementById('work-modal-cta');

    if (backdrop) {
      backdrop.addEventListener('click', function () {
        closeWorkModal(true);
      });
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeWorkModal(true);
      });
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        stepWorkModal(-1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        stepWorkModal(1);
      });
    }
    if (ctaLink) {
      ctaLink.addEventListener('click', function () {
        closeWorkModal(false);
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
    resizeRaf: null,
    touchStartX: 0,
    touchStartY: 0,
    touchIgnore: true
  };

  function isSafeHttpUrl(url) {
    return /^https?:\/\/\S+$/i.test(String(url || '').trim());
  }

  function isAllowedAvatarSrc(url) {
    var clean = String(url || '').trim();
    return isSafeHttpUrl(clean) || /^(\/)?img\//i.test(clean);
  }

  function getReviewsMeta(overrideMeta) {
    var src = overrideMeta || TD.REVIEWS_META || {};
    var clinic = TD.CLINIC || {};
    var fallbackUrl = clinic.GOOGLE_MAPS_URL || '';
    var googleUrl = isSafeHttpUrl(src.googleUrl)
      ? String(src.googleUrl).trim()
      : isSafeHttpUrl(fallbackUrl)
        ? String(fallbackUrl).trim()
        : '';

    var summaryVerified = Boolean(src.summaryVerified === true);
    var rawRating =
      src.rating !== undefined && src.rating !== null && src.rating !== ''
        ? Number(src.rating)
        : NaN;
    var hasValidRating =
      summaryVerified && isFinite(rawRating) && rawRating > 0 && rawRating <= 5;
    var ratingDisplay = hasValidRating
      ? src.ratingDisplay
        ? String(src.ratingDisplay)
        : rawRating.toFixed(1)
      : '';

    var rawCountSource =
      src.userRatingCount !== undefined ? src.userRatingCount : src.reviewsCount;
    var rawCount =
      rawCountSource !== undefined && rawCountSource !== null && rawCountSource !== ''
        ? Number(rawCountSource)
        : NaN;
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

    var stableId = raw.id !== undefined && raw.id !== null ? String(raw.id).trim() : '';
    var author = raw.author ? String(raw.author).trim() : '';
    var text = raw.text ? String(raw.text).trim() : '';
    if (!stableId || !author || !text) return null;

    var rawRating =
      raw.rating !== undefined && raw.rating !== null && raw.rating !== ''
        ? Number(raw.rating)
        : NaN;
    var normalizedRating =
      isFinite(rawRating) && rawRating >= 1 && rawRating <= 5
        ? Math.round(rawRating * 10) / 10
        : null;

    var relativeDate = raw.relativeDate
      ? String(raw.relativeDate).trim()
      : raw.date
        ? String(raw.date).trim()
        : '';
    var publishedAt = raw.publishedAt ? String(raw.publishedAt).trim() : '';
    var ownerReply = raw.ownerReply ? String(raw.ownerReply).trim() : '';
    var authorPhotoRaw = raw.authorPhoto ? String(raw.authorPhoto).trim() : '';
    var authorPhoto = isAllowedAvatarSrc(authorPhotoRaw) ? authorPhotoRaw : '';
    var googleUrl = isSafeHttpUrl(raw.googleUrl) ? String(raw.googleUrl).trim() : fallbackUrl;

    return Object.freeze({
      id: stableId,
      source: raw.source ? String(raw.source).trim() : 'Google',
      author: author,
      authorInitials: raw.authorInitials ? String(raw.authorInitials).trim() : '',
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
    var listRaw = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.reviews)
        ? payload.reviews
        : [];
    var payloadMeta =
      !Array.isArray(payload) && payload.meta && typeof payload.meta === 'object'
        ? payload.meta
        : payload;

    var mergedMeta = {
      sourceLabel: payloadMeta.source || metaBase.sourceLabel,
      sourceName: metaBase.sourceName,
      placeId: payloadMeta.placeId || metaBase.placeId,
      googleUrl: isSafeHttpUrl(payloadMeta.googleUrl)
        ? payloadMeta.googleUrl
        : metaBase.googleUrl,
      rating:
        payloadMeta.rating !== undefined && payloadMeta.rating !== null
          ? Number(payloadMeta.rating)
          : metaBase.rating,
      userRatingCount:
        payloadMeta.userRatingCount !== undefined && payloadMeta.userRatingCount !== null
          ? Number(payloadMeta.userRatingCount)
          : payloadMeta.reviewsCount !== undefined && payloadMeta.reviewsCount !== null
            ? Number(payloadMeta.reviewsCount)
            : metaBase.userRatingCount,
      summaryVerified:
        (payloadMeta.rating !== undefined &&
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

      if (!url || !isSafeHttpUrl(url) && url.charAt(0) !== '/') {
        return Promise.resolve({
          meta: meta,
          reviews: normalizeReviewsList(TD.REVIEWS, meta.googleUrl, false)
        });
      }

      if (typeof window.fetch !== 'function') {
        return Promise.reject(new Error('Fetch API is unavailable'));
      }

      return window
        .fetch(url, { headers: { Accept: 'application/json' } })
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
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
      return { isTruncated: false, excerpt: clean, full: clean };
    }
    var minBreak = Math.floor(limit * 0.55);
    var breakIdx = clean.lastIndexOf(' ', limit);
    if (breakIdx < minBreak) {
      breakIdx = clean.indexOf(' ', limit);
    }
    if (breakIdx === -1) {
      return { isTruncated: false, excerpt: clean, full: clean };
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
    var pluralFn =
      typeof TD.pluralizeUk === 'function'
        ? TD.pluralizeUk
        : function (n, one, few, many) {
            var a = Math.abs(Number(n)) % 100;
            var m = a % 10;
            if (a > 10 && a < 20) return many;
            if (m > 1 && m < 5) return few;
            return m === 1 ? one : many;
          };
    return count + ' ' + pluralFn(count, 'відгук', 'відгуки', 'відгуків');
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
      reviewsSliderState.userPaused
        ? 'Відновити автоматичне перемикання'
        : 'Призупинити автоматичне перемикання'
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
      stepReviewsSlider(1, { manual: false, announce: false });
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

    if (instant) {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(-' + offsetPx + 'px, 0, 0)';
      track.getBoundingClientRect();
      track.style.transition = '';
    } else {
      track.style.transform = 'translate3d(-' + offsetPx + 'px, 0, 0)';
    }

    if (dotsEl) {
      var dots = dotsEl.querySelectorAll('[role="tab"]');
      for (var i = 0; i < dots.length; i++) {
        var active = i === idx;
        dots[i].classList.toggle('is-active', active);
        dots[i].setAttribute('aria-selected', active ? 'true' : 'false');
        dots[i].tabIndex = active ? 0 : -1;
      }
    }

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
          stepReviewsSlider(-1, { manual: true, announce: true });
          pauseSliderAfterInteraction();
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener('click', function () {
          stepReviewsSlider(1, { manual: true, announce: true });
          pauseSliderAfterInteraction();
        });
      }

      if (dotsEl) {
        dotsEl.addEventListener('click', function (e) {
          var tab = e.target.closest('[role="tab"]');
          if (!tab) return;
          var idx = Number(tab.getAttribute('data-slide-to'));
          if (!isFinite(idx)) return;
          goToSliderIndex(idx, { manual: true, announce: true });
          pauseSliderAfterInteraction();
        });

        dotsEl.addEventListener('keydown', function (e) {
          var tabs = Array.prototype.slice.call(
            dotsEl.querySelectorAll('[role="tab"]')
          );
          if (!tabs.length) return;
          var current = tabs.indexOf(document.activeElement);
          if (current === -1) return;

          var next = current;
          if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
          else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = tabs.length - 1;
          else return;

          e.preventDefault();
          tabs[next].focus();
          goToSliderIndex(next, { manual: true, announce: true });
          pauseSliderAfterInteraction();
        });
      }

      if (pauseBtn) {
        pauseBtn.addEventListener('click', function () {
          if (reviewsSliderState.reducedMotion) return;
          reviewsSliderState.userPaused = !reviewsSliderState.userPaused;
          clearSliderTimers();
          syncSliderPauseButton();

          var liveSlide = document.getElementById('reviews-slider-status');
          if (liveSlide) {
            liveSlide.textContent = reviewsSliderState.userPaused
              ? 'Автоматичне перемикання призупинено.'
              : 'Автоматичне перемикання відновлено.';
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
        viewport.addEventListener(
          'touchstart',
          function (e) {
            if (!e.touches || e.touches.length !== 1) {
              reviewsSliderState.touchIgnore = true;
              return;
            }
            if (e.target && e.target.closest('button, a, [role="tab"]')) {
              reviewsSliderState.touchIgnore = true;
              return;
            }
            reviewsSliderState.touchIgnore = false;
            reviewsSliderState.touchStartX = e.touches[0].clientX;
            reviewsSliderState.touchStartY = e.touches[0].clientY;
          },
          { passive: true }
        );

        viewport.addEventListener(
          'touchend',
          function (e) {
            if (
              reviewsSliderState.touchIgnore ||
              !e.changedTouches ||
              !e.changedTouches.length
            ) {
              reviewsSliderState.touchIgnore = true;
              return;
            }
            var dx = e.changedTouches[0].clientX - reviewsSliderState.touchStartX;
            var dy = e.changedTouches[0].clientY - reviewsSliderState.touchStartY;
            reviewsSliderState.touchIgnore = true;

            if (Math.abs(dx) < 42 || Math.abs(dx) <= Math.abs(dy) * 1.2) {
              return;
            }

            if (dx < 0) {
              stepReviewsSlider(1, { manual: true, announce: true });
            } else {
              stepReviewsSlider(-1, { manual: true, announce: true });
            }
            pauseSliderAfterInteraction();
          },
          { passive: true }
        );

        viewport.addEventListener(
          'touchcancel',
          function () {
            reviewsSliderState.touchIgnore = true;
          },
          { passive: true }
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

      window.addEventListener('pagehide', function () {
        clearSliderTimers();
        if (modalCloseTimer) {
          window.clearTimeout(modalCloseTimer);
          modalCloseTimer = null;
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

      try {
        var mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
        if (mq && typeof mq.addEventListener === 'function') {
          mq.addEventListener('change', function () {
            reviewsSliderState.reducedMotion = Boolean(mq.matches);
            if (reviewsSliderState.reducedMotion) {
              clearSliderTimers();
            } else {
              scheduleSliderAutoplay();
            }
            syncSliderPauseButton();
          });
        }
      } catch (e) {}
    }
  }

  function createReviewCard(item, index, fallbackUrl) {
    var card = document.createElement('article');
    card.className = 'review-card';
    if (item.id) card.setAttribute('data-review-id', item.id);

    var head = document.createElement('header');
    head.className = 'review-card__head';

    var authorBox = document.createElement('div');
    authorBox.className = 'review-card__author';

    var avatar = document.createElement('div');
    avatar.className = 'review-card__avatar';

    var initials = document.createElement('span');
    initials.className = 'review-card__initials';
    initials.setAttribute('aria-hidden', 'true');
    initials.textContent = getReviewInitials(item.author, item.authorInitials);
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

      function markAvatarLoaded() {
        if (img.naturalWidth > 0) {
          avatar.classList.add('is-loaded');
          avatar.classList.remove('is-fallback');
        } else {
          markAvatarFallback();
        }
      }

      function markAvatarFallback() {
        avatar.classList.add('is-fallback');
        avatar.classList.remove('is-loaded');
      }

      img.addEventListener('load', markAvatarLoaded);
      img.addEventListener('error', markAvatarFallback);
      avatar.appendChild(img);
      if (img.complete) markAvatarLoaded();
    } else {
      avatar.classList.add('is-fallback');
      avatar.setAttribute('aria-hidden', 'true');
    }

    var identity = document.createElement('div');
    identity.className = 'review-card__identity';

    var nameEl = document.createElement('h3');
    nameEl.className = 'review-card__name';
    nameEl.textContent = item.author;

    var metaEl = document.createElement('p');
    metaEl.className = 'review-card__meta';
    var dateDisplay = item.relativeDate || item.publishedAt || '';
    metaEl.textContent = dateDisplay ? item.source + ' · ' + dateDisplay : item.source;

    identity.appendChild(nameEl);
    identity.appendChild(metaEl);

    authorBox.appendChild(avatar);
    authorBox.appendChild(identity);

    var sourceBadge = document.createElement('span');
    sourceBadge.className = 'review-card__source';
    sourceBadge.setAttribute('aria-label', 'Відгук із Google');
    sourceBadge.appendChild(createSvgUse('td-google-logo', 'review-card__source-icon'));
    var sourceText = document.createElement('span');
    sourceText.textContent = item.source;
    sourceBadge.appendChild(sourceText);

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
      var replyBox = document.createElement('div');
      replyBox.className = 'review-card__reply';
      var replyTitle = document.createElement('strong');
      replyTitle.className = 'review-card__reply-title';
      replyTitle.textContent = 'Відповідь власника';
      var replyBody = document.createElement('p');
      replyBody.className = 'review-card__reply-text';
      replyBody.textContent = item.ownerReply;
      replyBox.appendChild(replyTitle);
      replyBox.appendChild(replyBody);
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
    var targetEndpoint = endpointOverride
      ? String(endpointOverride).trim()
      : meta.endpoint;

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
        return { meta: meta, reviews: [] };
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
        var li = document.createElement('li');
        li.className = 'booking-steps__item';
        var num = document.createElement('span');
        num.className = 'booking-steps__num';
        num.setAttribute('aria-hidden', 'true');
        num.textContent = (i < 9 ? '0' : '') + (i + 1);
        var txt = document.createElement('span');
        txt.className = 'booking-steps__text';
        txt.textContent = String(cfg.bookingSteps[i]);
        li.appendChild(num);
        li.appendChild(txt);
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
    if (!container) return;

    var embedUrl = cfg.mapEmbedUrl ? String(cfg.mapEmbedUrl).trim() : '';
    if (!isSafeHttpUrl(embedUrl) || container.dataset.mapEmbedMounted) return;

    container.dataset.mapEmbedMounted = '1';
    var clinicUrl = (TD.CLINIC && TD.CLINIC.GOOGLE_MAPS_URL) || '';

    var wrap = document.createElement('div');
    wrap.className = 'contacts-map__embed';

    var iframe = document.createElement('iframe');
    iframe.className = 'contacts-map__iframe';
    iframe.src = embedUrl;
    iframe.title = 'Карта проїзду до стоматології TRUST DENTAL';
    iframe.loading = 'lazy';
    iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
    wrap.appendChild(iframe);

    if (isSafeHttpUrl(clinicUrl)) {
      var fbBar = document.createElement('div');
      fbBar.className = 'contacts-map__fallback-bar';
      var fbLink = document.createElement('a');
      fbLink.className = 'btn btn--outline contacts-map__btn';
      fbLink.href = clinicUrl;
      fbLink.target = '_blank';
      fbLink.rel = 'noopener noreferrer';
      var span = document.createElement('span');
      span.textContent = 'Відкрити в Google Maps';
      fbLink.appendChild(span);
      fbLink.appendChild(createArrowSvg('btn__arrow'));
      fbBar.appendChild(fbLink);
      wrap.appendChild(fbBar);
    }

    container.textContent = '';
    container.appendChild(wrap);
  }

  function syncPrivacySlots() {
    var cfg = TD.APPOINTMENT_CONFIG || {};
    var url = cfg.privacyPolicyUrl ? String(cfg.privacyPolicyUrl).trim() : '';
    if (!isSafeHttpUrl(url) && url.charAt(0) !== '/') return;

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
          typeof TD.formatPrice === 'function'
            ? TD.formatPrice(it.subtotal, it.prefix, 'грн')
            : String(it.subtotal) + ' грн';
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
        selection.items.length === 1
          ? mapCalcItemToServiceValue(selection.items[0])
          : 'calc-bundle';
      serviceSel.value = nextService;
    }

    if (msgEl && (!msgEl.value.trim() || msgEl.dataset.calcAutofill === '1')) {
      var summaryStr = selection.summaryText
        ? 'Попередній розрахунок (орієнтовно): ' + selection.summaryText
        : '';
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
      submitLabel.textContent = isLoading
        ? hasEndpoint
          ? 'Надсилання заявки…'
          : 'Перевірка заявки…'
        : 'Записатися на консультацію';
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
      (stateName === 'success'
        ? 'Дякуємо! Ми зв’яжемося з вами для підтвердження запису.'
        : stateName === 'error'
          ? 'Не вдалося завершити надсилання заявки.'
          : hasEndpoint
            ? 'Надсилаємо дані заявки…'
            : 'Перевіряємо заповнені дані…');
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

    var checks = [
      {
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
        target.focus({ preventScroll: true });
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

    var fieldPairs = [
      {
        el: document.getElementById('appointment-name'),
        errId: 'appointment-name-error',
        fn: function (el) { return validateAppointmentName(el.value); }
      },
      {
        el: document.getElementById('appointment-phone'),
        errId: 'appointment-phone-error',
        fn: function (el) { return validateAppointmentPhone(el.value); }
      },
      {
        el: document.getElementById('appointment-preferred-time'),
        errId: 'appointment-preferred-time-error',
        fn: function (el) { return validateAppointmentPreferredTime(el.value); }
      },
      {
        el: document.getElementById('appointment-message'),
        errId: 'appointment-message-error',
        fn: function (el) { return validateAppointmentMessage(el.value); }
      },
      {
        el: document.getElementById('appointment-consent'),
        errId: 'appointment-consent-error',
        fn: function (el) { return validateAppointmentConsent(el.checked); }
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
        calcSelection: activeCalcSelection
          ? {
              total: activeCalcSelection.total,
              formattedTotal: activeCalcSelection.formattedTotal,
              summaryText: activeCalcSelection.summaryText,
              items: activeCalcSelection.items
            }
          : null,
        consent: true
      };

      clearAppointmentTimer();
      setAppointmentFormState('loading');

      if (endpoint && (isSafeHttpUrl(endpoint) || endpoint.charAt(0) === '/')) {
        if (typeof window.fetch !== 'function') {
          setAppointmentFormState(
            'error',
            'Браузер не підтримує автоматичне надсилання.',
            'Зателефонуйте нам за номером ' + (clinic.PHONE_DISPLAY || '') + '.'
          );
          return;
        }
        window
          .fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json'
            },
            body: JSON.stringify(payload)
          })
          .then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            setAppointmentFormState(
              'success',
              'Дякуємо! Ми зв’яжемося з вами для підтвердження запису.'
            );
          })
          .catch(function () {
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
        var calcNote = activeCalcSelection
          ? ' Попередній розрахунок (' + activeCalcSelection.formattedTotal + ') додано до заявки.'
          : '';
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
        var reduced = prefersReducedMotion();

        if (href === '#contacts') {
          var contacts = document.getElementById('contacts');
          if (!contacts) return;
          e.preventDefault();
          if (typeof contacts.scrollIntoView === 'function') {
            contacts.scrollIntoView({
              behavior: reduced ? 'auto' : 'smooth',
              block: 'start'
            });
          }
          var isBookingCta = !link.hasAttribute('data-nav-target');
          focusContactsTarget(isBookingCta ? 'form' : 'heading');
        } else if (href === '#top') {
          e.preventDefault();
          window.scrollTo({
            top: 0,
            behavior: reduced ? 'auto' : 'smooth'
          });
          var skip = document.querySelector('.skip-link');
          if (skip && typeof skip.focus === 'function') {
            skip.focus({ preventScroll: true });
          }
        }
      });

      window.addEventListener('pagehide', function () {
        clearAppointmentTimer();
      });
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
    renderServices();
    renderPriceFilters();
    renderPriceList();
    renderWorkFilters();
    renderWorksGrid();
    bindWorkModal();
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

  TD.render = {
    init: init,
    setPriceFilter: function (cat) {
      if (!isInitialized) init();
      applyPriceFilter(cat, true);
    },
    getActiveFilter: function () {
      return activeCategory;
    },
    setWorkFilter: function (cat) {
      if (!isInitialized) init();
      applyWorkFilter(cat);
    },
    getActiveWorkFilter: function () {
      return activeWorkCategory;
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

