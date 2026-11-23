# Звіт з оптимізації фронтенду (`Trust Dental`)

**Гілка:** `chore/frontend-optimization` (відгалужено від `main` @ `c9c216c`)  
**Дата:** 2026-11-23  
**Інваріант:** Візуальний вигляд, DOM-структура інтерфейсу, поведінка, доступність (`aria-*`, клавіатурна навігація, `prefers-reduced-motion`, `forced-colors`), кольори, шрифти й макет збережено без змін. За погодженим рішенням усі дублікати `.webp` прибрано: іконки послуг подаються суто у `.png`, головне фото Hero — суто в оптимізованому `.jpg`.

---

## 1. Коротке резюме

Проведено аудит та оптимізацію статичного фронтенду без впровадження системи збірки (вихідники `css/style.css` та `js/*.js` збережені у читабельному вигляді):

- **Розмір файлів та ресурсів на диску (`47 → 38` файлів, `0` файлів `.webp` у `img/`):** зменшено з `8,011,024 B` до `1,432,971 B` (**`-6,578,053 B` / `-82.11%`**).
- **Переданий трафік при завантаженні сторінки (`transferred bytes`):** зменшено на **`-1.78` – `-2.00 MB`** залежно від в’юпорта (приблизно **`-61%` – `-66%`**).
- **LCP (Largest Contentful Paint, `verify_browser.py`):**
  - Desktop `1440×900`: **`440 ms` → `204 ms`** (`-54%`)
  - Desktop `1920×1080`: **`544 ms` → `212 ms`** (`-61%`)
  - Tablet `768×1024`: **`452 ms` → `172 ms`** (`-62%`)
  - Mobile `390×844`: **`424 ms` → `168 ms`** (`-60%`)
  - `fast_3g`: **`13,948 ms` → `4,024 ms`** (`-71%`)
  - `slow_3g`: **`57,464 ms` → `15,784 ms`** (`-73%`)
- **CLS (Cumulative Layout Shift):** **`0`** на всіх перевірених в’юпортах та профілях мережі (`scrolled` reload: `0.00317`).
- **Візуальне порівняння (`opt_pixel_diff.py`):** повна висота сторінки збігається байт-у-байт на всіх в’юпортах; поза Hero-фото єдина постійна різниця на `1440` Dark (`3,626` пікселів, `belowMax = 14`) — перехід іконок послуг зі стиснутого lossy WebP (`0.94`) назад на вихідні `.png` у секції `#services`.

---

## 2. Історія змін на гілці `chore/frontend-optimization`

1. **`45805fb`** — *Dead & Redundant CSS Cleanup*:
   - Видалено невикористовувану CSS-змінну `--star-color` (`#EAB308` / `#FACC15`) у `css/style.css` та інлайновому `<style>` у `index.html`.
   - Видалено надлишкове медіаправило `@media (max-width: 540px)` `.stat-item__label { font-size: 0.8125rem; }` у `css/style.css` та `index.html`.
   - Видалено 10 CSS-змінних, не задіяних у критичному першому рендері, з інлайнового `<style>` у `index.html` (`--surface-strong`, `--surface-card`, `--line-strong`, `--border-subtle`, `--primary-hover`, `--backdrop`, `--focus-ring`, `--radius-card`, `--shadow-md`, `--shadow-lg` — усі збережено в `css/style.css`).
   - Розмір `css/style.css`: `167,918 B` → `167,809 B` (`-109 B`).

2. **`51f0298`** — *JS Deduplication in `js/render.js`*:
   - Повторювану логіку каруселей і табів (`#services`, `#works`, `#gallery`, `#reviews`) винесено в локальні хелпери `createEl`, `setSlideInteractivity`, `syncTabDotsState`, `applyTrackTransform`, `bindTablistKeyNav`, `bindCarouselArrowsKey` без зміни контрактів `window.TD` і DOM.
   - Прибрано дубльовану функцію `pluralizeUk` у `formatReviewCountLabel()`.
   - Розмір `js/render.js` (з нормалізованим CRLF): `133,629 B` → `132,667 B` (`-962 B`).

