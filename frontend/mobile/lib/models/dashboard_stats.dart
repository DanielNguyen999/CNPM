class DashboardStats {
  final double todayRevenue;
  final int todayOrders;
  final double totalDebtPending;
  final int lowStockCount;
  final int newCustomers;
  final String? aiSummary;
  final List<dynamic>? recentActivity;

  DashboardStats({
    required this.todayRevenue,
    required this.todayOrders,
    required this.totalDebtPending,
    required this.lowStockCount,
    this.newCustomers = 0,
    this.aiSummary,
    this.recentActivity,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      todayRevenue: _parseDouble(json['today_revenue']),
      todayOrders:
          _parseInt(json['today_orders'] ?? json['today_orders_count']),
      totalDebtPending: _parseDouble(json['total_debt_pending']),
      lowStockCount: _parseInt(json['low_stock_count']),
      newCustomers: _parseInt(json['new_customers']),
      aiSummary: json['ai_summary'],
      recentActivity: json['recent_activity'],
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}
