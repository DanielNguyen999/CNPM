import 'dart:io';
import 'package:dio/dio.dart';
import '../core/api/api_client.dart';
import '../models/order.dart';

class AIService {
  final ApiClient apiClient;

  AIService(this.apiClient);

  Future<DraftOrder> processVoiceOrder(File audioFile) async {
    try {
      String fileName = audioFile.path.split('/').last;
      FormData formData = FormData.fromMap({
        "file": await MultipartFile.fromFile(
          audioFile.path,
          filename: fileName,
        ),
      });

      final response = await apiClient.dio.post(
        '/ai/voice-to-order',
        data: formData,
        options: Options(
          contentType: 'multipart/form-data',
        ),
      );

      return DraftOrder.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}
