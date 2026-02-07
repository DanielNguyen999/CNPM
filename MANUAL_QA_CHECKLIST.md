# MANUAL QA CHECKLIST
**Feature:** Voice-to-Draft & AI Porting

## 1. Voice Recording Flow
- [ ] Click the "GIỌNG NÓI" tab in Draft Creation.
- [ ] Click the Mic icon. (Expected: Icon pulses red, timer starts).
- [ ] Speak: "Bán 2 bánh mì cho chị Lan".
- [ ] Click Stop (Square icon).
- [ ] Observe processing state. (Expected: "Đang chuyển đổi giọng nói..." appears).
- [ ] Verify transcript result. (Expected: Text matches spoken words).

## 2. AI Parsing Flow
- [ ] Click "TIẾP TỤC PHÂN TÍCH CHI TIẾT" after recording.
- [ ] Observe loading state.
- [ ] Verify the Draft Card results:
  - [ ] Customer Name: "Chị Lan"
  - [ ] Product: "bánh mì"
  - [ ] Quantity: 2
- [ ] System should NOT show error "Lỗi phân tích" if text is valid.

## 3. UI/UX Aesthetics
- [ ] Check Vietnamese display for all buttons and labels in the AI section.
- [ ] Verify that no page reload occurs during the entire flow (using React Query patterns).
- [ ] Toast notification should appear in Vietnamese when a draft is created.

## 4. Regression Check
- [ ] Verify the traditional Text mode ("VĂN BẢN") still works as expected.
- [ ] Ensure previous orders and inventory data are not affected.
