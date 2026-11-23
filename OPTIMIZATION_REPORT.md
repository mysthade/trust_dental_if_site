# Звіт з оптимізації фронтенду (`Trust Dental`)

**Гілка:** `chore/frontend-optimization` (відгалужено від `main` @ `c9c216c`)  
**Дата:** 2026-11-23  
**Інваріант:** Візуальний вигляд, DOM-структура інтерфейсу, поведінка, доступність (`aria-*`, клавіатурна навігація, `prefers-reduced-motion`, `forced-colors`), кольори, шрифти й макет залишилися незмінними.

---

## 1. Коротке резюме

Проведено аудит та безпечну оптимізацію статичного фронтенду без впровадження системи збірки (source-файли `css/style.css` та `js/*.js` збережені у читабельному вигляді):

- **Розмір фронтенд-файлів та ресурсів на диску:** зменшено з `8,011,024 B` (`47` файлів у baseline) до `1,704,569 B` (`50` файлів, `+3` адаптивні WebP Hero) — економія **`-6,306,455 B` (`-78.72%`)**.
- **Переданий трафік при завантаженні сторінки (`transferred bytes`):** зменшено на **`-2.11` – `-2.29 MB`** залежно від в’юпорта (приблизно **`-72%` – `-75%`**).
- **LCP (Largest Contentful Paint):**
  - Desktop `1440×900`: **`440 ms` → `220 ms`** (`-50%`)
  - Mobile `390×844`: **`424 ms` → `172 ms`** (`-59%`)
  - Fast 3G: **`13,948 ms` → `3,768 ms`** (`-73%`)
  - Slow 3G: **`57,464 ms` → `14,716 ms`** (`-74%`)
- **CLS (Cumulative Layout Shift):** **`0`** на всіх перевірених в’юпортах та мережевих профілях.
- **Візуальне порівняння:** **`0` змінених UI-пікселів нижче Hero** (`belowFoldGt3: 0` на десктопі; помірний diff у межах Hero-фото спричинений виключно ресайзом та стисненням растру).

---

## 2. Атомарні коміти на гілці `chore/frontend-optimization`

1. **`45805fb`** — *Dead & Redundant CSS Cleanup* (`2 files changed, 1 insertion(+), 32 deletions(-)`):
   - Видалено невикористовувану CSS-змінну `--star-color` (`#EAB308` для світлої теми, `#FACC15` для темної) у `css/style.css` та інлайновому `<style>` у `index.html` (перевірено grep-пошуком по всьому репозиторію — жодного `var(--star-color)`).
   - Видалено надлишкове правило `@media (max-width: 540px)` `.stat-item__label { font-size: 0.8125rem; }` у `css/style.css` та `index.html` (воно вже дублювало базове значення).
   - Видалено 10 CSS-змінних, що не використовуються у критичному першому рендері, з інлайнового `<style>` у `index.html` (`:root` / `[data-theme='dark']`: `--surface-strong`, `--surface-card`, `--line-strong`, `--border-subtle`, `--primary-hover`, `--backdrop`, `--focus-ring`, `--radius-card`, `--shadow-md`, `--shadow-lg`). Усі 10 змінних повністю збережені у `css/style.css`.
   - Розмір `css/style.css`: `167,918 B` → `167,809 B` (`-109 B`).

2. **`51f0298`** — *JS Deduplication in `js/render.js`* (`180 insertions(+), 294 deletions(-)`):
   - У `js/render.js` винесено повторювані патерни в локальні утиліти без зміни публічних контрактів `window.TD` або DOM-виводу:
     - `createEl` — створення DOM-елементів із класами/атрибутами;
     - `setSlideInteractivity` — синхронізація `aria-hidden`, `inert`/фокусованості неактивних слайдів;
     - `syncTabDotsState` — спільна синхронізація `aria-selected` / активних точок навігації;
     - `applyTrackTransform` — позиціонування треку слайдера;
     - `bindTablistKeyNav` — клавіатурна навігація `ArrowLeft`/`ArrowRight`/`Home`/`End` для `tablist`;
     - `bindCarouselArrowsKey` — навігація стрілками для каруселей.
   - Застосовано ці хелпери у секціях `#services`, `#works`, `#gallery`, `#reviews` та прибрано локальний дубль `pluralizeUk` у `formatReviewCountLabel()`.
   - Розмір `js/render.js`: `133,629 B` → `129,083 B` (`-4,546 B`).

