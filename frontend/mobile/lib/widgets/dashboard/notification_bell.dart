import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../providers/notification_provider.dart';
import '../../core/constants/app_colors.dart';

class NotificationBell extends StatelessWidget {
  const NotificationBell({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, provider, child) {
        final unreadCount = provider.unreadCount;

        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: Icon(
                unreadCount > 0
                    ? Icons.notifications_active
                    : Icons.notifications_none_outlined,
                color: unreadCount > 0
                    ? AppColors.primary
                    : AppColors.textSecondary,
              ),
              onPressed: () {
                // TODO: Navigate to notification screen or show modal
                _showNotificationSheet(context);
              },
            )
                .animate(
                  target: unreadCount > 0 ? 1 : 0,
                  onPlay: (controller) => controller.repeat(),
                )
                .shake(hz: 2, curve: Curves.easeInOut),
            if (unreadCount > 0)
              Positioned(
                top: 8,
                right: 8,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: BoxDecoration(
                    color: AppColors.error,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: Colors.white, width: 2),
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    unreadCount > 9 ? '9+' : unreadCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 8,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ).animate().scale(
                      duration: 200.ms,
                      curve: Curves.elasticOut,
                    ),
              ),
          ],
        );
      },
    );
  }

  void _showNotificationSheet(BuildContext context) {
    // We'll implement the list view here in a bit
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const NotificationSheet(),
    );
  }
}

class NotificationSheet extends StatelessWidget {
  const NotificationSheet({super.key});

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.slate200,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.between,
                  children: [
                    const Text(
                      "Thông báo",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        context.read<NotificationProvider>().markAllAsRead();
                      },
                      child: const Text("Đọc tất cả"),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: Consumer<NotificationProvider>(
                  builder: (context, provider, child) {
                    final notifications = provider.notifications;

                    if (notifications.isEmpty) {
                      return const Center(
                        child: Text("Không có thông báo nào"),
                      );
                    }

                    return ListView.separated(
                      controller: controller,
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      itemCount: notifications.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final n = notifications[index];
                        return ListTile(
                          contentPadding:
                              const EdgeInsets.symmetric(vertical: 8),
                          leading: CircleAvatar(
                            backgroundColor: (n.isRead
                                    ? AppColors.slate200
                                    : AppColors.primary)
                                .withOpacity(0.1),
                            child: Icon(
                              Icons.announcement_outlined,
                              color: n.isRead
                                  ? AppColors.textSecondary
                                  : AppColors.primary,
                              size: 20,
                            ),
                          ),
                          title: Text(
                            n.title,
                            style: TextStyle(
                              fontWeight: n.isRead
                                  ? FontWeight.normal
                                  : FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const SizedBox(height: 4),
                              Text(
                                n.message,
                                style: const TextStyle(fontSize: 13),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                "${n.createdAt.hour}:${n.createdAt.minute} - ${n.createdAt.day}/${n.createdAt.month}",
                                style: const TextStyle(
                                    fontSize: 11,
                                    color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                          onTap: () {
                            if (!n.isRead) {
                              provider.markAsRead(n.id);
                            }
                          },
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
