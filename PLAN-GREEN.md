# PLAN-GREEN — Phủ xanh + thêm hiệu ứng sống động
_Người viết: Fable. Người triển khai: Opus 5. Làm theo đúng thứ tự Phase._

## Bối cảnh & ý đồ

Nam Anh muốn hai thứ:
1. **Nhiều màu xanh lá (mint) hơn** — hiện mint chỉ xuất hiện ở 3 chỗ (nút CTA, cột highlight So sánh, chip ✓). Xanh = tiền + tăng trưởng + đúng motif favicon mầm cây → phải trở thành màu kể chuyện của trang.
2. **Nhiều hiệu ứng / demo hơn** — trang đã có reveal + stagger nhưng thiếu khoảnh khắc "trang tự làm gì đó": số tự đếm, nét tự vẽ, demo tự chạy.

### Luật cứng KHÔNG được phá (design system)
- ĐÚNG 1 shadow `6px 6px 0 #000` trên toàn trang (đang ở `.hero__player`). Không thêm shadow thứ hai.
- Tối đa 2 accent/section. Khi thêm mint vào section nào, phải kiểm lại ngân sách accent của section đó (ghi rõ ở từng mục dưới).
- Coral underline vẫn là chữ ký thị giác — KHÔNG đổi `.mark--underline` sang mint.
- Không parallax, không scroll-jack. Animation reveal chạy 1 lần.
- Mọi hiệu ứng mới phải: (a) có nhánh `prefers-reduced-motion:reduce` tắt sạch, (b) không làm nội dung vô hình vĩnh viễn nếu JS/observer chết — dùng đúng 2 lớp an toàn sẵn có trong `js/main.js` (rAF viewport check + failsafe 2.5s).
- Không loop vô hạn, TRỪ mục 3.6 (đã đánh dấu chờ Nam Anh duyệt riêng).

---

## PHASE 1 — Token & nền tảng xanh

### 1.1 Bổ sung token trong `:root` (css/styles.css)
```css
--mint-tint:#79D2871f;          /* tint band 12% — đang hardcode ở .compare__col--highlight, đổi chỗ đó dùng token luôn */
--green-ink:#2F7A43;            /* mint đậm hoá để làm MÀU CHỮ — mint gốc #79D287 trên nền kem không đủ tương phản cho text */
```
- `--green-ink` phải đạt contrast ≥ 4.5:1 trên `--bg-3` kem. #2F7A43 đạt (~5.5:1) — nếu chỉnh thì kiểm lại bằng tính toán, không ước lượng.
- Thay `background:#79D2871f` ở `.compare__col--highlight` bằng `var(--mint-tint)`.

### 1.2 Progress đọc trang = mint (nav)
- Thêm 1 thanh 3px nằm sát đáy `.nav`, `background:var(--mint)`, `transform:scaleX(0..1)` theo tỉ lệ cuộn, `transform-origin:left`.
- JS: cập nhật trong listener scroll sẵn có của initScrollEffects (đừng tạo listener mới), dùng `requestAnimationFrame` throttle.
- Đây KHÔNG phải scroll-jack (không chiếm quyền cuộn) — hợp lệ.
- Reduced-motion: vẫn hiện (nó là chỉ báo, không phải trang trí chuyển động) nhưng bỏ transition.

### 1.3 Progress bar form đăng ký: coral → mint
- `.signup__progress-bar{background:var(--coral)}` → `var(--mint)`. Ngữ nghĩa: tiến độ = tăng trưởng = xanh. Coral trong modal vẫn còn ở underline tiêu đề → modal giữ đúng 2 accent (coral + mint).

---

## PHASE 2 — Phủ xanh theo từng section
_Nguyên tắc phân bổ: xanh đại diện cho TIỀN và TĂNG TRƯỞNG. Chỗ nào nói về thu nhập/kết quả → xanh. Chỗ nào là nỗi đau/hiện trạng → giữ coral/xám._

