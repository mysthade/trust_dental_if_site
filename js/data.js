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
    GOOGLE_MAPS_URL: 'https://www.google.com/maps/place/%D0%A1%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3%D1%96%D1%8F+Trust+Dental/@48.9262602,24.7089406,1034m/data=!3m2!1e3!4b1!4m6!3m5!1s0x4730c1cbf46247f5:0x5a3dbed54b7a2497!8m2!3d48.9262602!4d48.7089406!16s%2Fg%2F11vc1rfymb?entry=ttu',
    GOOGLE_MAPS_EMBED_URL: 'https://www.google.com/maps?q=%D0%A1%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3%D1%96%D1%8F+Trust+Dental,+%D0%BC.+%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA,+%D0%B2%D1%83%D0%BB.+%D0%93%D0%B0%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0,+51%D0%B0&hl=uk&z=16&output=embed',
    INSTAGRAM_HANDLE: '@trust_dental_ua',
    INSTAGRAM_URL: 'https://www.instagram.com/trust_dental_ua/',
    /* TODO: підтвердити у власника реальний URL Telegram-чату або профілю клініки (наприклад, 'https://t.me/trust_dental_ua') і вставити в TELEGRAM_URL */
    TELEGRAM_URL: ''
  });

  TD.NAV_ITEMS = Object.freeze([{
    id: 'services',
    label: 'Послуги та ціни'
  },
  {
    id: 'advantages',
    label: 'Переваги'
  },
  {
    id: 'doctors',
    label: 'Лікарі'
  },
  {
    id: 'works',
    label: 'Роботи'
  },
  {
    id: 'gallery',
    label: 'Галерея'
  },
  {
    id: 'reviews',
    label: 'Відгуки'
  },
  {
    id: 'contacts',
    label: 'Контакти'
  }
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
        } catch (err) { }
      }
    });
    window.addEventListener('pageshow', function (e) {
      for (var i = 0; i < pageShowHandlers.length; i++) {
        try {
          pageShowHandlers[i](e);
        } catch (err) { }
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
     TODO: Заповнити includedItems для послуг із порожнім масивом після
           фінального підтвердження складу процедур власником клініки.
     -------------------------------------------------------------------------- */
  TD.SERVICES = Object.freeze([
    Object.freeze({
      id: 'therapy',
      title: 'Терапія та канали',
      description: 'Лікування карієсу з кофердамом, реставрація та лікування кореневих каналів.',
      icon: 'td-icon-therapy',
      iconImg: 'img/services/therapy',
      category: 'therapy',
      calcItemId: 'calc-caries',
      includedItems: Object.freeze([
        'Ізоляція робочого поля кофердамом',
        'Препарування та лікування карієсу зуба',
        'Відновлення анатомічної форми (реставрація)',
        'Обробка кореневих каналів за показаннями'
      ]),
      includedFallback: ''
    }),
    Object.freeze({
      id: 'hygiene',
      title: 'Професійна гігієна',
      description: 'Професійна гігієна (40 хв). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-hygiene',
      iconImg: 'img/services/hygiene',
      category: 'hygiene',
      calcItemId: 'calc-hygiene',
      /* TODO: Підтвердити у власника точний перелік етапів гігієни (40 хв) */
      includedItems: Object.freeze([]),
      includedFallback: 'Тривалість процедури — 40 хв. Склад послуги уточнюється лікарем.'
    }),
    Object.freeze({
      id: 'surgery',
      title: 'Атравматична хірургія',
      description: 'Ультразвукове (п\'єзохірургічне) видалення зубів із мінімальною травматизацією.',
      icon: 'td-icon-surgery',
      iconImg: 'img/services/surgery',
      category: 'surgery',
      calcItemId: 'calc-extraction',
      includedItems: Object.freeze([
        'Огляд ділянки втручання перед процедурою',
        'Ультразвукове (п’єзохірургічне) видалення зуба',
        'Контроль гемостазу та обробка лунки',
        'Рекомендації лікаря щодо догляду після видалення'
      ]),
      includedFallback: ''
    }),
    Object.freeze({
      id: 'braces',
      title: 'Брекет-системи',
      description: 'Сучасні брекет-системи та ортодонтія. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-braces',
      iconImg: 'img/services/braces',
      category: 'braces',
      calcItemId: 'calc-braces',
      /* TODO: Підтвердити у власника точний склад ортодонтичного етапу (за 1 щелепу) */
      includedItems: Object.freeze([]),
      includedFallback: 'Розрахунок вказано за 1 щелепу. Склад послуги уточнюється лікарем.'
    }),
    Object.freeze({
      id: 'implantation',
      title: 'Імплантація',
      description: 'Імплантація зубів (хірургічний етап). [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-implantation',
      iconImg: 'img/services/implant',
      category: null,
      calcItemId: 'calc-implant',
      /* TODO: Підтвердити у власника точний склад хірургічного етапу імплантації */
      includedItems: Object.freeze([]),
      includedFallback: 'Вказано вартість хірургічного етапу за 1 зуб. Склад послуги уточнюється лікарем.'
    }),
    Object.freeze({
      id: 'orthopedics',
      title: 'Ортопедія',
      description: 'Цирконієві коронки та вініри. [ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-orthopedics',
      iconImg: 'img/services/orthopedics',
      category: 'orthopedics',
      calcItemId: 'calc-crown',
      /* TODO: Підтвердити у власника точний склад ортопедичного етапу (за 1 зуб) */
      includedItems: Object.freeze([]),
      includedFallback: 'Цирконієві коронки та вініри (за 1 зуб). Склад послуги уточнюється лікарем.'
    }),
    Object.freeze({
      id: 'pediatric',
      title: 'Дитяча стоматологія',
      description: '[ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]',
      icon: 'td-icon-pediatric',
      iconImg: 'img/services/pediatric',
      category: null,
      calcItemId: null,
      /* TODO: Підтвердити у власника перелік та вартість дитячих процедур */
      includedItems: Object.freeze([]),
      includedFallback: 'Склад послуги та план лікування визначаються лікарем після огляду.'
    }),
    Object.freeze({
      id: 'diagnostics',
      title: 'Діагностика',
      description: 'Консультація та діагностика на візіографі.',
      icon: 'td-icon-diagnostics',
      iconImg: 'img/services/diagnostics',
      category: null,
      calcItemId: 'calc-consultation',
      includedItems: Object.freeze([
        'Первинний огляд та консультація стоматолога',
        'Прицільна рентген-діагностика на візіографі',
        'Складання попереднього плану лікування'
      ]),
      includedFallback: ''
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
     Clinical Works Showcase (3 curated "Before / After" template cases)
     Щоб підключити реальні фото:
       1. Покладіть файли у img/works/:
          - img/works/case-01-before.webp та img/works/case-01-after.webp
          - img/works/case-02-before.webp та img/works/case-02-after.webp
          - img/works/case-03-before.webp та img/works/case-03-after.webp
       2. Оновіть за потреби title, description і note.
       3. Змініть status з 'placeholder' на 'ready'.
     -------------------------------------------------------------------------- */
  TD.WORKS = Object.freeze([
    Object.freeze({
      id: 'case-01',
      category: 'therapy',
      categoryLabel: 'Терапія',
      title: 'Реставрація зуба',
      description: 'Приклад оформлення клінічного випадку: пошарова реставрація анатомічної форми коронкової частини зуба.',
      beforeImage: 'img/works/case-01-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-01-after.webp',
      afterFallback: '',
      beforeAlt: 'Стан зуба до лікування — випадок 1',
      afterAlt: 'Стан зуба після лікування — випадок 1',
      note: 'Інформація про методику, матеріали та клінічні етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-02',
      category: 'orthopedics',
      categoryLabel: 'Ортопедія',
      title: 'Відновлення форми зуба коронкою',
      description: 'Приклад оформлення клінічного випадку: ортопедичне відновлення цілісності зуба та контактного пункту безметалевою коронкою.',
      beforeImage: 'img/works/case-02-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-02-after.webp',
      afterFallback: '',
      beforeAlt: 'Стан зуба до лікування — випадок 2',
      afterAlt: 'Стан зуба після лікування — випадок 2',
      note: 'Інформація про методику, конструкцію та клінічні етапи уточнюється лікарем.',
      status: 'placeholder'
    }),
    Object.freeze({
      id: 'case-03',
      category: 'orthodontics',
      categoryLabel: 'Ортодонтія',
      title: 'Корекція положення зубів',
      description: 'Приклад оформлення клінічного випадку: поетапне вирівнювання положення зубів із використанням брекет-системи.',
      beforeImage: 'img/works/case-03-before.webp',
      beforeFallback: '',
      afterImage: 'img/works/case-03-after.webp',
      afterFallback: '',
      beforeAlt: 'Стан зубів до лікування — випадок 3',
      afterAlt: 'Стан зубів після лікування — випадок 3',
      note: 'Тривалість лікування та клінічний протокол уточнюються лікарем.',
      status: 'placeholder'
    })
  ]);

  /* --------------------------------------------------------------------------
     Clinic Photo Gallery (#gallery): "Всередині" (5) + "Зовні" (3)
     TODO: Отримати реальні фото клініки, alt і підписи від власника:
       1. Підготувати img/gallery/{inside,outside}-0N-{480,800,1200}.webp та fallback .webp/.jpg.
       2. Заповнити alt і caption (1 короткий рядок), не вигадуючи деталей інтер'єру.
       3. Змінити status з 'placeholder' на 'ready'.
     -------------------------------------------------------------------------- */
  TD.GALLERY = Object.freeze({
    inside: Object.freeze([
      Object.freeze({
        id: 'gallery-01',
        category: 'inside',
        group: 'inside',
        src: 'img/gallery/inside-01.webp',
        srcSet: 'img/gallery/inside-01-480.webp 480w, img/gallery/inside-01-800.webp 800w, img/gallery/inside-01-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/inside-01.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-02',
        category: 'inside',
        group: 'inside',
        src: 'img/gallery/inside-02.webp',
        srcSet: 'img/gallery/inside-02-480.webp 480w, img/gallery/inside-02-800.webp 800w, img/gallery/inside-02-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/inside-02.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-03',
        category: 'inside',
        group: 'inside',
        src: 'img/gallery/inside-03.webp',
        srcSet: 'img/gallery/inside-03-480.webp 480w, img/gallery/inside-03-800.webp 800w, img/gallery/inside-03-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/inside-03.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-04',
        category: 'inside',
        group: 'inside',
        src: 'img/gallery/inside-04.webp',
        srcSet: 'img/gallery/inside-04-480.webp 480w, img/gallery/inside-04-800.webp 800w, img/gallery/inside-04-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/inside-04.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-05',
        category: 'inside',
        group: 'inside',
        src: 'img/gallery/inside-05.webp',
        srcSet: 'img/gallery/inside-05-480.webp 480w, img/gallery/inside-05-800.webp 800w, img/gallery/inside-05-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/inside-05.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      })
    ]),
    outside: Object.freeze([
      Object.freeze({
        id: 'gallery-06',
        category: 'outside',
        group: 'outside',
        src: 'img/gallery/outside-01.webp',
        srcSet: 'img/gallery/outside-01-480.webp 480w, img/gallery/outside-01-800.webp 800w, img/gallery/outside-01-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/outside-01.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-07',
        category: 'outside',
        group: 'outside',
        src: 'img/gallery/outside-02.webp',
        srcSet: 'img/gallery/outside-02-480.webp 480w, img/gallery/outside-02-800.webp 800w, img/gallery/outside-02-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/outside-02.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      }),
      Object.freeze({
        id: 'gallery-08',
        category: 'outside',
        group: 'outside',
        src: 'img/gallery/outside-03.webp',
        srcSet: 'img/gallery/outside-03-480.webp 480w, img/gallery/outside-03-800.webp 800w, img/gallery/outside-03-1200.webp 1200w',
        sizes: '(max-width: 639px) 92vw, (max-width: 979px) 46vw, 30vw',
        placeholderSrc: 'img/gallery/outside-03.svg',
        width: 1200,
        height: 900,
        alt: '',
        caption: '',
        status: 'placeholder'
      })
    ])
  });

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
    sourceNote: 'Відображаються перевірені відгуки пацієнтів із офіційного профілю клініки у Google Business Profile.'
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
    Object.freeze({
      id: 'consultation',
      label: 'Первинна консультація та діагностика'
    }),
    Object.freeze({
      id: 'therapy',
      label: 'Терапія та лікування каналів'
    }),
    Object.freeze({
      id: 'hygiene',
      label: 'Професійна гігієна'
    }),
    Object.freeze({
      id: 'surgery',
      label: 'Атравматична хірургія'
    }),
    Object.freeze({
      id: 'braces',
      label: 'Брекет-системи (ортодонтія)'
    }),
    Object.freeze({
      id: 'implantation',
      label: 'Імплантація'
    }),
    Object.freeze({
      id: 'orthopedics',
      label: 'Ортопедія (коронки та вініри)'
    }),
    Object.freeze({
      id: 'pediatric',
      label: 'Дитяча стоматологія'
    }),
    Object.freeze({
      id: 'calc-bundle',
      label: 'Попередній розрахунок із калькулятора'
    }),
    Object.freeze({
      id: 'other',
      label: 'Інше / уточнити з адміністратором'
    })
  ]);

  TD.APPOINTMENT_CONFIG = Object.freeze({
    endpoint: '',
    privacyPolicyUrl: '',
    mapEmbedUrl: 'https://www.google.com/maps?q=%D0%A1%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3%D1%96%D1%8F+Trust+Dental,+%D0%BC.+%D0%86%D0%B2%D0%B0%D0%BD%D0%BE-%D0%A4%D1%80%D0%B0%D0%BD%D0%BA%D1%96%D0%B2%D1%81%D1%8C%D0%BA,+%D0%B2%D1%83%D0%BB.+%D0%93%D0%B0%D0%BB%D0%B8%D1%86%D1%8C%D0%BA%D0%B0,+51%D0%B0&hl=uk&z=16&output=embed',
    contactMethods: Object.freeze([
      Object.freeze({
        id: 'phone',
        label: 'Телефонний дзвінок'
      }),
      Object.freeze({
        id: 'messenger',
        label: 'Месенджер (Viber / Telegram)'
      }),
      Object.freeze({
        id: 'any',
        label: 'Будь-який зручний спосіб'
      })
    ]),
    bookingSteps: Object.freeze([
      Object.freeze({
        title: 'Залишаєте заявку або телефонуєте',
        text: 'Оберіть зручний спосіб зв’язку онлайн або за номером клініки.'
      }),
      Object.freeze({
        title: 'Адміністратор уточнює деталі та час',
        text: 'Зв’язуємося у робочий час і підбираємо зручну дату прийому.'
      }),
      Object.freeze({
        title: 'Ви отримуєте підтвердження запису',
        text: 'Фіксуємо ваш візит точно на узгоджений час без черг.'
      })
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
    var body = Array.isArray(price) ?
      TD.formatNumber(price[0]) + '–' + TD.formatNumber(price[1]) :
      TD.formatNumber(price);
    return (prefix ? prefix + '\u00A0' : '') + body + '\u00A0' + currency;
  };

  /**
   * Look up a calculator item in TD.CALC_ITEMS by stable calcItemId
   */
  TD.findCalcItemById = function (calcItemId) {
    if (!calcItemId || !Array.isArray(TD.CALC_ITEMS)) return null;
    for (var i = 0; i < TD.CALC_ITEMS.length; i++) {
      if (TD.CALC_ITEMS[i].id === calcItemId) return TD.CALC_ITEMS[i];
    }
    return null;
  };

  /**
   * Look up a service item in TD.SERVICES by stable serviceId
   */
  TD.findServiceById = function (serviceId) {
    if (!serviceId || !Array.isArray(TD.SERVICES)) return null;
    for (var i = 0; i < TD.SERVICES.length; i++) {
      if (TD.SERVICES[i].id === serviceId) return TD.SERVICES[i];
    }
    return null;
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
   * Shared reduced-motion preference check across TD modules
   */
  TD.prefersReducedMotion = function () {
    try {
      return Boolean(
        window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      );
    } catch (e) {
      return false;
    }
  };

  /**
   * Subscribe safely to a CSS media query change across modern and legacy engines
   */
  TD.onMediaQueryChange = function (query, handler) {
    if (!query || typeof handler !== 'function') return null;
    try {
      if (!window.matchMedia) return null;
      var mq = window.matchMedia(query);
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', handler);
      } else if (typeof mq.addListener === 'function') {
        mq.addListener(handler);
      }
      return mq;
    } catch (e) {
      return null;
    }
  };

  /**
   * Validate external HTTP(S) URLs and optional single-slash same-origin paths.
   * Blocks protocol-relative ("//evil.com"), embedded userinfo, control chars,
   * and non-HTTP schemes such as "javascript:" or "data:".
   */
  TD.isSafeHttpUrl = function (url, allowRelative) {
    var clean = String(url || '').trim();
    if (!clean || /[\u0000-\u001F\u007F\s]/.test(clean)) return false;

    if (allowRelative && clean.charAt(0) === '/') {
      /* Reject protocol-relative URLs ("//host") and backslash confusion ("/\host") */
      return clean.length === 1 || (clean.charAt(1) !== '/' && clean.charAt(1) !== '\\');
    }

    if (typeof window.URL === 'function') {
      try {
        var base =
          window.location && window.location.origin && window.location.origin !== 'null' ?
            window.location.origin :
            'https://trustdental.if.ua';
        var parsed = new window.URL(clean, base);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
        if (parsed.username || parsed.password) return false;
        return /^https?:\/\//i.test(clean);
      } catch (e) {
        return false;
      }
    }

    return /^https?:\/\/[^\s/@]+(?:\/[^\s]*)?$/i.test(clean);
  };

  /**
   * Check whether a validated URL points to the current document origin
   */
  TD.isSameOriginUrl = function (url) {
    var clean = String(url || '').trim();
    if (!clean) return false;
    if (clean.charAt(0) === '/') {
      return clean.length === 1 || (clean.charAt(1) !== '/' && clean.charAt(1) !== '\\');
    }
    if (typeof window.URL === 'function' && window.location && window.location.origin !== 'null') {
      try {
        return new window.URL(clean, window.location.href).origin === window.location.origin;
      } catch (e) {
        return false;
      }
    }
    return false;
  };

  /**
   * Populate DOM placeholders bound via [data-clinic] from TD.CLINIC
   */
  TD.hydrateClinicData = function () {
    var c = TD.CLINIC;
    var reviewsWord = TD.pluralizeUk(c.REVIEWS_COUNT, 'відгук', 'відгуки', 'відгуків');
    var reviewsText = c.REVIEWS_COUNT + ' ' + reviewsWord + ' на Google';

    var map = {
      name: function (el) {
        el.textContent = c.NAME;
      },
      tagline: function (el) {
        el.textContent = c.TAGLINE;
      },
      address: function (el) {
        el.textContent = c.ADDRESS_FULL;
      },
      'address-short': function (el) {
        el.textContent = c.ADDRESS;
      },
      hours: function (el) {
        el.textContent = c.HOURS;
      },
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
      'phone-display': function (el) {
        el.textContent = c.PHONE_DISPLAY;
      },
      'phone-link': function (el) {
        el.setAttribute('href', c.PHONE_HREF);
      },
      rating: function (el) {
        el.textContent = c.RATING_DISPLAY;
        if (el.hasAttribute('data-count')) {
          el.setAttribute('data-count', c.RATING_DISPLAY);
        }
      },
      'reviews-text': function (el) {
        el.textContent = reviewsText;
      },
      'maps-link': function (el) {
        el.setAttribute('href', c.GOOGLE_MAPS_URL);
      },
      'maps-embed': function (el) {
        if (c.GOOGLE_MAPS_EMBED_URL && el.getAttribute('src') !== c.GOOGLE_MAPS_EMBED_URL) {
          el.setAttribute('src', c.GOOGLE_MAPS_EMBED_URL);
        }
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
      'telegram-link': function (el) {
        var tgUrl = c.TELEGRAM_URL ? String(c.TELEGRAM_URL).trim() : '';
        if (/^https:\/\/(t\.me|telegram\.me)\/[A-Za-z0-9_+/=?&%-]+$/i.test(tgUrl)) {
          el.setAttribute('href', tgUrl);
          el.setAttribute('target', '_blank');
          el.setAttribute('rel', 'noopener noreferrer');
          el.removeAttribute('role');
          el.removeAttribute('aria-disabled');
          el.removeAttribute('tabindex');
          el.removeAttribute('title');
          el.classList.remove('is-disabled');
          el.setAttribute(
            'aria-label',
            'Написати в Telegram клініки TRUST DENTAL (відкриється у новій вкладці)'
          );
        } else {
          el.removeAttribute('href');
          el.removeAttribute('target');
          el.removeAttribute('rel');
          el.setAttribute('role', 'link');
          el.setAttribute('aria-disabled', 'true');
          el.setAttribute('tabindex', '-1');
          el.classList.add('is-disabled');
          el.setAttribute(
            'aria-label',
            'Telegram-чат клініки TRUST DENTAL (посилання очікує підтвердження власником)'
          );
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