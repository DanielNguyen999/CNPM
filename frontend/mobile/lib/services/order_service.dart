import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/order.dart';

class OrderService {
  final ApiClient apiClient;

  OrderService(this.apiClient);

  Future<List<Order>> listOrders({String? status, String? search}) async {
    try {
      final response = await apiClient.dio.get('/orders', queryParameters: {
        if (status != null) 'payment_status': status,
        if (search != null) 'search': search,
      });
      final List data = response.data['items'] ?? [];
      return data.map((json) => Order.fromJson(json)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<Order> getOrderDetail(int id) async {
    try {
      final response = await apiClient.dio.get('/orders/$id');
      return Order.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

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
