import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/debt_service.dart';
import '../../models/debt.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_routes.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';
import '../../widgets/badges/status_badge.dart';
import '../../widgets/common/loading_skeleton.dart';
import '../../widgets/common/empty_state.dart';

class DebtCollectionScreen extends StatefulWidget {
  const DebtCollectionScreen({super.key});

  @override
  State<DebtCollectionScreen> createState() => _DebtCollectionScreenState();
}

class _DebtCollectionScreenState extends State<DebtCollectionScreen> {
  String _status = 'all'; // all, PENDING, PARTIAL, OVERDUE
  List<Debt> _debts = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDebts();
  }

  Future<void> _loadDebts() async {
    setState(() => _isLoading = true);
    try {
      final debtService = Provider.of<DebtService>(context, listen: false);
      final response = await debtService.listDebts(status: _status);
      setState(() => _debts = response['items']);
    } catch (e) {
      // Error
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Danh sách nợ",
      body: Column(
        children: [
          // Filters
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Row(
              children: [
                _buildFilterChip("Tất cả", "all"),
                const SizedBox(width: 8),
                _buildFilterChip("Chưa trả", "PENDING"),
                const SizedBox(width: 8),
                _buildFilterChip("Trả một phần", "PARTIAL"),
                const SizedBox(width: 8),
                _buildFilterChip("Quá hạn", "OVERDUE"),
              ],
            ),
          ),
          
          Expanded(
            child: _isLoading
                ? const LoadingListSkeleton()
                : _debts.isEmpty
                    ? const EmptyState(message: "Không có khoản nợ nào")
                    : RefreshIndicator(
                        onRefresh: _loadDebts,
                        child: ListView.separated(
                          itemCount: _debts.length,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          separatorBuilder: (_, __) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final debt = _debts[index];
                            return InkWell(
                              onTap: () => Navigator.pushNamed(
                                context, 
                                AppRoutes.debtDetail,
                                arguments: debt.id,
                              ).then((_) => _loadDebts()),
                              child: Container(
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: AppColors.slate200),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          debt.customerName,
                                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                                        ),
                                        StatusBadge(
                                          status: debt.status,
                                          label: debt.status == 'PAID' ? 'Đã trả' : 'Cần thu',
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      "Mã đơn: ${debt.orderCode}",
                                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                    ),
                                    const Divider(height: 24),
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        const Text("Còn lại:", style: TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                        Text(
                                          AppFormatters.formatCurrency(debt.remainingAmount),
                                          style: const TextStyle(
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.error,
                                            fontSize: 16,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _status == value;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() => _status = value);
          _loadDebts();
        }
      },
      selectedColor: AppColors.primary,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppColors.textPrimary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
      ),
      backgroundColor: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(color: isSelected ? AppColors.primary : AppColors.slate200),
      ),
    );
  }
}
