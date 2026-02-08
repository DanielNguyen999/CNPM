class Debt {
  final int id;
  final int customerId;
  final String customerName;
  final String orderCode;
  final double totalAmount;
  final double paidAmount;
  final double remainingAmount;
  final String status;
  final String createdAt;
  final String? dueDate;
  final List<DebtPayment>? payments;

  Debt({
    required this.id,
    required this.customerId,
    required this.customerName,
    required this.orderCode,
    required this.totalAmount,
    required this.paidAmount,
    required this.remainingAmount,
    required this.status,
    required this.createdAt,
    this.dueDate,
    this.payments,
  });

  factory Debt.fromJson(Map<String, dynamic> json) {
    return Debt(
      id: _parseInt(json['id']),
      customerId: _parseInt(json['customer_id']),
      customerName: json['customer_name'] ?? '',
      orderCode: json['order_code'] ?? '',
      totalAmount: _parseDouble(json['total_amount']),
      paidAmount: _parseDouble(json['paid_amount']),
      remainingAmount: _parseDouble(json['remaining_amount']),
      status: json['status'] ?? 'PENDING',
      createdAt: json['created_at'] ?? '',
      dueDate: json['due_date'],
      payments: json['payments'] != null
          ? (json['payments'] as List)
              .map((i) => DebtPayment.fromJson(i))
              .toList()
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

class DebtPayment {
  final int id;
  final double paymentAmount;
  final String paymentMethod;
  final String? referenceNumber;
  final String? notes;
  final String createdAt;

  DebtPayment({
    required this.id,
    required this.paymentAmount,
    required this.paymentMethod,
    this.referenceNumber,
    this.notes,
    required this.createdAt,
  });

  factory DebtPayment.fromJson(Map<String, dynamic> json) {
    return DebtPayment(
      id: _parseInt(json['id']),
      paymentAmount: _parseDouble(json['payment_amount']),
      paymentMethod: json['payment_method'] ?? 'CASH',
      referenceNumber: json['reference_number'],
      notes: json['notes'],
      createdAt: json['created_at'] ?? '',
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
