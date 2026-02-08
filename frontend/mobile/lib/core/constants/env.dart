import 'package:flutter/foundation.dart';

class Env {
  // Use 10.0.2.2 for Android Emulator to access localhost
  // Use localhost for iOS simulator and Web
  static const String baseUrl =
      kIsWeb ? 'http://127.0.0.1:8080/api/v1' : 'http://10.0.2.2:8080/api/v1';
}
