import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:path_provider/path_provider.dart';
import 'package:record/record.dart';
import 'package:fluttertoast/fluttertoast.dart';
import '../../services/ai_service.dart';
import '../../core/constants/app_colors.dart';

class VoiceRecorderSheet extends StatefulWidget {
  const VoiceRecorderSheet({super.key});

  @override
  State<VoiceRecorderSheet> createState() => _VoiceRecorderSheetState();
}

class _VoiceRecorderSheetState extends State<VoiceRecorderSheet> {
  final _audioRecorder = AudioRecorder();
  bool _isRecording = false;
  bool _isProcessing = false;
  String? _filePath;

  @override
  void dispose() {
    _audioRecorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    try {
      if (await _audioRecorder.hasPermission()) {
        final dir = await getTemporaryDirectory();
        final fileName =
            'voice_order_${DateTime.now().millisecondsSinceEpoch}.m4a';
        _filePath = '${dir.path}/$fileName';

        await _audioRecorder.start(
          const RecordConfig(),
          path: _filePath!,
        );

        setState(() => _isRecording = true);
      } else {
        Fluttertoast.showToast(msg: "Cần quyền truy cập microphone");
      }
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi ghi âm: $e");
    }
  }

  Future<void> _stopRecording() async {
    try {
      final path = await _audioRecorder.stop();
      setState(() => _isRecording = false);

      if (path != null) {
        _processAudio(path);
      }
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi dừng ghi âm: $e");
    }
  }

  Future<void> _processAudio(String path) async {
    setState(() => _isProcessing = true);
    try {
      final aiService = Provider.of<AIService>(context, listen: false);
      final draftOrder = await aiService.processVoiceOrder(File(path));

      if (mounted) {
        Navigator.pop(context, draftOrder);
      }
    } catch (e) {
      Fluttertoast.showToast(msg: "Lỗi xử lý AI: $e");
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(32),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            "Đặt hàng bằng giọng nói",
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          const Text(
            "Nói danh sách sản phẩm bạn muốn đặt",
            style: TextStyle(color: AppColors.textSecondary),
          ),
          const SizedBox(height: 48),
          if (_isProcessing)
            const Column(
              children: [
                CircularProgressIndicator(),
                SizedBox(height: 16),
                Text("Đang xử lý giọng nói..."),
              ],
            )
          else
            GestureDetector(
              onLongPressStart: (_) => _startRecording(),
              onLongPressEnd: (_) => _stopRecording(),
              child: Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isRecording ? AppColors.error : AppColors.primary,
                  boxShadow: [
                    BoxShadow(
                      color:
                          (_isRecording ? AppColors.error : AppColors.primary)
                              .withOpacity(0.3),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
                child: Icon(
                  _isRecording ? Icons.mic : Icons.mic_none,
                  color: Colors.white,
                  size: 40,
                ),
              ),
            ),
          const SizedBox(height: 24),
          if (!_isProcessing)
            Text(
              _isRecording ? "Đang ghi âm (Thả để gửi)" : "Nhấn giữ để nói",
              style: TextStyle(
                color: _isRecording ? AppColors.error : AppColors.primary,
                fontWeight: FontWeight.bold,
              ),
            ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
