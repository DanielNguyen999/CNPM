import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/order_service.dart';
import '../../models/order.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/badges/status_badge.dart';
import '../../widgets/pos/thermal_receipt_view.dart';

class OrderDetailScreen extends StatefulWidget {
  final int orderId;

  const OrderDetailScreen({super.key, required this.orderId});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  Order? _order;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    try {
      final orderService = Provider.of<OrderService>(context, listen: false);
      final detail = await orderService.getOrderDetail(widget.orderId);
      setState(() => _order = detail);
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Chi tiết đơn hàng",
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _order == null
              ? const Center(child: Text("Không tìm thấy đơn hàng"))
              : Column(
                  children: [
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildInfoSection(),
                            const SizedBox(height: 24),
                            const Text("Sản phẩm đã mua",
                                style: TextStyle(
                                    fontSize: 16, fontWeight: FontWeight.bold)),
                            const SizedBox(height: 12),
                            _buildItemsList(),
                            const SizedBox(height: 24),
                            _buildPriceSummary(),
                          ],
                        ),
                      ),
                    ),
                    _buildBottomAction(),
                  ],
                ),
    );
  }

  Widget _buildInfoSection() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.slate50,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(_order!.orderCode,
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, fontSize: 18)),
              StatusBadge(
                  status: _order!.paymentStatus, label: _order!.paymentStatus),
            ],
          ),
          const SizedBox(height: 12),
          _buildInfoRow(Icons.calendar_today_outlined, "Thời gian:",
              AppFormatters.formatDateTime(_order!.createdAt)),
          _buildInfoRow(Icons.person_outline, "Khách hàng:", "Khách lẻ"),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 14, color: AppColors.textSecondary),
          const SizedBox(width: 8),
          Text(label,
              style: const TextStyle(
                  fontSize: 12, color: AppColors.textSecondary)),
          const Spacer(),
          Text(value,
              style:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildItemsList() {
    if (_order!.items == null || _order!.items!.isEmpty) {
      return const Text("Không có sản phẩm");
    }
    return Column(
      children: _order!.items!
          .map((item) => Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: const BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: AppColors.slate100))),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(item.productName ?? 'SP',
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold)),
                          Text(
                              "${item.quantity} x ${AppFormatters.formatCurrency(item.unitPrice)}",
                              style: const TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                        ],
                      ),
                    ),
                    Text(AppFormatters.formatCurrency(item.lineTotal),
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                  ],
                ),
              ))
          .toList(),
    );
  }

  Widget _buildPriceSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.slate100),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          _buildSummaryRow("Tổng tiền hàng",
              AppFormatters.formatCurrency(_order!.totalAmount)),
          const Divider(height: 24),
          _buildSummaryRow(
              "Khách đã trả", AppFormatters.formatCurrency(_order!.paidAmount),
              isBold: true),
          _buildSummaryRow(
              "Còn nợ",
              AppFormatters.formatCurrency(
                  _order!.totalAmount - _order!.paidAmount),
              color: AppColors.error),
        ],
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value,
      {bool isBold = false, Color? color}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: const TextStyle(
                  fontSize: 13, color: AppColors.textSecondary)),
          Text(value,
              style: TextStyle(
                fontSize: 14,
                fontWeight: isBold ? FontWeight.w900 : FontWeight.bold,
                color: color ?? AppColors.textPrimary,
              )),
        ],
      ),
    );
  }

  Widget _buildBottomAction() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, -4))
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                icon: const Icon(Icons.print_outlined),
                label: const Text("IN HÓA ĐƠN",
                    style: TextStyle(fontWeight: FontWeight.bold)),
                onPressed: () => _showPrintPreview(),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: AppColors.primary),
                  foregroundColor: AppColors.primary,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showPrintPreview() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.8,
        builder: (_, controller) => Container(
          decoration: const BoxDecoration(
              color: AppColors.slate100,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: AppColors.slate300,
                      borderRadius: BorderRadius.circular(2))),
              const Padding(
                  padding: EdgeInsets.all(20),
                  child: Text("In lại hóa đơn",
                      style: TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold))),
              Expanded(
                child: SingleChildScrollView(
                  controller: controller,
                  child: Center(
                      child: Card(
                          elevation: 8,
                          child:
                              ThermalReceiptView(orderData: _order!.toJson()))),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
