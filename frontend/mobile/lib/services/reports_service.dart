import '../core/api/api_client.dart';
import '../models/dashboard_stats.dart';
export '../models/dashboard_stats.dart';

class ReportsService {
  final ApiClient apiClient;

  ReportsService(this.apiClient);

  Future<DashboardStats> getDashboardStats({String? date}) async {
    final response =
        await apiClient.dio.get('/reports/dashboard', queryParameters: {
      if (date != null) 'date': date,
    });
    return DashboardStats.fromJson(response.data);
  }
}
