class NotificationModel {
  final int id;
  final int userId;
  final int? ownerId;
  final String notificationType;
  final String title;
  final String message;
  final bool isRead;
  final String? referenceType;
  final int? referenceId;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.userId,
    this.ownerId,
    required this.notificationType,
    required this.title,
    required this.message,
    required this.isRead,
    this.referenceType,
    this.referenceId,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? 0,
      userId: json['user_id'] ?? 0,
      ownerId: json['owner_id'],
      notificationType: json['notification_type'] ?? 'SYSTEM',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      isRead: json['is_read'] ?? false,
      referenceType: json['reference_type'],
      referenceId: json['reference_id'],
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'owner_id': ownerId,
      'notification_type': notificationType,
      'title': title,
      'message': message,
      'is_read': isRead,
      'reference_type': referenceType,
      'reference_id': referenceId,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
