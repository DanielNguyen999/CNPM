import '../core/api/api_client.dart';

class DashboardStats {
  final double todayRevenue;
  final int todayOrdersCount;
  final double totalDebtPending;
  final int lowStockCount;

  DashboardStats({
    required this.todayRevenue,
    required this.todayOrdersCount,
    required this.totalDebtPending,
    required this.lowStockCount,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      todayRevenue: (json['today_revenue'] ?? 0).toDouble(),
      todayOrdersCount: json['today_orders_count'] ?? 0,
      totalDebtPending: (json['total_debt_pending'] ?? 0).toDouble(),
      lowStockCount: json['low_stock_count'] ?? 0,
    );
  }
}

class ReportsService {
  final ApiClient apiClient;

  ReportsService(this.apiClient);

  Future<DashboardStats> getDashboardStats({String? date}) async {
    final response = await apiClient.dio.get('/reports/dashboard', queryParameters: {
      if (date != null) 'date': date,
    });
    return DashboardStats.fromJson(response.data);
  }
}
