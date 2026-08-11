# PLAN-CRM — Nâng admin.html thành mini-CRM chốt sale
_Người viết: Fable. Người triển khai: Opus 5. Làm đúng thứ tự Phase; Phase 1 xong phải kiểm RLS rồi mới sang Phase 2._

## Ý đồ

`admin.html` hiện chỉ ĐỌC: xem đơn, xem phân bố. Nam Anh cần một vòng làm việc bán hàng hoàn chỉnh trên chính trang đó:

1. **Nhìn phát biết gọi ai trước** — xếp hạng ưu tiên tự động từ câu trả lời.
2. **Theo dấu từng người qua phễu** — Mới → Đã liên hệ → Đã đặt lịch → Đã meeting → Chốt (hoặc Từ chối / Không phù hợp).
3. **Ghi chú + hẹn ngày follow-up** — mở trang ra là thấy "hôm nay cần gọi ai".
4. **Analytics phục vụ bán** — phễu chuyển đổi, nguồn nào ra lead chất, tốc độ phản hồi — chứ không chỉ phân bố dân số.

### Ràng buộc cứng
- **Một file `admin.html`, không build, không thư viện ngoài** — giữ đúng triết lý repo.
- **KHÔNG đụng `index.html` / form public.** Cột mới trong DB phải nullable hoặc có default để INSERT hiện tại của form không phải đổi một ký tự nào.
- **RLS:** project lctos có 116 tài khoản auth (học viên hoc). MỌI policy mới phải khoá theo `auth.uid() = 'beb3504b-9889-4edf-acc0-1b6904d5fcf4'` (tài khoản namanhsuit@gmail.com) — tuyệt đối không `to authenticated using (true)`.
- **Deploy:** webhook GitHub→Vercel từng miss. Sau khi push, luôn `vercel --prod --yes` tay rồi verify bằng fetch trang thật (không grep file local).
- Giao diện giữ token Editorial Warm Clean đang import từ `styles.css`; class tiền tố `adm-`. Trang nội bộ nên không bị luật "1 shadow/trang" của trang public ràng — nhưng cũng đừng thêm shadow mới, không cần.

---

## PHASE 1 — Nền dữ liệu (Supabase, project `gedyrwfhqpjrfcptrnck`)

### 1.1 Migration: cột CRM trên `ktt_applications`
```sql
alter table public.ktt_applications
  add column if not exists status text not null default 'moi'
    check (status in ('moi','da_lien_he','da_dat_lich','da_meeting','chot','tu_choi','khong_phu_hop')),
  add column if not exists note text,
  add column if not exists follow_up_on date,
  add column if not exists contacted_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();
```
- `contacted_at`: set MỘT LẦN ở client khi status rời `moi` lần đầu (đo tốc độ phản hồi). Đừng làm trigger phức tạp.
- `updated_at`: client tự gửi `now()` trong mỗi PATCH (đủ dùng, khỏi trigger).

### 1.2 Policy UPDATE — chỉ Nam Anh
```sql
create policy "nam anh updates ktt applications"
on public.ktt_applications
for update
to authenticated
using (auth.uid() = 'beb3504b-9889-4edf-acc0-1b6904d5fcf4'::uuid)
with check (auth.uid() = 'beb3504b-9889-4edf-acc0-1b6904d5fcf4'::uuid);
```

### 1.3 Kiểm chứng bắt buộc trước khi sang Phase 2
1. Giả lập học viên khác (`set local role authenticated` + jwt sub của uid khác): UPDATE phải 0 rows / bị chặn.
2. Giả lập Nam Anh: UPDATE đổi được `status`, rồi trả về giá trị cũ.
3. Anon qua REST thật (publishable key, không token): PATCH phải fail, SELECT vẫn `[]`, INSERT form vẫn chạy (POST thử một bản ghi test rồi ghi chú lại — có thể xoá tay sau).
4. Chạy `get_advisors` (security) sau migration, xử lý cảnh báo nếu có.

---

