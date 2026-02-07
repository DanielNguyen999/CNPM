import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../../services/order_service.dart';
import '../../models/order.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/common/loading_skeleton.dart';
import '../../widgets/common/empty_state.dart';
import '../../widgets/badges/status_badge.dart';
import 'order_detail_screen.dart';

class OrderListScreen extends StatefulWidget {
  const OrderListScreen({super.key});

  @override
  State<OrderListScreen> createState() => _OrderListScreenState();
}

class _OrderListScreenState extends State<OrderListScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;
  String _filterStatus = 'ALL';
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final orderService = Provider.of<OrderService>(context, listen: false);
      // Giả sử API listOrders có tham số status và search
      final results = await orderService.listOrders(
        status: _filterStatus == 'ALL' ? null : _filterStatus,
        search: _searchController.text.isEmpty ? null : _searchController.text,
      );
      if (mounted) setState(() => _orders = results);
    } catch (e) {
      debugPrint("Error loading orders: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _loadOrders();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Lịch sử đơn hàng",
      body: Column(
        children: [
          // Filter & Search Bar
          _buildFilterHeader(),

          Expanded(
            child: _isLoading
                ? const LoadingListSkeleton()
                : RefreshIndicator(
                    onRefresh: _loadOrders,
                    child: _orders.isEmpty
                        ? const EmptyState(message: "Chưa có đơn hàng nào")
                        : ListView.builder(
                            itemCount: _orders.length,
                            padding: const EdgeInsets.all(16),
                            itemBuilder: (context, index) {
                              final order = _orders[index];
                              return _buildOrderCard(order);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterHeader() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
      color: Colors.white,
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            decoration: InputDecoration(
              hintText: "Tìm mã đơn, tên khách...",
              prefixIcon: const Icon(Icons.search, size: 20),
              filled: true,
              fillColor: AppColors.slate50,
              contentPadding: const EdgeInsets.symmetric(vertical: 0),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _filterChip("Tất cả", "ALL"),
                _filterChip("Đã trả", "PAID"),
                _filterChip("Còn nợ", "PARTIAL"),
                _filterChip("Chưa trả", "UNPAID"),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _filterChip(String label, String value) {
    final isSelected = _filterStatus == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        label: Text(label),
        selected: isSelected,
        onSelected: (val) {
          setState(() => _filterStatus = value);
          _loadOrders();
        },
        selectedColor: AppColors.primary.withOpacity(0.2),
        checkmarkColor: AppColors.primary,
        labelStyle: TextStyle(
          color: isSelected ? AppColors.primary : AppColors.textSecondary,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          fontSize: 12,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        side: BorderSide(
            color: isSelected ? AppColors.primary : AppColors.slate200),
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate100),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(
              builder: (_) => OrderDetailScreen(orderId: order.id)),
        ),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        order.orderCode,
                        style: const TextStyle(
                            fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      Text(
                        AppFormatters.formatDateTime(order.createdAt),
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  StatusBadge(
                      status: order.paymentStatus,
                      label: _getStatusLabel(order.paymentStatus)),
                ],
              ),
              const Divider(height: 24, color: AppColors.slate50),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text("Tổng thanh toán",
                      style: TextStyle(
                          fontSize: 13, color: AppColors.textSecondary)),
                  Text(
                    AppFormatters.formatCurrency(order.totalAmount),
                    style: const TextStyle(
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        fontSize: 16),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'PAID':
        return 'Đã thanh toán';
      case 'PARTIAL':
        return 'Ghi nợ/Một phần';
      case 'UNPAID':
        return 'Chưa thanh toán';
      default:
        return 'Khác';
    }
  }
}
