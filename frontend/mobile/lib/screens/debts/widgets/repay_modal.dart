import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../widgets/common/primary_button.dart';

class RepayModal extends StatefulWidget {
  final double remainingAmount;
  final Function(double amount, String method, String? notes) onConfirm;

  const RepayModal({
    super.key,
    required this.remainingAmount,
    required this.onConfirm,
  });

  @override
  State<RepayModal> createState() => _RepayModalState();
}

class _RepayModalState extends State<RepayModal> {
  final _amountController = TextEditingController();
  String _method = 'CASH';
  final _noteController = TextEditingController();

  void _setAmount(double amount) {
    setState(() {
      _amountController.text = amount.toStringAsFixed(0);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              "Thu tiền nợ",
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              "Còn lại: ${AppFormatters.formatCurrency(widget.remainingAmount)}",
              style: const TextStyle(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            TextField(
              controller: _amountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "Số tiền thu",
                suffixText: "₫",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _buildShortcutButton("50%", widget.remainingAmount * 0.5),
                const SizedBox(width: 8),
                _buildShortcutButton("100%", widget.remainingAmount),
              ],
            ),
            const SizedBox(height: 24),
            const Text("Hình thức nhận:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _method,
              items: const [
                DropdownMenuItem(value: 'CASH', child: Text("Tiền mặt")),
                DropdownMenuItem(value: 'BANK_TRANSFER', child: Text("Chuyển khoản")),
                DropdownMenuItem(value: 'MOMO', child: Text("Ví Momo")),
              ],
              onChanged: (val) => setState(() => _method = val!),
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 20),
            TextField(
              controller: _noteController,
              decoration: InputDecoration(
                labelText: "Ghi chú",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 32),
            PrimaryButton(
              text: "Xác nhận thu tiền",
              onPressed: () {
                final amount = double.tryParse(_amountController.text) ?? 0;
                if (amount <= 0) return;
                widget.onConfirm(amount, _method, _noteController.text);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildShortcutButton(String label, double amount) {
    return Expanded(
      child: OutlinedButton(
        onPressed: () => _setAmount(amount),
        style: OutlinedButton.styleFrom(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          side: const BorderSide(color: AppColors.slate200),
        ),
        child: Text(label),
      ),
    );
  }
}