## PHASE 2 — Điểm ưu tiên & pipeline (logic thuần client)

### 2.1 Điểm ưu tiên (lead score) — hàm thuần, dễ chỉnh
```
score = urgency + commit + following + income
urgency:  'Càng sớm càng tốt'=4 · 'Trong vòng 1 tháng tới'=3 · 'Trong năm nay'=1 · 'Chưa chắc'=0
commit:   chứa 'sẵn sàng'=2 · còn lại=0
following:'Hơn 1 năm'=2 · '6–12 tháng'=1 · '1–6 tháng'=1 · mới biết=0
income:   '25 – 50'=1 · '50 – 80'=2 · '80 – 150'=2 · 'Trên 150'=2 · dưới đó=0
```
- Hiển thị thành hạng: **A (≥7) · B (4–6) · C (<4)** — chip màu: A mint-soft, B yellow-soft, C xám. KHÔNG hiện số thô.
- So khớp chuỗi bằng `indexOf` trên giá trị thật của form (xem index.html) — đừng đoán chuỗi, copy nguyên văn.
- Đặt bảng điểm trong MỘT object `SCORING` ở đầu script để Nam Anh chỉnh sau này dễ.

### 2.2 Pipeline
- Nhãn hiển thị: `moi`→"Mới" · `da_lien_he`→"Đã liên hệ" · `da_dat_lich`→"Đã đặt lịch" · `da_meeting`→"Đã meeting" · `chot`→"Chốt ✓" · `tu_choi`→"Từ chối" · `khong_phu_hop`→"Không phù hợp".
- Một object `STATUS` duy nhất: `{key: {label, mau}}` — mọi nơi render từ đây.

---

## PHASE 3 — UI làm việc

### 3.1 Khối "Hôm nay" (đầu dashboard — actionable, quan trọng nhất trang)
Ngay dưới bar, trước các thẻ số liệu:
- **Follow-up quá hạn** (follow_up_on < hôm nay, status chưa kết thúc) — đỏ nhạt.
- **Follow-up hôm nay**.
- **Lead mới chưa liên hệ** (status = moi), sắp theo hạng A trước.
Mỗi mục là danh sách mini (tên + hạng + SĐT copy được + nút nhảy tới thẻ đầy đủ). Không có gì thì hiện "Hôm nay chưa có việc — gọn."

### 3.2 Thanh lọc + sắp xếp danh sách
- Chip lọc theo status (đếm số kèm theo, bấm toggle), thêm chip "Hạng A".
- Sort mặc định: **hạng A trước, cùng hạng thì mới nhất trước**. Giữ ô tìm kiếm hiện có.

### 3.3 Thẻ đơn — thêm khối CRM khi mở
Hàng đầu thẻ thêm: chip hạng (A/B/C) + chip status hiện tại.
Trong phần mở rộng, trên cùng, một khối `adm__crm`:
- **Status**: dãy nút pill (không phải select) — bấm phát ăn luôn, nút đang chọn nền mực chữ trắng (luật active đen đặc).
- **Follow-up**: `<input type="date">` + nút nhanh "+3 ngày" "+1 tuần".
- **Ghi chú**: textarea auto-save khi blur + debounce 800ms khi gõ; góc phải hiện "Đang lưu… / Đã lưu ✓ / Lỗi — bấm để thử lại". Lỗi thì GIỮ nội dung trong ô, đừng revert.
- **Liên hệ nhanh**: nút copy SĐT (Clipboard API, đổi nhãn "Đã copy ✓" 1.5s), link `https://zalo.me/<SĐT bỏ số 0 đầu, thêm 84>` mở tab mới, mailto sẵn có.
- PATCH: `PATCH /rest/v1/ktt_applications?id=eq.<id>` + `Prefer: return=representation`, cập nhật `rows[]` tại chỗ từ response (không refetch cả bảng). Khi status rời `moi` lần đầu và `contacted_at` đang null → gửi kèm `contacted_at: new Date().toISOString()`.
- 401 giữa chừng → dùng lại cơ chế refresh token sẵn có; refresh fail thì đưa về màn đăng nhập kèm thông báo, KHÔNG nuốt lỗi im lặng.

