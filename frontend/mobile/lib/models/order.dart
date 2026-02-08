class Order {
  final int id;
  final String orderCode;
  final int? customerId;
  final double totalAmount;
  final double paidAmount;
  final String paymentStatus;
  final String createdAt;
  final List<OrderItem>? items;

  Order({
    required this.id,
    required this.orderCode,
    this.customerId,
    required this.totalAmount,
    required this.paidAmount,
    required this.paymentStatus,
    required this.createdAt,
    this.items,
  });

  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      id: _parseInt(json['id']),
      orderCode: json['order_code'] ?? '',
      customerId: _parseInt(json['customer_id']),
      totalAmount: _parseDouble(json['total_amount']),
      paidAmount: _parseDouble(json['paid_amount']),
      paymentStatus: json['payment_status'] ?? 'PENDING',
      createdAt: json['created_at'] ?? '',
      items: json['items'] != null
          ? (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList()
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'order_code': orderCode,
      'customer_id': customerId,
      'total_amount': totalAmount,
      'paid_amount': paidAmount,
      'payment_status': paymentStatus,
      'created_at': createdAt,
      'items': items?.map((i) => i.toJson()).toList(),
    };
  }
}

class OrderItem {
  final int id;
  final int productId;
  final String? productName;
  final double quantity;
  final double unitPrice;
  final double lineTotal;

  OrderItem({
    required this.id,
    required this.productId,
    this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.lineTotal,
  });

  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      id: _parseInt(json['id']),
      productId: _parseInt(json['product_id']),
      productName: json['product_name'],
      quantity: _parseDouble(json['quantity']),
      unitPrice: _parseDouble(json['unit_price']),
      lineTotal: _parseDouble(json['line_total']),
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

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'product_id': productId,
      'product_name': productName,
      'quantity': quantity,
      'unit_price': unitPrice,
      'line_total': lineTotal,
    };
  }
}

class DraftOrder {
  final List<DraftItem> items;
  final String? rawText;

  DraftOrder({required this.items, this.rawText});

  factory DraftOrder.fromJson(Map<String, dynamic> json) {
    var rawItems = json['items'] as List? ?? [];
    return DraftOrder(
      items: rawItems.map((i) => DraftItem.fromJson(i)).toList(),
      rawText: json['raw_text'],
    );
  }
}

class DraftItem {
  final int productId;
  final String productName;
  final double quantity;
  final int unitId;
  final double unitPrice;

  DraftItem({
    required this.productId,
    required this.productName,
    required this.quantity,
    required this.unitId,
    required this.unitPrice,
  });

  factory DraftItem.fromJson(Map<String, dynamic> json) {
    return DraftItem(
      productId: _parseInt(json['product_id']),
      productName: json['product_name'] ?? 'Sản phẩm',
      quantity: _parseDouble(json['quantity']),
      unitId: _parseInt(json['unit_id']),
      unitPrice: _parseDouble(json['unit_price']),
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
