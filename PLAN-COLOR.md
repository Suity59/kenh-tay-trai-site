# PLAN-COLOR — Cân bằng lại màu sắc cho kenh-tay-trai-site

> **Người viết:** Fable 5 (10/08/2026, sau audit usage 5 accent trong styles.css).
> **Người thực thi:** Opus 5. Đọc hết trước khi sửa. Nguồn luật: `04_Resources/Design System — Marketing/Nam-Anh-Marketing-Design-System.md` (§2 vai trò khóa, §7 tiebreak).

## 0. Chẩn đoán

Đếm usage thực tế trong `css/styles.css`:

| Accent | Vai trò KHÓA theo design system | Đang dùng |
|---|---|---|
| Coral | Underline keyword, squiggle/deco | **15 chỗ — chiếm sóng, còn bị dùng SAI vai trò (làm số thứ tự)** |
| Mint | CTA duy nhất | 1 (đúng) + tint bảng so sánh |
| Yellow | **Nav/spotlight, SỐ THỨ TỰ TRÒN** | **0 — vắng hoàn toàn** |
| Sky | Link hành động | 3 (scroll-spy, link citation — đúng) |
| Lavender | Badge decorative, avatar, illustration | 3 (dot tag, sao, icon circle — đúng nhưng ít) |

**Kết luận:** trang là "kem + coral" đơn sắc. Chữ ký thị giác của brand site (5 accent mỗi màu một việc, soft tint làm nền tile) chưa lên được. Sửa bằng cách **trả yellow về đúng vai trò số thứ tự** và **phủ soft tint có kỷ luật** — KHÔNG thêm hue mới, KHÔNG gradient, giữ trần 2 accent/section.

## 1. Ngân sách accent từng section (bảng chốt — Opus đối chiếu khi làm)

| Section | Accent 1 | Accent 2 | Ghi chú |
|---|---|---|---|
| Hero | Coral (eyebrow, underline, deco) | Lavender (dot tags) | Giữ nguyên, không sửa |
| 2 Lý do | Coral (✕, underline, em title) | — | Giữ 1 accent; chỉ thêm nền tile trung tính (mục 2.1) |
| 3 Về Nam Anh | Coral (arrow, underline) | Lavender (sao + badge mới 2.2) | |
| 4 So sánh | Mint (tint + ✓) | Coral (dòng chốt) | Đã đạt trần, không sửa |
| 5 Lộ trình | Coral (em title) | **Yellow (số giai đoạn tròn — MỚI)** | ✓ checklist GIỮ mực đen, không mint (tránh accent thứ 3) |
| 6 Ba điều | Coral (underline title) | Lavender (icon circles + avatar mockchat) | **Fix mockchat đang 3 màu → 1 màu** (mục 2.4) |
| 7 Quy trình + FAQ | **Yellow (số bước tròn — ĐỔI từ coral)** | Coral (dấu + FAQ active) | Coral số hiện tại là sai vai trò |
| 9 Final CTA | Mint (CTA) | Coral (underline) | Giữ nguyên |

## 2. Thay đổi cụ thể

### 2.1 Section 2 — Lý do: 3 gạch đầu dòng thành tile
List "Bạn sẽ không cần" hiện là text trần. Design system: "nền tile dùng soft tint" — nhưng section này đã có coral làm accent, nên tile dùng **trung tính** `var(--bg-2)` (không tốn ngân sách accent):
```css
.reasons__list li{
  background:var(--bg-2);border:1px solid var(--hairline);
  border-radius:var(--r-card);padding:14px 18px 14px 44px;margin-bottom:10px;
}
.reasons__list li::before{left:16px;top:50%;transform:translateY(-50%);}
```
(Điều chỉnh vị trí ✕ theo padding mới; text-align trái đã có.)

### 2.2 Section 3 — Badge lavender cho khối thu nhập
Trước đoạn "Đây là thu nhập thụ động... tháng 3/2026" thêm 1 pill badge đúng vai trò lavender ("badge decorative"):
```html
<span class="badge-lav">Số liệu tháng 3/2026</span>
```
```css
.badge-lav{
  display:inline-block;background:var(--lavender-soft);border:1.5px solid var(--fg-1);
  border-radius:var(--r-pill);padding:5px 14px;
  font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;
  margin-bottom:14px;
}
```

### 2.3 Section 5 — Số giai đoạn tròn màu yellow (vai trò đúng của yellow)
Tab "Giai đoạn 1/2/3": thêm chip số tròn yellow trước label. HTML mỗi tab thêm `<i class="tab-num">1</i>` (đổi span hiện có hoặc thêm phần tử):
```css
.roadmap__tab .tab-num{
  display:inline-flex;align-items:center;justify-content:center;
  width:26px;height:26px;border-radius:50%;flex:none;
  background:var(--yellow);color:var(--fg-1);
  font-style:normal;font-weight:700;font-size:0.8125rem;
  font-variant-numeric:tabular-nums;
}
.roadmap__tab.is-active .tab-num{background:var(--yellow);} /* yellow giữ nguyên trên nền đen — spotlight */
```
Layout tab chuyển thành hàng ngang (chip số + cột chữ). Chip yellow trên tab active nền đen = đúng kiểu "spotlight" của yellow, và KHÔNG vi phạm luật active-đen-đặc (nền tab vẫn đen, chữ vẫn trắng).

