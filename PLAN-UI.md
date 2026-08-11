# PLAN-UI — Nâng cấp UI / Effect / Animation cho kenh-tay-trai-site

> **Người viết plan:** Fable 5 (10/08/2026, sau audit toàn bộ index.html + styles.css + main.js + assets).
> **Người thực thi:** Opus 5. Đọc HẾT file này trước khi sửa dòng đầu tiên.
>
> **Mệnh lệnh tối cao:** đây là redesign-PRESERVE. KHÔNG đổi copy đã chốt với Nam Anh, KHÔNG đổi cấu trúc section, KHÔNG thêm thư viện (site là HTML/CSS/JS thuần — không React, không GSAP, không Motion). Mọi hiệu ứng viết bằng CSS + vanilla JS + IntersectionObserver.

---

## 0. Luật cứng KHÔNG ĐƯỢC VI PHẠM (Editorial Warm Clean)

Nguồn: `~/Library/.../04_Resources/Design System — Marketing/Nam-Anh-Marketing-Design-System.md`. Vi phạm bất kỳ điều nào = hỏng brand, không phải "sáng tạo":

1. **Đúng 1 crisp shadow `6px 6px 0 #000`/trang** — đã tiêu ở `.hero__player`. Không thêm shadow cho bất kỳ card nào khác, kể cả hover.
2. **CTA = mint, chữ mực, không shadow.** Hover = `#6BC77A` + translateY(-1px). Đã đúng, giữ nguyên.
3. **Active state (tab/pill đang chọn) = đen đặc** `#1B1624`/chữ trắng. Không dùng accent cho trạng thái chọn.
4. **Tối đa 2 accent/section.** Trước khi thêm màu vào section nào, đếm lại accent đang có.
5. **Motion cho phép:** entry fade-in + slide-up 12–14px, stagger 70–90ms, duration 400–500ms, chạy ĐÚNG 1 LẦN (IntersectionObserver). Hover card: translateY(-2px) + border đậm nhẹ.
6. **Motion CẤM:** parallax, scroll-jacking (pin/hijack), bounce, autoplay, animation vô hạn — ngoại lệ duy nhất là micro-decor có chủ đích (mục 4.6, đánh dấu OPTIONAL).
7. **`prefers-reduced-motion` là bắt buộc** cho mọi thứ thêm mới.
8. **Chỉ animate `transform` và `opacity`** (+ `background-size` cho underline draw-in, `grid-template-rows` cho accordion — hai ngoại lệ có chủ đích, không đụng layout mỗi frame).
9. **Dark section duy nhất được phép:** nền `#1B1624` (dùng cho Final CTA mới — mục 5).

**Dial đọc brief:** VARIANCE giữ ~6 (không đổi layout), MOTION nâng 3→5 (trong khuôn luật 5–6), DENSITY giữ 3–4.

---

## 1. P0 — SỬA LỖI TRƯỚC KHI LÀM ĐẸP (bắt buộc, làm đầu tiên)

### 1.1 Bug JS: reduced-motion giết chết toàn bộ tương tác
`js/main.js` dòng 39–46: hai `return` sớm nằm TRƯỚC phần init tabs/FAQ/form:

```js
var items = document.querySelectorAll('.reveal');
if (!items.length) return;                    // ← giết mọi thứ phía dưới
if (!('IntersectionObserver' in window) || prefers-reduced-motion) {
  items.forEach(...); return;                 // ← user bật reduced-motion: mất tabs, FAQ, form
}
```

**Fix:** tách phần reveal thành khối riêng (IIFE hoặc if/else lồng), để roadmap tabs, pillars tabs, FAQ, signup form init chạy vô điều kiện. Đây là lý do phải restructure `main.js` thành các khối độc lập:

```js
(function initNav() { ... })();
(function initModal() { ... })();
(function initReveal() { ... })();   // return sớm chỉ thoát khối này
(function initRoadmapTabs() { ... })();
(function initPillarTabs() { ... })();
(function initFaq() { ... })();
(function initSignupForm() { ... })();
```

