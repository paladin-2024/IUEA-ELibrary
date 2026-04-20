import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  // ── Headings (Lora serif) ──────────────────────────────────────────────────
  static TextStyle get h1 => const TextStyle(
    fontFamily:  'Lora',
    fontSize:    28,
    fontWeight:  FontWeight.bold,
    color:       AppColors.textPrimary,
    height:      1.2,
  );

  static TextStyle get h2 => const TextStyle(
    fontFamily:  'Lora',
    fontSize:    22,
    fontWeight:  FontWeight.bold,
    color:       AppColors.textPrimary,
    height:      1.3,
  );

  static TextStyle get h3 => const TextStyle(
    fontFamily:  'Inter',
    fontSize:    18,
    fontWeight:  FontWeight.w600,
    color:       AppColors.textPrimary,
  );

  // ── Body (Inter sans) ─────────────────────────────────────────────────────
  static TextStyle get body => const TextStyle(
    fontFamily:  'Inter',
    fontSize:    15,
    fontWeight:  FontWeight.normal,
    color:       AppColors.textPrimary,
    height:      1.6,
  );

  static TextStyle get bodySmall => const TextStyle(
    fontFamily: 'Inter',
    fontSize:   13,
    color:      AppColors.textSecondary,
    height:     1.5,
  );

  // ── Labels / captions ─────────────────────────────────────────────────────
  static TextStyle get label => const TextStyle(
    fontFamily:    'Inter',
    fontSize:      12,
    fontWeight:    FontWeight.w500,
    color:         AppColors.textSecondary,
    letterSpacing: 0.3,
  );

  // ── Button ────────────────────────────────────────────────────────────────
  static TextStyle get button => const TextStyle(
    fontFamily:    'Inter',
    fontSize:      15,
    fontWeight:    FontWeight.w600,
    color:         Colors.white,
    letterSpacing: 0.3,
  );

  // ── Reading body (Lora serif, large leading) ──────────────────────────────
  static TextStyle get readingBody => const TextStyle(
    fontFamily: 'Lora',
    fontSize:   18,
    height:     1.8,
    color:      AppColors.textPrimary,
  );

  // ── Dynamic reader body ───────────────────────────────────────────────────
  static TextStyle readerBody(double fontSize, Color color) => TextStyle(
    fontFamily: 'Lora',
    fontSize:   fontSize,
    height:     1.8,
    color:      color,
  );

  // ── Legacy aliases ─────────────────────────────────────────────────────────
  static TextStyle get headline1 => h1;
  static TextStyle get headline2 => h2;
  static TextStyle get headline3 => h3;
  static TextStyle get body1     => body;
  static TextStyle get body2     => bodySmall;
  static TextStyle get caption   => label;
}
