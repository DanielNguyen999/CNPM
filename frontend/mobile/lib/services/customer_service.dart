import '../core/api/api_client.dart';
import '../models/customer.dart';

class CustomerService {
  final ApiClient apiClient;

  CustomerService(this.apiClient);

  Future<Map<String, dynamic>> listCustomers({String? q, int page = 1, int pageSize = 10}) async {
    try {
      final response = await apiClient.dio.get('/customers', queryParameters: {
        if (q != null) 'q': q,
        'page': page,
        'page_size': pageSize,
      });
      
      final List customers = (response.data['items'] as List)
          .map((i) => Customer.fromJson(i))
          .toList();
          
      return {
        'items': customers,
        'total': response.data['total'],
        'total_pages': response.data['total_pages'],
      };
    } catch (e) {
      rethrow;
    }
  }
}