### 1.2 Nav trỏ anchor không tồn tại
Nav hiện có `#he-sinh-thai` và `#cau-hoi` — cả hai id KHÔNG có trong trang. Id thật: `ly-do`, `ve-nam-anh`, `so-sanh`, `chuong-trinh`, `chuong-trinh-hoc`, `quy-trinh`.

**Fix:** đổi nav thành 3 link thật:
- "Về Nam Anh" → `#ve-nam-anh`
- "Lộ trình" → `#chuong-trinh` (giữ)
- "Câu hỏi" → `#quy-trinh`
KHÔNG đổi id section (giữ URL/anchor ổn định).

### 1.3 Ảnh nặng + ảnh rác
- `nam-anh-live-session.jpg` = **966KB** → resize còn max 1600px chiều rộng, chất lượng ~80 (`sips -Z 1600 --setProperty formatOptions 80`), mục tiêu <250KB.
- Xóa ảnh không còn dùng (verify bằng grep trước khi xóa từng file): `proof-affiliate.png`, `proof-youtube.png`, `proof-template.png`, `proof-affiliate-ssi.png`, `proof-youtube-ads.png`, `proof-digital-product.png` (~1.4MB rác — trang giờ dùng bộ `crop-*.png`).
- Mọi `<img>` dưới màn hình đầu: thêm `loading="lazy"` + `width`/`height` thật (chống CLS). Ảnh hero giữ eager.

### 1.4 Cache-busting cho JS
`styles.css` đã có `?v=5` nhưng `main.js` KHÔNG có version param (nguồn gốc mấy lần cache lỗi trong dev). **Fix:** thêm `js/main.js?v=1` và từ nay mỗi lần sửa JS/CSS bump số cùng nhau.

### 1.5 Preload font quan trọng
8 file OTF (~800KB) đang load qua CSS. Thêm vào `<head>`:
```html
<link rel="preload" href="fonts/SVN-Recoleta Bold.otf" as="font" type="font/otf" crossorigin>
<link rel="preload" href="fonts/SVN-Gilroy Regular.otf" as="font" type="font/otf" crossorigin>
```
(Chỉ 2 font gánh first paint. Chuyển WOFF2 là việc P2, không làm trong đợt này.)

---

## 2. HỆ MOTION MỚI (nền tảng dùng chung)

### 2.1 Nâng cấp reveal: từ "cả khối hiện một cục" → stagger từng con
Hiện tại `.reveal` gắn trên CONTAINER (cả section mờ vào một lượt) — đây chính là lý do trang "tĩnh". Đổi sang:

- Thêm attribute `data-reveal-group` trên container; JS tự gắn reveal cho **con trực tiếp** (hoặc selector trong `data-reveal-items`), stagger **80ms/phần tử**, duration **450ms**, ease **cubic-bezier(0.16, 1, 0.3, 1)**, translateY **13px**, chạy 1 lần.
- CSS:
```css
[data-reveal-group] > * { opacity: 0; transform: translateY(13px); }
.rv-in { opacity: 1; transform: none;
  transition: opacity .45s cubic-bezier(.16,1,.3,1), transform .45s cubic-bezier(.16,1,.3,1); }
@media (prefers-reduced-motion: reduce) {
  [data-reveal-group] > * { opacity: 1; transform: none; transition: none; }
}
```
- **QUAN TRỌNG:** phải có fallback no-JS — nếu JS không chạy, nội dung vẫn hiện. Cách an toàn: JS thêm class `js` lên `<html>` ngay đầu file, CSS ẩn ban đầu chỉ áp khi `.js [data-reveal-group] > *`. Giữ `.reveal` cũ hoạt động song song cho chỗ chưa migrate.

**Áp `data-reveal-group` cho:** `.reasons__list` (3 gạch đầu dòng), `.compare__grid` (2 cột), `.compare__list` từng `li`, `.roadmap__tabs` (3 tab), `.roadmap__checklist` từng `li` (khi vào view lần đầu), `.pillars__tabs`, `.pillars__numbered` từng `li`, `.apply__steps` từng `li`, `.apply__faq` từng cặp câu hỏi, `.story__proof` (3 card lệch nhau 100ms), `.hero__tags` từng pill.