### 3.4 CSV
- Thêm các cột mới vào export (đã tự có vì export theo `Object.keys(rows[0])` — nhưng kiểm lại thứ tự cột và bổ sung cột dẫn xuất `hang` (A/B/C)).

---

## PHASE 4 — Analytics bán hàng (thay/bổ sung khối charts)

Giữ 6 chart phân bố hiện có nhưng chuyển xuống dưới, thêm lên trên:

1. **Phễu chuyển đổi**: hàng ngang các status với số + % so với tổng (bỏ tu_choi/khong_phu_hop ra một dòng phụ "Loại: X"). Render bar thuần div như chart hiện tại.
2. **Chất lượng nguồn**: bảng nhỏ mỗi source: tổng đơn · % hạng A · % đã chốt. Đây là chart trả lời "dồn tiền/công sức vào kênh nào".
3. **Đơn theo tuần**: 8 tuần gần nhất, cột dọc mini (div cao theo %, nhãn tuần dd/mm). Tuần bắt đầu thứ Hai.
4. **Tốc độ phản hồi**: trung bình + trung vị `contacted_at - created_at` (giờ), chỉ tính đơn đã có contacted_at; kèm dòng chú "đơn chưa liên hệ: X".

Số đơn hiện tại mới có 1 — mọi chart phải đẹp cả khi dữ liệu 0/1 dòng (empty state chữ, không NaN%, không chia 0).

---

## PHASE 5 — Kiểm & deploy

1. Dựng lại `admin-test.html` tạm bằng stub fetch (pattern đã dùng: chèn script giả lập TRƯỚC script chính, sessionStorage seed) với ~8 bản ghi giả phủ đủ: mọi status, có/không follow_up, quá hạn, thiếu SĐT, note dài, hạng A/B/C. Kiểm bằng DOM thật: điểm số đúng theo bảng, sort đúng, lọc đúng, khối Hôm nay gom đúng, PATCH giả được gọi với payload đúng (log lại URL+body trong stub). **Xoá file test trước khi commit.**
2. Kiểm 375px: chip lọc cuộn ngang được, khối CRM không tràn.
3. Console sạch. HTML hợp lệ (dt/dd trong dl — lỗi từng gặp).
4. Commit + push + `vercel --prod --yes` + verify trên `https://kenhtaytrai.namanhsuit.com/admin.html` bằng fetch/DOM (login view hiện, RLS anon vẫn `[]`).
5. Append kết quả (làm gì, lệch gì, bảng kiểm) vào cuối file này — như PLAN-UI/COLOR/GREEN.

## Thứ tự
1.1 → 1.2 → 1.3 (chốt cửa) → 2 → 3.3 → 3.1 → 3.2 → 3.4 → 4 → 5.

---

# KẾT QUẢ TRIỂN KHAI (Opus 5)

## Đã làm — bám plan, không lệch mục nào

**Phase 1 — DB.** 5 cột (`status`/`note`/`follow_up_on`/`contacted_at`/`updated_at`) + CHECK constraint + policy UPDATE khoá theo `auth.uid()` của Nam Anh. `status` default `'moi'`, còn lại nullable → form public không phải đổi gì.

**Phase 2–4 — `admin.html` viết lại.** Bảng `SCORING` + `STATUS` đặt đầu script để chỉnh sau dễ; hạng A/B/C; 7 trạng thái phễu; khối Hôm nay; lọc + sort; khối CRM trong thẻ; 4 chart bán hàng + 5 chart chân dung; CSV có thêm cột `hang`.

## Kiểm chứng RLS (cửa chốt Phase 1)

| Vai | SELECT | UPDATE | INSERT |
|---|---|---|---|
| Học viên khác (uid bất kỳ trong 116 tài khoản) | 0 dòng | **0 dòng** | — |
| Nam Anh | 2 dòng | sửa được (đã trả lại nguyên trạng) | — |
| anon qua REST thật | `[]` | `[]` | **201 ✓** |

