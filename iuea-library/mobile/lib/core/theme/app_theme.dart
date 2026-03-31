import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class AppTheme {
  AppTheme._();

  static ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor:   AppColors.primary,
      primary:     AppColors.primary,
      secondary:   AppColors.accent,
      surface:     AppColors.surface,
      brightness:  Brightness.light,
    ),
    scaffoldBackgroundColor: AppColors.surface,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: AppColors.white,
      elevation:       0,
      centerTitle:     false,
      titleTextStyle:  TextStyle(
        fontSize: 18, fontWeight: FontWeight.w600,
        color: AppColors.white, fontFamily: 'serif',
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side:   const BorderSide(color: AppColors.primary),
        shape:  RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      border:        OutlineInputBorder(borderRadius: BorderRadius.circular(6)),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(6),
        borderSide:   const BorderSide(color: AppColors.primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      labelStyle:     const TextStyle(color: AppColors.grey700),
    ),
    cardTheme: CardTheme(
      elevation:    2,
      shape:        RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color:        AppColors.white,
      surfaceTintColor: Colors.transparent,
    ),
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor:   AppColors.primary,
      unselectedItemColor: AppColors.grey500,
      backgroundColor:     AppColors.white,
      type:                BottomNavigationBarType.fixed,
      elevation:           8,
    ),
    chipTheme: ChipThemeData(
      backgroundColor: AppColors.primary.withOpacity(0.1),
      labelStyle:      const TextStyle(color: AppColors.primary, fontSize: 12),
      padding:         const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      shape:           RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
    ),
  );

  static ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor:  AppColors.primary,
      primary:    AppColors.primaryLight,
      secondary:  AppColors.accent,
      surface:    AppColors.surfaceDark,
      brightness: Brightness.dark,
    ),
    scaffoldBackgroundColor: AppColors.surfaceDark,
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primaryDark,
      foregroundColor: AppColors.white,
      elevation:       0,
    ),
  );
}
