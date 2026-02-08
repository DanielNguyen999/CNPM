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
      productId: _parseInt(json['product_id']),
      productName: json['product_name'] ?? '',
      productCode: json['product_code'] ?? '',
      availableQuantity: _parseDouble(json['available_quantity']),
      unitName: json['unit_name'] ?? '',
      isLowStock: json['is_low_stock'] ?? false,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value == null) return 0;
    if (value is num) return value.toInt();
    if (value is String) return int.tryParse(value) ?? 0;
    return 0;
  }
}
