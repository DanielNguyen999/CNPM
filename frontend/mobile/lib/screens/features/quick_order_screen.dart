import 'package:flutter/material.dart';

class QuickOrderScreen extends StatefulWidget {
  const QuickOrderScreen({super.key});

  @override
  State<QuickOrderScreen> createState() => _QuickOrderScreenState();
}

class _QuickOrderScreenState extends State<QuickOrderScreen> {
  // Mock data for demo
  final List<Map<String, dynamic>> _products = [
    {'id': 1, 'name': 'Xi măng Hà Tiên', 'code': 'XM001', 'price': 95000},
    {'id': 2, 'name': 'Cát xây dựng (Khối)', 'code': 'VL002', 'price': 250000},
    {'id': 3, 'name': 'Gạch ống 4 lỗ', 'code': 'G001', 'price': 1200},
  ];

  final Map<int, int> _cart = {}; // ProductID -> Quantity

  void _addToCart(int productId) {
    setState(() {
      _cart[productId] = (_cart[productId] ?? 0) + 1;
    });
  }

  void _removeFromCart(int productId) {
    if ((_cart[productId] ?? 0) > 0) {
      setState(() {
        _cart[productId] = _cart[productId]! - 1;
        if (_cart[productId] == 0) _cart.remove(productId);
      });
    }
  }

  double get _totalAmount {
    double total = 0;
    _cart.forEach((id, qty) {
      final product = _products.firstWhere((p) => p['id'] == id);
      total += (product['price'] as int) * qty;
    });
    return total;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tạo Đơn Nhanh')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _products.length,
              itemBuilder: (context, index) {
                final product = _products[index];
                final qty = _cart[product['id']] ?? 0;

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                product['name'],
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              Text('${product['code']} - ${(product['price'] as int).toString()} ₫'),
                            ],
                          ),
                        ),
                        if (qty > 0)
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            color: Colors.red,
                            onPressed: () => _removeFromCart(product['id']),
                          ),
                        if (qty > 0)
                          Text('$qty', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                        IconButton(
                          icon: const Icon(Icons.add_circle_outline),
                          color: Colors.blue,
                          onPressed: () => _addToCart(product['id']),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          if (_cart.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                boxShadow: [BoxShadow(blurRadius: 4, color: Colors.black12)],
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Tổng ${_cart.values.fold(0, (a, b) => a + b)} sản phẩm'),
                      Text(
                        '${_totalAmount.toStringAsFixed(0)} ₫',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.blue),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton(
                      onPressed: () {}, // Implement create API
                      child: const Text('Hoàn tất đơn hàng'),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
