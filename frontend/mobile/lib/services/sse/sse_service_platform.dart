import '../../core/auth/auth_state.dart';

abstract class SSEServicePlatform {
  Stream<Map<String, dynamic>> get events;
  void startListening(String token, String baseUrl);
  void stopListening();
  void dispose();
}

// Factory to create platform specific instance
// This will be implemented using conditional imports
class SSEServiceFactory {
  static SSEServicePlatform create(AuthState authState) {
    throw UnimplementedError('SSEServiceFactory not implemented');
  }
}
