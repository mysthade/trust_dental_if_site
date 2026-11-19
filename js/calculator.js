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
  var stateMap = Object.create(null);

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

    var formattedTotal = selectedItems.length
      ? TD.formatPrice(total, hasFrom ? 'від' : '', 'грн')
      : '0\u00A0грн';

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
      summaryText: summaryLines.length
        ? summaryLines.join('; ') + '. Разом: ' + formattedTotal
        : '',
      timestamp: new Date().toISOString()
    };
  }

  function syncStepperUI(itemId) {
    var item = findItem(itemId);
    var entry = stateMap[itemId];
    if (!item || !entry) return;

    var row = document.querySelector('[data-calc-row="' + itemId + '"]');
    if (!row) return;

    row.classList.toggle('is-selected', entry.checked);

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

  function updateSummary() {
    var selection = buildSelection();
    var totalEl = document.getElementById('calc-total');
    var listEl = document.getElementById('calc-breakdown');
    var emptyEl = document.getElementById('calc-empty');
    var submitBtn = document.getElementById('calc-submit');
    var resetBtn = document.getElementById('calc-reset');

    if (totalEl) {
      totalEl.textContent = selection.formattedTotal;
    }

    var hasItems = selection.items.length > 0;

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
      stateMap[item.id] = { checked: false, qty: item.min };

      var row = document.createElement('div');
      row.className = 'calc-item';
      row.setAttribute('data-calc-row', item.id);

      var checkWrap = document.createElement('div');
      checkWrap.className = 'calc-item__main';

      var input = document.createElement('input');
      input.type = 'checkbox';
      input.className = 'calc-item__checkbox';
      input.id = item.id;
      input.name = 'calc_service';
      input.value = item.id;

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

  function bindSummaryActions() {
    var submitBtn = document.getElementById('calc-submit');
    var resetBtn = document.getElementById('calc-reset');

    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
          var item = TD.CALC_ITEMS[i];
          stateMap[item.id].checked = false;
          stateMap[item.id].qty = item.min;
          var checkbox = document.getElementById(item.id);
          if (checkbox) checkbox.checked = false;
          syncStepperUI(item.id);
        }
        TD.state.calcSelection = null;
        updateSummary();
      });
    }

    if (submitBtn) {
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
    getSelection: buildSelection
  };
})(window, document);

