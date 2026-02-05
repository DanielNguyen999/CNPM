import 'package:flutter/material.dart';
import 'app.dart';
import 'core/api/api_client.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  final apiClient = ApiClient();
  
  runApp(BizFlowApp(apiClient: apiClient));
}
