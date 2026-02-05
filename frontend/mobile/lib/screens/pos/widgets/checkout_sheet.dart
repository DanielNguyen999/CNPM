import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';
import '../../../widgets/common/primary_button.dart';

class CheckoutSheet extends StatefulWidget {
  final double totalAmount;
  final Function(String method, double paidAmount, bool isDebt) onConfirm;

  const CheckoutSheet({
    super.key,
    required this.totalAmount,
    required this.onConfirm,
  });

  @override
  State<CheckoutSheet> createState() => _CheckoutSheetState();
}

class _CheckoutSheetState extends State<CheckoutSheet> {
  String _paymentMethod = 'CASH';
  bool _isDebt = false;
  late TextEditingController _paidAmountController;

  @override
  void initState() {
    super.initState();
    _paidAmountController = TextEditingController(text: widget.totalAmount.toStringAsFixed(0));
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Thanh toán",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Tổng tiền:"),
              Text(
                AppFormatters.formatCurrency(widget.totalAmount),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primary),
              ),
            ],
          ),
          const SizedBox(height: 20),
          const Text("Hình thức:", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
          const SizedBox(height: 12),
          Row(
            children: [
              _buildMethodOption('Tiền mặt', 'CASH', Icons.money),
              const SizedBox(width: 12),
              _buildMethodOption('Chuyển khoản', 'BANK_TRANSFER', Icons.account_balance),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("Bán nợ?", style: TextStyle(fontWeight: FontWeight.bold)),
              Switch(
                value: _isDebt,
                onChanged: (val) {
                  setState(() {
                    _isDebt = val;
                    if (_isDebt) {
                      _paidAmountController.text = "0";
                    } else {
                      _paidAmountController.text = widget.totalAmount.toStringAsFixed(0);
                    }
                  });
                },
                activeColor: AppColors.primary,
              ),
            ],
          ),
          if (!_isDebt) ...[
            const SizedBox(height: 16),
            TextField(
              controller: _paidAmountController,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: "Khách trả",
                suffixText: "₫",
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
          const SizedBox(height: 32),
          PrimaryButton(
            text: "Xác nhận tạo đơn",
            onPressed: () {
              final paid = double.tryParse(_paidAmountController.text) ?? 0;
              widget.onConfirm(_paymentMethod, paid, _isDebt);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMethodOption(String label, String value, IconData icon) {
    final isSelected = _paymentMethod == value;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _paymentMethod = value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary.withOpacity(0.1) : Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? AppColors.primary : AppColors.slate200,
            ),
          ),
          child: Column(
            children: [
              Icon(icon, color: isSelected ? AppColors.primary : AppColors.slate400),
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: isSelected ? AppColors.primary : AppColors.textSecondary,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
