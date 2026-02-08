import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/reports_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  bool _isLoading = true;
  DashboardStats? _data;
  List<dynamic> _revenueData = [];
  List<dynamic> _topProducts = [];
  String _timeRange = 'today';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final reportsService =
          Provider.of<ReportsService>(context, listen: false);

      // Load Dashboard Stats
      final stats = await reportsService.getDashboardStats();

      // Load Revenue Report based on range
      DateTime end = DateTime.now();
      DateTime start;
      if (_timeRange == 'week') {
        start = end.subtract(const Duration(days: 7));
      } else if (_timeRange == 'month') {
        start = DateTime(end.year, end.month, 1);
      } else {
        start = end;
      }

      final revenue = await reportsService.getRevenueReport(
        start.toIso8601String().split('T')[0],
        end.toIso8601String().split('T')[0],
      );

      // Load Top Products
      final top = await reportsService.getTopProducts(limit: 5);

      if (mounted) {
        setState(() {
          _data = stats;
          _revenueData = revenue;
          _topProducts = top;
        });
      }
    } catch (e) {
      debugPrint("Error loading stats: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onRangeChanged(String value) {
    if (_timeRange == value) return;
    setState(() => _timeRange = value);
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Báo cáo doanh thu",
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                physics: const AlwaysScrollableScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildTimeFilter(),
                    const SizedBox(height: 24),
                    _buildMainStats(),
                    const SizedBox(height: 32),
                    const Text("Hiệu suất bán hàng",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildRevenueChart(),
                    const SizedBox(height: 32),
                    const Text("Sản phẩm bán chạy",
                        style: TextStyle(
                            fontSize: 18, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildTopProducts(),
                    const SizedBox(height: 32),
                    _buildSecondaryStats(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildTimeFilter() {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: AppColors.slate100,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          _filterBtn("Hôm nay", 'today'),
          _filterBtn("7 ngày", 'week'),
          _filterBtn("Tháng này", 'month'),
        ],
      ),
    );
  }

  Widget _filterBtn(String label, String value) {
    final isSelected = _timeRange == value;
    return Expanded(
      child: InkWell(
        onTap: () => _onRangeChanged(value),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.transparent,
            borderRadius: BorderRadius.circular(10),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 4)
                  ]
                : null,
          ),
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              color: isSelected ? AppColors.primary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMainStats() {
    final revenue = _data?.todayRevenue ?? 0.0;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.2),
              blurRadius: 15,
              offset: const Offset(0, 8))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text("TỔNG DOANH THU",
              style: TextStyle(
                  color: Colors.white70,
                  fontSize: 12,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(
            AppFormatters.formatCurrency(revenue),
            style: const TextStyle(
                color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              const Icon(Icons.trending_up, color: AppColors.success, size: 20),
              const SizedBox(width: 4),
              Text("+12% so với kỳ trước",
                  style: TextStyle(
                      color: Colors.white.withValues(alpha: 0.8),
                      fontSize: 12)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueChart() {
    if (_revenueData.isEmpty) {
      return Container(
        height: 200,
        alignment: Alignment.center,
        child: const Text("Chưa có dữ liệu doanh thu",
            style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    // Find max revenue for scaling
    double maxRev = 1.0;
    for (var d in _revenueData) {
      double rev = (d['revenue'] as num?)?.toDouble() ?? 0.0;
      if (rev > maxRev) maxRev = rev;
    }

    return Container(
      height: 220,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.slate100),
      ),
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _revenueData.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final item = _revenueData[index];
          final revenue = (item['revenue'] as num?)?.toDouble() ?? 0.0;
          final dateStr = item['date'] as String;
          // Shorten date (e.g., 2024-05-20 -> 20/05)
          final shortDate =
              dateStr.split('-').reversed.take(2).toList().reversed.join('/');

          return _chartBar(shortDate, revenue / maxRev, revenue);
        },
      ),
    );
  }

  Widget _chartBar(String label, double heightFactor, double revenue) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        if (revenue > 0)
          Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text(
              AppFormatters.formatCurrency(revenue).replaceAll('₫', ''),
              style: const TextStyle(
                  fontSize: 8,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primary),
            ),
          ),
        Container(
          width: 32,
          height: 120 * heightFactor.clamp(0.05, 1.0),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                AppColors.primary.withValues(alpha: 0.6),
                AppColors.primary
              ],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
        const SizedBox(height: 8),
        Text(label,
            style:
                const TextStyle(fontSize: 10, color: AppColors.textSecondary)),
      ],
    );
  }

  Widget _buildSecondaryStats() {
    return Row(
      children: [
        _miniStatCard("Đơn hàng", "${_data?.todayOrders ?? 0}",
            Icons.shopping_bag_outlined, Colors.orange),
        const SizedBox(width: 16),
        _miniStatCard(
            "Cần thu nợ",
            AppFormatters.formatCurrency(_data?.totalDebtPending ?? 0),
            Icons.account_balance_wallet_outlined,
            Colors.purple),
      ],
    );
  }

  Widget _buildTopProducts() {
    if (_topProducts.isEmpty) {
      return Container(
        height: 100,
        alignment: Alignment.center,
        child: const Text("Chưa có dữ liệu sản phẩm",
            style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return Column(
      children: _topProducts.map((p) {
        final revenue = (p['total_revenue'] as num?)?.toDouble() ?? 0.0;
        final sold = (p['total_sold'] as num?)?.toDouble() ?? 0.0;
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.slate100),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['name'] ?? '',
                        style: const TextStyle(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 4),
                    Text("Đã bán: ${sold.toInt()}",
                        style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
              Text(
                AppFormatters.formatCurrency(revenue),
                style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _miniStatCard(String title, String value, IconData icon, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.slate100),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 16),
            ),
            const SizedBox(height: 12),
            Text(value,
                style:
                    const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                overflow: TextOverflow.ellipsis),
            Text(title,
                style: const TextStyle(
                    fontSize: 11, color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