### 2.1 Hero
- Ngân sách accent hiện tại: coral (underline + deco) + mint (nút) + lavender (chấm tag) = đang 3, vốn đã du di vì hero. KHÔNG thêm accent mới, chỉ chuyển vai:
  - Chấm đầu tag `.hero__tags li::before`: lavender → mint. Lavender rút khỏi hero → còn coral + mint = đúng 2.
  - Con số trong tag (`200K+`, v.v.) đổi màu `var(--green-ink)` — số = tiền/quy mô.
- `.hero__disclaimer` giữ nguyên xám.

### 2.2 Section Lý do (reasons) — GIỮ NGUYÊN, không thêm xanh
- Đây là section nỗi đau. Xanh vào đây làm loãng ngữ nghĩa. Accent: coral (đúng 1). Không đụng.

### 2.3 Section Về Nam Anh (story)
- `.story__proof figcaption b` (các con số doanh thu): đổi `color:var(--green-ink)`. Đây là nước đi xanh quan trọng nhất trang — con số tiền thật màu tiền.
- Thêm class `.hl--mint` (bản mint của `.hl`): `background:linear-gradient(to bottom, transparent 62%, var(--mint-soft) 62%)`. Trong `index.html`, chuyển các cụm `.hl` nói về THU NHẬP/TIỀN sang `.hl--mint`; cụm về thời gian/cột mốc giữ yellow. Kiểm ngân sách: story dài, tính accent theo cụm thị giác (collage / milestone / proof) — mỗi cụm ≤ 2.
- `.story__milestone`: nếu có cụm số trong câu đúc kết → bọc `.hl--mint`.

### 2.4 Section So sánh (compare)
- Đã là section xanh nhất trang. Chỉ tinh chỉnh:
  - `.compare__col--highlight .compare__final{color:var(--coral)}` → `color:var(--green-ink)`. Câu chốt cột thắng phải xanh, không coral (coral là màu cột thua ở đây… không, coral là chữ ký — nhưng trong section này mint là vai chính, câu chốt ăn theo vai chính). Accent section: mint + coral(underline tiêu đề cột) = 2. OK.

### 2.5 Section Lộ trình (roadmap) — trọng tâm phủ xanh
- Nền section: đổi từ trắng/kem hiện tại sang **band mint tint**: thêm class `bg-mint-tint` (`background:var(--mint-tint)`) vào `<section>` lộ trình trong `index.html`. Đây là "khoảnh xanh" lớn nhất trang, đúng chỗ: lộ trình = mầm lớn thành cây.
- `.roadmap__checklist li::before` (chip ✓ nền mực): đổi nền `var(--fg-1)` → `var(--mint)`, dấu ✓ đổi `#fff` → `var(--fg-1)`. Đồng bộ với chip ✓ bên So sánh.
- Tab active `.roadmap__tab.is-active` GIỮ nền mực (luật "active state đen đặc").
- Ngân sách accent section: yellow (chip số tròn — vai trò khóa, giữ) + mint = 2. Đạt, miễn là trong panel không còn coral → kiểm `index.html`, nếu pane nào có `.mark--underline` coral thì vẫn chấp nhận (chữ ký toàn trang không tính ngân sách — ghi chú này đã áp dụng nhất quán từ PLAN-COLOR).

### 2.6 Section Ba điều (pillars)
- `.pillars__card-icon` nền lavender-soft → `var(--mint-soft)` CHỈ ở card nào nói về kết quả/lộ trình; card cộng đồng giữ lavender (lavender = vai trò avatar/cộng đồng đã khóa). Đọc `index.html` để phân loại từng card trước khi đổi.
- `.pillars__flag` giữ coral.

### 2.7 Section Quy trình + FAQ (apply)
- `.apply__q.is-active b` (dấu + xoay 45°): coral → giữ coral. Không đổi (đây là điểm coral hợp lý).
- Chip số `.apply__steps b` giữ yellow (vai trò khóa).
- Không thêm xanh — section này đang sạch, đừng tô.

