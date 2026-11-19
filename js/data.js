/* ==========================================================================
   TRUST DENTAL — Single Source of Truth (window.TD.CLINIC)
   ========================================================================== */
(function (window, document) {
  'use strict';

  var TD = (window.TD = window.TD || {});

  TD.CLINIC = Object.freeze({
    NAME: 'TRUST DENTAL',
    TAGLINE: 'турбота про вашу усмішку',
    CITY: 'Івано-Франківськ',
    ADDRESS: 'вул. Галицька, 51а',
    ADDRESS_FULL: 'м. Івано-Франківськ, вул. Галицька, 51а',
    PHONE_RAW: '+380500500821',
    PHONE_HREF: 'tel:+380500500821',
    PHONE_DISPLAY: '+38 (050) 050-08-21',
    /* Графік взято з наданого скріншота клініки; за потреби оновіть після підтвердження власником */
    HOURS: 'Пн–Сб 09:00–22:00, Нд 09:00–20:00',
    HOURS_DETAIL: Object.freeze({
      WEEKDAYS_SAT: 'Пн–Сб: 09:00–22:00 (без перерви)',
      SUNDAY: 'Нд: 09:00–20:00 (без перерви)'
    }),
    RATING: 5.0,
    RATING_DISPLAY: '5.0',
    REVIEWS_COUNT: 73,
    /* TODO: підтвердити у власника точну кількість років клінічного досвіду лікаря та замінити '[X]' на число (наприклад, 10) */
    EXPERIENCE_YEARS: '[X]',
    DIRECTIONS_COUNT: 9,
    /* TODO: підтвердити у власника та замінити пошуковий URL на пряме посилання профілю клініки у Google Maps (maps.app.goo.gl/...) */
    GOOGLE_MAPS_URL:
      'https://www.google.com/maps/search/?api=1&query=TRUST+DENTAL+%D0%B2%D1%83%D0%BB.+%D0%93%D0%B0%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0+51%D0%B0+%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA',
    INSTAGRAM_HANDLE: '@trust_dental_ua',
    INSTAGRAM_URL: 'https://www.instagram.com/trust_dental_ua/'
  });

  TD.NAV_ITEMS = Object.freeze([
    { id: 'services', label: 'Послуги' },
    { id: 'advantages', label: 'Переваги' },
    { id: 'prices', label: 'Прайс' },
    { id: 'doctors', label: 'Лікарі' },
    { id: 'works', label: 'Роботи' },
    { id: 'reviews', label: 'Відгуки' },
    { id: 'contacts', label: 'Контакти' }
  ]);

  /* Shared UI state (used for calculator -> Stage 4 booking form handoff) */
  TD.state = TD.state || {
    calcSelection: null
  };

  /* --------------------------------------------------------------------------
     Services (8 items) — strictly owner facts or confirmation placeholders
     -------------------------------------------------------------------------- */
  TD.SERVICES = Object.freeze([
    Object.freeze({
      id: 'therapy',
      title: 'Терапія та канали',
      description: 'Лікування карієсу з кофердамом, реставрація та лікування кореневих каналів.',
      icon: 'td-icon-therapy',
      iconImg: 'therapy',
      category: 'therapy'
    }),
    Object.freeze({
      id: 'hygiene',
      title: 'Професійна гігієна',
      description: 'Професійна гігієна (40 хв). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-hygiene',
      iconImg: 'hygiene',
      category: 'hygiene'
    }),
    Object.freeze({
      id: 'surgery',
      title: 'Атравматична хірургія',
      description: 'Ультразвукове (п\'єзохірургічне) видалення зубів із мінімальною травматизацією.',
      icon: 'td-icon-surgery',
      iconImg: 'surgery',
      category: 'surgery'
    }),
    Object.freeze({
      id: 'braces',
      title: 'Брекет-системи',
      description: 'Сучасні брекет-системи та ортодонтія. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-braces',
      iconImg: 'braces',
      category: 'braces'
    }),
    Object.freeze({
      id: 'implantation',
      title: 'Імплантація',
      description: 'Імплантація зубів (хірургічний етап). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-implantation',
      iconImg: 'implant',
      category: null
    }),
    Object.freeze({
      id: 'orthopedics',
      title: 'Ортопедія',
      description: 'Цирконієві коронки та вініри. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-orthopedics',
      iconImg: 'orthopedics',
      category: 'orthopedics'
    }),
    Object.freeze({
      id: 'pediatric',
      title: 'Дитяча стоматологія',
      description: '[ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-pediatric',
      iconImg: 'pediatric',
      category: null
    }),
    Object.freeze({
      id: 'diagnostics',
      title: 'Діагностика',
      description: 'Консультація та діагностика на візіографі.',
      icon: 'td-icon-diagnostics',
      iconImg: 'diagnostics',
      category: null
    })
  ]);

  /* --------------------------------------------------------------------------
     Price filters — strictly these 6 filters
     -------------------------------------------------------------------------- */
  TD.PRICE_FILTERS = Object.freeze([
    Object.freeze({ id: 'all', label: 'Всі' }),
    Object.freeze({ id: 'surgery', label: 'Атравматична хірургія' }),
    Object.freeze({ id: 'braces', label: 'Брекет-системи' }),
    Object.freeze({ id: 'therapy', label: 'Терапія та канали' }),
    Object.freeze({ id: 'orthopedics', label: 'Ортопедія' }),
    Object.freeze({ id: 'hygiene', label: 'Гігієна' })
  ]);

  /* --------------------------------------------------------------------------
     Prices (9 items) — items with category: null appear only in "Всі"
     -------------------------------------------------------------------------- */
  TD.PRICES = Object.freeze([
    Object.freeze({
      id: 'consultation-visiograph',
      title: 'Консультація + візіограф',
      price: 400,
      prefix: '',
      unit: 'грн',
      note: '',
      category: null
    }),
    Object.freeze({
      id: 'ultrasonic-extraction',
      title: 'Видалення зуба ультразвуком',
      price: 2200,
      prefix: 'від',
      unit: 'грн',
      note: '',
      category: 'surgery'
    }),
    Object.freeze({
      id: 'braces-jaw',
      title: 'Брекети',
      price: 9500,
      prefix: 'від',
      unit: 'грн',
      note: 'за 1 щелепу',
      category: 'braces'
    }),
    Object.freeze({
      id: 'implant-surgical',
      title: 'Імплантат (хірургічний етап)',
      price: 11500,
      prefix: 'від',
      unit: 'грн',
      note: '',
      category: null
    }),
    Object.freeze({
      id: 'caries-restoration',
      title: 'Карієс і реставрація',
      price: Object.freeze([1200, 2200]),
      prefix: '',
      unit: 'грн',
      note: '',
      category: 'therapy'
    }),
    Object.freeze({
      id: 'root-canals',
      title: 'Кореневі канали',
      price: 1800,
      prefix: 'від',
      unit: 'грн',
      note: '',
      category: 'therapy'
    }),
    Object.freeze({
      id: 'zirconia-crowns-veneers',
      title: 'Цирконієві коронки та вініри',
      price: 6500,
      prefix: 'від',
      unit: 'грн',
      note: '',
      category: 'orthopedics'
    }),
    Object.freeze({
      id: 'professional-hygiene',
      title: 'Гігієна',
      price: 1300,
      prefix: '',
      unit: 'грн',
      note: '40 хв',
      category: 'hygiene'
    }),
    Object.freeze({
      id: 'pediatric-dentistry',
      title: 'Дитяча стоматологія',
      price: 800,
      prefix: 'від',
      unit: 'грн',
      note: '',
      category: null
    })
  ]);

  /* --------------------------------------------------------------------------
     Calculator items (8 items with fixed base prices & unit steppers)
     -------------------------------------------------------------------------- */
  TD.CALC_ITEMS = Object.freeze([
    Object.freeze({
      id: 'calc-consultation',
      title: 'Консультація',
      price: 400,
      prefix: '',
      note: '',
      countable: false,
      min: 1,
      max: 1,
      unitForms: null
    }),
    Object.freeze({
      id: 'calc-caries',
      title: 'Лікування карієсу',
      price: 1500,
      prefix: '',
      note: 'за 1 зуб з кофердамом',
      countable: true,
      min: 1,
      max: 32,
      unitForms: Object.freeze(['зуб', 'зуби', 'зубів'])
    }),
    Object.freeze({
      id: 'calc-canals',
      title: 'Кореневі канали',
      price: 1800,
      prefix: 'від',
      note: 'за 1 зуб',
      countable: true,
      min: 1,
      max: 32,
      unitForms: Object.freeze(['зуб', 'зуби', 'зубів'])
    }),
    Object.freeze({
      id: 'calc-hygiene',
      title: 'Гігієна',
      price: 1300,
      prefix: '',
      note: '40 хв',
      countable: false,
      min: 1,
      max: 1,
      unitForms: null
    }),
    Object.freeze({
      id: 'calc-extraction',
      title: 'Видалення зуба ультразвуком',
      price: 2200,
      prefix: 'від',
      note: 'за 1 зуб',
      countable: true,
      min: 1,
      max: 32,
      unitForms: Object.freeze(['зуб', 'зуби', 'зубів'])
    }),
    Object.freeze({
      id: 'calc-crown',
      title: 'Коронка',
      price: 6500,
      prefix: 'від',
      note: 'за 1 зуб',
      countable: true,
      min: 1,
      max: 32,
      unitForms: Object.freeze(['зуб', 'зуби', 'зубів'])
    }),
    Object.freeze({
      id: 'calc-braces',
      title: 'Брекети',
      price: 9500,
      prefix: 'від',
      note: 'за 1 щелепу',
      countable: true,
      min: 1,
      max: 2,
      unitForms: Object.freeze(['щелепа', 'щелепи', 'щелеп'])
    }),
    Object.freeze({
      id: 'calc-implant',
      title: 'Імплантат',
      price: 11500,
      prefix: 'від',
      note: 'за 1 зуб',
      countable: true,
      min: 1,
      max: 32,
      unitForms: Object.freeze(['зуб', 'зуби', 'зубів'])
    })
  ]);

  /**
   * Format integer with non-breaking space thousands separator: 2200 -> "2 200"
   */
  TD.formatNumber = function (num) {
    return String(Math.round(Number(num) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0');
  };

  /**
   * Format price item or numeric sum into Ukrainian UAH format:
   * - number + prefix "від" -> "від 2 200 грн"
   * - range [1200, 2200] -> "1 200–2 200 грн"
   */
  TD.formatPrice = function (price, prefix, unit) {
    var currency = unit || 'грн';
    var body = Array.isArray(price)
      ? TD.formatNumber(price[0]) + '–' + TD.formatNumber(price[1])
      : TD.formatNumber(price);
    return (prefix ? prefix + '\u00A0' : '') + body + '\u00A0' + currency;
  };

  /**
   * Ukrainian pluralization helper: 1 відгук, 2-4 відгуки, 5+ відгуків
   */
  TD.pluralizeUk = function (count, one, few, many) {
    var abs = Math.abs(Number(count)) % 100;
    var mod10 = abs % 10;
    if (abs > 10 && abs < 20) return many;
    if (mod10 > 1 && mod10 < 5) return few;
    if (mod10 === 1) return one;
    return many;
  };

  /**
   * Populate DOM placeholders bound via [data-clinic] from TD.CLINIC
   */
  TD.hydrateClinicData = function () {
    var c = TD.CLINIC;
    var reviewsWord = TD.pluralizeUk(c.REVIEWS_COUNT, 'відгук', 'відгуки', 'відгуків');
    var reviewsText = c.REVIEWS_COUNT + ' ' + reviewsWord + ' на Google';

    var map = {
      name: function (el) { el.textContent = c.NAME; },
      tagline: function (el) { el.textContent = c.TAGLINE; },
      address: function (el) { el.textContent = c.ADDRESS_FULL; },
      'address-short': function (el) { el.textContent = c.ADDRESS; },
      hours: function (el) { el.textContent = c.HOURS; },
      'phone-display': function (el) { el.textContent = c.PHONE_DISPLAY; },
      'phone-link': function (el) {
        el.setAttribute('href', c.PHONE_HREF);
      },
      rating: function (el) {
        el.textContent = c.RATING_DISPLAY;
        if (el.hasAttribute('data-count')) {
          el.setAttribute('data-count', c.RATING_DISPLAY);
        }
      },
      'reviews-text': function (el) { el.textContent = reviewsText; },
      'maps-link': function (el) {
        el.setAttribute('href', c.GOOGLE_MAPS_URL);
      },
      'instagram-link': function (el) {
        el.setAttribute('href', c.INSTAGRAM_URL);
        el.textContent = c.INSTAGRAM_HANDLE;
      },
      experience: function (el) {
        var val = String(c.EXPERIENCE_YEARS);
        el.textContent = val + '+ років';
        el.setAttribute('data-count', val);
      },
      directions: function (el) {
        var val = String(c.DIRECTIONS_COUNT);
        el.textContent = val;
        el.setAttribute('data-count', val);
      }
    };

    var nodes = document.querySelectorAll('[data-clinic]');
    for (var i = 0; i < nodes.length; i++) {
      var key = nodes[i].getAttribute('data-clinic');
      if (map[key]) {
        map[key](nodes[i]);
      }
    }
  };
})(window, document);

