import 'package:flutter/material.dart';
import '../../services/api_service.dart';

class DraftOrdersScreen extends StatefulWidget {
  const DraftOrdersScreen({super.key});

  @override
  State<DraftOrdersScreen> createState() => _DraftOrdersScreenState();
}

class _DraftOrdersScreenState extends State<DraftOrdersScreen> {
  List<dynamic> _drafts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadDrafts();
  }

  Future<void> _loadDrafts() async {
    try {
      final data = await ApiService.get('/draft-orders');
      setState(() {
        _drafts = data;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Lỗi tải dữ liệu: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Đơn Nháp AI')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _drafts.isEmpty
              ? const Center(child: Text('Không có đơn nháp nào.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _drafts.length,
                  itemBuilder: (context, index) {
                    final draft = _drafts[index];
                    final confidence = (draft['confidence_score'] * 100).round();
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  draft['draft_code'],
                                  style: const TextStyle(fontWeight: FontWeight.bold),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: confidence >= 80 ? Colors.green[100] : Colors.amber[100],
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    '$confidence% tin cậy',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: confidence >= 80 ? Colors.green[800] : Colors.amber[800],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              '"${draft['original_input']}"',
                              style: const TextStyle(fontStyle: FontStyle.italic),
                            ),
                            const SizedBox(height: 12),
                            if (draft['missing_fields'] != null && (draft['missing_fields'] as List).isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(bottom: 8.0),
                                child: Text(
                                  'Thiếu: ${(draft['missing_fields'] as List).join(', ')}',
                                  style: const TextStyle(color: Colors.red, fontSize: 12),
                                ),
                              ),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.end,
                              children: [
                                OutlinedButton(
                                  onPressed: () {}, // Implement reject
                                  child: const Text('Từ chối', style: TextStyle(color: Colors.red)),
                                ),
                                const SizedBox(width: 8),
                                FilledButton(
                                  onPressed: () {}, // Implement confirm
                                  child: const Text('Xác nhận'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
