import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';

class ThermalReceiptView extends StatelessWidget {
  final Map<String, dynamic> orderData;

  const ThermalReceiptView({super.key, required this.orderData});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 300, // Roughly 80mm
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            "CỬA HÀNG BIZFLOW",
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 18),
            textAlign: TextAlign.center,
          ),
          const Text(
            "Hệ thống quản lý bán hàng\nHotline: 1900 xxxx",
            style: TextStyle(fontSize: 10, color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          const Text(
            "HÓA ĐƠN BÁN HÀNG",
            style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
          ),
          Text(
            "Số: ${orderData['order_code'] ?? 'TEMP'}",
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          ),
          Text(
            "Ngày: ${DateFormat('dd/MM/yyyy HH:mm').format(DateTime.now())}",
            style:
                const TextStyle(fontSize: 10, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 16),

          // Customer Info
          _buildInfoRow("Khách:"),

          const SizedBox(height: 8),
          const Divider(thickness: 1, color: Colors.black, height: 1),
          const SizedBox(height: 4),
          Row(
            children: const [
              Expanded(
                  flex: 3,
                  child: Text("SP",
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 10))),
              Expanded(
                  flex: 1,
                  child: Text("SL",
                      textAlign: TextAlign.center,
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 10))),
              Expanded(
                  flex: 2,
                  child: Text("T.Tiền",
                      textAlign: TextAlign.right,
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 10))),
            ],
          ),
          const SizedBox(height: 4),
          const Divider(thickness: 1, color: Colors.black, height: 1),
          const SizedBox(height: 4),

          // Items
          ...((orderData['items'] as List).map((item) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Text(
                        item['product_name']?.toUpperCase() ?? "SẢN PHẨM",
                        style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                    Expanded(
                      flex: 1,
                      child: Text(
                        "${item['quantity']}",
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 11),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Text(
                        AppFormatters.formatCurrency(
                            item['unit_price'] * item['quantity']),
                        textAlign: TextAlign.right,
                        style: const TextStyle(
                            fontSize: 11, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ))),

          const SizedBox(height: 12),
          const Divider(thickness: 1, color: Colors.black, height: 1),
          const SizedBox(height: 8),

          _buildSummaryRow("TỔNG TIỀN HÀNG:",
              AppFormatters.formatCurrency(orderData['total_amount'])),
          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text("THANH TOÁN:",
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
              Text(
                "${AppFormatters.formatCurrency(orderData['total_amount'])} đ",
                style:
                    const TextStyle(fontWeight: FontWeight.w900, fontSize: 16),
              ),
            ],
          ),

          const SizedBox(height: 24),
          const Text(
            "Cảm ơn quý khách & Hẹn gặp lại!",
            style: TextStyle(
                fontStyle: FontStyle.italic,
                fontWeight: FontWeight.bold,
                fontSize: 12),
          ),
          const Text(
            "WWW.BIZFLOW.VN",
            style: TextStyle(
                fontSize: 10, letterSpacing: 2, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style:
                  const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
          const Text("KHÁCH LẺ",
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String val) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
        Text(val,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
