import 'package:flutter/foundation.dart';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/env.dart';
import '../auth/auth_state.dart';

class ApiClient {
  late Dio dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  AuthState? _authState;

  ApiClient() {
    dio = Dio(BaseOptions(
      baseUrl: Env.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      contentType: 'application/json',
      responseType: ResponseType.json,
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'jwt_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        if (e.response?.statusCode == 401 || e.response?.statusCode == 403) {
          _authState?.logout();
        }

        // Map localized error messages
        String message = "Không thể kết nối máy chủ.";
        if (e.type == DioExceptionType.connectionTimeout) {
          message = "Hết thời gian kết nối.";
        } else if (e.response != null) {
          final dynamic data = e.response!.data;
          if (data is Map && data.containsKey('detail')) {
            message = data['detail'].toString();
          } else {
            switch (e.response!.statusCode) {
              case 401:
                message = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
                break;
              case 403:
                message = "Bạn không có quyền thực hiện thao tác này.";
                break;
              case 500:
                message = "Lỗi hệ thống máy chủ.";
                break;
            }
          }
        }

        if (e.response != null) {
          debugPrint(
              'API Error: ${e.response?.statusCode} - ${e.response?.data}');
        } else {
          debugPrint('API Connection Error: ${e.message} - ${e.type}');
        }

        final error = DioException(
          requestOptions: e.requestOptions,
          response: e.response,
          type: e.type,
          error: message,
        );

        return handler.next(error);
      },
    ));
  }

  void updateAuthState(AuthState authState) {
    _authState = authState;
  }
}