3. **`df2555f`** — *Hero Images & Critical Head Performance Optimization* (`7 files changed, 251 insertions(+), 1604 deletions(-)`):
   - **Виправлено роздуті Hero JPEG:** усі 3 вихідні файли (`img/hero-new-800.jpg`, `1200.jpg`, `1600.jpg`) були незменшеними `3008×1408` по `2.19–2.29 MB`. Оскільки вихідники `800`/`1200`/`1600` мають дещо різне кадрування, кожен цільовий варіант перебудовано саме з його відповідного базового вихідника в реальних розмірах:
     - `img/hero-new-800.jpg`: `2,296,361 B` → `47,749 B` (`800×374`, `q=0.88`) + `img/hero-new-800.webp` (`32,176 B`, `q=0.90`);
     - `img/hero-new-1200.jpg`: `2,273,539 B` → `84,329 B` (`1200×562`, `q=0.88`) + `img/hero-new-1200.webp` (`53,786 B`, `q=0.90`);
     - `img/hero-new-1600.jpg`: `2,191,391 B` → `153,638 B` (`1600×749`, `q=0.88`) + `img/hero-new-1600.webp` (`99,652 B`, `q=0.90`).
   - **Оновлено `index.html` (`149,295 B` → `137,456 B`, `-11,839 B`):**
     - Додано `<picture class="hero__picture">` із `<source type="image/webp">` та JPEG-фолбеком `width="1600" height="749"`;
     - Оновлено `<link rel="preload" as="image" type="image/webp" imagesrcset="...webp">` для точного збігу з `<source>`;
     - Стиснено зайві пробіли у Schema.org JSON-LD, ущільнено форматування критичного `<style>` (правило-на-рядок) та нормалізовано CRLF.

---

## 3. Порівняльні метрики (ДО / ПІСЛЯ)

### 3.1. Розміри ключових файлів на диску

| Ресурс | ДО (`main` baseline) | ПІСЛЯ (`chore/frontend-optimization`) | Зміна |
|---|---:|---:|---:|
| Загалом (47 → 50 файлів) | `8,011,024 B` | `1,704,569 B` | **`-6,306,455 B` (`-78.72%`)** |
| `img/hero-new-800.jpg` (+ `.webp`) | `2,296,361 B` | `47,749 B` JPEG / `32,176 B` WebP | **`-97.9%` / `-98.6%`** |
| `img/hero-new-1200.jpg` (+ `.webp`) | `2,273,539 B` | `84,329 B` JPEG / `53,786 B` WebP | **`-96.3%` / `-97.6%`** |
| `img/hero-new-1600.jpg` (+ `.webp`) | `2,191,391 B` | `153,638 B` JPEG / `99,652 B` WebP | **`-93.0%` / `-95.5%`** |
| `index.html` | `149,295 B` | `137,456 B` | **`-11,839 B` (`-7.93%`)** |
| `js/render.js` | `133,629 B` | `129,083 B` | **`-4,546 B` (`-3.40%`)** |
| `css/style.css` | `167,918 B` | `167,809 B` | **`-109 B` (`-0.06%`)** |

### 3.2. Трафік завантаження та візуальне порівняння (`opt_metrics.py` + pixel diff vs baseline)

| Сценарій | Transferred ДО | Transferred ПІСЛЯ | Економія | CLS | Full height | UI нижче Hero |
|---|---:|---:|---:|---:|---:|---|
| Desktop `1440` Light | `2,935,778 B` | `825,564 B` | **`-2,110,214 B`** | `0` | `10440px` (=) | `belowFoldGt3: 0` (`fold diff 8.493%`, `maxD=116` у Hero-фото) |
| Desktop `1440` Dark | `2,933,027 B` | `824,794 B` | **`-2,108,233 B`** | `0` | `10440px` (=) | `belowFoldGt3: 0` (`fold diff 8.4726%`, `maxD=116` у Hero-фото) |
| Tablet `768` Light | `3,012,196 B` | `775,949 B` | **`-2,236,247 B`** | `0` | `12090px` (=) | `0` UI-змін (`1239` px на `y=900..930` — нижній край Hero; `fold diff 6.1619%`) |
| Mobile `375` Light | `3,042,714 B` | `751,504 B` | **`-2,291,210 B`** | `0` | `13536px` (=) | `261` px на `y=900..950` — нижній край Hero (`fold diff 2.7202%`) |
| Mobile `375` Dark | `3,031,172 B` | `750,493 B` | **`-2,280,679 B`** | `0` | — | Без регресій |

### 3.3. Продуктивність, мережевий тротлінг та перевірки (`verify_browser.py`)

