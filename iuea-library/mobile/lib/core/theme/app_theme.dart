import 'package:flutter/material.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';
import '../constants/app_text_styles.dart';

class AppTheme {
  AppTheme._();

  // ── Light theme ────────────────────────────────────────────────────────────
  static ThemeData get lightTheme => ThemeData(
    useMaterial3:            true,
    fontFamily:              'Inter',
    scaffoldBackgroundColor: AppColors.surface,
    colorScheme: ColorScheme.fromSeed(
      seedColor:  AppColors.primary,
      primary:    AppColors.primary,
      secondary:  AppColors.accent,
      surface:    AppColors.surface,
      error:      AppColors.error,
      brightness: Brightness.light,
    ).copyWith(
      onPrimary:   AppColors.white,
      onSecondary: AppColors.textPrimary,
      onSurface:   AppColors.textPrimary,
    ),

    // AppBar
    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.background,
      foregroundColor: AppColors.textPrimary,
      elevation:       0,
      centerTitle:     false,
      titleTextStyle:  TextStyle(
        fontFamily:  'Inter',
        fontSize:    18,
        fontWeight:  FontWeight.w600,
        color:       AppColors.textPrimary,
      ),
      iconTheme: IconThemeData(color: AppColors.textPrimary),
    ),

    // ElevatedButton — maroon fill
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor:  AppColors.primary,
        foregroundColor:  AppColors.white,
        disabledBackgroundColor: AppColors.primaryLight,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: AppTextStyles.button,
        elevation: 0,
      ),
    ),

    // OutlinedButton
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: AppColors.primary,
        side:  const BorderSide(color: AppColors.primary),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: AppTextStyles.button.copyWith(color: AppColors.primary),
      ),
    ),

    // TextButton
    textButtonTheme: TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: AppColors.primary,
        textStyle: AppTextStyles.body.copyWith(
          fontWeight: FontWeight.w600,
          color:      AppColors.primary,
        ),
      ),
    ),

    // Input fields — maroon focus border
    inputDecorationTheme: InputDecorationTheme(
      filled:      true,
      fillColor:   AppColors.background,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.primary, width: 2),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.error),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      hintStyle:      AppTextStyles.body.copyWith(color: AppColors.textHint),
      labelStyle:     AppTextStyles.body.copyWith(color: AppColors.textSecondary),
    ),

    // Card — 12px radius, white
    cardTheme: CardTheme(
      elevation:        2,
      color:            AppColors.background,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
      ),
    ),

    // BottomNavigationBar — maroon selected
    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor:   AppColors.primary,
      unselectedItemColor: AppColors.textSecondary,
      backgroundColor:     AppColors.background,
      type:                BottomNavigationBarType.fixed,
      elevation:           8,
      selectedLabelStyle:  TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
      unselectedLabelStyle: TextStyle(fontSize: 11),
    ),

    // Chips
    chipTheme: ChipThemeData(
      backgroundColor:  AppColors.primary.withOpacity(0.08),
      selectedColor:    AppColors.primary,
      labelStyle:       AppTextStyles.label.copyWith(color: AppColors.primary),
      padding:          const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
      ),
    ),

    // Divider
    dividerTheme: const DividerThemeData(
      color:     AppColors.border,
      thickness: 1,
      space:     1,
    ),

    // ProgressIndicator
    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color:            AppColors.primary,
      linearTrackColor: AppColors.border,
    ),
  );

  // ── Dark theme ─────────────────────────────────────────────────────────────
  static ThemeData get darkTheme => ThemeData(
    useMaterial3:            true,
    fontFamily:              'Inter',
    scaffoldBackgroundColor: AppColors.backgroundDark,
    colorScheme: ColorScheme.fromSeed(
      seedColor:  AppColors.primaryLight,
      primary:    AppColors.primaryLight,
      secondary:  AppColors.accent,
      surface:    AppColors.surfaceDark,
      error:      AppColors.error,
      brightness: Brightness.dark,
    ).copyWith(
      onPrimary: AppColors.white,
      onSurface: AppColors.white,
    ),

    appBarTheme: const AppBarTheme(
      backgroundColor: AppColors.primaryDark,
      foregroundColor: AppColors.white,
      elevation:       0,
      centerTitle:     false,
      titleTextStyle:  TextStyle(
        fontFamily:  'Inter',
        fontSize:    18,
        fontWeight:  FontWeight.w600,
        color:       AppColors.white,
      ),
    ),

    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primaryLight,
        foregroundColor: AppColors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
        textStyle: AppTextStyles.button,
        elevation: 0,
      ),
    ),

    inputDecorationTheme: InputDecorationTheme(
      filled:    true,
      fillColor: AppColors.surfaceDark,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.primaryLight),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppSpacing.inputRadius),
        borderSide:   const BorderSide(color: AppColors.accent, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      hintStyle:      TextStyle(color: AppColors.white.withOpacity(0.4)),
      labelStyle:     TextStyle(color: AppColors.white.withOpacity(0.7)),
    ),

    cardTheme: CardTheme(
      color:            AppColors.surfaceDark,
      surfaceTintColor: Colors.transparent,
      elevation:        2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
      ),
    ),

    bottomNavigationBarTheme: const BottomNavigationBarThemeData(
      selectedItemColor:   AppColors.accent,
      unselectedItemColor: AppColors.grey500,
      backgroundColor:     AppColors.primaryDark,
      type:                BottomNavigationBarType.fixed,
      elevation:           8,
    ),

    progressIndicatorTheme: const ProgressIndicatorThemeData(
      color:            AppColors.accent,
      linearTrackColor: AppColors.primaryLight,
    ),
  );
}
