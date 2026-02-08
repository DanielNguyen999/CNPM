import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/auth/auth_state.dart';
import '../../services/reports_service.dart';
import '../../services/sse_service.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/dashboard/notification_bell.dart';
import '../orders/order_list_screen.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../core/utils/formatters.dart';
import '../admin/admin_dashboard_screen.dart';
import '../customer_portal/customer_home_screen.dart';
import '../../widgets/dashboard/revenue_chart.dart';
import '../../widgets/dashboard/top_products_list.dart';
import '../../widgets/dashboard/recent_activity_list.dart';
import 'package:intl/intl.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double _todayRevenue = 0;
  double _totalDebt = 0;
  int _lowStockCount = 0;
  String? _aiSummary;
  List<dynamic> _revenueData = [];
  List<dynamic> _topProducts = [];
  List<dynamic> _recentActivity = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadStats();
    });
    _setupSSE();
  }

  Future<void> _loadStats() async {
    if (!mounted) return;
    try {
      final reportsService =
          Provider.of<ReportsService>(context, listen: false);

      // Load all data in parallel
      final now = DateTime.now();
      final startDate = now.subtract(const Duration(days: 6));
      final endDate = now;
      final dateFormat = DateFormat('yyyy-MM-dd');

      final results = await Future.wait([
        reportsService.getDashboardStats(),
        reportsService.getRevenueReport(
            dateFormat.format(startDate), dateFormat.format(endDate)),
        reportsService.getTopProducts(),
      ]);

      final stats = results[0] as DashboardStats;
      final revenue = results[1] as List<dynamic>;
      final products = results[2] as List<dynamic>;

      if (mounted) {
        setState(() {
          _todayRevenue = stats.todayRevenue;
          _totalDebt = stats.totalDebtPending;
          _lowStockCount = stats.lowStockCount;
          _aiSummary = stats.aiSummary;
          _revenueData = revenue;
          _topProducts = products;
          _recentActivity = stats.recentActivity ?? [];
        });
      }
    } catch (e) {
      debugPrint("Error loading dashboard stats: $e");
      Fluttertoast.showToast(msg: "Lỗi đồng bộ dữ liệu");
    }
  }

  void _setupSSE() {
    final sseService = Provider.of<SSEService>(context, listen: false);
    sseService.events.listen((event) {
      if (event['type'] == 'ORDER_CREATED' ||
          event['type'] == 'ORDER_UPDATED') {
        _loadStats();
        Fluttertoast.showToast(msg: "Dữ liệu mới đã được cập nhật");
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    try {
      final authState = Provider.of<AuthState>(context);
      final user = authState.user;

      if (user?.role == 'ADMIN') {
        return const AdminDashboardScreen();
      }

      if (user?.role == 'CUSTOMER') {
        return const CustomerHomeScreen();
      }

      final name = user?.fullName ?? "Người dùng";

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
            icon: const Icon(Icons.account_circle_outlined),
            onPressed: () => Navigator.pushNamed(context, '/profile'),
          ),
        ],
        body: RefreshIndicator(
          onRefresh: _loadStats,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildModernHeader(name),
                const SizedBox(height: 20),
                _buildStatsSection(),
                const SizedBox(height: 24),
                if (_aiSummary != null && _aiSummary!.isNotEmpty)
                  _buildAISummary(),
                const SizedBox(height: 24),
                if (_revenueData.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: RevenueChart(data: _revenueData),
                  ),
                  const SizedBox(height: 24),
                ],
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 20),
                  child: Text("QUẢN LÝ CỬA HÀNG",
                      style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w900,
                          color: AppColors.slate400,
                          letterSpacing: 1.5)),
                ),
                const SizedBox(height: 16),
                _buildFullServiceGrid(),
                const SizedBox(height: 24),
                if (_topProducts.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: TopProductsList(data: _topProducts),
                  ),
                  const SizedBox(height: 24),
                ],
                if (_recentActivity.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: RecentActivityList(activities: _recentActivity),
                  ),
                  const SizedBox(height: 24),
                ],
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      );
    } catch (e) {
      return Scaffold(
        body: Center(
          child: Text("Đã xảy ra lỗi: $e"),
        ),
      );
    }
  }

  Widget _buildModernHeader(String name) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
      child: Row(
        children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            child: Text(name.isNotEmpty ? name[0].toUpperCase() : "?",
                style: const TextStyle(
                    color: AppColors.primary, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text("Xin chào,",
                  style:
                      TextStyle(color: AppColors.textSecondary, fontSize: 13)),
              Text(name,
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAISummary() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          colors: [
            AppColors.primary,
            AppColors.primary.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.auto_awesome, color: Colors.white, size: 20),
              SizedBox(width: 8),
              Text(
                "AI TỔNG HỢP",
                style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.2,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            _aiSummary!,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              height: 1.6,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsSection() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          _buildCompactStat("Hôm nay",
              AppFormatters.formatCurrency(_todayRevenue), AppColors.success),
          const SizedBox(width: 12),
          _buildCompactStat("Nợ cần thu",
              AppFormatters.formatCurrency(_totalDebt), AppColors.error),
          const SizedBox(width: 12),
          _buildCompactStat(
              "Sắp hết hàng", "$_lowStockCount SP", AppColors.warning),
        ],
      ),
    );
  }

  Widget _buildCompactStat(String label, String value, Color color) {
    return Container(
      width: 140,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 10, color: color, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text(value,
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w900,
                  color: color,
                  overflow: TextOverflow.ellipsis)),
        ],
      ),
    );
  }

  Widget _buildFullServiceGrid() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 4,
        mainAxisSpacing: 20,
        crossAxisSpacing: 12,
        childAspectRatio: 0.8,
        children: [
          _buildGridItem("Bán hàng", Icons.add_shopping_cart, AppColors.primary,
              AppRoutes.pos),
          _buildGridItem("Kho hàng", Icons.inventory_2_outlined,
              AppColors.success, AppRoutes.inventory),
          _buildGridItem("Khách hàng", Icons.people_alt_outlined,
              AppColors.warning, '/customers'),
          _buildGridItem(
              "Đối tác", Icons.business_outlined, AppColors.info, '/suppliers'),
          _buildGridItem("Công nợ", Icons.account_balance_wallet_outlined,
              AppColors.error, AppRoutes.debts),
          _buildGridItem(
              "Sổ quỹ", Icons.account_balance, Colors.purple, '/cashbook'),
          _buildGridItem(
              "Kiểm kho", Icons.inventory_outlined, Colors.teal, '/adjustment'),
          _buildGridItem(
              "Báo cáo", Icons.analytics_outlined, Colors.indigo, '/reports'),
        ],
      ),
    );
  }

  Widget _buildGridItem(
      String label, IconData icon, Color color, String route) {
    return InkWell(
      onTap: () {
        try {
          Navigator.pushNamed(context, route);
        } catch (e) {
          debugPrint("Navigation error: $e");
        }
      },
      borderRadius: BorderRadius.circular(16),
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withValues(alpha: 0.1)),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppColors.textPrimary),
          ),
        ],
      ),
    );
  }
}
