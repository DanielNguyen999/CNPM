class Product {
  final int id;
  final String productCode;
  final String name;
  final String? description;
  final String? category;
  final double price;
  final double? costPrice;
  final double? availableQuantity;
  final String? imageUrl;
  final List<ProductUnit>? units;

  Product({
    required this.id,
    required this.productCode,
    required this.name,
    this.description,
    this.category,
    required this.price,
    this.costPrice,
    this.availableQuantity,
    this.imageUrl,
    this.units,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: _parseInt(json['id']),
      productCode: json['product_code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      category: json['category'],
      price: _parseDouble(json['base_price'] ?? json['price']),
      costPrice: _parseDouble(json['cost_price']),
      availableQuantity: _parseDouble(json['available_quantity']),
      imageUrl: json['image_url'],
      units: json['units'] != null
          ? (json['units'] as List).map((i) => ProductUnit.fromJson(i)).toList()
          : null,
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

class ProductUnit {
  final int id;
  final String name;
  final double conversionRate;
  final double price;

  ProductUnit({
    required this.id,
    required this.name,
    required this.conversionRate,
    required this.price,
  });

  factory ProductUnit.fromJson(Map<String, dynamic> json) {
    return ProductUnit(
      id: _parseInt(json['id']),
      name: json['unit_name'] ?? json['name'] ?? '',
      conversionRate: _parseDouble(json['conversion_rate'] ?? 1.0),
      price: _parseDouble(json['price']),
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
