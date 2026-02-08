import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../services/admin_service.dart';

class AdminOwnersScreen extends StatefulWidget {
  const AdminOwnersScreen({super.key});

  @override
  State<AdminOwnersScreen> createState() => _AdminOwnersScreenState();
}

class _AdminOwnersScreenState extends State<AdminOwnersScreen> {
  List<dynamic> _owners = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchOwners();
  }

  Future<void> _fetchOwners() async {
    try {
      final owners =
          await Provider.of<AdminService>(context, listen: false).listOwners();
      if (mounted) {
        setState(() {
          _owners = owners;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleStatus(int id, bool currentStatus) async {
    try {
      await Provider.of<AdminService>(context, listen: false)
          .updateOwnerStatus(id, !currentStatus);
      _fetchOwners();
    } catch (e) {
      // Handle error
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Quản lý cửa hàng"),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _owners.length,
              itemBuilder: (context, index) {
                final owner = _owners[index];
                final isActive = owner['is_active'] ?? false;
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: ListTile(
                    title: Text(owner['shop_name'] ?? 'N/A'),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(owner['email'] ?? ''),
                        Text(
                          "Gói: ${owner['plan_name'] ?? 'Free'}",
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    ),
                    trailing: Switch(
                      value: isActive,
                      activeColor: AppColors.success,
                      onChanged: (val) => _toggleStatus(owner['id'], isActive),
                    ),
                  ),
                );
              },
            ),
    );
  }
}
