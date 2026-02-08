import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'sse_service_platform.dart';

import 'sse_service_platform.dart';

SSEServicePlatform createSSEServicePlatform() => SSEServiceMobile();

class SSEServiceMobile implements SSEServicePlatform {
  StreamSubscription? _subscription;
  CancelToken? _cancelToken;
  final _eventController = StreamController<Map<String, dynamic>>.broadcast();

  @override
  Stream<Map<String, dynamic>> get events => _eventController.stream;

  @override
  void startListening(String token, String baseUrl) async {
    if (_subscription != null) return;

    final url = '$baseUrl/api/v1/events/stream?token=$token';
    debugPrint('SSE (Mobile): Connecting to $url');

    try {
      final dio = Dio();
      _cancelToken = CancelToken();

      final response = await dio.get<ResponseBody>(
        url,
        options: Options(
          responseType: ResponseType.stream,
        ),
        cancelToken: _cancelToken,
      );

      final stream = response.data?.stream;
      if (stream != null) {
        _subscription = stream
            .cast<List<int>>()
            .transform(utf8.decoder)
            .transform(const LineSplitter())
            .listen((line) {
          if (line.startsWith('data: ')) {
            final dataStr = line.substring(6);
            try {
              final data = jsonDecode(dataStr);
              debugPrint('SSE (Mobile): Received event: $data');
              _eventController.add(data);
            } catch (e) {
              debugPrint('SSE (Mobile): Error parsing data: $e');
            }
          }
        }, onError: (e) {
          debugPrint('SSE (Mobile): Connection error: $e');
          _reconnect(token, baseUrl);
        }, onDone: () {
          debugPrint('SSE (Mobile): Connection closed');
          _reconnect(token, baseUrl);
        });
      }
    } catch (e) {
      debugPrint('SSE (Mobile): Failed to start: $e');
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
    _subscription?.cancel();
    _subscription = null;
    _cancelToken?.cancel();
    _cancelToken = null;
    debugPrint('SSE (Mobile): Stopped listening');
  }

  @override
  void dispose() {
    stopListening();
    _eventController.close();
  }
}