### 2.2 Hero load-in cascade (chạy khi tải trang, không chờ scroll)
Thứ tự xuất hiện, mỗi nhịp cách 80ms, cùng spec fade+up 13px/450ms:
1. `.eyebrow` → 2. `h1` → 3. `.hero__sub` → 4. `.hero__actions` → 5. `.hero__player` → 6. `.hero__tags` + `.hero__credit`.

Thuần CSS (không cần JS): keyframe `heroIn` + `animation-delay: calc(var(--i) * 80ms)`, gắn `--i` bằng inline style hoặc nth-child. Bọc trong `@media (prefers-reduced-motion: no-preference)`.

### 2.3 Coral underline "draw-in" (chữ ký thị giác — điểm nhấn số 1 của đợt này)
Underline coral hiện dùng `text-decoration` (không animate được). Đổi `.mark--underline` sang kỹ thuật background-gradient để vẽ từ trái sang phải:

```css
.mark--underline {
  text-decoration: none;
  background-image: linear-gradient(var(--coral), var(--coral));
  background-repeat: no-repeat;
  background-position: 0 92%;
  background-size: 0% 5px;
  transition: background-size .6s cubic-bezier(.16,1,.3,1) .35s;
  padding-bottom: 2px;
}
.is-in .mark--underline, .rv-in .mark--underline, .marked .mark--underline {
  background-size: 100% 5px;
}
@media (prefers-reduced-motion: reduce) { .mark--underline { background-size: 100% 5px; transition: none; } }
```

- Hero: thêm class `.marked` vào `h1` bằng JS sau ~500ms (hoặc animation-delay CSS).
- Các section title có `.mark--underline` (story, compare, signup modal): draw-in khi title vào viewport.
- **Kiểm tra kỹ:** cụm xuống dòng (`.mark--wrap` nếu còn) — background-size sẽ vẽ theo từng dòng, chấp nhận được; test hero mobile 375px.

### 2.4 SVG hand-drawn deco tự vẽ (stroke draw)
`.hero__deco` và `.story__deco--arrow` là stroke coral → thêm draw-in 1 lần khi vào view:
```css
.deco-draw path { stroke-dasharray: 120; stroke-dashoffset: 120; }
.is-in .deco-draw path, .rv-in .deco-draw path {
  animation: decoDraw .7s ease-out forwards; }
.is-in .deco-draw path:nth-child(2) { animation-delay: .5s; }
@keyframes decoDraw { to { stroke-dashoffset: 0; } }
```
(Đo `getTotalLength()` thật của từng path hoặc dùng 150 dư dả — set dasharray đủ lớn hơn path length.) `.story__deco--1` (ngôi sao lavender, fill) → pop: scale .5→1 + fade, 400ms, delay 200ms.

### 2.5 Count-up cho số liệu (một lần, khi vào view)
Áp dụng cho ĐÚNG 3 chỗ (không lạm dụng): `200K+` trong `.hero__tags`, `200K+` và milestone trong `.story__milestone`, `16/38/15 triệu` trong `.story__proof` figcaption.
- Vanilla JS: parse số từ text, đếm từ 0 → giá trị trong 800ms, easing ease-out, giữ nguyên hậu tố ("K+", " triệu"). `tabular-nums` đã có sẵn nên không giật layout.
- Reduced-motion: bỏ qua, hiện số luôn.