3. **`df2555f`** — *Hero Images & Head Compaction*:
   - Вихідні `img/hero-new-{800,1200,1600}.jpg` (`3008×1408` по `2.19–2.29 MB`) перебудовано зі своїх точних базових вихідників у реальних цільових розмірах:
     - `img/hero-new-800.jpg`: `2,296,361 B` → `47,749 B` (`800×374`, `q=0.88`, `-97.9%`);
     - `img/hero-new-1200.jpg`: `2,273,539 B` → `84,329 B` (`1200×562`, `q=0.88`, `-96.3%`);
     - `img/hero-new-1600.jpg`: `2,191,391 B` → `153,638 B` (`1600×749`, `q=0.88`, `-93.0%`).
   - Стиснуто зайві пробіли у Schema.org JSON-LD та відступи інлайнового `<style>` у `index.html`.

4. **`ae26cec`** — первинний звіт оптимізації (оновлено після прибирання `.webp`).

5. **Відмова від `.webp`-дублікатів (`img/services/` суто `.png`, Hero суто `.jpg`)**:
   - За вимогою власника/користувача видалено всі 11 файлів `.webp` із репозиторію (`8` файлів `img/services/*.webp` та `3` файли `img/hero-new-*.webp`).
   - У `js/render.js` (`createServiceMedia()`) прибрано `<source type="image/webp">`: `<picture class="service-card__picture">` завантажує напряму `img/services/*.png` (`357,115 B` сумарно, `8` файлів `320×320`).
   - У `index.html` (`149,295 B → 137,220 B`, `-12,075 B`, `-8.09%`) видалено `<source type="image/webp">` у `<picture class="hero__picture">` і оновлено `<link rel="preload" as="image" type="image/jpeg">` на `img/hero-new-{800,1200,1600}.jpg`.

---

## 3. Порівняльні метрики (ДО baseline `c9c216c` / ПІСЛЯ без `.webp`)

### 3.1. Розміри файлів на диску

| Ресурс | ДО (`main` baseline) | ПІСЛЯ (`chore/frontend-optimization`) | Зміна |
|---|---:|---:|---:|
| Загалом (`47 → 38` файлів) | `8,011,024 B` | `1,432,971 B` | **`-6,578,053 B` (`-82.11%`)** |
| `img/hero-new-800.jpg` | `2,296,361 B` | `47,749 B` | **`-97.92%`** |
| `img/hero-new-1200.jpg` | `2,273,539 B` | `84,329 B` | **`-96.29%`** |
| `img/hero-new-1600.jpg` | `2,191,391 B` | `153,638 B` | **`-92.99%`** |
| `img/services/*.png` (`8` шт.) | `357,115 B` + `82,832 B` WebP | `357,115 B` (лише PNG) | **`-82,832 B` на диску** |
| `index.html` | `149,295 B` | `137,220 B` | **`-12,075 B` (`-8.09%`)** |
| `js/render.js` | `133,629 B` | `132,667 B` | **`-962 B` (`-0.72%`)** |
| `css/style.css` | `167,918 B` | `167,809 B` | **`-109 B` (`-0.06%`)** |

### 3.2. Трафік завантаження та візуальне звіряння (`opt_metrics.py` + `opt_pixel_diff.py`)

| Сценарій | Transferred ДО | Transferred ПІСЛЯ | Економія | CLS | Висота |
|---|---:|---:|---:|---:|---:|
| Desktop `1440` Light | `2,935,778 B` | `1,157,422 B` | **`-1,778,356 B`** | `0` | `10440px` (=) |
| Desktop `1440` Dark | `2,933,027 B` | `1,156,411 B` | **`-1,776,616 B`** | `0` | `10440px` (=) |
| Tablet `768` Light | `3,012,196 B` | `1,080,378 B` | **`-1,931,818 B`** | `0` | `12090px` (=) |
| Mobile `375` Light | `3,042,714 B` | `1,040,963 B` | **`-2,001,751 B`** | `0` | `13536px` (=) |
| Mobile `375` Dark | `3,031,172 B` | `1,039,952 B` | **`-1,991,220 B`** | `0` | `13536px` (=) |

- Попіксельне порівняння першого екрана (`opt_pixel_diff.py` vs `baseline_backup`): Desktop `1440` Light `8.3394%`, Dark `8.3227%`, Tablet `768` `5.9587%`, Mobile `375` `2.7944%` (суто перекодування фото Hero).

### 3.3. Швидкодія, тротлінг та перевірки (`verify_browser.py`)

