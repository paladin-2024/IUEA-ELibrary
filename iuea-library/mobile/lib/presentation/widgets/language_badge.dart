import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/language_util.dart';

class LanguageBadge extends StatelessWidget {
  final String code;
  const LanguageBadge({super.key, required this.code});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color:        AppColors.accent.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        LanguageUtil.getLanguageName(code),
        style: const TextStyle(
          fontSize:   11,
          color:      AppColors.primaryDark,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
