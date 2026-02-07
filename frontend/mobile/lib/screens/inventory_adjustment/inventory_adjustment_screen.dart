import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/common/app_scaffold.dart';

class InventoryAdjustmentScreen extends StatefulWidget {
  const InventoryAdjustmentScreen({super.key});

  @override
  State<InventoryAdjustmentScreen> createState() =>
      _InventoryAdjustmentScreenState();
}

class _InventoryAdjustmentScreenState extends State<InventoryAdjustmentScreen> {
  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Điều chỉnh kho",
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            color: AppColors.info.withOpacity(0.05),
            child: Row(
              children: const [
                Icon(Icons.info_outline, color: AppColors.info, size: 20),
                SizedBox(width: 12),
                Expanded(
                    child: Text(
                        "Sử dụng tính năng này để cập nhật số lượng tồn kho thực tế của hàng hóa.",
                        style: TextStyle(fontSize: 12, color: AppColors.info))),
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: 5,
              itemBuilder: (context, index) {
                return _buildAdjustmentCard(index);
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        child:
            const Icon(Icons.add_photo_alternate_outlined, color: Colors.white),
      ),
    );
  }

  Widget _buildAdjustmentCard(int index) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text("Phiếu ADJ00$index",
                  style: const TextStyle(fontWeight: FontWeight.bold)),
              const Text("Đã cân bằng",
                  style: TextStyle(
                      fontSize: 10,
                      color: AppColors.success,
                      fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          const Text("Lý do: Kiểm hàng định kỳ tháng 2",
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              Text("Số mặt hàng:",
                  style:
                      TextStyle(fontSize: 13, color: AppColors.textSecondary)),
              Text("12 SP", style: TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }
}
