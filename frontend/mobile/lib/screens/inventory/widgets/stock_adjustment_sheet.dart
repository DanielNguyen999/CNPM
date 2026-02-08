import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../../models/product.dart';
import '../../../services/inventory_service.dart';
import '../../../core/constants/app_colors.dart';
import '../../../widgets/common/primary_button.dart';

class StockAdjustmentSheet extends StatefulWidget {
  final Product product;
  final VoidCallback onSuccess;

  const StockAdjustmentSheet({
    super.key,
    required this.product,
    required this.onSuccess,
  });

  @override
  State<StockAdjustmentSheet> createState() => _StockAdjustmentSheetState();
}

class _StockAdjustmentSheetState extends State<StockAdjustmentSheet> {
  final _quantityController = TextEditingController();
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isLoading = false;
  bool _isIncrease = true; // Default to increase

  Future<void> _submit() async {
    final qtyText = _quantityController.text;
    final qty = double.tryParse(qtyText);

    if (qty == null || qty <= 0) {
      Fluttertoast.showToast(msg: "Vui lòng nhập số lượng hợp lệ");
      return;
    }

    if (_reasonController.text.isEmpty) {
      Fluttertoast.showToast(msg: "Vui lòng nhập lý do");
      return;
    }

    setState(() => _isLoading = true);

    try {
      final change = _isIncrease ? qty : -qty;
      await Provider.of<InventoryService>(context, listen: false).adjustStock(
        productId: widget.product.id,
        quantityChange: change,
        reason: _reasonController.text,
        notes: _notesController.text,
      );

      Fluttertoast.showToast(msg: "Đã cập nhật tồn kho");
      widget.onSuccess();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.slate300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            "Điều chỉnh kho: ${widget.product.name}",
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            "Tồn hiện tại: ${widget.product.availableQuantity?.toInt() ?? 0} ${widget.product.units?.isNotEmpty == true ? widget.product.units!.first.name : ''}",
            style: const TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: _buildTypeButton(
                  title: "Nhập kho (+)",
                  isSelected: _isIncrease,
                  color: AppColors.success,
                  onTap: () => setState(() => _isIncrease = true),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTypeButton(
                  title: "Xuất kho (-)",
                  isSelected: !_isIncrease,
                  color: AppColors.error,
                  onTap: () => setState(() => _isIncrease = false),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _quantityController,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(
              labelText: "Số lượng điều chỉnh",
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _reasonController,
            decoration: const InputDecoration(
              labelText: "Lý do (Bắt buộc)",
              hintText: "VD: Nhập hàng mới, Hư hỏng, Kiểm kê...",
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _notesController,
            decoration: const InputDecoration(
              labelText: "Ghi chú thêm",
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 24),
          PrimaryButton(
            text: "Xác nhận",
            isLoading: _isLoading,
            onPressed: _submit,
            color: _isIncrease ? AppColors.success : AppColors.error,
          ),
        ],
      ),
    );
  }

  Widget _buildTypeButton({
    required String title,
    required bool isSelected,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.1) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : AppColors.slate300,
            width: isSelected ? 2 : 1,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          title,
          style: TextStyle(
            color: isSelected ? color : AppColors.textSecondary,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