| Профіль / В’юпорт | LCP ДО | LCP ПІСЛЯ | CLS | Overflow |
|---|---:|---:|---:|---:|
| Desktop `1440×900` | `440 ms` | **`204 ms`** | `0` | `0` |
| Desktop `1920×1080` | `544 ms` | **`212 ms`** | `0` | `0` |
| Tablet `768×1024` | `452 ms` | **`172 ms`** | `0` | `0` |
| Mobile `390×844` | `424 ms` | **`168 ms`** | `0` | `0` |
| `fast_3g` | `13,948 ms` | **`4,024 ms`** | `0` | `0` |
| `slow_3g` | `57,464 ms` | **`15,784 ms`** | `0` | `0` |
| `slow_3g_4x_cpu` | `56,420 ms` | **`16,396 ms`** | `0` | `0` |

Додаткові перевірки:
- `check_static.mjs`: SVG-спрайт (`symbols: 30, htmlUseCount: 60, uniqueUses: 30, missingSymbols: []`), `preloadSynced: true` (`imagesrcset` синхронізовано з `.jpg`), `Forbidden CSS violations: []`, `Script defer order OK: true`.
- `node --check`: усі 7 файлів `js/*.js` — синтаксис коректний (вихід `0`).
- `check_refactor_security.py`: `REFACTOR & SECURITY CHECKS PASSED!` (`errors: [], warnings: []`).
- Інтерактив і доступність (`verify_browser.py`): `serviceLoaded: 8` на всіх в’юпортах і мережах, `doctorLoaded: 2`, `fontHeaderShiftPx: 0`, `fontHeroShiftPx: 0`, `touchViolations: 0`, `calc_click_ms: 69.9` (`"400\u00a0грн"`), `toggleClickMs: 80.4`, `drawer: true`, `work_modal: true`, `gallery_modal: true`, `reduced_motion` (`pending: 0, hiddenReveals: 0, animStartCount: 0, cls: 0`), `forced_colors` (`totalDecos: 17, visibleDecos: 0`), `errors: [], warnings: []`.

---

## 4. Що свідомо НЕ змінювалося та `REQUIRES APPROVAL`

1. **`[REQUIRES APPROVAL]` Автоматична мініфікація `css/style.css` (`167,809 B`) та `js/*.js`:**
   - Проєкт статичний і не має збірника (`package.json` / Vite / esbuild). Ручне стискання в один рядок погіршить підтримку; за потреби додаткової економії ~80–120 KB (без gzip) доцільно підключити build-крок.
2. **Логотипи `img/logo.png` (`10,531 B`) та `img/logo-white.png` (`9,520 B`):**
   - `loading="lazy"` для прихованого логотипа іншої теми не застосовується, щоб уникнути короткого спалаху під час синхронного перемикання теми через `startViewTransition`.
3. **Синхронне підключення `<link rel="stylesheet" href="css/style.css">`:**
   - Переведення в асинхронне (`media="print" onload`) створює ризик FOUC та CLS при відкритті сторінки з якірними хешами (`#services`, `#calculator`, `#contacts`) або при відновленні прокрутки.
4. **Плейсхолдери та нереалізовані шаблони в `TD.WORKS` / `TD.GALLERY`:**
   - Без змін збережені: `img/doctors/doctor-{1,2}-placeholder.svg`, `img/gallery/{inside-01..05,outside-01..03}.svg`, макети-шаблони `TD.WORKS` / `TD.GALLERY` (`status: 'placeholder'`), стилі/стани `#reviews-slider`, `.is-fallback`, `form-status.*`, а також обгортки `<picture class="hero__picture">` і `<picture class="service-card__picture">` (на них зав’язані правила CSS).

---

## 5. Чеклист для рев’юера

- [ ] Перевірити `git diff main..chore/frontend-optimization --stat` — усі зміни ізольовано на гілці `chore/frontend-optimization`.
- [ ] Візуально перевірити перший екран (`Hero` у `.jpg`) та сітку послуг (`#services` у `.png`) у світлій і темній темах на `desktop`, `tablet`, `mobile`.
- [ ] Вирішити, чи потрібен окремий build-пайплайн для мініфікації CSS/JS (`[REQUIRES APPROVAL]`).
- [ ] Після перевірки виконати merge/cherry-pick у `main`.
