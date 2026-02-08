import 'dart:async';
import 'package:flutter/foundation.dart';
import '../core/auth/auth_state.dart';
import '../core/constants/env.dart';
import 'sse/sse_service_platform.dart';

// Import the stub, but override with platform specific implementations
import 'sse/sse_service_stub.dart'
    if (dart.library.io) 'sse/sse_service_mobile.dart'
    if (dart.library.html) 'sse/sse_service_web.dart';

class SSEService {
  final AuthState authState;
  final SSEServicePlatform _platformService;

  final _eventController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get events => _eventController.stream;

  SSEService(this.authState) : _platformService = createSSEServicePlatform() {
    // Listen to platform events and forward them
    _platformService.events.listen((event) {
      _eventController.add(event);
    });

    if (authState.isLoggedIn) {
      startListening();
    }
  }

  void startListening() {
    final token = authState.token;
    if (token == null) return;

    // For Web, ensure we strip /api/v1 if it's included in baseUrl, but logic in web/mobile impl handles url construction.
    final baseUrl = Env.baseUrl.replaceAll('/api/v1', '');
    _platformService.startListening(token, baseUrl);
  }

  void stopListening() => _platformService.stopListening();

  void dispose() {
    _platformService.dispose();
    _eventController.close();
  }
}