### 2.6 Micro-interaction bổ sung (đều trong luật)
- **Mũi tên trong nút/link:** mọi `span` chứa "→"/"↓" trong `.btn`, `.link-action`: hover cha → `transform: translateX(3px)` (hoặc translateY cho ↓), transition 150ms. 
- **Tab switching (roadmap + pillars):** pane khi nhận `.is-active` chạy `animation: paneIn .3s ease` (fade + up 10px) — copy đúng pattern `signupIn` đã có ở form. Thêm cho `.roadmap__pane.is-active` và `.pillars__pane.is-active`.
- **Roadmap checklist ✓:** dấu check tròn đen pop-in `scale(.5)→1` + stagger 60ms khi pane active (animation trên `::before` không chạy được — animate cả `li` hoặc bọc check vào span).
- **FAQ accordion mượt:** bỏ `display:none` toggle. Đổi `.apply__a` sang grid-rows trick:
```css
.apply__a { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .3s ease; }
.apply__a > .apply__a-inner { overflow: hidden; min-height: 0; }
.apply__a.is-active { grid-template-rows: 1fr; }
```
(Cần bọc nội dung mỗi `.apply__a` vào `<div class="apply__a-inner">` — sửa HTML.) Padding chuyển vào inner để không giật.
- **Mockchat "đang nhắn":** khi tab Cộng đồng active lần đầu, 3 tin nhắn hiện lần lượt (fade+up, cách 250ms) — một lần duy nhất, không loop.
- **Modal step direction:** bước tiến → slide từ phải (`translateX(16px)→0`), bước lùi → từ trái. JS set `data-dir="next|prev"` trên form trước khi renderStep, CSS 2 keyframes.
- **Nav scroll-spy:** IntersectionObserver đánh dấu section đang xem, nav link tương ứng nhận class `is-current` (màu `--fg-1` + underline sky 2px). Nhẹ, không đụng scroll event.
- **Photo hover (story collage + pillars card):** `transform: translateY(-2px)` + border đậm (`--fg-3`), transition 200ms. KHÔNG thêm shadow.
- **Proof cards (story__proof):** đã có rotation sẵn — thêm hover: `rotate(0) translateY(-2px)`, transition 250ms.

### 2.7 OPTIONAL (hỏi Nam Anh trước khi làm, mặc định KHÔNG làm)
- Ngôi sao lavender `.story__deco--1` float nhẹ vô hạn (6s, ±4px) — thuộc diện "micro-decor có chủ đích" được luật cho phép, nhưng vẫn là animation vô hạn nên cần Nam Anh gật đầu.

---

## 3. UI POLISH TỪNG SECTION

### 3.1 Section 2 — Lý do (`#ly-do`)
- `.reasons__list` markers: đổi chấm tròn coral → dấu **✕** coral (list này là "Bạn sẽ KHÔNG cần" — chấm tròn đọc như checklist dương tính, sai ngữ nghĩa). Vẽ ✕ bằng 2 thanh `::before/::after` hoặc SVG inline stroke coral 2px, 14px.
- Câu chốt `.reasons__closing`: thêm nhấn nhẹ — bọc "một hệ thống đúng" trong `.mark--underline` (sẽ tự có draw-in theo 2.3). Đếm accent section: coral (✕ + underline) = 1 accent. OK.

### 3.2 Section 3 — Về Nam Anh
- `.story__proof` figcaption số tiền: thêm count-up (2.5).
- Ảnh collage: hover lift (2.6). Không đổi gì khác — section này đang tốt nhất trang.

### 3.3 Section 4 — So sánh (`#so-sanh`)
- **Cột "Kênh Tay Trái" thêm tint mint** `background: #79D2871f` (đúng token "tint band nhóm = {accent}1f" của design system) — hiện 2 cột chỉ khác viền, chưa đủ chênh lệch thị giác.
- **Markers cho 2 cột:** cột trái mỗi `li` thêm ✕ nhỏ màu `--fg-4` trước text; cột phải thêm ✓ trong chip tròn mint-soft (nền `--mint-soft`, dấu mực). Accent count: mint (tint + ✓) + coral (`.compare__final`) = 2. Chạm trần nhưng hợp lệ.
- Reveal: 2 cột stagger (trái trước, phải sau 120ms), rồi từng row.

### 3.4 Section 5 — Lộ trình
- Tab pane transition + checklist pop (2.6).
- `.roadmap__tab` hover: thêm `transform: translateY(-1px)` cho cảm giác bấm được.

### 3.5 Section 6 — Ba điều
- Tab pane transition (2.6), mockchat stagger (2.6).
- `.pillars__card-photo img` hover: `scale(1.03)` trong khung overflow hidden, 400ms — chỉ ảnh, không cả card.

### 3.6 Section 7 — Quy trình + FAQ
- FAQ accordion mượt (2.6) + hover câu hỏi: nền `var(--hover)`.
- `.apply__steps` số coral: khi reveal, số pop-in trước text 80ms.

