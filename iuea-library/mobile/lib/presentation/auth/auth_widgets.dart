import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

InputDecoration authInputDeco({
  required String hint,
  required IconData prefix,
  Widget? suffix,
}) {
  return InputDecoration(
    hintText: hint,
    hintStyle: TextStyle(fontFamily: 'Inter', 
      color:    const Color(0xFFBDBDBD),
      fontSize: 13,
    ),
    prefixIcon: Icon(prefix, size: 18, color: AppColors.textHint),
    suffixIcon: suffix,
    filled:     true,
    fillColor:  AppColors.white,
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide:   const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide:   const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide:   const BorderSide(color: AppColors.primary, width: 1.5),
    ),
    errorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide:   const BorderSide(color: AppColors.error),
    ),
    focusedErrorBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide:   const BorderSide(color: AppColors.error, width: 1.5),
    ),
  );
}

class AuthFieldLabel extends StatelessWidget {
  const AuthFieldLabel(this.text, {super.key});
  final String text;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        text,
        style: AppTextStyles.label.copyWith(
          fontSize:      10,
          fontWeight:    FontWeight.w600,
          letterSpacing: 1.2,
          color:         AppColors.textSecondary,
        ),
      ),
    );
  }
}

class AuthFooterLink extends StatelessWidget {
  const AuthFooterLink(this.label, {super.key});
  final String label;

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontFamily: 'Inter',
        fontSize:   10,
        color:      AppColors.textHint.withValues(alpha: 0.7),
        decoration: TextDecoration.underline,
        decorationColor: AppColors.textHint.withValues(alpha: 0.4),
      ),
    );
  }
}

Widget authFooterDot() => Padding(
  padding: const EdgeInsets.symmetric(horizontal: 6),
  child: Text(
    '·',
    style: TextStyle(
      color:    AppColors.textHint.withValues(alpha: 0.5),
      fontSize: 10,
    ),
  ),
);
