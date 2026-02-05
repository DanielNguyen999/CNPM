import '../core/api/api_client.dart';
import '../models/debt.dart';

class DebtService {
  final ApiClient apiClient;

  DebtService(this.apiClient);

  Future<Map<String, dynamic>> listDebts({String? status, int page = 1, int pageSize = 10}) async {
    try {
      final response = await apiClient.dio.get('/debts', queryParameters: {
        if (status != null && status != 'all') 'status': status,
        'page': page,
        'page_size': pageSize,
      });
      
      final List debts = (response.data['items'] as List)
          .map((i) => Debt.fromJson(i))
          .toList();
          
      return {
        'items': debts,
        'total': response.data['total'],
        'total_pages': response.data['total_pages'],
      };
    } catch (e) {
      rethrow;
    }
  }

  Future<Debt> getDebtDetail(int id) async {
    try {
      final response = await apiClient.dio.get('/debts/$id');
      return Debt.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<Debt> repayDebt(int id, {
    required double amount,
    required String method,
    String? reference,
    String? notes,
  }) async {
    try {
      final response = await apiClient.dio.post('/debts/$id/repay', data: {
        'payment_amount': amount,
        'payment_method': method,
        'reference_number': reference,
        'notes': notes,
      });
      return Debt.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
