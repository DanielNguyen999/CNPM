class DashboardStats {
  final double totalRevenue;
  final int totalOrdersCount;
  final double totalDebtPending;
  final int lowStockCount;
  final double todayRevenue;

  DashboardStats({
    required this.totalRevenue,
    required this.totalOrdersCount,
    required this.totalDebtPending,
    required this.lowStockCount,
    this.todayRevenue = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalRevenue: (json['total_revenue'] ?? 0).toDouble(),
      totalOrdersCount: json['total_orders_count'] ?? 0,
      totalDebtPending: (json['total_debt_pending'] ?? 0).toDouble(),
      lowStockCount: json['low_stock_count'] ?? 0,
      todayRevenue: (json['today_revenue'] ?? 0).toDouble(),
    );
  }
}
