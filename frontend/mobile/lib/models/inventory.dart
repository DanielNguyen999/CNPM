class Inventory {
  final int productId;
  final String productName;
  final String productCode;
  final double availableQuantity;
  final String unitName;
  final bool isLowStock;

  Inventory({
    required this.productId,
    required this.productName,
    required this.productCode,
    required this.availableQuantity,
    required this.unitName,
    this.isLowStock = false,
  });

  factory Inventory.fromJson(Map<String, dynamic> json) {
    return Inventory(
      productId: json['product_id'] ?? 0,
      productName: json['product_name'] ?? '',
      productCode: json['product_code'] ?? '',
      availableQuantity: (json['available_quantity'] ?? 0).toDouble(),
      unitName: json['unit_name'] ?? '',
      isLowStock: json['is_low_stock'] ?? false,
    );
  }
}
