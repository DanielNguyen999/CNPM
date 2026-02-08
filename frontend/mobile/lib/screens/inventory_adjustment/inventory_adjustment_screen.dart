import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../services/inventory_service.dart';
import '../../core/utils/formatters.dart';
import '../../widgets/common/app_scaffold.dart';

class InventoryAdjustmentScreen extends StatefulWidget {
  const InventoryAdjustmentScreen({super.key});

  @override
  State<InventoryAdjustmentScreen> createState() =>
      _InventoryAdjustmentScreenState();
}

class _InventoryAdjustmentScreenState extends State<InventoryAdjustmentScreen> {
  List<dynamic> _movements = [];
  bool _isLoading = true;
  bool _hasMore = true;
  int _skip = 0;
  final int _limit = 20;

  @override
  void initState() {
    super.initState();
    _fetchMovements();
  }

  Future<void> _fetchMovements({bool refresh = false}) async {
    if (refresh) {
      _skip = 0;
      _hasMore = true;
    }
    if (!_hasMore) return;

    try {
      final newItems =
          await Provider.of<InventoryService>(context, listen: false)
              .listMovements(skip: _skip, limit: _limit);

      if (mounted) {
        setState(() {
          if (refresh) _movements = [];
          _movements.addAll(newItems);
          _hasMore = newItems.length == _limit;
          _skip += _limit;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      title: "Lịch sử kho",
      body: RefreshIndicator(
        onRefresh: () => _fetchMovements(refresh: true),
        child: _isLoading && _movements.isEmpty
            ? const Center(child: CircularProgressIndicator())
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _movements.length + (_hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _movements.length) {
                    _fetchMovements();
                    return const Center(child: CircularProgressIndicator());
                  }
                  final m = _movements[index];
                  return _buildMovementCard(m);
                },
              ),
      ),
    );
  }

  Widget _buildMovementCard(dynamic movement) {
    final qty = movement['quantity_change'] ?? 0;
    final isPositive = qty > 0;
    final reason = movement['reason'] ?? '';
    final code = movement['product_code'] ?? 'N/A';
    final name = movement['product_name'] ?? 'Sản phẩm';
    final date = movement['created_at'] != null
        ? AppFormatters.formatDateTime(movement['created_at'])
        : '';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: (isPositive ? AppColors.success : AppColors.error)
              .withOpacity(0.1),
          child: Icon(
            isPositive ? Icons.arrow_upward : Icons.arrow_downward,
            color: isPositive ? AppColors.success : AppColors.error,
            size: 20,
          ),
        ),
        title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("$code • $date", style: const TextStyle(fontSize: 12)),
            if (reason.isNotEmpty)
              Text("Lý do: $reason",
                  style: const TextStyle(
                      fontSize: 12, fontStyle: FontStyle.italic)),
          ],
        ),
        trailing: Text(
          "${isPositive ? '+' : ''}$qty",
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: isPositive ? AppColors.success : AppColors.error,
            fontSize: 16,
          ),
        ),
      ),
    );
  }
}
