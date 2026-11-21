# PROJECT_CONTEXT — TRUST DENTAL

## 1. Паспорт проєкту `[ARCH]` `[DATA]`

- **Назва**: `TRUST DENTAL` — односторінковий сайт приватної стоматологічної клініки (м. Івано-Франківськ, вул. Галицька, 51а).
- **Стек**: чистий HTML5 (`lang="uk"`), CSS3, vanilla JavaScript; без фреймворків, збірки та зовнішніх CDN.
- **Файлова структура**:
  - [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html) — семантична розмітка, inline critical CSS (`L43-131`), inline SVG-спрайт (`L150-241`), підключення стилю (`L134`) і модулів JS.
  - [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css) — self-hosted `Inter Variable` + `Inter Fallback` (`L10-46`), токени світлої/темної теми (`--bg*`, `--deco-*` тощо, `L51+`), компоненти, секція переваг і фонова система `.deco` (`12.2`, з `L2598`). Дубль `.sr-only` прибрано.
  - `fonts/` — 3 локальні `.woff2` сабсети (`inter-cyrillic-ext-wght-normal.woff2`, `inter-cyrillic-wght-normal.woff2`, `inter-latin-wght-normal.woff2`).
  - `img/` — `hero-mono.jpg`, `hero-mono-{800,1200,1600}.webp`, `logo.png`, `logo-white.png`, `img/services/{therapy,hygiene,surgery,braces,implant,orthopedics,pediatric,diagnostics}.{webp,png}`, `img/doctors/doctor-{1,2}-placeholder.svg`.