| Профіль / В’юпорт | LCP ДО | LCP ПІСЛЯ | CLS | Overflow |
|---|---:|---:|---:|---:|
| Desktop `1440×900` | `440 ms` | **`220 ms`** | `0` | `0` |
| Mobile `390×844` | `424 ms` | **`172 ms`** | `0` | `0` |
| Tablet `768×1024` | `452 ms` | **`200 ms`** | `0` | `0` |
| Desktop `1920×1080` | `544 ms` | **`228 ms`** | `0` | `0` |
| `fast_3g` | `13,948 ms` | **`3,768 ms`** | `0` | `0` |
| `slow_3g` | `57,464 ms` | **`14,716 ms`** | `0` | `0` |
| `slow_3g_4x_cpu` | `56,420 ms` | **`15,284 ms`** | `0` | `0` |

Додаткові перевірки після фінального кодового коміту `df2555f`:
- `check_static.mjs`: SVG-спрайт (`symbols: 30, htmlUseCount: 60, uniqueUses: 30, missingSymbols: []`), `preloadSynced: true`, `Forbidden CSS violations: []`, `Script defer order OK: true`.
- `node --check`: усі 7 файлів `js/*.js` — синтаксис коректний (вихід `0`).
- `check_refactor_security.py`: `REFACTOR & SECURITY CHECKS PASSED!` (`errors: [], warnings: []`).
- Інтерактив та a11y (`verify_browser.py`): `fontHeaderShiftPx: 0`, `fontHeroShiftPx: 0`, `touchViolations: 0`, `calc_click_ms: 70.9` (`"400\u00a0грн"`), `drawer: true`, `work_modal: true`, `gallery_modal: true`, `reduced_motion` (`pending: 0, hiddenReveals: 0, animStartCount: 0, cls: 0`), `forced_colors` (`totalDecos: 17, visibleDecos: 0`), перезавантаження / `#hash`-переходи (`cls <= 0.00317`), `errors: [], warnings: []`.

---

## 4. Що свідомо НЕ змінювалося, ризики та `REQUIRES APPROVAL`

1. **`[REQUIRES APPROVAL]` Фолбеки `img/services/*.png` (`357,075 B` на диску, `0 B` трафіку у WebP-браузерах):**
   - Залишені згідно з архітектурним обмеженням `PROJECT_CONTEXT.md` (`service-media-fallback-lock`). Можна безпечно видалити, якщо замовник підтвердить відмову від підтримки застарілих браузерів/клієнтів без WebP.
2. **`[REQUIRES APPROVAL]` Однорядкова мініфікація `css/style.css` (`167,809 B`) та `js/*.js`:**
   - Проєкт статичний і не має збірника (`package.json` / Vite / esbuild). Ручне перетворення вихідників у мініфіковані однорядкові бандли погіршить подальшу підтримку; автоматична мініфікація рекомендована при додаванні build-пайплайна.
3. **Логотипи `img/logo.png` (`10,531 B`) та `img/logo-white.png` (`9,520 B`):**
   - Конвертація через Chromium Canvas у WebP збільшувала вагу до `18,556 B` / `18,724 B` (більше за індексовані PNG), а `loading="lazy"` для прихованого логотипа іншої теми створює ризик короткого спалаху порожнього місця при синхронному перемиканні теми через `startViewTransition`.
4. **Синхронне підключення `<link rel="stylesheet" href="css/style.css">`:**
   - Переведення в асинхронне (`media="print" onload`) створює ризик FOUC та стрибків CLS при відкритті сторінки з якірними хешами (`#services`, `#calculator`, `#contacts`) або при відновленні позиції прокрутки.
5. **Плейсхолдери та стани майбутнього функціоналу / бекенду:**
   - Без змін збережені: `img/doctors/doctor-{1,2}-placeholder.svg`, `img/gallery/{inside-01..05,outside-01..03}.svg`, плейсхолдери `TD.WORKS`, стилі/стани `#reviews-slider`, `.is-fallback`, `form-status.*` та усі публічні класи/селектори, `aria-*`, `data-*`.

---

## 5. Чеклист для рев’юера

- [ ] Переглянути `git diff main..chore/frontend-optimization --stat` та переконатися у відсутності зайвих змін поза цільовими файлами (`index.html`, `css/style.css`, `js/render.js`, `img/hero-new-*`, `OPTIMIZATION_REPORT.md`).
- [ ] Візуально перевірити перший екран (`Hero`) у світлій та темній темах на `desktop`, `tablet`, `mobile` — підтвердити відсутність артефактів стиснення WebP/JPEG та збереження кадрування `800`/`1200`/`1600`.
- [ ] Прийняти рішення щодо пунктів **`[REQUIRES APPROVAL]`** (`img/services/*.png` і додавання build-мініфікації).
- [ ] Лише після перевірки виконати merge/cherry-pick у `main` (поточна робота залишена ізольовано на гілці `chore/frontend-optimization`).