### 3.7 Modal đăng ký
- Step direction-aware (2.6).
- `.signup__choice` khi chọn: thêm tick ✓ nhỏ hiện ra bên phải (scale-in 200ms) — feedback rõ hơn trước khi autonext nhảy câu.

---

## 4. HAI KHỐI MỚI (trang đang thiếu phần kết)

Trang hiện KẾT THÚC ở section FAQ — không có cú chốt cuối, không footer. Người xem cuộn hết trang không gặp CTA cuối cùng nào. Theo đúng cấu trúc trang LBA tham chiếu:

### 4.1 Section 9 — Final CTA (nền mực `#1B1624`, dark section hợp lệ duy nhất)
Đặt sau section Quy trình + FAQ, trước footer:

```html
<section class="section final bg-ink" id="bat-dau">
  <div class="container final__inner">
    <h2>Ba tháng nữa, bạn có thể đang vận hành một kênh
        <span class="mark mark--underline">tự trả tiền cho bạn.</span></h2>
    <p>Hoặc bạn có thể để mọi thứ giữ nguyên như năm nay. Cả hai đều là lựa chọn —
       mình chỉ biết mình sẽ chọn cái nào.</p>
    <a class="btn btn--mint" href="#dang-ky">Đăng ký cohort tiếp theo</a>
  </div>
</section>
```
- Chữ trắng `#EDEAF1`, headline Recoleta, căn giữa, `max-width: 680px`.
- Underline coral vẫn draw-in — coral nổi trên nền mực, đẹp.
- CTA mint chữ mực — pop mạnh nhất trang trên nền tối.
- Copy trên là bản nháp Fable dịch thoát từ LBA ("In six months, you could be…") — **Nam Anh duyệt copy trước khi ship, đánh dấu comment `<!-- COPY NHÁP -->` trong HTML.**
- KHÔNG thêm dòng "37 chỗ còn lại" — chưa có số thật.

### 4.2 Footer (nằm trong section mực luôn hoặc tách nền `#141019`)
```html
<footer class="footer">
  <div class="container footer__inner">
    <div><b>Kênh Tay Trái</b> <span>by Nam Anh</span></div>
    <nav>Về Nam Anh · Lộ trình · Câu hỏi</nav>
    <p class="footer__note">Con số trên trang là kết quả thực tế của Nam Anh,
       không phải cam kết thu nhập. © 2026 Kênh Tay Trái.</p>
  </div>
</footer>
```
Chữ xám nhạt trên nền mực, hairline trắng 10% ngăn với Final CTA, nhỏ gọn 1–2 hàng.

Nhớ: nút CTA trong Final CTA vẫn phải được `initModal` bắt (`a[href="#dang-ky"]` — selector đã cover).

---

## 5. QUY TẮC KỸ THUẬT KHI THỰC THI

1. **Không thư viện.** Mọi thứ vanilla. Nếu thấy cần GSAP nghĩa là đang làm quá tay so với luật motion.
2. **Một IntersectionObserver dùng chung** cho reveal + scroll-spy + count-up trigger (hoặc tối đa 2 IO). Không tạo IO mỗi phần tử.
3. **Không `window.addEventListener('scroll')` mới.** Cái duy nhất đang có (nav is-stuck) giữ nguyên, passive.
4. **Mọi animation mới bọc reduced-motion.** Test bằng cách bật "Reduce Motion" trong macOS → trang phải hiện đầy đủ, tương tác đầy đủ (sau fix P0 1.1).
5. **Thứ tự làm:** P0 (mục 1) → hệ motion nền (2.1–2.3) → micro-interactions (2.4–2.6) → polish section (3) → khối mới (4). Commit/verify từng cụm, đừng dồn một cục.
6. **Verify bằng browser thật từng cụm** (preview server `kenh-tay-trai`, port 4790; nhớ hard-reload vì cache — đã có tiền sử cache lừa trong dev). DOM-check bằng JS nếu screenshot flaky.
7. **Sau khi xong:** bump `?v=` cho cả CSS lẫn JS.

---

## 6. CHECKLIST NGHIỆM THU (Opus tự tick trước khi báo xong)

