import 'package:flutter/material.dart';
import 'dart:async';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/auth/auth_state.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../core/utils/formatters.dart';
import '../../services/reports_service.dart';
import '../../services/sse_service.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/dashboard/notification_bell.dart';
import '../orders/order_list_screen.dart';
import '../customers/customer_list_screen.dart';
import '../reports/reports_screen.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double _todayRevenue = 0;
  int _todayOrdersCount = 0;
  double _totalDebt = 0;
  int _lowStockCount = 0;
  StreamSubscription? _sseSubscription;

  @override
  void initState() {
    super.initState();
    _loadStats();

    // Setup SSE listener
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final sseService = Provider.of<SSEService>(context, listen: false);
      _sseSubscription = sseService.events.listen((event) {
        final type = event['type'];
        final payload = event['payload'];

        if (type == 'ORDER_CREATED') {
          Fluttertoast.showToast(
            msg:
                "Đơn hàng mới: ${payload['order_code']} - ${AppFormatters.formatCurrency(payload['total_amount'])}",
            backgroundColor: AppColors.primary,
            textColor: Colors.white,
            gravity: ToastGravity.TOP,
          );
          _loadStats();
        } else if (type == 'DEBT_REPAID') {
          Fluttertoast.showToast(
            msg:
                "Thanh toán công nợ: ${AppFormatters.formatCurrency(payload['payment_amount'])}",
            backgroundColor: AppColors.success,
            textColor: Colors.white,
            gravity: ToastGravity.TOP,
          );
          _loadStats();
        }
      });
    });
  }

  @override
  void dispose() {
    _sseSubscription?.cancel();
    super.dispose();
  }

  Future<void> _loadStats() async {
    try {
      final reportsService =
          Provider.of<ReportsService>(context, listen: false);
      final stats = await reportsService.getDashboardStats();

      setState(() {
        _todayRevenue = stats.todayRevenue;
        _todayOrdersCount = stats.todayOrdersCount;
        _totalDebt = stats.totalDebtPending;
        _lowStockCount = stats.lowStockCount;
      });
    } catch (e) {
      // Silent error or toast
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context);
    final user = authState.user;

    return AppScaffold(
      title: "BizFlow",
      showBackButton: false,
      actions: [
        IconButton(
          icon: const Icon(Icons.bar_chart_outlined),
          onPressed: () => Navigator.pushNamed(context, '/reports'),
        ),
        IconButton(
          icon: const Icon(Icons.history),
          onPressed: () => Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const OrderListScreen()),
          ),
        ),
        const NotificationBell(),
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: () => authState.logout(),
        ),
      ],
      body: RefreshIndicator(
        onRefresh: _loadStats,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Xin chào, ${user?.fullName ?? 'Người dùng'}",
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
              ),
              const Text(
                "Tổng quan hôm nay",
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 24),

              // Revenue Card
              _buildStatCard(
                "Doanh thu hôm nay",
                AppFormatters.formatCurrency(_todayRevenue),
                Icons.trending_up,
                AppColors.primary,
              ),
              const SizedBox(height: 16),

              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      "Số đơn hàng",
                      _todayOrdersCount.toString(),
                      Icons.shopping_bag_outlined,
                      AppColors.info,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildStatCard(
                      "Cần nhập kho",
                      _lowStockCount.toString(),
                      Icons.warning_amber_rounded,
                      AppColors.warning,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildStatCard(
                "Tổng nợ khách hàng",
                AppFormatters.formatCurrency(_totalDebt),
                Icons.account_balance_wallet_outlined,
                AppColors.error,
              ),

              const SizedBox(height: 40),
              const Text(
                "Thao tác nhanh",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),

              GridView.count(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisCount: 4,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                children: [
                  _buildActionButton(
                    context,
                    "Bán hàng",
                    Icons.add_shopping_cart,
                    AppColors.primary,
                    AppRoutes.pos,
                  ),
                  _buildActionButton(
                    context,
                    "Kiểm kho",
                    Icons.inventory_2_outlined,
                    AppColors.info,
                    AppRoutes.inventory,
                  ),
                  _buildActionButton(
                    context,
                    "Thu nợ",
                    Icons.payments_outlined,
                    AppColors.success,
                    AppRoutes.debts,
                  ),
                  _buildActionButton(
                    context,
                    "Khách hàng",
                    Icons.people_alt_outlined,
                    AppColors.warning,
                    '/customers', // Sẽ định nghĩa trong app.dart sau
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    String route,
  ) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.2)),
            ),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
