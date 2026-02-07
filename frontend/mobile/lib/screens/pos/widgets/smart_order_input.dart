import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../../core/constants/app_colors.dart';
import '../../../widgets/common/primary_button.dart';

class SmartOrderInput extends StatefulWidget {
  final Future<void> Function(String command) onProcess;

  const SmartOrderInput({super.key, required this.onProcess});

  @override
  State<SmartOrderInput> createState() => _SmartOrderInputState();
}

class _SmartOrderInputState extends State<SmartOrderInput> {
  final _inputController = TextEditingController();
  bool _isProcessing = false;

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  void _handleSubmit() async {
    if (_inputController.text.trim().isEmpty) return;

    setState(() => _isProcessing = true);
    try {
      await widget.onProcess(_inputController.text.trim());
      if (mounted) {
        setState(() {
          _isProcessing = false;
          _inputController.clear();
        });
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) setState(() => _isProcessing = false);
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
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppColors.primary.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.auto_awesome,
                    color: AppColors.primary, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                "Trợ lý AI Bán hàng",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const SizedBox(height: 8),
          const Text(
            "Nhập nhanh nhu cầu khách hàng (vd: '5 bia 3 nước ngọt')",
            style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
          ),
          const SizedBox(height: 20),
          TextField(
            controller: _inputController,
            autofocus: true,
            maxLines: 3,
            minLines: 1,
            style: const TextStyle(fontSize: 16),
            decoration: InputDecoration(
              hintText: "Gõ lệnh tại đây...",
              filled: true,
              fillColor: AppColors.slate50,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
          const SizedBox(height: 20),
          PrimaryButton(
            text: _isProcessing ? "Đang xử lý..." : "Xác nhận AI",
            onPressed: _isProcessing ? null : _handleSubmit,
          ),
          const SizedBox(height: 8),
          Center(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text("Hủy bỏ",
                  style: TextStyle(color: AppColors.textSecondary)),
            ),
          ),
        ],
      ),
    ).animate().slideY(begin: 1.0, curve: Curves.easeOutQuad);
  }
}
