import 'package:flutter/material.dart';
import 'app_colors.dart';

class AppTextStyles {
  AppTextStyles._();

  static const String _sans  = 'Inter';
  static const String _serif = 'Lora';

  // ── Headings (Lora serif) ──────────────────────────────────────────────────
  static const TextStyle h1 = TextStyle(
    fontFamily:  _serif,
    fontSize:    28,
    fontWeight:  FontWeight.bold,
    color:       AppColors.textPrimary,
    height:      1.2,
  );

  static const TextStyle h2 = TextStyle(
    fontFamily:  _serif,
    fontSize:    22,
    fontWeight:  FontWeight.bold,
    color:       AppColors.textPrimary,
    height:      1.3,
  );

  static const TextStyle h3 = TextStyle(
    fontFamily:  _sans,
    fontSize:    18,
    fontWeight:  FontWeight.w600,
    color:       AppColors.textPrimary,
  );

  // ── Body (Inter sans) ─────────────────────────────────────────────────────
  static const TextStyle body = TextStyle(
    fontFamily:  _sans,
    fontSize:    15,
    fontWeight:  FontWeight.normal,
    color:       AppColors.textPrimary,
    height:      1.6,
  );

  static const TextStyle bodySmall = TextStyle(
    fontFamily:  _sans,
    fontSize:    13,
    color:       AppColors.textSecondary,
    height:      1.5,
  );

  // ── Labels / captions ─────────────────────────────────────────────────────
  static const TextStyle label = TextStyle(
    fontFamily:  _sans,
    fontSize:    12,
    fontWeight:  FontWeight.w500,
    color:       AppColors.textSecondary,
    letterSpacing: 0.3,
  );

  // ── Button ────────────────────────────────────────────────────────────────
  static const TextStyle button = TextStyle(
    fontFamily:  _sans,
    fontSize:    15,
    fontWeight:  FontWeight.w600,
    color:       Colors.white,
    letterSpacing: 0.3,
  );

  // ── Reading body (Lora serif, large leading) ──────────────────────────────
  static const TextStyle readingBody = TextStyle(
    fontFamily:  _serif,
    fontSize:    18,
    height:      1.8,
    color:       AppColors.textPrimary,
  );

  // ── Dynamic reader body — varies by size and theme color ──────────────────
  static TextStyle readerBody(double fontSize, Color color) => TextStyle(
    fontFamily: _serif,
    fontSize:   fontSize,
    height:     1.8,
    color:      color,
  );

  // ── Legacy aliases (kept for existing widgets that use these names) ────────
  static const TextStyle headline1 = h1;
  static const TextStyle headline2 = h2;
  static const TextStyle headline3 = h3;
  static const TextStyle body1     = body;
  static const TextStyle body2     = bodySmall;
  static const TextStyle caption   = label;
}
