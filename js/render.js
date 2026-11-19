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
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', className);
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.8');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M4 10h12m0 0-4.5-4.5M16 10l-4.5 4.5');
    svg.appendChild(path);
    return svg;
  }

  /* ------------------------------------------------------------------------
     1. Services Cards (#services-grid)
     ------------------------------------------------------------------------ */
  function renderServices() {
    var container = document.getElementById('services-grid');
    if (!container || !Array.isArray(TD.SERVICES)) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < TD.SERVICES.length; i++) {
      var svc = TD.SERVICES[i];
      var card = document.createElement('article');
      card.className = 'service-card';

      var iconWrap = document.createElement('div');
      iconWrap.className = 'service-card__icon-wrap';
      iconWrap.appendChild(createSvgUse(svc.icon, 'service-card__icon'));

      var title = document.createElement('h3');
      title.className = 'service-card__title';
      title.textContent = svc.title;

      var desc = document.createElement('p');
      desc.className = 'service-card__desc';
      desc.textContent = svc.description;

      var cta = document.createElement('a');
      cta.className = 'btn btn--primary btn--sm service-card__cta';
      cta.setAttribute('href', '#prices');
      cta.setAttribute('data-price-jump', svc.category || 'all');

      var ctaLabel = document.createElement('span');
      ctaLabel.textContent = 'Дізнатися ціну';
      cta.appendChild(ctaLabel);
      cta.appendChild(createArrowSvg('btn__arrow'));

      card.appendChild(iconWrap);
      card.appendChild(title);
      card.appendChild(desc);
      card.appendChild(cta);
      frag.appendChild(card);
    }

    container.textContent = '';
    container.appendChild(frag);

    container.addEventListener('click', function (e) {
      var link = e.target.closest('[data-price-jump]');
      if (!link) return;
      var targetCat = link.getAttribute('data-price-jump') || 'all';
      applyPriceFilter(targetCat, false);
    });
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

    container.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-filter]');
      if (!btn) return;
      var cat = btn.getAttribute('data-filter');
      if (cat && cat !== activeCategory) {
        applyPriceFilter(cat, true);
      }
    });

    /* Arrow-key convenience alongside standard Tab navigation */
    container.addEventListener('keydown', function (e) {
      var key = e.key;
      if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Home' && key !== 'End') {
        return;
      }
      var buttons = container.querySelectorAll('[data-filter]');
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
        row.classList.remove('is-filtered-out');
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
      window.requestAnimationFrame(function () {
        for (var j = 0; j < rows.length; j++) {
          rows[j].classList.remove('is-entering');
        }
      });
    }

    updatePriceStatus(visibleCount, target);
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    renderServices();
    renderPriceFilters();
    renderPriceList();
  }

  TD.render = {
    init: init,
    setPriceFilter: function (cat) {
      if (!isInitialized) init();
      applyPriceFilter(cat, true);
    },
    getActiveFilter: function () {
      return activeCategory;
    }
  };
})(window, document);