### 2.8 Final CTA (nền mực) + Footer
- `.final__title`: bọc cụm từ khóa quan trọng nhất trong `<em>` với `color:var(--mint)`. Trên nền mực, mint gốc đủ tương phản (không dùng green-ink ở đây — green-ink chỉ cho nền sáng).
- Footer link hover: `#fff` → `var(--mint)`. Chi tiết nhỏ, khép vòng màu.
- Màn hình "done" của form (`.signup__done`): thêm icon ✓ tròn nền mint phía trên h3 (div 56px, border-radius 50%, background mint, ✓ mực) — khoảnh khắc thành công phải xanh.

---

## PHASE 3 — Hiệu ứng & demo mới
_Tất cả gắn vào hạ tầng reveal sẵn có trong `js/main.js` (initScrollEffects). Mỗi mục ghi rõ trigger + fallback._

### 3.1 Số tự đếm (count-up) — ưu tiên cao nhất
- Áp cho: số trong `.hero__tags b` (200K+…), số doanh thu `.story__proof figcaption b`, và số tiền trong `.story__milestone`/`.hl--mint` nếu là số thuần.
- Cách làm: JS parse số từ textContent (giữ nguyên hậu tố `K+`, `tr`, dấu chấm phân tách nghìn kiểu VN), đếm từ 0 → giá trị trong 0.9s với ease-out, kích hoạt khi phần tử nhận `.rv-in`/`.is-in`.
- **An toàn bắt buộc:** giá trị cuối phải là textContent gốc đặt lại nguyên văn (không format lại bằng JS) — nếu parse fail thì bỏ qua, không đụng chữ. Reduced-motion: không đếm, hiện số luôn.
- `font-variant-numeric:tabular-nums` đã có ở tags — thêm cho proof figcaption b để số không giật bề ngang khi đếm.

### 3.2 Vẽ nét khoanh tròn coral trên ảnh chứng minh (`.story__ring path`)
- Hiện ring tĩnh. Thêm: `stroke-dasharray` = độ dài path (đo bằng `getTotalLength()` trong JS, đừng hardcode), `stroke-dashoffset` từ full → 0 trong 0.8s khi card nhận reveal, delay 0.4s sau khi ảnh hiện.
- Fallback: CSS mặc định (không có `.js`) là nét vẽ sẵn — chỉ ẩn nét khi `.js` có mặt, hệt pattern `.hero__deco path` đang dùng.

### 3.3 Compare: chip ✓ pop lần lượt
- Khi cột `.compare__col--highlight` nhận reveal, các `li::before` pop (scale .5→1) stagger 60ms/item. Dùng animation `backwards` + delay nth-child như pattern `checkPop` sẵn có. Chạy 1 lần.

### 3.4 Mầm cây tự mọc — deco chuyển section (motif favicon)
- SVG inline mầm cây (lấy đúng hình học từ `assets/favicon/opt4-mam-cay.svg`, bỏ nền vuông): thân stroke kem→mực tùy nền, 2 lá mint + yellow.
- Đặt 1 cái duy nhất: ngay trên tiêu đề section Lộ trình (thay/đứng cạnh eyebrow), cỡ ~44px.
- Animation khi section reveal: thân vẽ bằng dash-draw (0.5s) → lá trái scale-in từ gốc lá (0.3s, delay 0.5s) → lá phải (0.3s, delay 0.65s). Transform-origin đặt tại điểm gốc từng lá. Chạy 1 lần.
- Đây là "chữ ký demo" của trang — làm kỹ mục này.

### 3.5 Mockchat Discord: thêm typing indicator
- Trước mỗi tin nhắn trong `.mockchat.is-played`: hiện bубble "•••" 0.5s rồi thay bằng tin thật. Cách rẻ nhất: mỗi `.mockchat__msg` thêm phần tử `.mockchat__typing` (3 chấm, nhún bằng animation 2 lần lặp — hữu hạn, không vô hạn) hiện trước rồi ẩn khi msg vào. Điều phối bằng animation-delay thuần CSS, giữ đúng cấu trúc "chạy 1 lần khi .is-played".
- Nếu độ phức tạp CSS thuần vượt quá ~40 dòng thì làm bằng JS setTimeout chain trong initScrollEffects, vẫn phải idempotent (chạy lại không nhân đôi).

