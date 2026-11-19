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
    /* [плейсхолдер] — вписати точну кількість років клінічного досвіду після підтвердження */
    EXPERIENCE_YEARS: '[X]',
    DIRECTIONS_COUNT: 9,
    /* Замініть на пряме посилання профілю клініки у Google Maps (maps.app.goo.gl/...) */
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

