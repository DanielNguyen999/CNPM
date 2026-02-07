import 'dart:async';
import 'package:flutter/material.dart';
import '../models/notification.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _service;

  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  Timer? _pollingTimer;

  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider(this._service) {
    fetchNotifications();
    startPolling();
  }

  Future<void> fetchNotifications() async {
    try {
      final fetched = await _service.getNotifications();
      // Only update and notify if data actually changed to avoid unnecessary rebuilds
      _notifications = fetched;
      notifyListeners();
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    }
  }

  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      fetchNotifications();
    });
  }

  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  Future<void> markAsRead(int id) async {
    try {
      await _service.markAsRead(id);
      // Optimistic update
      final index = _notifications.indexWhere((n) => n.id == id);
      if (index != -1) {
        final n = _notifications[index];
        _notifications[index] = NotificationModel(
          id: n.id,
          userId: n.userId,
          ownerId: n.ownerId,
          notificationType: n.notificationType,
          title: n.title,
          message: n.message,
          isRead: true,
          referenceType: n.referenceType,
          referenceId: n.referenceId,
          createdAt: n.createdAt,
        );
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Error marking notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      await _service.markAllAsRead();
      _notifications = _notifications.map((n) {
        return NotificationModel(
          id: n.id,
          userId: n.userId,
          ownerId: n.ownerId,
          notificationType: n.notificationType,
          title: n.title,
          message: n.message,
          isRead: true,
          referenceType: n.referenceType,
          referenceId: n.referenceId,
          createdAt: n.createdAt,
        );
      }).toList();
      notifyListeners();
    } catch (e) {
      debugPrint('Error marking all as read: $e');
    }
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
