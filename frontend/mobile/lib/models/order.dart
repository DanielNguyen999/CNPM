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
      id: json['id'] ?? 0,
      orderCode: json['order_code'] ?? '',
      customerId: json['customer_id'],
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      paymentStatus: json['payment_status'] ?? 'PENDING',
      createdAt: json['created_at'] ?? '',
      items: json['items'] != null
          ? (json['items'] as List).map((i) => OrderItem.fromJson(i)).toList()
          : null,
    );
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
      id: json['id'] ?? 0,
      productId: json['product_id'] ?? 0,
      productName: json['product_name'],
      quantity: (json['quantity'] ?? 0).toDouble(),
      unitPrice: (json['unit_price'] ?? 0).toDouble(),
      lineTotal: (json['line_total'] ?? 0).toDouble(),
    );
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
