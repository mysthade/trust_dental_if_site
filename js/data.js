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
    /* Офіційний профіль клініки TRUST DENTAL у Google Business Profile (Place ID: ChIJ9QI8s0nG1EARlyS0q9U9PV0).
       Примітка: URL збережено з офіційного посилання; за потреби уточніть пряму коротку адресу maps.app.goo.gl через Place ID Finder */
    GOOGLE_PLACE_ID: 'ChIJ9QI8s0nG1EARlyS0q9U9PV0',
    GOOGLE_MAPS_URL:
      'https://www.google.com/maps/place/%D0%A1%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3%D1%96%D1%8F+Trust+Dental/@48.9262602,24.7089406,1034m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4730c1cbf46247f5:0x5a3dbed54b7a2497!8m2!3d48.9262602!4d48.7089406!16s%2Fg%2F11vc1rfymb?entry=ttu',
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

  /* Centralized BFcache (pagehide / pageshow) lifecycle registry */
  var pageHideHandlers = [];
  var pageShowHandlers = [];
  var lifecycleBound = false;

  function ensureLifecycleListeners() {
    if (lifecycleBound) return;
    lifecycleBound = true;
    window.addEventListener('pagehide', function (e) {
      for (var i = 0; i < pageHideHandlers.length; i++) {
        try {
          pageHideHandlers[i](e);
        } catch (err) {}
      }
    });
    window.addEventListener('pageshow', function (e) {
      for (var i = 0; i < pageShowHandlers.length; i++) {
        try {
          pageShowHandlers[i](e);
        } catch (err) {}
      }
    });
  }

  TD.lifecycle = {
    onPageHide: function (fn) {
      if (typeof fn !== 'function') return;
      ensureLifecycleListeners();
      if (pageHideHandlers.indexOf(fn) === -1) {
        pageHideHandlers.push(fn);
      }
    },
    onPageShow: function (fn) {
      if (typeof fn !== 'function') return;
      ensureLifecycleListeners();
      if (pageShowHandlers.indexOf(fn) === -1) {
        pageShowHandlers.push(fn);
      }
    }
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
      iconImg: 'img/services/therapy',
      category: 'therapy'
    }),
    Object.freeze({
      id: 'hygiene',
      title: 'Професійна гігієна',
      description: 'Професійна гігієна (40 хв). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-hygiene',
      iconImg: 'img/services/hygiene',
      category: 'hygiene'
    }),
    Object.freeze({
      id: 'surgery',
      title: 'Атравматична хірургія',
      description: 'Ультразвукове (п\'єзохірургічне) видалення зубів із мінімальною травматизацією.',
      icon: 'td-icon-surgery',
      iconImg: 'img/services/surgery',
      category: 'surgery'
    }),
    Object.freeze({
      id: 'braces',
      title: 'Брекет-системи',
      description: 'Сучасні брекет-системи та ортодонтія. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-braces',
      iconImg: 'img/services/braces',
      category: 'braces'
    }),
    Object.freeze({
      id: 'implantation',
      title: 'Імплантація',
      description: 'Імплантація зубів (хірургічний етап). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-implantation',
      iconImg: 'img/services/implant',
      category: null
    }),
    Object.freeze({
      id: 'orthopedics',
      title: 'Ортопедія',
      description: 'Цирконієві коронки та вініри. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-orthopedics',
      iconImg: 'img/services/orthopedics',
      category: 'orthopedics'
    }),
    Object.freeze({
      id: 'pediatric',
      title: 'Дитяча стоматологія',
      description: '[ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-pediatric',
      iconImg: 'img/services/pediatric',
      category: null
    }),
    Object.freeze({
      id: 'diagnostics',
      title: 'Діагностика',
      description: 'Консультація та діагностика на візіографі.',
      icon: 'td-icon-diagnostics',
      iconImg: 'img/services/diagnostics',
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

  /* --------------------------------------------------------------------------
     Works Filter Categories (7 base directions)
     -------------------------------------------------------------------------- */
  TD.WORK_FILTERS = Object.freeze([
    Object.freeze({ id: 'all', label: 'Усі' }),
    Object.freeze({ id: 'therapy', label: 'Терапія' }),
    Object.freeze({ id: 'surgery', label: 'Хірургія' }),
    Object.freeze({ id: 'implantation', label: 'Імплантація' }),
    Object.freeze({ id: 'orthopedics', label: 'Ортопедія' }),
    Object.freeze({ id: 'orthodontics', label: 'Ортодонтія' }),
    Object.freeze({ id: 'hygiene', label: 'Гігієна' })
  ]);

  /* --------------------------------------------------------------------------
     Clinical Works Showcase (6 neutral template cases)
     Щоб підключити реальні фото:
       1. Покладіть файли у img/works/ (основний формат .webp, за потреби .jpg/.png у *Fallback).
       2. Оновіть шляхи coverImage / beforeImage / afterImage, title, description і note.
       3. Змініть status з 'placeholder' на 'ready'.
     -------------------------------------------------------------------------- */
  TD.WORKS = Object.freeze([
    Object.freeze({
      id: 'case-01',
      category: 'therapy',
      categoryLabel: 'Терапія',
      title: 'Відновлення анатомічної форми зуба',
      description: 'Приклад оформлення клінічного випадку: пошарова реставрація дефекту коронкової частини зуба.',
      coverImage: 'img/works/case-01-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-01-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-01-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: відновлення анатомічної форми зуба',
      beforeAlt: 'Стан до лікування — випадок 1',
      afterAlt: 'Стан після лікування — випадок 1',
      note: 'Інформація про методику, матеріали та клінічні етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-02',
      category: 'therapy',
      categoryLabel: 'Терапія',
      title: 'Ендодонтичне лікування та реставрація',
      description: 'Приклад оформлення клінічного випадку: обробка кореневих каналів і герметичне відновлення коронки.',
      coverImage: 'img/works/case-02-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-02-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-02-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: ендодонтичне лікування та реставрація',
      beforeAlt: 'Стан до лікування — випадок 2',
      afterAlt: 'Стан після лікування — випадок 2',
      note: 'Інформація про методику, матеріали та клінічні етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-03',
      category: 'surgery',
      categoryLabel: 'Хірургія',
      title: 'Ультразвукове видалення зуба',
      description: 'Приклад оформлення клінічного випадку: п’єзохірургічний підхід із делікатним ставленням до навколишніх тканин.',
      coverImage: 'img/works/case-03-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-03-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-03-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: ультразвукове видалення зуба',
      beforeAlt: 'Стан до хірургічного етапу — випадок 3',
      afterAlt: 'Стан після хірургічного етапу — випадок 3',
      note: 'Інформація про методику та клінічні етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-04',
      category: 'orthopedics',
      categoryLabel: 'Ортопедія',
      title: 'Ортопедичне відновлення коронкою',
      description: 'Приклад оформлення клінічного випадку: відновлення цілісності зуба та контактного пункту безметалевою коронкою.',
      coverImage: 'img/works/case-04-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-04-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-04-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: ортопедичне відновлення коронкою',
      beforeAlt: 'Стан до протезування — випадок 4',
      afterAlt: 'Стан після фіксації конструкції — випадок 4',
      note: 'Інформація про методику, конструкцію та етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-05',
      category: 'orthodontics',
      categoryLabel: 'Ортодонтія',
      title: 'Ортодонтична корекція прикусу',
      description: 'Приклад оформлення клінічного випадку: поетапне вирівнювання положення зубів із використанням брекет-системи.',
      coverImage: 'img/works/case-05-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-05-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-05-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: ортодонтична корекція прикусу',
      beforeAlt: 'Стан зубного ряду до лікування — випадок 5',
      afterAlt: 'Стан зубного ряду після етапу корекції — випадок 5',
      note: 'Тривалість лікування та клінічний протокол уточнюються лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-06',
      category: 'hygiene',
      categoryLabel: 'Гігієна',
      title: 'Професійна гігієна порожнини рота',
      description: 'Приклад оформлення клінічного випадку: очищення м’яких і мінералізованих відкладень та полірування емалі.',
      coverImage: 'img/works/case-06-cover.webp',
      coverFallback: '',
      beforeImage: 'img/works/case-06-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-06-after.webp',
      afterFallback: '',
      coverAlt: 'Приклад лікування: професійна гігієна порожнини рота',
      beforeAlt: 'Стан до професійної гігієни — випадок 6',
      afterAlt: 'Стан після професійної гігієни — випадок 6',
      note: 'Рекомендовану періодичність профілактичних оглядів визначає лікар.',
      status: 'placeholder'
    })
  ]);

  /* --------------------------------------------------------------------------
     Google Business Profile Reviews (#reviews)
     Офіційний профіль: TRUST DENTAL (Google Place ID: ChIJ9QI8s0nG1EARlyS0q9U9PV0)
     ВАЖЛИВО:
       1. API-ключі Google Places не можна додавати у frontend-код (index.html / CSS / JS).
       2. Для автоматичного живого імпорту вкажіть URL власного backend/serverless endpoint
          у TD.REVIEWS_META.endpoint, який повертає JSON формату:
          {
            "source": "Google",
            "placeId": "ChIJ9QI8s0nG1EARlyS0q9U9PV0",
            "rating": 5,
            "userRatingCount": 73,
            "reviews": [
              {
                "id": "google-review-unique-id",
                "author": "Ім’я автора з Google",
                "authorInitials": "АП",
                "authorPhoto": "",
                "rating": 5,
                "relativeDate": "місяць тому",
                "publishedAt": "",
                "text": "Дослівний текст відгуку з Google",
                "ownerReply": "",
                "googleUrl": "https://www.google.com/maps/place/..."
              }
            ]
          }
       3. Або додавайте лише перевірені дослівні відгуки з Google до TD.REVIEWS (verified: true).
       4. Пряме посилання профілю клініки зберігається у TD.CLINIC.GOOGLE_MAPS_URL (рядок 33).
     -------------------------------------------------------------------------- */
  TD.REVIEWS_META = Object.freeze({
    sourceLabel: 'Google',
    sourceName: 'Google Business Profile',
    placeId: TD.CLINIC.GOOGLE_PLACE_ID,
    googleUrl: TD.CLINIC.GOOGLE_MAPS_URL,
    rating: null,
    userRatingCount: null,
    /* Показувати числовий рейтинг/кількість у #reviews-summary лише коли отримано підтверджені дані Google */
    summaryVerified: false,
    autoplayDelayMs: 6000,
    resumeDelayMs: 9000,
    state: 'ready',
    errorMessage: '',
    endpoint: '',
    sourceNote:
      'Відображаються перевірені відгуки пацієнтів із офіційного профілю клініки у Google Business Profile.'
  });

  TD.REVIEWS = Object.freeze([]);

  /* --------------------------------------------------------------------------
     Contacts, Appointment Form Config & Map/Privacy Slots (#contacts, #site-footer)
     ВАЖЛИВО:
       - Поки endpoint порожній, форма працює у режимі локальної перевірки
         (не імітує серверну доставку і не зберігає ПД у localStorage/sessionStorage).
       - Для реального прийому заявок вкажіть підтверджений backend/CRM/webhook URL у endpoint.
       - Для карти iframe додайте офіційний embed URL у mapEmbedUrl (https://www.google.com/maps/embed?...).
       - Для політики конфіденційності додайте реальний URL сторінки у privacyPolicyUrl.
     -------------------------------------------------------------------------- */
  TD.APPOINTMENT_SERVICES = Object.freeze([
    Object.freeze({ id: 'consultation', label: 'Первинна консультація та діагностика' }),
    Object.freeze({ id: 'therapy', label: 'Терапія та лікування каналів' }),
    Object.freeze({ id: 'hygiene', label: 'Професійна гігієна' }),
    Object.freeze({ id: 'surgery', label: 'Атравматична хірургія' }),
    Object.freeze({ id: 'braces', label: 'Брекет-системи (ортодонтія)' }),
    Object.freeze({ id: 'implantation', label: 'Імплантація' }),
    Object.freeze({ id: 'orthopedics', label: 'Ортопедія (коронки та вініри)' }),
    Object.freeze({ id: 'pediatric', label: 'Дитяча стоматологія' }),
    Object.freeze({ id: 'calc-bundle', label: 'Попередній розрахунок із калькулятора' }),
    Object.freeze({ id: 'other', label: 'Інше / уточнити з адміністратором' })
  ]);

  TD.APPOINTMENT_CONFIG = Object.freeze({
    endpoint: '',
    privacyPolicyUrl: '',
    mapEmbedUrl: '',
    contactMethods: Object.freeze([
      Object.freeze({ id: 'phone', label: 'Телефонний дзвінок' }),
      Object.freeze({ id: 'messenger', label: 'Месенджер (Viber / Telegram)' }),
      Object.freeze({ id: 'any', label: 'Будь-який зручний спосіб' })
    ]),
    bookingSteps: Object.freeze([
      'Залишаєте заявку або телефонуєте.',
      'Адміністратор уточнює деталі та час.',
      'Ви отримуєте підтвердження запису.'
    ])
  });

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
      'hours-weekdays': function (el) {
        if (c.HOURS_DETAIL && c.HOURS_DETAIL.WEEKDAYS_SAT) {
          el.textContent = c.HOURS_DETAIL.WEEKDAYS_SAT;
        }
      },
      'hours-sunday': function (el) {
        if (c.HOURS_DETAIL && c.HOURS_DETAIL.SUNDAY) {
          el.textContent = c.HOURS_DETAIL.SUNDAY;
        }
      },
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
      'instagram-handle': function (el) {
        el.textContent = c.INSTAGRAM_HANDLE;
      },
      'instagram-link': function (el) {
        el.setAttribute('href', c.INSTAGRAM_URL);
        var inner = el.querySelector('[data-clinic="instagram-handle"]');
        if (inner) {
          inner.textContent = c.INSTAGRAM_HANDLE;
        } else if (el.children.length === 0) {
          el.textContent = c.INSTAGRAM_HANDLE;
        }
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

