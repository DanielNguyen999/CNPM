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
      id: json['id'] ?? json['user_id'] ?? 0,
      email: json['email'] ?? '',
      fullName: json['full_name'] ?? '',
      role: json['role'] ?? 'EMPLOYEE',
      ownerId: json['owner_id'],
      customerId: json['customer_id'],
      phone: json['phone'],
      isActive: json['is_active'] ?? true,
    );
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
