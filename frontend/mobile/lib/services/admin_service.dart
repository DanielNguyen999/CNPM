import '../core/api/api_client.dart';

class AdminService {
  final ApiClient apiClient;

  AdminService(this.apiClient);

  Future<Map<String, dynamic>> getDashboardStats() async {
    try {
      final response = await apiClient.dio.get('/admin/dashboard-stats');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> listOwners() async {
    try {
      final response = await apiClient.dio.get('/admin/owners');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> updateOwnerStatus(int id, bool isActive) async {
    try {
      await apiClient.dio.patch('/admin/owners/$id/status', data: {
        'is_active': isActive,
      });
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> listPlans() async {
    try {
      final response = await apiClient.dio.get('/admin/plans');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<dynamic>> listPasswordRequests() async {
    try {
      final response = await apiClient.dio.get('/admin/password-requests');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<Map<String, dynamic>> approvePasswordRequest(int id) async {
    try {
      final response =
          await apiClient.dio.post('/admin/password-requests/$id/approve');
      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> rejectPasswordRequest(int id) async {
    try {
      await apiClient.dio.post('/admin/password-requests/$id/reject');
    } catch (e) {
      rethrow;
    }
  }

  Future<void> publishAnnouncement(String title, String message) async {
    try {
      await apiClient.dio.post('/admin/announcements', data: {
        'title': title,
        'message': message,
      });
    } catch (e) {
      rethrow;
    }
  }
}
