import 'dart:async';
import 'dart:convert';
import 'dart:io';
import '../core/auth/auth_state.dart';
import '../core/constants/env.dart';

class SSEService {
  final AuthState authState;
  HttpClient? _client;
  StreamSubscription? _subscription;

  final _eventController = StreamController<Map<String, dynamic>>.broadcast();
  Stream<Map<String, dynamic>> get events => _eventController.stream;

  SSEService(this.authState) {
    _init();
  }

  void _init() {
    authState.addListener(() {
      if (authState.isLoggedIn && _subscription == null) {
        startListening();
      } else if (!authState.isLoggedIn && _subscription != null) {
        stopListening();
      }
    });

    if (authState.isLoggedIn) {
      startListening();
    }
  }

  Future<void> startListening() async {
    if (_subscription != null) return;

    final token = authState.token;
    if (token == null) return;

    final baseUrl = Env.baseUrl.replaceFirst('/api/v1', '');
    final url = Uri.parse('$baseUrl/api/v1/events/stream?token=$token');

    print('SSE: Connecting to $url');

    try {
      _client = HttpClient();
      final request = await _client!.getUrl(url);
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
            print('SSE: Error parsing data: $e');
          }
        }
      }, onError: (e) {
        print('SSE: Connection error: $e');
        stopListening();
        // Retry after delay
        Future.delayed(const Duration(seconds: 5), startListening);
      }, onDone: () {
        print('SSE: Connection closed');
        stopListening();
        Future.delayed(const Duration(seconds: 5), startListening);
      });
    } catch (e) {
      print('SSE: Failed to start: $e');
      Future.delayed(const Duration(seconds: 10), startListening);
    }
  }

  void stopListening() {
    _subscription?.cancel();
    _subscription = null;
    _client?.close();
    _client = null;
    print('SSE: Stopped listening');
  }

  void dispose() {
    stopListening();
    _eventController.close();
  }
}
