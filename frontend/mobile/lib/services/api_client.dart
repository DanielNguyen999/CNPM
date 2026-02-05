import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

/**
 * Standard API Client for BizFlow Mobile
 * - Auto-attaches JWT Bearer token
 * - Handles 401 errors with token clearing
 */

class ApiClient {
  static const String _baseUrl = 'http://10.0.2.2:8080/api/v1'; // Default for Android Emulator

  // Helper to get headers with Auth
  static Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Handle Response & 401
  static http.Response _handleResponse(http.Response response) {
    if (response.statusCode == 401) {
      // Clear token on 401
      SharedPreferences.getInstance().then((prefs) {
        prefs.remove('access_token');
        prefs.remove('user_data');
      });
      throw Exception('Session expired. Please login again.');
    }
    return response;
  }

  // GET
  static Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.get(url, headers: await _getHeaders());
    return _handleResponse(response);
  }

  // POST
  static Future<http.Response> post(String endpoint, dynamic body) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.post(
      url, 
      headers: await _getHeaders(),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  // PUT
  static Future<http.Response> put(String endpoint, dynamic body) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.put(
      url, 
      headers: await _getHeaders(),
      body: jsonEncode(body),
    );
    return _handleResponse(response);
  }

  // DELETE
  static Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('$_baseUrl$endpoint');
    final response = await http.delete(url, headers: await _getHeaders());
    return _handleResponse(response);
  }
}
