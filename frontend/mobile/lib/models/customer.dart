class Customer {
  final int id;
  final String customerCode;
  final String fullName;
  final String? phone;
  final String? email;
  final String? address;
  final double totalDebt;
  final int? orderCount;

  Customer({
    required this.id,
    required this.customerCode,
    required this.fullName,
    this.phone,
    this.email,
    this.address,
    this.totalDebt = 0,
    this.orderCount,
  });

  factory Customer.fromJson(Map<String, dynamic> json) {
    return Customer(
      id: _parseInt(json['id']),
      customerCode: json['customer_code'] ?? '',
      fullName: json['full_name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      totalDebt: _parseDouble(json['total_debt']),
      orderCount: _parseInt(json['order_count']),
    );
  }

  Customer copyWith({
    int? id,
    String? customerCode,
    String? fullName,
    String? phone,
    String? email,
    String? address,
    double? totalDebt,
    int? orderCount,
  }) {
    return Customer(
      id: id ?? this.id,
      customerCode: customerCode ?? this.customerCode,
      fullName: fullName ?? this.fullName,
      phone: phone ?? this.phone,
      email: email ?? this.email,
      address: address ?? this.address,
      totalDebt: totalDebt ?? this.totalDebt,
      orderCount: orderCount ?? this.orderCount,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'customer_code': customerCode,
      'full_name': fullName,
      'phone': phone,
      'email': email,
      'address': address,
      'total_debt': totalDebt,
      'order_count': orderCount,
    };
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
