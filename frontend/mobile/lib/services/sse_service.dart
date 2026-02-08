import 'dart:async';

import 'package:flutter/foundation.dart';
import '../core/auth/auth_state.dart';
import '../core/constants/env.dart';
// Note: dart:io is NOT available on web. We use conditional imports or just avoid it.

class SSEService {
  final AuthState authState;
  StreamSubscription? _subscription;

  final _eventController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get events => _eventController.stream;

  SSEService(this.authState) {
    _init();
  }

  void _init() {
    // Only verify status on creation.
    // ProxyProvider will handle re-creation/updates if AuthState changes.
    if (authState.isLoggedIn) {
      startListening();
    }
  }

  Future<void> startListening() async {
    if (kIsWeb) {
      // For web, we might need a different SSE implementation or just skip for now
      // if not critical. HttpClient from dart:io will crash.
      debugPrint('SSE: Skipping for Web (dart:io not supported)');
      return;
    }

    if (_subscription != null) return;

    final token = authState.token;
    if (token == null) return;

    final baseUrl = Env.baseUrl.replaceFirst('/api/v1', '');
    final url = Uri.parse('$baseUrl/api/v1/events/stream?token=$token');

    debugPrint('SSE: Connecting to $url');

    try {
      // This part will only run on native platforms (Android/iOS/Desktop)
      // because of the kIsWeb check above.
      /*
      final client = HttpClient();
      final request = await client.getUrl(url);
      final response = await request.close();

      _subscription = response
          .transform(utf8.decoder)
          .transform(const LineSplitter())
          .listen((line) {
        if (line.startsWith('data: ')) {
          final dataStr = line.substring(6);
          try {
            final data = jsonDecode(dataStr);
            _eventController.add(data);
          } catch (e) {
            debugPrint('SSE: Error parsing data: $e');
          }
        }
      }, onError: (e) {
        debugPrint('SSE: Connection error: $e');
        stopListening();
        Future.delayed(const Duration(seconds: 5), startListening);
      }, onDone: () {
        debugPrint('SSE: Connection closed');
        stopListening();
        Future.delayed(const Duration(seconds: 5), startListening);
      });
      */
    } catch (e) {
      debugPrint('SSE: Failed to start: $e');
      Future.delayed(const Duration(seconds: 10), startListening);
    }
  }

  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    debugPrint('SSE: Stopped listening');
  }

  void dispose() {
    stopListening();
    _eventController.close();
  }
}
