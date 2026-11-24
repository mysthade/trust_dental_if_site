/* ==========================================================================
   TRUST DENTAL — Interactive Cost Calculator (window.TD.calculator)
   Contract for Stage 4 booking form:
     - State: window.TD.state.calcSelection
     - Event: CustomEvent('td:calc-select', { bubbles: true, detail: selection })
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});
  var isInitialized = false;
  var isMobileExpanded = false;
  var PRIMARY_GROUP_COUNT = 4;
  var stateMap = Object.create(null);

  function prefersReducedMotion() {
    return typeof TD.prefersReducedMotion === 'function' ? TD.prefersReducedMotion() : false;
  }

  function formatUnitCount(item, qty) {
    if (!item.countable || !item.unitForms) return '';
    return qty + '\u00A0' + TD.pluralizeUk(qty, item.unitForms[0], item.unitForms[1], item.unitForms[2]);
  }

  function buildSelection() {
    var selectedItems = [];
    var total = 0;
    var hasFrom = false;

    for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
      var item = TD.CALC_ITEMS[i];
      var entry = stateMap[item.id];
      if (!entry || !entry.checked) continue;

      var qty = item.countable ? entry.qty : 1;
      var subtotal = item.price * qty;
      var isFrom = item.prefix === 'від';
      if (isFrom) hasFrom = true;
      total += subtotal;

      selectedItems.push({
        id: item.id,
        title: item.title,
        unitPrice: item.price,
        quantity: qty,
        prefix: item.prefix,
        unitLabel: formatUnitCount(item, qty),
        subtotal: subtotal
      });
    }

    var formattedTotal = selectedItems.length ?
      TD.formatPrice(total, hasFrom ? 'від' : '', 'грн') :
      '0\u00A0грн';

    var summaryLines = [];
    for (var j = 0; j < selectedItems.length; j++) {
      var s = selectedItems[j];
      var qtyPart = s.unitLabel ? ' (' + s.unitLabel + ')' : '';
      var subPart = TD.formatPrice(s.subtotal, s.prefix, 'грн');
      summaryLines.push(s.title + qtyPart + ' — ' + subPart);
    }

    return {
      items: selectedItems,
      total: total,
      isFrom: hasFrom,
      formattedTotal: formattedTotal,
      summaryText: summaryLines.length ?
        summaryLines.join('; ') + '. Разом: ' + formattedTotal :
        '',
      timestamp: new Date().toISOString()
    };
  }

  function findCalcRow(itemId) {
    var inputEl = document.getElementById(itemId);
    if (inputEl && typeof inputEl.closest === 'function') {
      return inputEl.closest('[data-calc-row]');
    }
    var rows = document.querySelectorAll('[data-calc-row]');
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].getAttribute('data-calc-row') === itemId) return rows[i];
    }
    return null;
  }

  function syncStepperUI(itemId) {
    var item = findItem(itemId);
    var entry = stateMap[itemId];
    if (!item || !entry) return;

    var row = findCalcRow(itemId);
    if (!row) return;

    row.classList.toggle('is-selected', entry.checked);
    if (entry.checked) {
      row.classList.remove('td-reveal-pending', 'is-revealing');
      row.classList.add('is-visible', 'is-revealed');
    }

    if (item.countable) {
      var decBtn = row.querySelector('[data-calc-dec]');
      var incBtn = row.querySelector('[data-calc-inc]');
      var qtyEl = row.querySelector('[data-calc-qty]');
      if (qtyEl) {
        qtyEl.textContent = String(entry.qty);
        qtyEl.setAttribute('aria-label', formatUnitCount(item, entry.qty));
      }
      if (decBtn) decBtn.disabled = !entry.checked || entry.qty <= item.min;
      if (incBtn) incBtn.disabled = !entry.checked || entry.qty >= item.max;
    }
  }

  function syncMobileAccordionUI() {
    var listEl = document.getElementById('calc-items');
    var toggleBtn = document.getElementById('calc-more-toggle');
    var textEl = document.getElementById('calc-more-toggle-text');
    var badgeEl = document.getElementById('calc-more-toggle-badge');
    if (!listEl || !toggleBtn || !Array.isArray(TD.CALC_ITEMS)) return;

    var totalExtra = 0;
    var unselectedExtra = 0;
    for (var i = PRIMARY_GROUP_COUNT; i < TD.CALC_ITEMS.length; i++) {
      totalExtra++;
      var item = TD.CALC_ITEMS[i];
      var entry = stateMap[item.id];
      if (!entry || !entry.checked) {
        unselectedExtra++;
      }
    }

    listEl.classList.toggle('is-mobile-expanded', isMobileExpanded);
    toggleBtn.classList.toggle('is-expanded', isMobileExpanded);
    toggleBtn.setAttribute('aria-expanded', isMobileExpanded ? 'true' : 'false');

    if (isMobileExpanded) {
      if (textEl) textEl.textContent = 'Згорнути додаткові послуги';
      if (badgeEl) badgeEl.textContent = 'Згорнути';
      var extraRows = listEl.querySelectorAll('.calc-item[data-calc-group="extra"]');
      for (var r = 0; r < extraRows.length; r++) {
        extraRows[r].classList.remove('td-reveal-pending', 'is-revealing');
        extraRows[r].classList.add('is-visible', 'is-revealed');
      }
    } else if (unselectedExtra === 0 && totalExtra > 0) {
      if (textEl) textEl.textContent = 'Усі додаткові послуги вже вибрано';
      if (badgeEl) badgeEl.textContent = totalExtra + ' з ' + totalExtra;
    } else {
      if (textEl) {
        textEl.textContent = 'Інші послуги (хірургія, коронки, брекети, імплантація, дитяча)';
      }
      if (badgeEl) {
        badgeEl.textContent = '+' + unselectedExtra;
      }
    }
  }

  function updateSummary() {
    var selection = buildSelection();
    var totalEl = document.getElementById('calc-total');
    var mobileTotalEl = document.getElementById('calc-mobile-total');
    var mobileTotalLink = document.getElementById('calc-mobile-total-link');
    var listEl = document.getElementById('calc-breakdown');
    var emptyEl = document.getElementById('calc-empty');
    var submitBtn = document.getElementById('calc-submit');
    var resetBtn = document.getElementById('calc-reset');

    if (totalEl) {
      totalEl.textContent = selection.formattedTotal;
    }
    if (mobileTotalEl) {
      mobileTotalEl.textContent = selection.formattedTotal;
    }

    var hasItems = selection.items.length > 0;
    if (mobileTotalLink) {
      mobileTotalLink.classList.toggle('has-selection', hasItems);
    }

    syncMobileAccordionUI();

    if (emptyEl) {
      emptyEl.hidden = hasItems;
    }

    if (listEl) {
      listEl.hidden = !hasItems;
      listEl.textContent = '';
      if (hasItems) {
        var frag = document.createDocumentFragment();
        for (var i = 0; i < selection.items.length; i++) {
          var s = selection.items[i];
          var li = document.createElement('li');
          li.className = 'calc-summary__row';

          var nameSpan = document.createElement('span');
          nameSpan.className = 'calc-summary__name';
          nameSpan.textContent = s.unitLabel ? s.title + ' · ' + s.unitLabel : s.title;

          var valSpan = document.createElement('span');
          valSpan.className = 'calc-summary__val';
          valSpan.textContent = TD.formatPrice(s.subtotal, s.prefix, 'грн');

          li.appendChild(nameSpan);
          li.appendChild(valSpan);
          frag.appendChild(li);
        }
        listEl.appendChild(frag);
      }
    }

    if (submitBtn) {
      submitBtn.disabled = !hasItems;
    }
    if (resetBtn) {
      resetBtn.hidden = !hasItems;
    }

    TD.state = TD.state || {};
    TD.state.calcSelection = hasItems ? selection : null;

    var selectedIds = Object.create(null);
    for (var k = 0; k < selection.items.length; k++) {
      selectedIds[selection.items[k].id] = true;
    }

    try {
      var changeEvt = new window.CustomEvent('td:calc-change', {
        bubbles: true,
        detail: {
          selection: selection,
          selectedIds: selectedIds
        }
      });
      document.dispatchEvent(changeEvt);
    } catch (e) { }

    return selection;
  }

  function findItem(id) {
    for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
      if (TD.CALC_ITEMS[i].id === id) return TD.CALC_ITEMS[i];
    }
    return null;
  }

  function renderCalculatorItems() {
    var listEl = document.getElementById('calc-items');
    if (!listEl || !Array.isArray(TD.CALC_ITEMS)) return;

    var frag = document.createDocumentFragment();

    for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
      var item = TD.CALC_ITEMS[i];
      var existing = stateMap[item.id];
      stateMap[item.id] = existing ?
        {
          checked: Boolean(existing.checked),
          qty: existing.qty >= item.min ? existing.qty : item.min
        } :
        {
          checked: false,
          qty: item.min
        };

      var row = document.createElement('div');
      row.className = 'calc-item';
      row.setAttribute('data-calc-row', item.id);
      row.setAttribute('data-calc-group', i < PRIMARY_GROUP_COUNT ? 'primary' : 'extra');

      var checkWrap = document.createElement('div');
      checkWrap.className = 'calc-item__main';

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'calc-item__checkbox';
      input.id = item.id;
      input.name = 'calc_service';
      input.value = item.id;
      input.checked = stateMap[item.id].checked;

      var label = document.createElement('label');
      label.className = 'calc-item__label';
      label.setAttribute('for', item.id);

      var titleWrap = document.createElement('span');
      titleWrap.className = 'calc-item__text';

      var titleSpan = document.createElement('span');
      titleSpan.className = 'calc-item__title';
      titleSpan.textContent = item.title;
      titleWrap.appendChild(titleSpan);

      if (item.note) {
        var noteSpan = document.createElement('span');
        noteSpan.className = 'calc-item__note';
        noteSpan.textContent = item.note;
        titleWrap.appendChild(noteSpan);
      }

      var priceSpan = document.createElement('span');
      priceSpan.className = 'calc-item__price';
      priceSpan.textContent = TD.formatPrice(item.price, item.prefix, 'грн');

      label.appendChild(titleWrap);
      label.appendChild(priceSpan);

      checkWrap.appendChild(input);
      checkWrap.appendChild(label);
      row.appendChild(checkWrap);

      if (item.countable) {
        var stepper = document.createElement('div');
        stepper.className = 'calc-stepper';
        stepper.setAttribute('role', 'group');
        stepper.setAttribute('aria-label', 'Кількість для: ' + item.title);

        var stepHint = document.createElement('span');
        stepHint.className = 'calc-stepper__hint';
        stepHint.textContent = 'Кількість:';
        stepper.appendChild(stepHint);

        var decBtn = document.createElement('button');
        decBtn.type = 'button';
        decBtn.className = 'calc-stepper__btn';
        decBtn.setAttribute('data-calc-dec', item.id);
        decBtn.setAttribute('aria-label', 'Зменшити кількість: ' + item.title);
        decBtn.textContent = '−';
        decBtn.disabled = true;

        var qtyVal = document.createElement('span');
        qtyVal.className = 'calc-stepper__val';
        qtyVal.setAttribute('data-calc-qty', item.id);
        qtyVal.textContent = String(item.min);

        var incBtn = document.createElement('button');
        incBtn.type = 'button';
        incBtn.className = 'calc-stepper__btn';
        incBtn.setAttribute('data-calc-inc', item.id);
        incBtn.setAttribute('aria-label', 'Збільшити кількість: ' + item.title);
        incBtn.textContent = '+';
        incBtn.disabled = true;

        stepper.appendChild(decBtn);
        stepper.appendChild(qtyVal);
        stepper.appendChild(incBtn);
        row.appendChild(stepper);
      }

      frag.appendChild(row);
    }

    listEl.textContent = '';
    listEl.appendChild(frag);

    for (var s = 0; s < TD.CALC_ITEMS.length; s++) {
      syncStepperUI(TD.CALC_ITEMS[s].id);
    }

    if (!listEl.dataset.calcListBound) {
      listEl.dataset.calcListBound = '1';
      listEl.addEventListener('change', function (e) {
        var input = e.target;
        if (!input || input.type !== 'checkbox' || !stateMap[input.id]) return;
        stateMap[input.id].checked = input.checked;
        syncStepperUI(input.id);
        updateSummary();
      });

      listEl.addEventListener('click', function (e) {
        var decBtn = e.target.closest('[data-calc-dec]');
        var incBtn = e.target.closest('[data-calc-inc]');
        var btn = decBtn || incBtn;
        if (!btn || btn.disabled) return;

        var id = btn.getAttribute(decBtn ? 'data-calc-dec' : 'data-calc-inc');
        var item = findItem(id);
        var entry = stateMap[id];
        if (!item || !entry || !entry.checked) return;

        var delta = decBtn ? -1 : 1;
        var nextQty = Math.max(item.min, Math.min(item.max, entry.qty + delta));
        if (nextQty === entry.qty) return;

        entry.qty = nextQty;
        syncStepperUI(id);
        updateSummary();
      });
    }
  }

  function resetCalculator() {
    if (!Array.isArray(TD.CALC_ITEMS)) return null;
    for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
      var item = TD.CALC_ITEMS[i];
      if (!stateMap[item.id]) {
        stateMap[item.id] = {
          checked: false,
          qty: item.min
        };
      } else {
        stateMap[item.id].checked = false;
        stateMap[item.id].qty = item.min;
      }
      var checkbox = document.getElementById(item.id);
      if (checkbox) checkbox.checked = false;
      syncStepperUI(item.id);
    }
    TD.state = TD.state || {};
    TD.state.calcSelection = null;
    return updateSummary();
  }

  function addItem(calcItemId) {
    if (!isInitialized) init();
    var item = findItem(calcItemId);
    if (!item) return null;
    var entry = stateMap[item.id];
    if (!entry) {
      entry = {
        checked: false,
        qty: item.min
      };
      stateMap[item.id] = entry;
    }

    if (!entry.checked) {
      entry.checked = true;
      if (item.countable && (!entry.qty || entry.qty < item.min)) {
        entry.qty = item.min;
      }
    }

    var checkbox = document.getElementById(item.id);
    if (checkbox) {
      checkbox.checked = true;
    }
    syncStepperUI(item.id);
    return updateSummary();
  }

  function addService(serviceId) {
    if (!serviceId || typeof TD.findServiceById !== 'function') return null;
    var svc = TD.findServiceById(serviceId);
    if (!svc || !svc.calcItemId) return null;
    return addItem(svc.calcItemId);
  }

  function isItemSelected(calcItemId) {
    if (!calcItemId || !stateMap[calcItemId]) return false;
    return Boolean(stateMap[calcItemId].checked);
  }

  function bindSummaryActions() {
    var submitBtn = document.getElementById('calc-submit');
    var resetBtn = document.getElementById('calc-reset');
    var moreToggleBtn = document.getElementById('calc-more-toggle');

    if (moreToggleBtn && !moreToggleBtn.dataset.calcMoreBound) {
      moreToggleBtn.dataset.calcMoreBound = '1';
      moreToggleBtn.addEventListener('click', function () {
        isMobileExpanded = !isMobileExpanded;
        syncMobileAccordionUI();
      });
    }

    if (resetBtn && !resetBtn.dataset.calcResetBound) {
      resetBtn.dataset.calcResetBound = '1';
      resetBtn.addEventListener('click', function () {
        resetCalculator();
      });
    }

    if (submitBtn && !submitBtn.dataset.calcSubmitBound) {
      submitBtn.dataset.calcSubmitBound = '1';
      submitBtn.addEventListener('click', function () {
        var selection = buildSelection();
        if (!selection.items.length) return;

        TD.state = TD.state || {};
        TD.state.calcSelection = selection;

        var evt = new window.CustomEvent('td:calc-select', {
          bubbles: true,
          detail: selection
        });
        document.dispatchEvent(evt);

        var contacts = document.getElementById('contacts');
        if (contacts && typeof contacts.scrollIntoView === 'function') {
          contacts.scrollIntoView({
            behavior: prefersReducedMotion() ? 'auto' : 'smooth',
            block: 'start'
          });

          var contactsHeading = document.getElementById('heading-contacts');
          if (contactsHeading && typeof contactsHeading.focus === 'function') {
            contactsHeading.setAttribute('tabindex', '-1');
            contactsHeading.focus({
              preventScroll: true
            });
          } else if (typeof contacts.focus === 'function') {
            contacts.focus({
              preventScroll: true
            });
          }
        }
      });
    }
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;
    renderCalculatorItems();
    bindSummaryActions();
    updateSummary();
  }

  TD.calculator = {
    init: init,
    getSelection: buildSelection,
    addItem: addItem,
    addService: addService,
    isItemSelected: isItemSelected,
    reset: resetCalculator
  };
})(window, document);