import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:universal_html/html.dart' as html;
import 'sse_service_platform.dart';

SSEServicePlatform createSSEServicePlatform() => SSEServiceWeb();

class SSEServiceWeb implements SSEServicePlatform {
  html.EventSource? _eventSource;
  final _eventController = StreamController<Map<String, dynamic>>.broadcast();

  @override
  Stream<Map<String, dynamic>> get events => _eventController.stream;

  @override
  void startListening(String token, String baseUrl) {
    if (_eventSource != null) return;

    final url = '$baseUrl/api/v1/events/stream?token=$token';
    debugPrint('SSE (Web): Connecting to $url');

    try {
      _eventSource = html.EventSource(url);

      _eventSource!.onMessage.listen((event) {
        try {
          final data = jsonDecode(event.data);
          debugPrint('SSE (Web): Received event: $data');
          _eventController.add(data);
        } catch (e) {
          debugPrint('SSE (Web): Error parsing data: $e');
        }
      });

      _eventSource!.onError.listen((event) {
        debugPrint('SSE (Web): Connection error');
        _reconnect(token, baseUrl);
      });
    } catch (e) {
      debugPrint('SSE (Web): Failed to start: $e');
      _reconnect(token, baseUrl);
    }
  }

  void _reconnect(String token, String baseUrl) {
    stopListening();
    Future.delayed(const Duration(seconds: 5), () {
      startListening(token, baseUrl);
    });
  }

  @override
  void stopListening() {
    _eventSource?.close();
    _eventSource = null;
    debugPrint('SSE (Web): Stopped listening');
  }

  @override
  void dispose() {
    stopListening();
    _eventController.close();
  }
}
