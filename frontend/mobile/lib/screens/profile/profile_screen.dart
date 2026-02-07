import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth/auth_state.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/common/app_scaffold.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final authState = Provider.of<AuthState>(context);
    final user = authState.user;

    return AppScaffold(
      title: "Cài đặt & Cá nhân",
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildProfileHeader(
                user?.fullName ?? "Chủ quán", user?.email ?? "CHỦ CỬA HÀNG"),
            const SizedBox(height: 24),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(
                children: [
                  _buildMenuCard([
                    _buildMenuItem(Icons.storefront_outlined,
                        "Thông tin cửa hàng", "BizFlow Store"),
                    _buildMenuItem(
                        Icons.security_outlined, "Bảo mật tài khoản", ""),
                    _buildMenuItem(Icons.notifications_none_outlined,
                        "Cấu hình thông báo", "Đang bật"),
                  ]),
                  const SizedBox(height: 20),
                  _buildMenuCard([
                    _buildMenuItem(
                        Icons.help_outline_rounded, "Trung tâm trợ giúp", ""),
                    _buildMenuItem(
                        Icons.info_outline_rounded, "Về BizFlow v1.0", ""),
                  ]),
                  const SizedBox(height: 32),
                  SizedBox(
                    width: double.infinity,
                    child: TextButton.icon(
                      onPressed: () => authState.logout(),
                      icon: const Icon(Icons.logout_rounded,
                          color: AppColors.error),
                      label: const Text("ĐĂNG XUẤT",
                          style: TextStyle(
                              color: AppColors.error,
                              fontWeight: FontWeight.bold)),
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: AppColors.error.withOpacity(0.05),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                  const Text("BizFlow Management Platform",
                      style: TextStyle(
                          color: AppColors.slate300,
                          fontSize: 10,
                          letterSpacing: 1)),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(String name, String role) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 40, 20, 40),
      decoration: const BoxDecoration(
        color: AppColors.primary,
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(32)),
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: const BoxDecoration(
                color: Colors.white, shape: BoxShape.circle),
            child: CircleAvatar(
              radius: 40,
              backgroundColor: AppColors.slate100,
              child: Text(name[0].toUpperCase(),
                  style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primary)),
            ),
          ),
          const SizedBox(height: 16),
          Text(name,
              style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(20)),
            child: Text(role.toUpperCase(),
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 1)),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuCard(List<Widget> items) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.slate100),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.02),
              blurRadius: 10,
              offset: const Offset(0, 4))
        ],
      ),
      child: Column(children: items),
    );
  }

  Widget _buildMenuItem(IconData icon, String title, String trailing) {
    return ListTile(
      leading: Icon(icon, color: AppColors.slate400, size: 22),
      title: Text(title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (trailing.isNotEmpty)
            Text(trailing,
                style: const TextStyle(
                    fontSize: 12, color: AppColors.textSecondary)),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right, size: 16, color: AppColors.slate300),
        ],
      ),
      onTap: () {},
    );
  }
}
