import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'jwt_utils.dart';
import '../../models/user.dart';

class AuthState extends ChangeNotifier {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  String? _token;
  User? _user;
  bool _isLoading = true;

  String? get token => _token;
  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _token != null;

  String? get role => _user?.role;
  int? get ownerId => _user?.ownerId;
  int? get userId => _user?.id;

  bool get isOwnerOrAdmin => role == "OWNER" || role == "ADMIN";
  bool get isEmployee => role == "EMPLOYEE";

  AuthState() {
    loadSession();
  }

  Future<void> loadSession() async {
    _isLoading = true;
    notifyListeners();

    _token = await _storage.read(key: 'jwt_token');
    
    if (_token != null) {
      if (JwtUtils.isExpired(_token!)) {
        await logout();
      } else {
        final decoded = JwtUtils.decode(_token!);
        // Fallback user if me() not called yet
        _user = User.fromJson({
          'id': decoded['user_id'],
          'email': decoded['email'],
          'role': decoded['role'],
          'owner_id': decoded['owner_id'],
          'full_name': 'User', // Placeholder
        });
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> login(String token, Map<String, dynamic> userData) async {
    _token = token;
    _user = User.fromJson(userData);
    await _storage.write(key: 'jwt_token', value: token);
    _isLoading = false;
    notifyListeners();
  }

  Future<void> logout() async {
    _token = null;
    _user = null;
    await _storage.delete(key: 'jwt_token');
    notifyListeners();
  }

  void setUser(User user) {
    _user = user;
    notifyListeners();
  }
}
