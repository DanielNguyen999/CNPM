import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/product_service.dart';
import '../../models/product.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/common/loading_skeleton.dart';
import '../../widgets/common/empty_state.dart';

class InventoryScreen extends StatefulWidget {
  const InventoryScreen({super.key});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen> {
  final _searchController = TextEditingController();
  List<Product> _products = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadProducts('');
  }

  Future<void> _loadProducts(String query) async {
    setState(() => _isLoading = true);
    try {
      final productService =
          Provider.of<ProductService>(context, listen: false);
      final results = await productService.listProducts(
          search: query.isEmpty ? null : query);
      setState(() => _products = results);
    } catch (e) {
      // Error
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Kiểm kho nhanh",
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: "Tìm sản phẩm...",
                prefixIcon: const Icon(Icons.search),
                filled: true,
                fillColor: Colors.white,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.slate200),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.slate200),
                ),
              ),
              onChanged: (val) => _loadProducts(val),
            ),
          ),
          Expanded(
            child: _isLoading
                ? const LoadingListSkeleton()
                : _products.isEmpty
                    ? const EmptyState(message: "Không tìm thấy sản phẩm")
                    : ListView.separated(
                        itemCount: _products.length,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final product = _products[index];
                          final isLowStock =
                              product.availableQuantity != null &&
                                  product.availableQuantity! < 10;

                          return ListTile(
                            contentPadding:
                                const EdgeInsets.symmetric(vertical: 8),
                            title: Text(
                              product.name,
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            subtitle: Row(
                              children: [
                                Text(
                                  "Mã: ${product.productCode}",
                                  style: const TextStyle(fontSize: 12),
                                ),
                                const SizedBox(width: 8),
                                if (isLowStock)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.error.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: const Text(
                                      "Sắp hết",
                                      style: TextStyle(
                                          color: AppColors.error,
                                          fontSize: 10,
                                          fontWeight: FontWeight.bold),
                                    ),
                                  ),
                              ],
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  "${product.availableQuantity ?? 0}",
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                    color: isLowStock
                                        ? AppColors.error
                                        : AppColors.textPrimary,
                                  ),
                                ),
                                const Text("Tồn",
                                    style: TextStyle(
                                        fontSize: 10,
                                        color: AppColors.textSecondary)),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