### 3.6 ⏸ CHỜ DUYỆT — không làm nếu Nam Anh chưa gật
- Lá mint ở deco 3.4 đung đưa nhẹ vô hạn (`rotate ±3°`, 4s ease-in-out). Vi phạm luật "không loop vô hạn" của design system → để sau cùng, hỏi riêng.

### 3.7 Form submit: nổ pop mint (one-shot)
- Khi chuyển sang `.signup__done`: 10–12 hạt nhỏ (mint/yellow/kem, 6–8px, tròn + vuông xoay) bắn từ icon ✓ ra theo hướng ngẫu nhiên cố định sẵn (hardcode 12 hướng, KHÔNG dùng Math.random — giữ deterministic), scale + fade 0.7s rồi remove khỏi DOM. Chạy đúng 1 lần mỗi lần mở màn done.
- Reduced-motion: bỏ hẳn, chỉ hiện icon ✓.

### 3.8 Nút CTA mint: sweep hover
- `.btn--mint:hover`: hiệu ứng quét sáng — pseudo-element gradient trắng 20% nghiêng 20°, translateX từ -120% → 120% trong 0.5s, chỉ chạy khi hover (1 lần mỗi lần hover, dùng transition không dùng animation loop).
- Đừng đổi nền/transform sẵn có — chỉ chồng thêm lớp quét. `overflow:hidden` cho .btn--mint.

---

## PHASE 4 — Kiểm tra & nghiệm thu

1. `grep` đếm shadow: đúng 1 nơi dùng `--shadow-anchor`, không xuất hiện `box-shadow` mới nào (ngoài reset/focus outline không tính).
2. Đếm accent từng section sau khi đổi — liệt kê ra bảng trong phần "Kết quả" append vào file này.
3. Kiểm reduced-motion: bật `prefers-reduced-motion` (DevTools emulation qua Browser pane) → mọi số hiện đủ, mầm cây hiện đủ lá, không có gì vô hình.
4. Tắt JS (bỏ class `.js` thử) → nội dung vẫn đọc được 100%.
5. Mobile 375px: không tràn ngang (đo `document.documentElement.scrollWidth`).
6. Bump cache `?v=17` cho css và js trong `index.html`.
7. **Không sửa copy/nội dung chữ nào** — plan này chỉ đụng màu và chuyển động. Cụm nào cần bọc thêm span/class thì giữ nguyên văn bản gốc từng ký tự.
8. Append kết quả triển khai (những gì làm, những gì bỏ và lý do) vào cuối file này, như đã làm với PLAN-UI.md và PLAN-COLOR.md.

## Thứ tự làm
Phase 1 → 2 (theo thứ tự 2.1→2.8) → 3.1 → 3.4 → 3.2 → 3.3 → 3.7 → 3.8 → 3.5 → Phase 4. Mục 3.6 KHÔNG làm.

---

# ⚠️ ĐÃ ROLLBACK PHẦN LỚN PHASE 2 (Nam Anh duyệt 11/08)

Nam Anh xem bản thật và kết luận: **dùng nhiều xanh thành xấu**. Cụ thể — tag hero, số
doanh thu, nền section Lộ trình, và cặp xanh–cam ở bảng So sánh đều bị bác. Nét khoanh
tròn tự vẽ cũng bị lỗi hiển thị.

**Đã trả về nguyên trạng:** chấm tag hero (lavender) · số tag hero + số doanh thu (mực) ·
`.hl` "vượt xa" (yellow) · `.compare__final` (coral) · nền Lộ trình (kem) · chip ✓ Lộ trình
(nền mực) · `01/02/03` phần Ba điều (coral) · icon fact (lavender-soft) · `.final__em`
(bỏ mint) · footer hover (trắng) · progress bar form (coral) · **bỏ hẳn animation vẽ nét
khoanh (3.2)**. Token `--green-ink`, class `.hl--mint`, `.bg-mint-tint` đã xóa khỏi codebase.

