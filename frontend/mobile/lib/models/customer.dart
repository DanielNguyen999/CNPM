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
      id: json['id'] ?? 0,
      customerCode: json['customer_code'] ?? '',
      fullName: json['full_name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      address: json['address'],
      totalDebt: (json['total_debt'] ?? 0).toDouble(),
      orderCount: json['order_count'],
    );
  }
}
