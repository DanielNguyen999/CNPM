import '../core/api/api_client.dart';
import '../models/dashboard_stats.dart';
export '../models/dashboard_stats.dart';

class ReportsService {
  final ApiClient apiClient;

  ReportsService(this.apiClient);

  Future<DashboardStats> getDashboardStats({String? date}) async {
    final response =
        await apiClient.dio.get('/reports/dashboard', queryParameters: {
      if (date != null) 'date': date.split('T')[0],
    });
    return DashboardStats.fromJson(response.data);
  }

  Future<List<dynamic>> getRevenueReport(
      String startDate, String endDate) async {
    try {
      final response = await apiClient.dio.get('/reports/revenue',
          queryParameters: {'start_date': startDate, 'end_date': endDate});
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> getTopProducts({int limit = 5}) async {
    try {
      final response = await apiClient.dio
          .get('/reports/top-products', queryParameters: {'limit': limit});
      return response.data;
    } catch (e) {
      rethrow;
    }
  }
}
