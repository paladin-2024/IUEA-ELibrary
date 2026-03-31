import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const TextStyle headline1 = TextStyle(
    fontSize: 28, fontWeight: FontWeight.w700, color: AppColors.black, height: 1.2,
  );
  static const TextStyle headline2 = TextStyle(
    fontSize: 22, fontWeight: FontWeight.w700, color: AppColors.black, height: 1.3,
  );
  static const TextStyle headline3 = TextStyle(
    fontSize: 18, fontWeight: FontWeight.w600, color: AppColors.black,
  );
  static const TextStyle subtitle1 = TextStyle(
    fontSize: 16, fontWeight: FontWeight.w500, color: AppColors.black,
  );
  static const TextStyle subtitle2 = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w500, color: AppColors.grey700,
  );
  static const TextStyle body1 = TextStyle(
    fontSize: 16, fontWeight: FontWeight.w400, color: AppColors.black, height: 1.6,
  );
  static const TextStyle body2 = TextStyle(
    fontSize: 14, fontWeight: FontWeight.w400, color: AppColors.grey700, height: 1.5,
  );
  static const TextStyle caption = TextStyle(
    fontSize: 12, fontWeight: FontWeight.w400, color: AppColors.grey500,
  );
  static const TextStyle button = TextStyle(
    fontSize: 15, fontWeight: FontWeight.w600, letterSpacing: 0.3,
  );
  static const TextStyle label = TextStyle(
    fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 0.8, color: AppColors.grey500,
  );

  // Reader
  static TextStyle readerBody(double fontSize, Color color) => TextStyle(
    fontFamily: 'serif', fontSize: fontSize, height: 1.8, color: color,
  );
}
