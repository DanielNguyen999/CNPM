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
      id: json['id'] ?? 0,
      customerId: json['customer_id'] ?? 0,
      customerName: json['customer_name'] ?? '',
      orderCode: json['order_code'] ?? '',
      totalAmount: (json['total_amount'] ?? 0).toDouble(),
      paidAmount: (json['paid_amount'] ?? 0).toDouble(),
      remainingAmount: (json['remaining_amount'] ?? 0).toDouble(),
      status: json['status'] ?? 'PENDING',
      createdAt: json['created_at'] ?? '',
      dueDate: json['due_date'],
      payments: json['payments'] != null
          ? (json['payments'] as List).map((i) => DebtPayment.fromJson(i)).toList()
          : null,
    );
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
      id: json['id'] ?? 0,
      paymentAmount: (json['payment_amount'] ?? 0).toDouble(),
      paymentMethod: json['payment_method'] ?? 'CASH',
      referenceNumber: json['reference_number'],
      notes: json['notes'],
      createdAt: json['created_at'] ?? '',
    );
  }
}
