import 'package:flutter/material.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final String label;

  const StatusBadge({
    super.key,
    required this.status,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    Color color;
    Color bgColor;

    switch (status.toUpperCase()) {
      case 'PAID':
      case 'ACTIVE':
        color = const Color(0xFF059669);
        bgColor = const Color(0xFFD1FAE5);
        break;
      case 'PARTIAL':
        color = const Color(0xFF2563EB);
        bgColor = const Color(0xFFDBEAFE);
        break;
      case 'PENDING':
      case 'OVERDUE':
        color = const Color(0xFFDC2626);
        bgColor = const Color(0xFFFEE2E2);
        break;
      default:
        color = const Color(0xFF4B5563);
        bgColor = const Color(0xFFF3F4F6);
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
