import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/auth/auth_state.dart';
import 'widgets/product_search_sheet.dart';
import 'widgets/cart_list.dart';
import 'widgets/checkout_sheet.dart';
import '../../models/product.dart';
import '../../models/customer.dart';
import '../../services/order_service.dart';
import '../../services/customer_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';

class QuickOrderScreen extends StatefulWidget {
  const QuickOrderScreen({super.key});

  @override
  State<QuickOrderScreen> createState() => _QuickOrderScreenState();
}

class _QuickOrderScreenState extends State<QuickOrderScreen> {
  final List<CartItem> _cartItems = [];
  Customer? _selectedCustomer;
  bool _isCreating = false;

  double get _totalAmount {
    return _cartItems.fold(0, (sum, item) => sum + item.total);
  }

  void _addProduct(Product product) {
    if (product.units == null || product.units!.isEmpty) {
      Fluttertoast.showToast(msg: "Sản phẩm chưa có đơn vị tính");
      return;
    }
    setState(() {
      final existingIndex =
          _cartItems.indexWhere((item) => item.product.id == product.id);
      if (existingIndex >= 0) {
        _cartItems[existingIndex].quantity += 1;
      } else {
        _cartItems.add(CartItem(
          product: product,
          quantity: 1,
          price: product.price,
          unitId: product.units!.first.id,
        ));
      }
    });
  }

  void _showProductSearch() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => ProductSearchSheet(onProductSelected: _addProduct),
    );
  }

  void _showCustomerSearch() async {
    // Basic customer selection logic
    final customerService =
        Provider.of<CustomerService>(context, listen: false);
    final response = await customerService.listCustomers();
    final List<Customer> customers = response['items'];

    if (!mounted) return;

    showModalBottomSheet(
      context: context,
      builder: (_) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            const Text("Chọn khách hàng",
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 20),
            Expanded(
              child: ListView.builder(
                itemCount: customers.length,
                itemBuilder: (context, index) {
                  final c = customers[index];
                  return ListTile(
                    title: Text(c.fullName),
                    subtitle: Text(c.phone ?? ''),
                    onTap: () {
                      setState(() => _selectedCustomer = c);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleCheckout(String method, double paid, bool isDebt) async {
    if (_cartItems.isEmpty) return;
    if (isDebt && _selectedCustomer == null) {
      Fluttertoast.showToast(msg: "Vui lòng chọn khách hàng để bán nợ");
      return;
    }

    setState(() => _isCreating = true);
    try {
      final orderService = Provider.of<OrderService>(context, listen: false);
      final authState = Provider.of<AuthState>(context, listen: false);

      // Generate idempotency key
      final idempotencyKey =
          "ord_${DateTime.now().millisecondsSinceEpoch}_${authState.userId}";

      final payload = {
        'customer_id': _selectedCustomer?.id,
        'items': _cartItems
            .map((item) => {
                  'product_id': item.product.id,
                  'unit_id': item.unitId,
                  'quantity': item.quantity,
                  'unit_price': item.price,
                })
            .toList(),
        'paid_amount': paid,
        'payment_method': method,
        'tax_rate': 0,
        'discount_amount': 0,
        'notes': 'Mobile POS order',
      };

      await orderService.createOrder(payload, idempotencyKey: idempotencyKey);

      Fluttertoast.showToast(msg: "Tạo đơn thành công!");
      if (mounted) Navigator.pop(context); // Back to Dashboard
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi: $e");
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Bán hàng nhanh",
      actions: [
        IconButton(
          icon: const Icon(Icons.person_add_alt),
          onPressed: _showCustomerSearch,
          color: _selectedCustomer != null ? AppColors.primary : null,
        ),
      ],
      body: Column(
        children: [
          // Customer selection display
          if (_selectedCustomer != null)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
              color: AppColors.primary.withOpacity(0.05),
              child: Row(
                children: [
                  const Icon(Icons.person, size: 16, color: AppColors.primary),
                  const SizedBox(width: 8),
                  Text(
                    "Khách hàng: ${_selectedCustomer!.fullName}",
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, color: AppColors.primary),
                  ),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.close, size: 16),
                    onPressed: () => setState(() => _selectedCustomer = null),
                  ),
                ],
              ),
            ),

          Expanded(
            child: CartList(
              items: _cartItems,
              onQuantityChanged: (idx, delta) {
                setState(() => _cartItems[idx].quantity += delta);
              },
              onRemove: (idx) {
                setState(() => _cartItems.removeAt(idx));
              },
            ),
          ),

          // Bottom Bar
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: SafeArea(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text("Tổng thanh toán",
                              style: TextStyle(
                                  fontSize: 12,
                                  color: AppColors.textSecondary)),
                          Text(
                            AppFormatters.formatCurrency(_totalAmount),
                            style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primary),
                          ),
                        ],
                      ),
                      ElevatedButton(
                        onPressed: _showProductSearch,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.slate100,
                          foregroundColor: AppColors.primary,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 12),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Row(
                          children: const [
                            Icon(Icons.add_circle_outline, size: 20),
                            SizedBox(width: 8),
                            Text("Thêm SP",
                                style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: ElevatedButton(
                      onPressed: _cartItems.isEmpty || _isCreating
                          ? null
                          : () {
                              showModalBottomSheet(
                                context: context,
                                isScrollControlled: true,
                                builder: (_) => CheckoutSheet(
                                  totalAmount: _totalAmount,
                                  onConfirm: _handleCheckout,
                                ),
                              );
                            },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        elevation: 0,
                      ),
                      child: _isCreating
                          ? const CircularProgressIndicator(color: Colors.white)
                          : const Text("Tạo đơn hàng",
                              style: TextStyle(
                                  fontSize: 16, fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