### 2.4 Section 6 — Fix mockchat 3 màu → 1 màu
`.mockchat__avatar` đang inline-style 3 màu (sky-soft, mint-soft, lavender-soft) = 3 accent trong 1 card, vỡ trần. Đổi cả 3 về `var(--lavender-soft)` (khớp icon circles của card Coaching, thống nhất "avatar = lavender" đúng vai trò):
- Sửa 3 inline style trong HTML → bỏ inline, chuyển vào CSS `.mockchat__avatar{background:var(--lavender-soft);}`.

### 2.5 Section 7 — Số bước 1/2/3 đổi coral → yellow chip tròn
`.apply__steps b` hiện là số coral serif to (coral sai vai trò ở đây). Đổi thành chip tròn yellow đồng bộ với 2.3:
```css
.apply__steps b{
  display:inline-flex;align-items:center;justify-content:center;
  width:34px;height:34px;border-radius:50%;flex:none;
  background:var(--yellow);color:var(--fg-1);
  font-size:1rem; /* bỏ font-size 1.75rem coral cũ */
}
```
FAQ dấu `+` active giữ coral (accent 2 của section).

### 2.6 Nhịp nền section (không tốn accent)
Hiện cream/white/cream/white đều tăm tắp. Design system cho phép 3 mức `#F3EDE9 / #FFFFFF / #F9F6F3` tạo nhịp. Đổi **Section 7 (Quy trình+FAQ)** từ `bg-cream` → `bg-ivory` (`#F9F6F3`) để 3 section cuối đọc thành nhịp sáng dần trước khi rơi vào nền mực của Final CTA: `...white (Ba điều) → ivory (Quy trình) → ink (Chốt)`.

## 3. KHÔNG làm
- Không thêm hue ngoài 5 accent + neutrals. Không gradient. Không đổi màu CTA.
- Không đụng Section 4 (đã đạt trần 2 accent) và Hero.
- Không dùng accent đậm làm nền lớn (chỉ soft tint / trung tính).

## 4. Checklist nghiệm thu
- [ ] Đếm lại bảng mục 1: không section nào quá 2 accent
- [ ] Yellow xuất hiện đúng 2 nhóm: số giai đoạn (S5) + số bước (S7) — vai trò "số thứ tự tròn"
- [ ] Mockchat chỉ còn 1 màu avatar (lavender-soft)
- [ ] Chip yellow + chữ mực đạt AA (#FDD46B/#1B1624 ~10.9:1 — pass)
- [ ] Tile list S2 nền bg-2, ✕ coral canh giữa dọc, mobile 375px không vỡ
- [ ] Badge "Số liệu tháng 3/2026" hiện đúng vị trí, không che ảnh proof
- [ ] S7 nền ivory, không còn bg-cream
- [ ] Bump `?v=` CSS/JS, hard-reload verify

---

## 5. KẾT QUẢ TRIỂN KHAI (Opus 5 — 10/08/2026)

Đã làm xong **6/6** thay đổi ở mục 2. Nghiệm thu 9/9 pass.

| Việc | Kết quả |
|---|---|
| 2.1 Tile list Lý do | Nền `--bg-2`, ✕ coral canh giữa dọc, tile 335×82 trên mobile |
| 2.2 Badge lavender | `Số liệu tháng 1/2026`, nền `--lavender-soft` + viền mực |
| 2.3 Chip số giai đoạn | Yellow 30×30 tròn, layout grid `"num label" / "num name"` |
| 2.4 Mockchat | 3 màu → 1 màu lavender-soft (bỏ inline style trong HTML) |
| 2.5 Chip số bước | Coral 1.75rem serif → chip yellow tròn 34×34 |
| 2.6 Nhịp nền S7 | `bg-cream` → `bg-ivory` |

**Usage accent sau khi sửa:** coral 14 (giảm 1, bỏ vai trò sai), yellow **0 → 2** (đúng vai trò số thứ tự), lavender-soft 2 → 4, mint/sky giữ nguyên.

**Kiểm chứng thêm:**
- Chip yellow + chữ mực = **12.48:1** (vượt xa AA 4.5:1)
- Tab active vẫn `#1B1624` nền + chữ trắng → không vi phạm luật "active = đen đặc"
- Vẫn đúng **1 shadow** `6px 6px 0 #000` toàn trang
- Tab bấm vẫn chạy sau khi đổi flex → grid
- Mobile 375px: không tràn ngang

**Giới hạn:** preview pane vẫn lỗi chụp ảnh khi trang đã cuộn (`visibilityState: hidden`), nên phần nhìn của Section 5 và 7 mới chỉ verify bằng tọa độ DOM + computed color. Nam Anh mở Chrome/Safari thật để duyệt cảm giác màu tổng thể.
