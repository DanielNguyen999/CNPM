import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/order.dart';

class OrderService {
  final ApiClient apiClient;

  OrderService(this.apiClient);

  Future<Order> createOrder(Map<String, dynamic> payload,
      {String? idempotencyKey}) async {
    try {
      final options = Options(
        headers: idempotencyKey != null
            ? {'X-Idempotency-Key': idempotencyKey}
            : null,
      );
      final response = await apiClient.dio.post(
        '/orders',
        data: payload,
        options: options,
      );
      return Order.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<DraftOrder> createDraftOrder(String text) async {
    try {
      final response = await apiClient.dio.post(
        '/orders/draft',
        data: {'text': text},
      );
      return DraftOrder.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
