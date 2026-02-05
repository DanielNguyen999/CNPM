import '../core/api/api_client.dart';
import '../models/product.dart';

class ProductService {
  final ApiClient apiClient;

  ProductService(this.apiClient);

  Future<List<Product>> listProducts({String? search, int limit = 100, int skip = 0}) async {
    try {
      final response = await apiClient.dio.get('/products', queryParameters: {
        if (search != null) 'search': search,
        'limit': limit,
        'skip': skip,
      });
      
      return (response.data as List).map((i) => Product.fromJson(i)).toList();
    } catch (e) {
      rethrow;
    }
  }
}
