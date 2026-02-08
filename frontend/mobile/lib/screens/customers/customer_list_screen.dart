import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'customer_form_screen.dart';
import '../../services/customer_service.dart';
import '../../models/customer.dart';
import '../../core/constants/app_colors.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/common/loading_skeleton.dart';
import '../../widgets/common/empty_state.dart';

class CustomerListScreen extends StatefulWidget {
  const CustomerListScreen({super.key});

  @override
  State<CustomerListScreen> createState() => _CustomerListScreenState();
}

class _CustomerListScreenState extends State<CustomerListScreen> {
  List<Customer> _customers = [];
  bool _isLoading = true;
  final _searchController = TextEditingController();
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadCustomers();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadCustomers() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final customerService =
          Provider.of<CustomerService>(context, listen: false);
      final results = await customerService.listCustomers();
      // Logic lọc tạm thời ở frontend nếu API chưa hỗ trợ search sâu
      final items =
          (results['items'] as List).map((e) => Customer.fromJson(e)).toList();

      if (mounted) {
        setState(() {
          _customers = items;
          if (_searchController.text.isNotEmpty) {
            _customers = items
                .where((c) =>
                    c.fullName
                        .toLowerCase()
                        .contains(_searchController.text.toLowerCase()) ||
                    (c.phone?.contains(_searchController.text) ?? false))
                .toList();
          }
        });
      }
    } catch (e) {
      debugPrint("Error: $e");
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _onSearchChanged(String query) {
    if (_debounce?.isActive ?? false) _debounce!.cancel();
    _debounce = Timer(const Duration(milliseconds: 500), () {
      _loadCustomers();
    });
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Khách hàng",
      actions: [
        IconButton(
          icon: const Icon(Icons.person_add_alt_1),
          onPressed: () async {
            final result = await Navigator.push(
              context,
              MaterialPageRoute(
                  builder: (context) => const CustomerFormScreen()),
            );
            if (result == true) _loadCustomers();
          },
        ),
      ],
      body: Column(
        children: [
          _buildSearchBox(),
          Expanded(
            child: _isLoading
                ? const LoadingListSkeleton()
                : RefreshIndicator(
                    onRefresh: _loadCustomers,
                    child: _customers.isEmpty
                        ? const EmptyState(
                            message: "Chưa có dữ liệu khách hàng")
                        : ListView.builder(
                            itemCount: _customers.length,
                            padding: const EdgeInsets.all(16),
                            itemBuilder: (context, index) {
                              final customer = _customers[index];
                              return _buildCustomerCard(customer);
                            },
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBox() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.white,
      child: TextField(
        controller: _searchController,
        onChanged: _onSearchChanged,
        decoration: InputDecoration(
          hintText: "Tên hoặc số điện thoại...",
          prefixIcon: const Icon(Icons.search),
          filled: true,
          fillColor: AppColors.slate50,
          border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide.none),
        ),
      ),
    );
  }

  Widget _buildCustomerCard(Customer customer) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.slate100),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: CircleAvatar(
          backgroundColor: AppColors.primary.withOpacity(0.1),
          child: Text(customer.fullName[0].toUpperCase(),
              style: const TextStyle(
                  color: AppColors.primary, fontWeight: FontWeight.bold)),
        ),
        title: Text(customer.fullName,
            style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (customer.phone != null)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    const Icon(Icons.phone_outlined,
                        size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(customer.phone!, style: const TextStyle(fontSize: 12)),
                  ],
                ),
              ),
            if (customer.address != null)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(
                  children: [
                    const Icon(Icons.location_on_outlined,
                        size: 12, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Expanded(
                        child: Text(customer.address!,
                            style: const TextStyle(fontSize: 12),
                            overflow: TextOverflow.ellipsis)),
                  ],
                ),
              ),
          ],
        ),
        trailing: const Icon(Icons.chevron_right, color: AppColors.slate300),
        onTap: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
                builder: (context) => CustomerFormScreen(customer: customer)),
          );
          if (result == true) _loadCustomers();
        },
      ),
    );
  }
}
