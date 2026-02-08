class User {
  final int id;
  final String email;
  final String fullName;
  final String role;
  final int? ownerId;
  final int? customerId;
  final String? phone;
  final bool isActive;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    this.ownerId,
    this.customerId,
    this.phone,
    this.isActive = true,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: _parseInt(json['id'] ?? json['user_id']),
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'EMPLOYEE',
      ownerId: _parseInt(json['owner_id']),
      customerId: _parseInt(json['customer_id']),
      phone: json['phone'],
      isActive: json['is_active'] ?? true,
    );
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
      'email': email,
      'full_name': fullName,
      'role': role,
      'owner_id': ownerId,
      'customer_id': customerId,
      'phone': phone,
      'is_active': isActive,
    };
  }
}
