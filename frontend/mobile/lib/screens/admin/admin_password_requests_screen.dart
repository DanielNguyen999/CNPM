import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../core/constants/app_colors.dart';
import '../../services/admin_service.dart';

class AdminPasswordRequestsScreen extends StatefulWidget {
  const AdminPasswordRequestsScreen({super.key});

  @override
  State<AdminPasswordRequestsScreen> createState() =>
      _AdminPasswordRequestsScreenState();
}

class _AdminPasswordRequestsScreenState
    extends State<AdminPasswordRequestsScreen> {
  List<dynamic> _requests = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchRequests();
  }

  Future<void> _fetchRequests() async {
    try {
      final requests = await Provider.of<AdminService>(context, listen: false)
          .listPasswordRequests();
      if (mounted) {
        setState(() {
          _requests = requests;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _approve(int id) async {
    try {
      final result = await Provider.of<AdminService>(context, listen: false)
          .approvePasswordRequest(id);
      Fluttertoast.showToast(msg: "Mật khẩu mới: ${result['new_password']}");
      _fetchRequests();
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi: $e");
    }
  }

  Future<void> _reject(int id) async {
    try {
      await Provider.of<AdminService>(context, listen: false)
          .rejectPasswordRequest(id);
      Fluttertoast.showToast(msg: "Đã từ chối yêu cầu");
      _fetchRequests();
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("Yêu cầu đặt lại mật khẩu"),
        backgroundColor: Colors.white,
        foregroundColor: AppColors.textPrimary,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: _requests.length,
              itemBuilder: (context, index) {
                final req = _requests[index];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text("Email: ${req['email']}",
                            style:
                                const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 8),
                        Text("Thời gian: ${req['created_at']}"),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: () => _reject(req['id']),
                              child: const Text("Từ chối",
                                  style: TextStyle(color: AppColors.error)),
                            ),
                            const SizedBox(width: 8),
                            ElevatedButton(
                              onPressed: () => _approve(req['id']),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                              ),
                              child: const Text("Duyệt"),
                            ),
                          ],
                        )
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
