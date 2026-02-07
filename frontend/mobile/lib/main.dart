import 'package:flutter/material.dart';
import 'app.dart';
import 'core/api/api_client.dart';
import 'package:intl/date_symbol_data_local.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize date formatting for intl
  await initializeDateFormatting('vi_VN', null);

  final apiClient = ApiClient();

  runApp(BizFlowApp(apiClient: apiClient));
}
