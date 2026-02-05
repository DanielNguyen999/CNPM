import 'package:flutter/material.dart';
import '../../../models/product.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/formatters.dart';

class CartItem {
  final Product product;
  int quantity;
  double price;
  int unitId;

  CartItem({
    required this.product,
    required this.quantity,
    required this.price,
    required this.unitId,
  });

  double get total => quantity * price;
}

class CartList extends StatelessWidget {
  final List<CartItem> items;
  final Function(int, int) onQuantityChanged; // index, delta
  final Function(int) onRemove;

  const CartList({
    super.key,
    required this.items,
    required this.onQuantityChanged,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_cart_outlined,
                size: 64, color: AppColors.slate300),
            const SizedBox(height: 16),
            const Text(
              "Giỏ hàng trống",
              style: TextStyle(color: AppColors.textSecondary),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      itemCount: items.length,
      padding: const EdgeInsets.all(20),
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final item = items[index];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.slate200),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.product.name,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    Text(
                      AppFormatters.formatCurrency(item.price),
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.remove_circle_outline, size: 20),
                    onPressed: () {
                      if (item.quantity > 1) {
                        onQuantityChanged(index, -1);
                      } else {
                        onRemove(index);
                      }
                    },
                    color: AppColors.slate400,
                  ),
                  Container(
                    constraints: const BoxConstraints(minWidth: 30),
                    alignment: Alignment.center,
                    child: Text(
                      "${item.quantity}",
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add_circle_outline, size: 20),
                    onPressed: () => onQuantityChanged(index, 1),
                    color: AppColors.primary,
                  ),
                ],
              ),
              const SizedBox(width: 8),
              Text(
                AppFormatters.formatCurrency(item.total),
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
            ],
          ),
        );
      },
    );
  }
}
