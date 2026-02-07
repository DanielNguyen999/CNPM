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
      id: json['id'] ?? 0,
      productCode: json['product_code'] ?? '',
      name: json['name'] ?? '',
      description: json['description'],
      category: json['category'],
      price: (json['base_price'] ?? json['price'] ?? 0).toDouble(),
      costPrice: (json['cost_price'] ?? 0).toDouble(),
      availableQuantity: (json['available_quantity'] ?? 0).toDouble(),
      imageUrl: json['image_url'],
      units: json['units'] != null
          ? (json['units'] as List).map((i) => ProductUnit.fromJson(i)).toList()
          : null,
    );
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
      id: json['id'] ?? 0,
      name: json['name'] ?? '',
      conversionRate: (json['conversion_rate'] ?? 1.0).toDouble(),
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}