- [ ] Bật Reduce Motion: trang hiện đủ nội dung, tabs/FAQ/form/modal hoạt động bình thường (P0 1.1)
- [ ] 3 nav link đều cuộn tới đúng section (P0 1.2)
- [ ] Tổng ảnh tải trang < 800KB; không còn ảnh rác trong assets/img (P0 1.3)
- [ ] Hero cascade chạy khi load; underline coral draw-in sau headline
- [ ] Cuộn cả trang: mỗi section con hiện stagger, không khối nào "bụp" cả cục
- [ ] SVG mũi tên coral tự vẽ 1 lần; không animation nào lặp vô hạn (trừ khi Nam Anh duyệt 2.7)
- [ ] Count-up chạy đúng 3 cụm số, không giật layout
- [ ] FAQ mở/đóng mượt (không display:none nhảy cục)
- [ ] Tab roadmap/pillars: pane vào có transition; check ✓ pop
- [ ] Modal: bước tiến slide phải→trái, bước lùi ngược lại; chọn radio có tick feedback
- [ ] Final CTA + footer hiện đúng, CTA mở modal, copy đánh dấu NHÁP chờ duyệt
- [ ] So sánh: cột KTT có tint mint + ✓/✕ markers; đếm accent ≤2/section toàn trang
- [ ] Đúng 1 shadow `6px 6px 0 #000` toàn trang (grep `--shadow-anchor` usage = 1)
- [ ] Form submit Supabase vẫn chạy (test 1 đơn giả rồi xóa như quy trình cũ: insert → verify → delete email test)
- [ ] Mobile 375px: hero, collage, compare, form đều không vỡ
- [ ] `?v=` đã bump cho styles.css và main.js

---

## 7. KẾT QUẢ TRIỂN KHAI (Opus 5 — 10/08/2026)

**Đã làm xong toàn bộ mục 1 → 5.** Ghi chú các phát hiện ngoài plan:

### Bug phát hiện thêm trong lúc làm (không có trong plan)
1. **Underline trong modal vô hình vĩnh viễn** — `.mark--underline` mặc định `background-size:0%`, chỉ vẽ khi observer thêm `.is-drawn`. Modal không phải reveal target nên gạch chân không bao giờ hiện. Đã fix: `openSignup()` tự thêm `.is-drawn` cho underline trong modal.
2. **Tràn ngang trên mobile 375px** (437px vs 375px), hai nguyên nhân:
   - `.mark{white-space:nowrap}` khiến cụm underline dài không xuống dòng được → thêm `@media (max-width:720px){.mark{white-space:normal}}`
   - `.roadmap__tabs` thiếu `min-width:0` nên `overflow-x:auto` không ăn (grid item mặc định `min-width:auto`) → đã thêm, kèm ẩn scrollbar.
3. **Rủi ro nội dung vô hình nếu IntersectionObserver không chạy** — phát hiện khi test: nếu IO không fire, mọi thứ kẹt ở `opacity:0`, người dùng thấy trang trắng. Đã thêm 2 lớp an toàn trong `initScrollEffects()`:
   - Reveal ngay các phần tử đã nằm trong viewport lúc tải (`requestAnimationFrame` + `getBoundingClientRect`)
   - Failsafe 2.5s: hiện sạch mọi thứ chưa reveal, và count-up nhảy thẳng về giá trị đúng.

### Giới hạn kiểm thử
Preview pane chạy ở `document.visibilityState = "hidden"` nên IntersectionObserver không fire, `innerHeight` có lúc = 0, screenshot trắng khi trang đã cuộn, và `getComputedStyle` trả giá trị cũ. Đã kiểm chứng bằng clone element (cùng class → opacity 1) và ép reflow (bản gốc cũng về 1) để chắc chắn CSS/class đúng.
**Cần Nam Anh mở bằng Chrome/Safari thật để duyệt phần nhìn:** nhịp stagger, tốc độ underline draw-in, count-up, và cảm giác tổng thể.

### Còn treo
- Copy Final CTA vẫn là **bản nháp** (đánh dấu `<!-- COPY NHÁP -->` trong HTML), chờ Nam Anh duyệt.
- Mục 2.7 (ngôi sao lavender float vô hạn) **chưa làm** — đúng như plan, cần Nam Anh đồng ý trước vì là animation lặp.
