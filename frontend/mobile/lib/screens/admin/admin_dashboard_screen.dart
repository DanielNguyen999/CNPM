import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../services/admin_service.dart';
import '../../core/auth/auth_state.dart';
import '../../widgets/common/stat_card.dart'; // Assume this exists or I'll create a simple one
import 'admin_owners_screen.dart';
import 'admin_plans_screen.dart';
import 'admin_password_requests_screen.dart';
import 'admin_announcements_screen.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  Map<String, dynamic>? _stats;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchStats();
  }

  Future<void> _fetchStats() async {
    try {
      final stats = await Provider.of<AdminService>(context, listen: false)
          .getDashboardStats();
      if (mounted) {
        setState(() {
          _stats = stats;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context, listen: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Admin Console'),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => authState.logout(),
          ),
        ],
      ),
      backgroundColor: Colors.grey[50],
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _fetchStats,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      "Tổng quan hệ thống",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    GridView.count(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisCount: 2,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                      childAspectRatio: 1.5,
                      children: [
                        _buildStatCard(
                          "Chủ cửa hàng",
                          _stats?['total_owners']?.toString() ?? "0",
                          Icons.store,
                          Colors.blue,
                        ),
                        _buildStatCard(
                          "Người dùng",
                          _stats?['total_users']?.toString() ?? "0",
                          Icons.people,
                          Colors.green,
                        ),
                        _buildStatCard(
                          "Gói dịch vụ",
                          _stats?['total_plans']?.toString() ?? "0",
                          Icons.subscriptions,
                          Colors.purple,
                        ),
                        _buildStatCard(
                          "Đang hoạt động",
                          _stats?['active_subscriptions']?.toString() ?? "0",
                          Icons.verified,
                          Colors.orange,
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    const Text(
                      "Quản lý",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildMenuTile(
                      context,
                      "Quản lý cửa hàng (Owners)",
                      Icons.storefront,
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AdminOwnersScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      context,
                      "Gói dịch vụ (Plans)",
                      Icons.card_membership,
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AdminPlansScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      context,
                      "Yêu cầu mật khẩu",
                      Icons.lock_reset,
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) =>
                                const AdminPasswordRequestsScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      context,
                      "Thông báo hệ thống",
                      Icons.campaign,
                      () => Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (_) => const AdminAnnouncementsScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      context,
                      "Xuất báo cáo hệ thống",
                      Icons.download,
                      // TODO: Implement download logic
                      () {},
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppColors.textPrimary,
            ),
          ),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: AppColors.textSecondary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTile(
      BuildContext context, String title, IconData icon, VoidCallback onTap) {
    return Card(
      elevation: 0,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: AppColors.slate200),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary),
        ),
        title: Text(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onTap,
      ),
    );
  }
}
