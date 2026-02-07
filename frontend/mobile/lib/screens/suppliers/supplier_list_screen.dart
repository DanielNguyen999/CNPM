import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/common/loading_skeleton.dart';
import '../../widgets/common/empty_state.dart';

class SupplierListScreen extends StatefulWidget {
  const SupplierListScreen({super.key});

  @override
  State<SupplierListScreen> createState() => _SupplierListScreenState();
}

class _SupplierListScreenState extends State<SupplierListScreen> {
  bool _isLoading = true;
  List<dynamic> _suppliers = [];
  final _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _loadSuppliers();
  }

  Future<void> _loadSuppliers() async {
    setState(() => _isLoading = true);
    try {
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        setState(() {
          _suppliers = [
            {
              'name': 'Nhà phân phối Hùng Phát',
              'phone': '0987654321',
              'address': 'Hà Nội',
              'debt': 1500000
            },
            {
              'name': 'Công ty CP Thiên Long',
              'phone': '0912345678',
              'address': 'TP.HCM',
              'debt': 0
            },
            {
              'name': 'Đại lý Bia Sài Gòn',
              'phone': '0901234567',
              'address': 'Đà Nẵng',
              'debt': 5200000
            },
          ];
        });
      }
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Nhà cung cấp",
      body: Column(
        children: [
          _buildSearchHeader(),
          Expanded(
            child: _isLoading
                ? const LoadingListSkeleton()
                : RefreshIndicator(
                    onRefresh: _loadSuppliers,
                    child: _suppliers.isEmpty
                        ? const EmptyState(message: "Chưa có nhà cung cấp nào")
                        : ListView.builder(
                            itemCount: _suppliers.length,
                            padding: const EdgeInsets.all(16),
                            itemBuilder: (context, index) {
                              final s = _suppliers[index];
                              return _buildSupplierCard(s);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchHeader() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: TextField(
        controller: _searchController,
        decoration: InputDecoration(
          hintText: "Tìm nhà cung cấp...",
          prefixIcon: const Icon(Icons.business_outlined),
          filled: true,
          fillColor: AppColors.slate50,
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Widget _buildSupplierCard(dynamic s) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate100),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
                color: AppColors.info.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.business, color: AppColors.info),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(s['name'],
                    style: const TextStyle(
                        fontWeight: FontWeight.bold, fontSize: 15)),
                Text(s['phone'],
                    style: const TextStyle(
                        fontSize: 12, color: AppColors.textSecondary)),
              ],
            ),
          ),
          if (s['debt'] > 0)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Text("Nợ NCC",
                    style: TextStyle(
                        fontSize: 10,
                        color: AppColors.error,
                        fontWeight: FontWeight.bold)),
                Text(
                  "${s['debt']}đ",
                  style: const TextStyle(
                      fontWeight: FontWeight.bold, color: AppColors.error),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
