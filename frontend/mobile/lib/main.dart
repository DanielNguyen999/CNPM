import 'package:flutter/material.dart';
import 'app.dart';
import 'core/api/api_client.dart';
// import 'package:intl/date_symbol_data_local.dart';

void main() async {
  // Global Error Handling
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
    debugPrint("GLOBAL ERROR: ${details.exception}");
  };

  WidgetsFlutterBinding.ensureInitialized();

  // Skip intl for now to ensure stability

  final apiClient = ApiClient();

  runApp(BizFlowApp(apiClient: apiClient));
}