- **Простір імен і порядок підключення JS (`defer`, суворий порядок)** ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L137-L143)):
  1. [js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js) — `window.TD` Single Source of Truth (`TD.CLINIC`, `TD.NAV_ITEMS`, `TD.state`, `TD.SERVICES`, `TD.CALC_ITEMS`, `TD.hydrateClinicData`, хелпери).
  2. [js/theme.js](file:///c:/Users/nagib/Desktop/стоматолог/js/theme.js) — світла/темна тема (`TD.theme`), синхронізація `<meta data-theme-color>`.
  3. [js/header.js](file:///c:/Users/nagib/Desktop/стоматолог/js/header.js) — липка шапка через `#header-sentinel`, мобільний `.drawer` з focus-trap, scroll spy (`TD.header`).
  4. [js/effects.js](file:///c:/Users/nagib/Desktop/стоматолог/js/effects.js) — анімація лічильників і прогресивне однократне появлення блоків при скролі через `IntersectionObserver` з повагою до `prefers-reduced-motion` (`TD.effects`: `initCounters`, `initReveal`, `revealNow`).
  5. [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js) — рендер карток послуг (разом із `createServiceMedia` та містком до калькулятора), робіт, відгуків і контактів (`TD.render`, `TD.contacts`).
  6. [js/calculator.js](file:///c:/Users/nagib/Desktop/стоматолог/js/calculator.js) — інтерактивний калькулятор вартості та подія `CustomEvent('td:calc-select')` у `TD.state.calcSelection` (`TD.calculator`).
  7. [js/main.js](file:///c:/Users/nagib/Desktop/стоматолог/js/main.js) — точка входу, оркестрація ініціалізації модулів (`TD.main`).
- **Секції в HTML**:
  - `#site-header` ([L373](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L373)), `#mobile-drawer` ([L440](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L440))
  - `#top` Hero ([L628](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L628)) + `.stats-section` ([L734](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L734))
  - `#services` «Послуги та орієнтовна вартість» ([L799](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L799))
  - `#advantages` «Переваги» ([L845](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L845)) — статичний HTML/CSS
  - `#calculator` «Попередній розрахунок вартості» ([L924](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L924)) — повноцінна секція калькулятора вартості без дубльованої таблиці прайсу
  - `#doctors` «Команда фахівців» ([L744](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L744)) — 2 картки `.doctor-card` із тимчасовими даними
  - `#works` «Приклади лікування» ([L840](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L840)) — 6 клінічних прикладів `.work-card` («До»/«Після»), фільтри `TD.WORK_FILTERS` (7 напрямків), empty-state та доступне модальне вікно `#work-modal`
  - `#reviews` «Відгуки пацієнтів» ([L881](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L881)) — адаптер `TD.reviewsSource` (`Place ID: ChIJ9QI8s0nG1EARlyS0q9U9PV0`), summary `#reviews-summary`, автослайдер `#reviews-slider` (`aria-roledescription="carousel"`), стани `loading`/`error`/`empty`/`ready`, свайпи та перехід у Google Business Profile
  - `#contacts` «Запис та контакти клініки» ([L1033](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L1033)) — контакти `TD.CLINIC`, кроки запису `.booking-steps-card`, безпечне прев’ю карти `#contacts-map-container` (готове до `mapEmbedUrl` без непідтвердженого iframe), форма запису `#appointment-form` із frontend-валідацією й інтеграцією `td:calc-select` / `TD.state.calcSelection` через `TD.contacts`
  - `#site-footer` ([L1351](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L1351)) — двотемний логотип, навігація по 7 секціях, контакти, Google Maps, `@trust_dental_ua`, CTA запису, copyright і кнопка «На початок сторінки»

## 2. Правила тем, фону та адаптивності `[STYLE]` `[A11Y]`

- **Світла й темна теми**: `:root` = light mono-silver (`--bg: #EEF0F2`, `--deco-fill-1`, `--deco-fill-2`, `--deco-wave`, `--deco-wave-soft`, `--deco-line`, `--deco-line-soft`), `[data-theme='dark']` = dark (`--bg: #0F1217`, відповідні напівпрозорі `--deco-*`); без FOUC через inline bootstrap (`index.html:14-35`, `localStorage['td-theme']`).
- **Фонова система `.deco`**: усі символи оголошені один раз у `.svg-sprite` (`#deco-tooth`, `#deco-wave-a`, `#deco-wave-b`, `#deco-arc`, `#deco-ribbon` із градієнтами `#deco-grad`, `#deco-grad-wave`, `#deco-grad-wave-b`) і підключаються через `<use href="#...">`; секції мають `isolation: isolate; overflow-x: clip; content-visibility: visible`, контейнери `> .container` — `z-index: 1`, `.deco` — `z-index: 0; pointer-events: none; user-select: none`.
- **Брейкпоїнти**: `<= 1279px` (3-кол. послуги), `1220px–980px` (ущільнений header/hero), `<= 980px / 979px` (мобільне меню, стек hero, прихована `path:nth-of-type(1)` у hero/services, `.hero__bg-waves` `240px` та `.services__bg-waves` `260px` внизу, `calc-layout: minmax(0, 1fr)`, стек intro `#advantages`, зменшені `.deco` зуби/дуги; при `max-height: 520px` компактний landscape hero), `<= 767px` (1-кол. `#advantages` і мобільні картки прайсу), `<= 719px` (світліші `--deco-*`, `.services__bg-waves` `210px`, приховані другорядні `.deco`, макс. 1 великий декор на секцію), `<= 639px` (1-кол. послуги/калькулятор, перенос у `.calc-summary__cta`), `<= 540px` (1-рядковий `.hero__badge`, зменшений `.hero__bg-tooth`, `.hero__img { object-position: 36% center }`, повноширинні CTA).
- **Заборони рендеру/ефектів**: жодних `filter`, `blur`, `backdrop-filter` на картках (дозволено лише на `.header.is-scrolled`), `mask-image`, `mix-blend-mode`, `will-change`, `background-attachment: fixed`, `opacity` на `.deco` контейнерах, автоанімацій чи паралаксу; у `@media (forced-colors: active)` `.deco` ховаються.

## 3. Непідтверджені дані й обмеження `[DATA]` `[TODO]`

- `TD.CLINIC.EXPERIENCE_YEARS = '[X]'` ([js/data.js:28](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L28), [index.html:516](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L516)) — очікує підтвердження власником.
- `TD.CLINIC.GOOGLE_MAPS_URL` і `GOOGLE_PLACE_ID = 'ChIJ9QI8s0nG1EARlyS0q9U9PV0'` ([js/data.js:32-34](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L32-L34)) — підставлено офіційний профіль клініки (за потреби звірити через Google Place ID Finder щодо параметра `!4d48.7089406` при `@48.9262602,24.7089406`); живий рейтинг у `#reviews-summary` очікує підключення backend API (`summaryVerified: false`).
- `TD.SERVICES` ([js/data.js:67-107](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L67-L107)) — 6 із 8 послуг містять `[ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]`.
- Заборонені будь-які абсолютні медичні гарантії («без болю», «без набряків», «100% результат», «гарантовано», «без ризиків»).

---

## 4. Компактна пам'ять проєкту

```md
---
name: single-source-of-truth-td
type: architecture
status: active
---
Усі дані клініки, послуг, прайсу й калькулятора зберігаються замороженими у `window.TD` ([js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L9-L120)), а скрипти підключаються з `defer` у фіксованому порядку ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L137-L143)).

Why: виключає розсинхрон між секціями та гонки ініціалізації без збірника.

Apply: нові дані секцій додавати в `js/data.js` і рендерити через `createElement`/`textContent` (без `innerHTML`).
```

```md
---
name: service-media-fallback-lock
type: architecture
status: active
---
3D-іконки послуг рендерить `createServiceMedia()` ([js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js#L55)) із `<picture class="service-card__picture">` (`source` `.webp` + fallback `.png`, eager `decoding="async"` без `loading="lazy"`) та `<div class="service-card__fallback">` ([css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css#L1735)). `.service-card__fallback` прихована через `display: none` за замовчуванням і при `.is-loaded`, та вмикається (`display: flex`) лише в `.is-fallback` (при `error` або відсутності `iconImg`).

Why: виключає короткочасний показ або просвічування старого круглого SVG-бейджа під час оновлення сторінки, lazy-відтермінування чи крос-фейду, зберігаючи 100% штатний WebP/PNG/SVG fallback та ідемпотентний `renderServices()`.

Apply: не повертати видимий за замовчуванням `.service-card__fallback`, `opacity`-кросфейд поверх картинки або `loading="lazy"` для `.service-card__img`; зберегти 8 пар WebP+PNG в `img/services/` та ідентифікатори `160x160`.
```

```md
---
name: static-advantages-section
type: decision
status: active
---
Секцію `#advantages` ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L588), [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css)) реалізовано статичним HTML/CSS з inline SVG (`32x32`, `currentColor`) і токенами теми без змін у JS.

Why: контент статичний, не залежить від калькулятора чи фільтрів і працює без JS.

Apply: не додавати JS-логіку чи зовнішні іконки для `#advantages`; тримати тексти без медичних гарантій.
```

```md
---
name: page-wide-svg-deco-system
type: decision
status: active
---
Фоновий декор усіх секцій (`#top`..`#site-footer`) побудовано через єдиний `.svg-sprite` (`#deco-tooth`, `#deco-wave-a/b`, `#deco-arc`, `#deco-ribbon`, градієнти `#deco-grad*`) у [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L207-L240) та блок `12.2` [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css#L2598) із `content-visibility: visible` і `overflow-x: clip`.

Why: `content-visibility: auto` збивав якірний скрол (до `#doctors`), а статичні `.deco` з `stop-opacity="0"` на краях хвиль і приховуванням у `forced-colors` дають цілісний фон без JS і GPU-фільтрів.

Apply: при верстці майбутніх секцій не повертати `overflow: hidden` на секції, не задавати `.deco { display }` вище правила `forced-colors` і зберігати макс. 1 великий декор на секцію на `<= 719px`.
```

```md
---
name: responsive-hero-and-calc-hardening
type: decision
status: active
---
У [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css) та критичному CSS [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L129-L130): додано `.drawer[hidden] { display: none; }`, прибрано вертикальні десктопні стрічки hero/services на `<= 979px`, зменшено `.hero__bg-tooth` і 1-рядковий `.hero__badge` на `<= 540px`, ущільнено landscape hero (`max-height: 520px`) та зафіксовано `calc-layout: minmax(0, 1fr)` із переносом `.calc-summary__cta`.

Why: усунуто вихід `.drawer__cta` поза viewport у tab-порядок, вертикальні смуги за мобільним текстом/картками, перенос бейджа й обрізання `.calc-item` на `360px`.

Apply: на нових секціях застосовувати `minmax(0, 1fr)` у grid та приховувати `[hidden]` явно вище `display: flex/grid`.
```

```md
---
name: standalone-calculator-section
type: decision
status: active
---
Дубльовану таблицю прайсу (`#price-filters`, `#price-status`, `.price-board`, `#price-list`, `.price-row`, `TD.PRICE_FILTERS`, `TD.PRICES` і функції `renderPriceFilters`/`renderPriceList`/`applyPriceFilter`) прибрано, а секцію реорганізовано в єдину повноцінну секцію попереднього розрахунку `<section id="calculator" class="section section--prices calculator-section" aria-labelledby="heading-calculator">` ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L924-L977), [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css), [js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js), [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js), [js/effects.js](file:///c:/Users/nagib/Desktop/стоматолог/js/effects.js)):
- Головним заголовком секції став `<h2 id="heading-calculator" class="section__title">Попередній розрахунок вартості</h2>` із eyebrow `ПОПЕРЕДНІЙ РОЗРАХУНОК`; усі навігаційні посилання (шапка, `#mobile-drawer`, hero CTA, `#services-calc-jump`, футер і `TD.NAV_ITEMS`) ведуть на `#calculator` (`data-nav-target="calculator"`).
- Єдиним джерелом цін залишено `TD.CALC_ITEMS` (8 процедур, зв'язаних із `TD.SERVICES` через `calcItemId`).
- Збережено фонову систему `.section--prices` (`--prices-section-bg`, `.deco--prices-ribbon`, `.deco--prices-arc`, `.deco--prices-wave`; на `<= 719px` видимий лише 1 декор `.deco--prices-ribbon`), тональну сцену `.calc-block` (`--calc-stage-bg`, `isolation: isolate; overflow: clip` на `>= 640px`, без подвійної рамки на `<= 639px`), липку панель `<aside class="calc-summary">` (`position: sticky` на desktop `>= 980px`) і `44×44px` touch-зони чекбоксів та степерів.
- На мобільних екранах (`<= 639px`) реалізовано компактний мобільний інтерфейс калькулятора (`.calc-list-col`, `.calc-mobile-head` зі швидким індикатором суми `#calc-mobile-total` та акордеоном `#calc-more-toggle` з `aria-expanded="false/true"` і `aria-controls="calc-items"`): спочатку відображаються 4 основні послуги (`data-calc-group="primary"`), а додаткові 4 позиції (`data-calc-group="extra"`) розгортаються за кліком або автоматично залишаються видимими у вибраному стані (`.calc-item.is-selected`). Для невибраних позицій (`.calc-item:not(.is-selected)`) на `<= 639px` вимкнений рядок `.calc-stepper` приховано й відкривається одразу після вибору послуги (із підказкою `.calc-stepper__hint`), що скорочує початкову висоту списку на телефоні більш ніж на 70% і тримає `.calc-summary` у прямій досяжності.

Why: ціни вже відображаються безпосередньо в картках послуг `#services` і в позиціях калькулятора `#calc-items`, тому окрема таблиця прайсу створювала дублювання та зайву висоту сторінки.

Apply: не повертати дубльований масив `TD.PRICES` чи таблицю `#price-list`; зберігати `overflow: clip` (не `overflow: hidden`) на `.section--prices` та `.calc-block`, щоб працював `position: sticky` на `.calc-summary`.
```

```md
---
name: doctors-two-card-section
type: decision
status: active
---
Заглушку `#doctors` ([index.html:735-819](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L735-L819), блок `12.3` [css/style.css:3000](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css#L3000)) замінено на секцію `.section.doctors-section` із сіткою `.doctors-grid` (2 рівновисотні картки `.doctor-card`, `aspect-ratio: 16 / 10` у `.doctor-card__media`, `object-fit: cover; object-position: center 20%`), локальними прозорими SVG-placeholder у `img/doctors/doctor-{1,2}-placeholder.svg`, прогресивним `error`-fallback `initDoctorMediaFallbacks()` у [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js#L336) та адаптованим `.deco--doctors-tooth` (`220×264` desktop → `180×216` `<=979px` → `132×158` `opacity: 0.55` `<=719px`).

Why: створює повноцінний двоколонковий блок без вигадування імен/регалій/стажу та зберігає узгоджений світлий/темний фон медіа й перехід від `.deco--prices-wave` до `#works`.

Apply: при підтвердженні реальних лікарів замінити `src`/`alt`, `[Спеціалізація лікаря 1/2]`, `[Ім'я та прізвище лікаря 1/2]` та текст опису у двох `<article class="doctor-card">` без зміни структури сітки.
```

```md
---
name: project-cleanup-audit
type: decision
status: active
---
Виконано аудит активів і коду: 22 зображення в `img/` та 3 шрифти в `fonts/` активні без бінарних дублікатів; видалено лише невикористаний дубль `.sr-only` з [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css) (критичний inline-CSS і fallback-логіка недоторкані).

Why: усунуто мертве CSS-правило без порушення FOUC-захисту, `createServiceMedia()`, секцій-заглушок і штатних WebP/PNG-пар.

Apply: майбутній клас `sr-only` або за потреби вже підтримується через inline `<head>` ([index.html:58](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L58)) або додається повторно при використанні в DOM.
```

```md
---
name: hero-reload-cls-stability
type: decision
status: active
---
Стабілізовано геометрію hero-блоку, фото кабінету та контуру хвилі під час завантаження й перезавантаження ([index.html:40-143](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/index.html#L40-L143), [index.html:450-467](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/index.html#L450-L467), [css/style.css:10-41](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/css/style.css#L10-L41), [css/style.css:977-1020](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/css/style.css#L977-L1020)):
1) Inline critical CSS у `<head>` синхронізовано з [css/style.css](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/css/style.css): додано `.deco`, `.deco--hero-arc`, `.deco--stats-wave`, `.stats-section` ізоляцію, `@media (max-width:719px)` та `@media (max-width:979px) and (max-height:520px)` (раніше відсутні правила робили `<svg class="deco--hero-arc">` потоковим flex-елементом до застосування зовнішнього CSS).
2) `.hero__media` переведено на `position: absolute; inset: 0;` (`.hero__picture` і `.hero__img` `display: block; width: 100%; height: 100%;`), а `<img class="hero__img">` отримав `decoding="sync"` при узгоджених `imagesizes` / `sizes="(max-width: 979px) 96vw, (max-width: 1220px) 47.5vw, 50vw"`.
3) `'Inter Fallback'` розділено на вагові `@font-face` (`100 599` `107.8%`, `600` `102.0%`, `700 900` `101.0%`), що прибрало стрибок переносу H1 (`768px`) та зсув блоків під час підвантаження шрифтів.

Why: виключено розбіжність Critical vs Full CSS, вплив intrinsic-розмірів `<img>` на висоту контейнера, пост-рендерне декодування LCP-фото і перенос рядків `hero__title` між subset-файлами шрифту.

Apply: завжди тримати inline critical `<style>` ([index.html](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/index.html)) синхронним з правилами `.header`, `.hero`, `.hero__media*`, `.deco--hero-arc`, `.deco--stats-wave` і `.stats-section` у [css/style.css](file:///c:/Users/nagib/Desktop/%D1%81%D1%82%D0%BE%D0%BC%D0%B0%D1%82%D0%BE%D0%BB%D0%BE%D0%B3/css/style.css), а `<link rel="preload" imagesizes>` ідентичним `<source sizes>`.
```

```md
---
name: user-collab-rules
type: preference
status: active
---
Відповідати українською стисло, за шаблоном; вносити лише мінімальні локальні правки, не вигадувати факти/дані, не чіпати суміжні секції, після змін перевіряти `node --check`, `git diff --check` та незмінність залежностей.

Why: зберігає цілісність односторінника і точність клінічної інформації.

Apply: виконувати на кожному етапі до звіту користувачу.
```

```md
---
name: unconfirmed-clinic-placeholders
type: issue
status: active
---
У `TD.CLINIC.EXPERIENCE_YEARS` ([js/data.js:28](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L28)), `GOOGLE_MAPS_URL` ([js/data.js:31](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L31)) та 6 послугах `TD.SERVICES` ([js/data.js:67-107](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js#L67-L107)) лишаються `[X]`, пошуковий лінк та `[ВПИСАТИ ПІСЛЯ ПІДТВЕРДЖЕННЯ ВЛАСНИКОМ]`.

Why: дані ще не підтверджені власником клініки.

Apply: `[VERIFY]` / `[TODO]` — замінювати лише після прямого підтвердження від користувача.
```

```md
---
name: pending-sections-and-seo-polish
type: issue
status: active
---
У `#doctors` використані тимчасові `[Ім'я]/[Спеціалізація]` і SVG-placeholder-и, у `#works` кейси мають `status: 'placeholder'`, у `#reviews` `TD.REVIEWS = Object.freeze([])` та `summaryVerified: false` очікують підключення backend-проксі або перевірених записів Google Business Profile, у `#contacts` та `#site-footer` (`TD.APPOINTMENT_CONFIG`) очікують підключення серверного `endpoint` для реальної відправки форми, офіційного `mapEmbedUrl` (поки працює стилізована preview-карта `#contacts-map-preview`) і `privacyPolicyUrl`; в `<head>` ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html)) додано `canonical`, `hreflang`, Open Graph, Twitter Card та JSON-LD `Dentist`.

Why: попередні етапи повністю замінили всі заглушки (включно з `#contacts` і `#site-footer`), сфокусувавшись на стабільності рендеру, адаптивності, доступності та чесних UI-станах без вигадування неперевірених даних клініки.

Apply: `[TODO]` — замінити фото лікарів і кейсів `#works`, підключити серверний Google Places API endpoint до `TD.REVIEWS_META.endpoint` (або додати перевірені записи у `TD.REVIEWS`) і налаштувати `TD.APPOINTMENT_CONFIG.endpoint` / `mapEmbedUrl` / `privacyPolicyUrl` після підтвердження власником.
```

```md
---
name: works-gallery-and-lightbox
type: decision
status: active
---
Секцію `#works` («Приклади лікування») реалізовано на базі `TD.WORK_FILTERS` (7 категорій) та `TD.WORKS` (6 клінічних кейсів) у [js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js) з рендером через `TD.render` ([js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js)), SVG-заглушками `#td-work-before`/`#td-work-after` при `status: 'placeholder'`, фільтром з живим статусом `#works-status`, станом порожньої категорії `#works-empty` (`#works-reset-filter`), доступним модальним переглядачем `#work-modal` (фокус-трап, `inert`, `Escape`, навігація Попередній/Наступний) та фоновим декором `.deco--works-contour`/`.deco--works-arc` у `--works-section-bg`.

Why: без реальних фото клініки заборонено вигадувати кейси чи породжувати 404-помилки на порожніх `<img>`; фіксовані `4 / 3` слоти `.work-card__slot` гарантують нульовий CLS і готовність до простої заміни `status` на `'ready'` після додавання файлів у `img/works/`.

Apply: для підключення реальних фото покласти `case-01-{cover,before,after}.webp` (і за потреби fallback `.jpg`/`.png`) у `img/works/`, за потреби заповнити `*Fallback` і змінити `status` у `TD.WORKS` із `'placeholder'` на `'ready'`.
```

```md
---
name: reviews-google-carousel-and-adapter
type: decision
status: active
---
Секцію `#reviews` («Відгуки пацієнтів») прив’язано до офіційного профілю TRUST DENTAL Google (`TD.CLINIC.GOOGLE_PLACE_ID = 'ChIJ9QI8s0nG1EARlyS0q9U9PV0'`, `TD.CLINIC.GOOGLE_MAPS_URL`) через нормалізований формат (`id`, `source`, `author`, `authorInitials`, `authorPhoto`, `rating`, `relativeDate`, `publishedAt`, `text`, `ownerReply`, `googleUrl`, `verified`) у [js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js), адаптер `TD.reviewsSource` та доступний автослайдер `[data-reviews-slider]` у [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js) і [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css) (`12.5`).
- Імпорт дозволений лише через власний backend/serverless endpoint (`TD.REVIEWS_META.endpoint`, JSON `{ source, placeId, rating, userRatingCount, reviews }`) або перевірений вручну масив `TD.REVIEWS`; без scraping HTML Google Maps і без API-ключів у frontend-файлах.
- До отримання підтверджених даних API (`summaryVerified: false`) числовий рейтинг і кількість у `#reviews-summary` приховані (показується «Перевірити актуальний рейтинг у Google»), а при `TD.REVIEWS = []` відображається `#reviews-empty` («Реальні відгуки пацієнтів доступні в Google.»).
- Слайдер показує 3/2/1 картки (desktop/tablet/mobile), перемикається кожні `6s` (і відновлюється через `9s` після взаємодії), зупиняється при hover, focus, відкритті повного тексту, кліку «Пауза», `visibilitychange` та `prefers-reduced-motion: reduce`; підтримує `Prev`/`Next`, `role="tablist"` dots із roving arrows, пасивні touch-свайпи (`touch-action: pan-y`), дедуплікацію за `id` та повне очищення таймерів через `clearTimeout` перед рендером і на `pagehide`.

Why: виключає витік Google Places API-ключа у публічний статичний сайт, нелегальний scraping, показ неперевірених оцінок, дублювання таймерів/карток і стрибки висоти при перемиканні.

Apply: для живого імпорту налаштувати власний backend endpoint, що повертає вказаний JSON-контракт без передачі ключів у браузер, і вказати його шлях у `TD.REVIEWS_META.endpoint`.
```

```md
---
name: contacts-booking-and-footer
type: decision
status: active
---
Замінено заглушки `#contacts` ([index.html:1033](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L1033)) та `#site-footer` ([index.html:1351](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L1351)), а також прибрано всі невикористані `.stub-section` / `.stub-card` правила ([css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css)):
- Контакти клініки, 3 кроки запису (`bookingSteps`), опції послуг форми (`TD.APPOINTMENT_SERVICES`, включно з `'calc-bundle'`) та конфігурація `TD.APPOINTMENT_CONFIG` (`endpoint`, `privacyPolicyUrl`, `mapEmbedUrl`) винесені в [js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js) і гідруються через `TD.hydrateClinicData()`.
- Модуль `TD.contacts` у [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js) обробляє `#appointment-form` (валідація ПІБ/телефону/часу/коментаря/згоди, `aria-invalid`, `aria-describedby`, фокус на перше невалідне поле, захист від подвійного сабміту, чесні стани `loading`/`success`/`error`), інтеграцію з калькулятором через `td:calc-select` і `TD.state.calcSelection` (`#appointment-calc-box`), а також плавний скрол і фокус на `#appointment-name` при переході з CTA запису (`href="#contacts"`).
- За відсутності підтвердженого `mapEmbedUrl` блок `#contacts-map-container` показує стилізовану preview-карту `#contacts-map-preview` без вигаданих координат чи стороннього трекінгу, а за порожнього `privacyPolicyUrl` у `#site-footer` виводиться текстовий статус замість фіктивного `href="#"`.

Why: статичний сайт не має реального backend-приймача заявок і підтвердженої URL-адреси політики конфіденційності чи iframe-вставки Google Maps; зберігання персональних даних пацієнта в `localStorage`/`sessionStorage` заборонено з міркувань приватності, а фіксовані розміри помилок, кнопки відправки й карти виключають CLS.

Apply: підключити реальний backend/serverless endpoint до `TD.APPOINTMENT_CONFIG.endpoint`, за потреби додати перевірені `TD.APPOINTMENT_CONFIG.mapEmbedUrl` та `TD.APPOINTMENT_CONFIG.privacyPolicyUrl`.
```

```md
---
name: smooth-motion-and-zero-cls-hardening
type: decision
status: active
---
Виконано системну стабілізацію макета й упроваджено стриману монохромну динаміку на весь сайт ([css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css), [js/effects.js](file:///c:/Users/nagib/Desktop/стоматолог/js/effects.js), [js/main.js](file:///c:/Users/nagib/Desktop/стоматолог/js/main.js), [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js), [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html)):
- Синхронізовано пре-JS `:empty` висоти (`.services-grid:empty`, `.price-filters:empty`, `.price-list:empty`, `.calc-list:empty`, `.works-filters:empty`, `.works-grid:empty`, `.reviews-summary:empty`) по всіх брейкпоїнтах, додано `min-height: 1.45em` для `.price-status`/`.works-status` та обгортку `#reviews-stage` (`min-height: 226px` / `288px` mobile), що усунуло стрибки при сповільненому завантаженні та reload серед сторінки.
- Замінено заборонений `transition: width` на `.reviews-slider__dot::before` на GPU `transform: scaleX(0.375)` → `scaleX(1)`.
- Усі `:hover` ефекти (кнопки, навігація, картки послуг/переваг/лікарів/робіт/відгуків, фільтри, степер, посилання контактів і футера) ізольовано в `@media (hover: hover) and (pointer: fine)`; розширено список елементів плавної зміни теми `html.is-theme-switching` (включно з `.site-footer`, `.stats-card`, `.contacts-list__icon`, `.booking-steps__num`).
- Додано однократну прогресивну появу секцій і блоків нижче першого вікна (`TD.effects.initReveal` у `TD.main.initStage2Modules()`, спільний `IntersectionObserver` із `rootMargin: '0px 0px -8% 0px'`, `threshold: 0.08`): елементи нижче `vh * 0.96` отримують `.td-reveal-pending` (`translateY(14px)` desktop / `10px` mobile `<=719px`; тільки `opacity` для `.deco` без перезапису поворотів), при входженні отримують `.is-visible` і `.is-revealed` з композитними переходами (`520–620ms` desktop, `450–480ms` mobile) й адаптивним stagger (`55ms <= 165ms` desktop, `45ms <= 90ms` tablet, `0ms` `<640px`), очищенням `.is-revealing` після `transitionend` та запобіжним sweep при швидкому скролі (`scroll`/`scrollend`), переході за якорем (`hashchange`), клавіатурному фокусі (`focusin`) і повним відключенням слухачів після відкриття всіх цілей; покрито `.stat-item`, `#services`, `#advantages`, `#prices`/`.price-row`, `#calculator`/`.calc-item`/`.calc-summary`/`.deco--prices-calc-*`, `#doctors`, `#works`, `#reviews`, `#contacts` і разову появу `#site-footer`.

Why: виключає sticky-hover на сенсорних пристроях, затримку наведення після reveal, конфлікти `:hover` і поворотів `.deco`, стрибки висоти на 3G/reload і гарантує 100% видимість контенту без JS або при `prefers-reduced-motion: reduce`.

Apply: для нових карток і блоків нижче першого екрана зберігати підхід «спершу резервування геометрії й видимий базовий стан у CSS, потім прогресивний `TD.effects.initReveal` / `TD.effects.refreshReveal()` на `opacity`/`transform`» без подвійного приховування вкладених контейнерів.
```

```md
---
name: mobile-drawer-floating-panel
type: decision
status: active
---
Оновлено `#mobile-drawer` ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html#L332-L449), блок `6` [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css#L747-L1060)) як компактне плаваюче діалогове вікно замість порожньої повноекранної смуги:
- Шапка `.drawer__head` використовує світлий/темний адаптивний логотип (`img/logo.png`/`img/logo-white.png`), прихований заголовок `#drawer-title` (`aria-labelledby="drawer-title"`, гідрований через `TD.CLINIC.NAME`), тонкий декоративний SVG `.drawer__deco` (`aria-hidden="true"`, прихований у `forced-colors`) і кнопку закриття `#drawer-close` (`44×44px`).
- Навігація містить 7 пунктів (`.drawer__link`, ≥44px) з монохромними іконками й шевронами; внизу `.drawer__contacts-card` виводить адресу, графік роботи, телефон і акцентну кнопку «Записатися на консультацію».
- По висоті вікно прилягає до вмісту (`bottom: auto; max-height: calc(100dvh - 20px)`), а в landscape (`max-width: 979px` і `max-height: 560px`) перемикається на 2-колонкову сітку `.drawer__list` та компактну flex-панель контактів, не виходячи за межі екрана; фокус-трап, `Esc`, клік по `.drawer-backdrop`, повернення фокусу на `#burger-btn` і `inert` у `TD.header` ([js/header.js](file:///c:/Users/nagib/Desktop/стоматолог/js/header.js)) збережено.

Why: виключає велику порожню вертикальну зону на високих екранах, обрізання нижньої кнопки/контактів у landscape і зберігає єдину монохромну стилістику та A11y-контракт сайту.

Apply: під час змін `.drawer*` тримати лише `transform`/`opacity` без `transition: all`/`backdrop-filter` і зберігати адаптацію під `max-height: 560px`.
```

```md
---
name: prices-calculator-deco-extension
type: decision
status: active
---
Декоративну систему секції `#calculator` (`.section--prices.calculator-section`, [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html), секція `12.2` [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css)) побудовано на спільному `.svg-sprite`:
- На рівні секції використовуються `.deco--prices-ribbon` (`#deco-ribbon` зверху справа), `.deco--prices-arc` (`#deco-arc` зліва: `left: -175px; top: 180px` desktop → `left: -145px; top: 140px` `<=979px`) та `.deco--prices-wave` (`#deco-wave-a` знизу), без статичної `opacity` на `.deco--prices-*`.
- При `<= 719px` `.deco--prices-arc` і `.deco--prices-wave` приховуються вище `@media (forced-colors: active)`, лишаючи рівно 1 великий верхній декор `.deco--prices-ribbon` (`150px`); у `forced-colors: active` усі `.deco` вимкнені.

Why: зберігає візуальну спадкоємність монохромних ліній між `#advantages`, `#calculator` і `#doctors`, `overflow: clip` не ламає `position: sticky` у `.calc-summary`, а мобільний екран не перевантажується зайвими лініями.

Apply: для подальших змін у `#calculator` зберігати `overflow: clip` (не `overflow: hidden`) та утримувати мобільне приховування другорядних `.deco--prices-*` вище правила `forced-colors`.
```

```md
---
name: frontend-audit-remediation
type: decision
status: active
---
Усунено технічний борг за результатами фронтенд-аудиту (крім навмисно залишених до хостингу плейсхолдерів `§2.1`):
- **SEO & Structured Data (`<head>`)**: додано `robots`, `canonical`, `hreflang` (`uk-UA`, `x-default`), Open Graph (`og:*`), Twitter Card (`twitter:*`) і JSON-LD `Dentist` (`PostalAddress`, `GeoCoordinates`, `OpeningHoursSpecification`, `sameAs`).
- **Дедуплікація SVG та URL**: у `.svg-sprite` винесено `#td-icon-arrow`, `#td-icon-arrow-left`, `#td-icon-arrow-up`, `#td-icon-phone`, `#td-icon-close`, `#td-icon-chevron-right`, `#td-icon-pin`, `#td-icon-clock`, `#td-doctor-fallback` і `#deco-drawer`; `.google-badge` використовує `#td-google-logo` і `#td-star`, `createArrowSvg()` — `#td-icon-arrow`, а всі 7 посилань Google Maps (включно з `<noscript>`) мають `data-clinic="maps-link"`.
- **A11y, Семантика, CSS і Lifecycle**: `#mobile-drawer` змінено з `<aside>` на `<div role="dialog">`; прибрано дубльовані `role="alert"` із 5 полів `.form-field__error` на користь `aria-invalid` + фокусу + єдиного `#appointment-status`; додано fallback-заголовок у `#work-modal-title`, атрибут `[hidden]` на порожній `#reviews-dots[role="tablist"]`, `srcset`/`sizes` на fallback `<img class="hero__img">`, Linux/Android локальні шрифти (`Roboto`, `Liberation Sans`, `DejaVu Sans`) у `'Inter Fallback'`, `@supports not (overflow-x: clip)` fallback та централізований `TD.lifecycle` (`onPageHide`/`onPageShow`) і `document.hidden` fallback для фонових вкладок і BFcache.

Why: закриває SEO-індексацію локального бізнесу, прибирає дублювання SVG/URL і спам скрінрідера без порушення інваріантів `window.TD`, критичного CSS і WebP/PNG пар.

Apply: нові повторювані іконки додавати в `.svg-sprite`, Google Maps посилання позначати `data-clinic="maps-link"`, а таймери модулів реєструвати в `TD.lifecycle`.
```

```md
---
name: services-to-calculator-bridge
type: decision
status: active
---
Замінено однотипні кнопки «Дізнатися ціну» (`.service-card__cta`) у `#services` на двосторонній інтерактивний місток «картка послуги ↔ калькулятор вартості» ([js/data.js](file:///c:/Users/nagib/Desktop/стоматолог/js/data.js), [js/calculator.js](file:///c:/Users/nagib/Desktop/стоматолог/js/calculator.js), [js/render.js](file:///c:/Users/nagib/Desktop/стоматолог/js/render.js), [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css), [index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html)):
- Кожен об’єкт `TD.SERVICES` має стабільне поле `calcItemId` (`therapy -> calc-caries`, `hygiene -> calc-hygiene`, `surgery -> calc-extraction`, `braces -> calc-braces`, `implantation -> calc-implant`, `orthopedics -> calc-crown`, `diagnostics -> calc-consultation`, `pediatric -> null`) та хелпери `TD.findCalcItemById()` / `TD.findServiceById()`.
- Секція `#services` має заголовок «Послуги та орієнтовна вартість» (eyebrow `Послуги та ціни`). На desktop/tablet (`>= 640px`) картки `.service-card` мають рівну висоту (`height: 100%`), ілюстрацію `160×160px`, опис `.service-card__desc`, вирівняний блок ціни `.service-card__price-wrap` (`min-height: 42px`) та повноширинну кнопку `.service-card__add-to-calc` на одному горизонтальному рівні. На мобільному (`<= 639px`) картки трансформуються у компактні горизонтальні картки-рядки (CSS Grid із мініатюрою зуба `.service-card__media` `64×64px` на `480px–639px` та `56×56px` на `<= 479px`, назвою, ціною та кнопкою дії без довгого опису `.service-card__desc`), що скорочує висоту `#services-grid` із `~3120px` до `~1050px` зі збереженням WebP/PNG і SVG-fallback.
- Картка послуги виводить підтверджену ціну безпосередньо з `TD.CALC_ITEMS` (`.service-card__price`) і компактну кнопку `<button type="button" class="service-card__add-to-calc">` (`+ Додати до розрахунку` ↔ `✓ Вибрано`, `aria-pressed="false/true"`). Для `pediatric` (`calcItemId: null`) без вигадування ціни виводиться повідомлення «Ця послуга потребує індивідуального розрахунку» та кнопка `type="button"` «Уточнити вартість», що обирає `pediatric` у `#appointment-service` і плавно скролить до `#contacts`.
- Двостороння синхронізація працює через `TD.calculator.addItem()`, `TD.calculator.isItemSelected()`, `TD.calculator.reset()` і подію `CustomEvent('td:calc-change')`, а також статус-бар `#services-calc-bar` (`aria-live="polite"`) із кнопкою переходу до `#calculator`.

Why: усуває 8 однакових кнопок «Дізнатися ціну», гарантує 100% збіг ціни на картці й у калькуляторі без вигаданих цифр та підтримує миттєву синхронізацію в обидва боки.

Apply: при додаванні чи зміні позицій у `TD.CALC_ITEMS` оновлювати `calcItemId` у `TD.SERVICES`; для послуг без прямого розрахунку залишати `calcItemId: null`.
```

---

## 5. Правила плавності, анімацій, стабільного рендерингу та запобігання Layout Shift `[PERF]` `[ARCH]`

- **Архітектурні правила плавності та performance**:
  - Усі переходи й поява елементів виконуються на композитних властивостях (`opacity`, `transform: translateY/translateX/scale`) без сторонніх бібліотек, CDN чи безперервних циклів `setInterval`;
  - `scroll-behavior: smooth` поєднується зі `scroll-margin-top: calc(var(--header-h) + 16px)` на секціях (`.section`, `.advantages-section`) і скидається в `auto` при `prefers-reduced-motion`;
  - перемикання теми (`html.is-theme-switching`) анімує лише колірні властивості (`background-color`, `color`, `border-color`, `box-shadow`, 300ms); `.header.is-scrolled` змінює фон/бордер/тінь без зміни висоти (`72px`); пасивний coalesced sweep (`scroll`/`scrollend`/`hashchange`/`focusin`) у `TD.effects.initReveal()` автоматично знімає всі слухачі та observer одразу після відкриття всіх елементів.
- **Правила анімацій, hover і focus**:
  - однократна поява `[data-reveal]` (`.is-visible` + `.is-revealed`, `opacity` + `translateY(14px)` desktop / `10px` `<=719px` для `head`/`card`, чистий `opacity` для `deco`, малювання `.section__eyebrow::before` через `scaleX(0→1)`) із затримкою `<= 165ms` (`0ms` `<640px`), `threshold: 0.08` та `rootMargin: '0px 0px -8% 0px'`, очищенням `.is-revealing` після `transitionend` та миттєвим відкриттям елементів у першому в’юпорті, при клавіатурному `focusin`, при фільтрації (`.is-visible.is-revealed` без `.td-reveal-pending`) та при прокручуванні повз елемент;
  - активні стани карток (`translateY(-2px)`, тінь, бордер), іконочних квадратів `.advantage-card__icon` (`scale(1.03)`), `.reviews-slider__dot::before` (`scaleX(0.375→1)`, без `transition: width`) і фільтрів/калькулятора не змінюють геометрію;
  - усі `:hover` правила обгорнуті в `@media (hover: hover) and (pointer: fine)`; `:focus-visible` та `:active` залишаються активними незалежно від типу вводу.
- **Обмеження щодо `prefers-reduced-motion` та `forced-colors`**:
  - у `@media (prefers-reduced-motion: reduce)` (`css/style.css` секція 13): `animation-duration: 0.001ms !important`, `animation-iteration-count: 1 !important`, `transition-duration: 0.001ms !important`, `scroll-behavior: auto !important`, і примусові `opacity: 1 !important; transform: none !important; transition: none !important;` для `[data-reveal="head"]`, `[data-reveal="card"]`, `.td-reveal-pending:not([data-reveal="deco"])`, `.section__eyebrow::before`, `.work-card.is-entering` (а для `[data-reveal="deco"]` — `opacity: 1 !important; transition: none !important;` зі збереженням поворотів SVG); JS-модулі слухають `prefers-reduced-motion` і одразу додають `.is-visible.is-revealed` без observer;
  - `@media (forced-colors: active)` приховує `.deco` (`display: none`) та зберігає чіткі рамки `CanvasText` / `Highlight`.
- **Додаткові інваріанти стабільного рендерингу й запобігання layout shift**:

- **Зображення та медіа**: кожне нове зображення повинне мати явні `width` та `height` або фіксований `aspect-ratio`; контейнер `.doctor-card__media` (`16 / 10`), `.work-card__slot` (`4 / 3`), `.review-card__avatar` (`46×46`), `.service-card__media` (`160x160`) і `.brand__img` (`aspect-ratio: 373 / 84`) зобов'язані резервувати розмір до завантаження; для критичних фото (hero, logo) застосовувати `decoding="sync"`, для другорядних нижче фолда — `loading="lazy"`; fallback (`.service-card__fallback`, `.doctor-card__fallback`, `.work-card__fallback`, `.review-card__avatar.is-fallback`) тримати в роздільному відображенні (`display: none` поза відповідним станом); `<link rel="preload" imagesizes>` завжди синхронізувати байт-у-байт із `<source sizes>` і `srcset`.
- **Critical CSS і `css/style.css`**: будь-які зміни геометрії `.header`, `.brand__img`, `.burger`, `.hero`, `.hero__media*`, `.deco--hero-arc`, `.deco--stats-wave`, `.stats-section` і брейкпоїнтів до `979px` / `max-height: 520px` вносити одночасно в inline `<style>` ([index.html](file:///c:/Users/nagib/Desktop/стоматолог/index.html)) і [css/style.css](file:///c:/Users/nagib/Desktop/стоматолог/css/style.css); не використовувати суперечливий `content-visibility: auto` на секціях (зберігати `content-visibility: visible`).
- **JS-рендер та ідемпотентність**: усі модулі (`TD.main`, `TD.theme`, `TD.header`, `TD.effects`, `TD.render`, `TD.calculator`, `TD.reviewsSource`, `TD.contacts`) повинні мати прапорці повторної ініціалізації / `dataset.*Bound`, очищення таймерів `clearTimeout` і скидання `textContent = ''` перед рендером; не дублювати в статичному HTML те, що генерує JS; динамічні списки резервувати через `:empty { min-height }` (`.services-grid:empty`, `.calc-list:empty`, `.works-filters:empty`, `.works-grid:empty`, `.reviews-summary:empty`, `.reviews-slider__track:empty`); елементи `#contacts` резервують геометрію через `.contacts-map-card` (`min-height: 224px`), `.form-field__error` (`min-height: 1.2em`), фіксовану висоту кнопки сабміту (`52px`) і `44px` hit-target чекбокса без збереження персональних даних у `localStorage`/`sessionStorage` і без фіктивних `href="#"` у футері.
- **Шрифти та теми**: підтримувати вагові `@font-face 'Inter Fallback'` (`100 599`, `600`, `700 900`), не вимикати anti-FOUC inline-скрипт теми в `<head>` і безпечний fallback при блокуванні `localStorage`.
- **Декор і заборони**: декоративні SVG (`.deco*`, `.hero__wave-outline`) завжди `position: absolute`, `pointer-events: none`, `aria-hidden="true"`, у секціях із `overflow-x: clip`; заборонено `transition: all`, зміну layout через `setTimeout`, маски через `opacity: 0` або preloader.
- **Перевірка перед завершенням**: тестувати всі брейкпоїнти (`360px`–`1920px`, portrait/landscape), обидві теми, масштаб `100%/125%/150%`, повторну ініціалізацію JS, hard reload і throttled повільне завантаження.
