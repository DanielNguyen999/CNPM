import 'package:intl/intl.dart';

class AppFormatters {
  static String formatCurrency(num amount) {
    try {
      // Standard number formatting if intl fails or for quick fix
      return "${NumberFormat("#,###").format(amount)}đ";
    } catch (e) {
      return "${amount.toStringAsFixed(0)}đ";
    }
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return "${date.day}/${date.month}/${date.year}";
    } catch (e) {
      return dateStr;
    }
  }

  static String formatDateTime(String? dateStr) {
    if (dateStr == null) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return "${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute}";
    } catch (e) {
      return dateStr;
    }
  }
}
