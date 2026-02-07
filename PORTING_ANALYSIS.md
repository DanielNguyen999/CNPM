# BÁO CÁO PHÂN TÍCH PORTING CNPM-1 -> BIZFLOW
**Trạng thái:** Phase 1 - Diff & Mapping (Hoàn tất phân tích)
**Nguyên tắc:** 
- KHÔNG copy logic database.
- KHÔNG push Git (Local-only).
- KHÔNG refactor phần đang chạy ổn định.
- SỬ DỤNG pattern UI/UX và Logic NLP từ CNPM-1.

---

## 1. PHÂN TÍCH TÍNH NĂNG VOICE-TO-DRAFT (TRỌNG TÂM)

### A. Pattern từ CNPM-1 (`employee/voice-order/page.tsx`)
- **UI:** Nút Mic nổi bật, trạng thái "🔴 Đang nghe" trực quan.
- **Transcript:** Hiển thị văn bản realtime khi người dùng nói.
- **NLP Logic (Vàng):** 
  - Regex chuyển đổi tiếng số tiếng Việt: `một` -> `1`, `hai` -> `2`... giúp parser chính xác hơn.
  - Nhận diện từ nối: `cộng`, `và`, `với` để chia tách các item sản phẩm.
  - Tách tên khách hàng: Tự động bắt từ khóa `cho [TênKhách]` ở cuối câu.
- **Flow:** Nói -> Parse ra JSON Draft -> Hiển thị Preview -> Bấm confirm để lưu vào Database.

### B. Ánh xạ sang BizFlow (`CODE_BizFLow_100Hrs`)
| Thành phần | Action trong BizFlow | File đích |
| :--- | :--- | :--- |
| **Backend Endpoint** | Tạo `POST /api/v1/ai/voice-to-order` | `backend/api/v1/routes/ai.py` |
| **STT Engine** | Tích hợp Whisper (thay vì SpeechRecognition browser) | `backend/infrastructure/ai/whisper_provider.py` |
| **NLP Parser** | Port bộ Regex từ CNPM-1 sang Python | `backend/infrastructure/ai/parser.py` |
| **Frontend UI** | Tạo Component `VoiceOrderModal.tsx` | `web/src/components/orders/VoiceOrderModal.tsx` |
| **Toast/Feedback** | Sử dụng Vietnamese Toast chuẩn CNPM-1 | `web/src/hooks/use-toast.ts` |

---

## 2. UI/UX PATTERNS CẦN PORT (PHASE 2)
- **Vietnamese Language:** Đồng bộ hóa bộ dịch `vi.json` từ CNPM-1 để có thông báo lỗi/thành công thân thiện hơn.
- **Skeleton Loading:** Thêm loading state vào trang Orders và Inventory để tránh màn hình trắng (No-reload policy).
- **Optimistic Updates:** Khi bấm xóa/sửa, UI cập nhật ngay lập tức trước khi chờ API (pattern từ `orders/page.tsx` của CNPM-1).

---

## 3. DANH SÁCH "FIX SUMMARY" (LOCAL-ONLY)
1. **Fix 01:** Implement bộ Parser NLP hỗ trợ số đếm tiếng Việt từ CNPM-1.
2. **Fix 02:** Tạo giao diện ghi âm chuyên nghiệp (Wow factor) cho POS/Orders.
3. **Fix 03:** Sửa lỗi hiển thị tiền tệ (VND) và ngày tháng chuẩn Việt Nam.

---

## 4. MANUAL QA CHECKLIST
- [ ] Ghi âm "2 bánh mì 3 nước cho anh Nam" -> Có nhận diện đúng 2 loại sản phẩm?
- [ ] Tên khách hàng "Nam" có được tự động điền?
- [ ] Bấm xác nhận có tạo đúng `DraftOrder` trong DB BizFlow?
- [ ] Toast hiển thị tiếng Việt: "Đã lưu đơn hàng thành công"?
- [ ] Tốc độ phản hồi < 2s?
