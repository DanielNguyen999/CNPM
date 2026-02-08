import '../core/api/api_client.dart';

class InventoryService {
  final ApiClient apiClient;

  InventoryService(this.apiClient);

  Future<List<dynamic>> listMovements(
      {int skip = 0, int limit = 20, int? productId}) async {
    try {
      final path = productId != null
          ? '/inventory/$productId/movements'
          : '/inventory/movements';

      final response = await apiClient.dio.get(path, queryParameters: {
        'skip': skip,
        'limit': limit,
      });

      return response.data;
    } catch (e) {
      rethrow;
    }
  }

  Future<void> adjustStock({
    required int productId,
    required double quantityChange,
    required String reason,
    String? notes,
  }) async {
    try {
      await apiClient.dio.post('/inventory/$productId/adjust', data: {
        'quantity_change': quantityChange,
        'reason': reason,
        'notes': notes,
      });
    } catch (e) {
      rethrow;
    }
  }
}
