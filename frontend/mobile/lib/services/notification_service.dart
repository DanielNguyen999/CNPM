import '../core/api/api_client.dart';
import '../models/notification.dart';

class NotificationService {
  final ApiClient apiClient;

  NotificationService(this.apiClient);

  Future<List<NotificationModel>> getNotifications() async {
    try {
      final response = await apiClient.dio.get('/notifications');
      final List<dynamic> data = response.data;
      return data.map((json) => NotificationModel.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      await apiClient.dio.post('/notifications/$notificationId/read');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await apiClient.dio.post('/notifications/read-all');
    } catch (e) {
      rethrow;
    }
  }
}