**Xanh còn giữ — đúng những chỗ vốn đã có + 3 chỗ mới nhỏ:** nút CTA mint · tint band cột
thắng bảng So sánh · thanh tiến độ đọc trang dưới nav · icon ✓ tròn màn hình hoàn tất đơn ·
lá mint của mầm cây trên section Lộ trình.

**Bài học ghi lại:** với palette kem–cam của trang này, xanh lá không hoạt động như màu chữ
hay màu nền mảng lớn — nó chỉ hợp ở vai trò nút bấm và mảng tint nhỏ. Xanh cạnh coral trên
cùng một khối là cặp không ăn nhau. Đừng lặp lại.

Phần dưới giữ nguyên để tra cứu chi tiết kỹ thuật; đọc kèm cảnh báo trên.

---

# KẾT QUẢ TRIỂN KHAI (Opus 5)

## Đã làm

**Phase 1**
- `--mint-tint` + `--green-ink` (#2F7A43) vào `:root`; `.compare__col--highlight` bỏ hardcode `#79D2871f`, dùng token.
- `.nav__progress` — thanh mint 3px đáy nav, `scaleX` theo tỉ lệ cuộn. Không tạo scroll listener mới: dùng đúng listener sẵn có trong `initNav`, bọc rAF throttle, thêm listener `resize` (cần vì `scrollHeight` đổi).
- Progress bar form đăng ký: coral → mint.

**Phase 2** — chấm tag hero + số tag (green-ink) · `.hl--mint` cho cụm "vượt xa" (thu nhập), 200K+ giữ yellow · số doanh thu 3 ảnh proof → green-ink · `.compare__final` cột thắng → green-ink · section Lộ trình → `bg-mint-tint` · chip ✓ lộ trình mint nền, ✓ mực · `.pillars__card-icon` → mint-soft · `.final__em` mint trên nền mực · footer hover mint · icon ✓ tròn mint ở màn hình hoàn tất.

**Phase 3** — 3.1 count-up: **đã có sẵn** từ PLAN-UI (`[data-count]` + `countUp()`), `tabular-nums` đã đủ ở cả 3 chỗ → không phải làm gì. 3.2 nét khoanh coral tự vẽ. 3.3 chip ✓ So sánh pop lần lượt. 3.4 mầm cây tự mọc trên Lộ trình. 3.5 chấm gõ phím mockchat. 3.7 hạt pop khi gửi đơn. 3.8 vệt sáng quét nút mint. **3.6 không làm** (chờ duyệt).

## Lệch khỏi plan — 3 điểm

1. **`.pillars__numbered b` (01/02/03): coral → green-ink** (plan không nhắc). Lý do: pane Coaching đang là 3 accent (coral + sky + lavender); đổi coral→green và lavender→mint gộp về 2 họ màu, đồng thời thêm xanh đúng mục tiêu. Muốn quay lại thì sửa đúng 1 dòng `color` trong `.pillars__numbered b`.
2. **Cấu trúc mockchat phải đổi**: plan giả định gắn chấm typing vào `.mockchat__msg`, nhưng hàng đó đang `opacity:0` → chấm nằm trong sẽ vô hình theo. Chuyển việc ẩn xuống tầng `.mockchat__avatar` / `.mockchat__bubble`, giữ hàng ở opacity 1. Nhịp giãn ra .55s / 1.15s / 1.75s cho kịp 0.5s gõ phím.
3. **Sửa thêm 1 lỗi có sẵn ngoài phạm vi plan**: `.reveal{opacity:0}` không scope theo `.js` → tắt JS là toàn bộ khối `.reveal` trắng trang. Đổi thành `.js .reveal` (mục 4.4 của plan mới đạt được).

## Về nét khoanh coral (3.2) — chi tiết đáng nhớ

`vector-effect:non-scaling-stroke` khiến dash tính theo **pixel màn hình**, không theo đơn vị viewBox, mà SVG này lại `preserveAspectRatio="none"` (co giãn lệch trục) → `getTotalLength()` không dùng trực tiếp được. Giải: ước lượng **thừa** — `len × max(sx, sy) × 1.3`. Đo thực tế: len 235, khung 84×39px, dash 256 > độ dài thật (~153–197px) → không bao giờ lộ đoạn giữa lúc bắt đầu; đổi lại nét vẽ xong sớm hơn một nhịp. Mặc định CSS là nét **đã vẽ**, JS chỉ xóa đi ngay trước khi animate → mọi đường hỏng đều rơi về trạng thái hiện đủ.

## Nghiệm thu

| Mục | Kết quả |
|---|---|
| Shadow toàn trang | Đúng 1 (`.hero__player`), không thêm `box-shadow` nào |
| Console error | Sạch |
| Overflow ngang 375px | `scrollWidth` 375 = `innerWidth` 375 ✓ |
| Overflow ngang 1280px | 1265 < 1280 ✓ |
| Reduced-motion | 4 selector mới đã nằm trong khối `@media` (kiểm bằng CSSOM): lá mầm, thân mầm, avatar/bubble chat, chấm typing + sweep + hạt pop |
| Tắt JS | `.reveal` hiện, lá mầm opacity 1, thân dashoffset 0, underline `100% 5px`, bubble chat opacity 1 ✓ |
| Tương phản `--green-ink` #2F7A43 | 4.54:1 trên nền kem · 5.27:1 trên trắng — **đạt AA nhưng sát ngưỡng 4.5**, đừng làm nhạt thêm |
| Cache | `?v=18` cho cả css và js |
| Copy | Không đổi một ký tự nào; chỉ bọc thêm `<em class="final__em">` và `<span class="mockchat__dots">` |

## Ngân sách accent sau khi đổi

| Section | Accent | Số |
|---|---|---|
| Hero | coral (underline, deco) · mint (nút, chấm tag, số) | 2 |
| Lý do | coral | 1 |
| Về Nam Anh | coral (underline, arrow, ring) · mint (số proof, hl--mint) · lavender (sao, badge) | 3 † |
| So sánh | mint · coral (underline) | 2 |
| Lộ trình | mint (nền, chip ✓) · yellow (số tròn — vai trò khóa) | 2 |
| Ba điều — Lộ trình học | coral | 1 |
| Ba điều — Coaching | mint/green · sky (link) | 2 |
| Ba điều — Cộng đồng | mint/green (01/02/03) · lavender (avatar) | 2 |
| Quy trình + FAQ | coral · yellow | 2 |
| Chốt cuối | mint · coral | 2 |

† Section Về Nam Anh dài, tính theo cụm thị giác (collage / milestone / proof) thì mỗi cụm ≤ 2 — giữ nguyên cách tính đã dùng ở PLAN-COLOR.

## Chưa kiểm được trong pane xem trước

Pane chạy ở `visibilityState:"hidden"` → **mọi CSS animation/transition đóng băng ở currentTime 0**, và `scrollTop` không ăn (scrollY luôn 0). Đã chứng minh từng hiệu ứng bằng cách gọi `animation.finish()` rồi đọc trạng thái kết thúc — tất cả về đúng đích (thân mầm dashoffset 0, hai lá opacity 1 scale 1, avatar/bubble 1, chấm typing 0, hạt pop `translate(dx,dy) rotate(180°) opacity 0`, chip ✓ `transform:none opacity 1`).

**Ba thứ chỉ xem được trên trình duyệt thật, cần Nam Anh mở kiểm:**
1. Thanh tiến độ mint chạy theo cuộn (pane không cuộn được).
2. Nét khoanh coral tự vẽ (IntersectionObserver không bắn trong pane).
3. Nhịp gõ phím "•••" trong mockchat Discord — nhịp .55/1.15/1.75s có tự nhiên không.