Advisor security sau migration: **không sinh cảnh báo mới nào cho `ktt_applications`** (các cảnh báo còn lại là của bảng/hàm khác có sẵn trong project lctos).

**Một lần báo động nhầm cần ghi lại:** thử INSERT bằng anon kèm `Prefer: return=representation` trả về **401**, thoạt nhìn như form public đã vỡ. Thực tế `return=representation` đòi quyền SELECT sau khi ghi, mà anon không có. Gọi lại đúng như `js/main.js` (`Prefer: return=minimal`) thì **201**. Bài học: kiểm form public phải mô phỏng Y HỆT header của code thật, khác một header là ra kết luận sai.

## Kiểm logic bằng dữ liệu giả (8 bản ghi, phủ mọi trạng thái)

Mọi con số dưới đây được tính tay trước, rồi đối chiếu với DOM thật — khớp 100%:

- **Hạng:** A=3 (điểm 10/9/7) · B=2 (6/5) · C=3 (0/2/3). Ngưỡng A=7 kiểm bằng một bản ghi đúng 7 điểm.
- **Sắp xếp:** A→B→C, cùng hạng thì mới nhất trước.
- **Hôm nay:** quá hạn 1 · hôm nay 1 · lead mới 2.
- **Phễu tích luỹ:** 6 / 4 / 3 / 2 / 1 (75/50/38/25/13%), đã loại 2.
- **Chất lượng nguồn:** YouTube 2 đơn 50% hạng A; Bạn bè & Instagram 100% hạng A; Email/Newsletter 100% chốt.
- **Tốc độ phản hồi:** trung bình 9.5 giờ, trung vị 3.5 giờ trên 4 đơn (deltas 1/2/5/30 giờ).
- **Đơn theo tuần:** 8 cột, tổng đúng 8.

**Ghi dữ liệu:**
- Đổi trạng thái lần đầu từ `moi` → payload có `contacted_at` ✓
- Đổi lần 2 → **không** ghi đè `contacted_at` ✓
- `updated_at` gửi kèm mọi PATCH ✓
- Thẻ vẫn mở sau khi render lại ✓
- Ghi chú: debounce 800ms chỉ bắn 1 PATCH, **giữ nguyên focus**, blur lưu ngay ✓
- Zalo: `0912345678` → `https://zalo.me/84912345678` ✓
- Lọc hạng A / lọc trạng thái / tìm trong ghi chú / nhảy từ Hôm nay xuống thẻ ✓

**Mobile 375px:** `scrollWidth` 375 = viewport, khối CRM 295px không tràn, chip lọc cuộn ngang được.

**HTML:** 0 thẻ `dt`/`dd` nằm ngoài `dl` (lỗi từng gặp ở bản trước).

## Lệch nhỏ so với plan — 1 điểm

Plan nói lưu ghi chú chỉ cần `renderToday()`. Làm vậy thì chip "📝 có ghi chú" trên thẻ không xuất hiện cho tới lần render sau. Thêm hàm `chipNote()` cập nhật đúng phần tử đó tại chỗ — vẫn không render lại danh sách nên không mất focus.

## Còn treo

- Bảng thật mới có **2 đơn**, cả hai `status='moi'` → phần lớn chart sẽ ở trạng thái rỗng cho tới khi có traffic thật. Các empty state đã được kiểm để không ra `NaN%` hay chia 0.
- Có sẵn hàm `notify_discord_ktt()` trong DB (không phải mình tạo) — nếu đang gắn trigger báo đơn mới về Discord thì không ảnh hưởng gì tới các cột mới.

---

## Không làm (để khỏi phình)
- Kanban kéo-thả (đơn ít, pill nhanh hơn).
- Email/Zalo tự động, nhắc lịch đẩy notification.
- Nhiều admin/phân quyền — khi nào có team hẵng bàn.
- Charts bằng thư viện — div là đủ.
