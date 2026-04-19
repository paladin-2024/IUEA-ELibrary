import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';
import '../constants/app_text_styles.dart';

class AppTheme {
  AppTheme._();

  // ── Light theme ────────────────────────────────────────────────────────────
  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3:            true,
      scaffoldBackgroundColor: AppColors.surface,
      textTheme:               GoogleFonts.interTextTheme(ThemeData.light().textTheme),
      colorScheme: ColorScheme(
        brightness:        Brightness.light,
        primary:           AppColors.primaryContainer,  // #7B0D1E — maroon used in buttons
        onPrimary:         AppColors.onPrimary,
        primaryContainer:  AppColors.primaryContainer,
        onPrimaryContainer: AppColors.onPrimaryContainer,
        secondary:         AppColors.secondary,
        onSecondary:       AppColors.onSecondary,
        secondaryContainer: AppColors.secondaryContainer,
        onSecondaryContainer: AppColors.onSecondaryContainer,
        tertiary:          AppColors.tertiary,
        onTertiary:        AppColors.onTertiary,
        tertiaryContainer: AppColors.tertiaryContainer,
        onTertiaryContainer: AppColors.onTertiaryContainer,
        error:             AppColors.error,
        onError:           AppColors.onError,
        errorContainer:    AppColors.errorContainer,
        onErrorContainer:  AppColors.error,
        surface:           AppColors.surface,
        onSurface:         AppColors.onSurface,
        surfaceContainerHighest: AppColors.surfaceContainerHighest,
        outline:           AppColors.outline,
        outlineVariant:    AppColors.outlineVariant,
      ),

      // AppBar
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.surfaceContainerLow,
        foregroundColor: AppColors.onSurface,
        elevation:       0,
        centerTitle:     false,
        titleTextStyle:  GoogleFonts.inter(
          fontSize:   17,
          fontWeight: FontWeight.w600,
          color:      AppColors.onSurface,
        ),
        iconTheme: const IconThemeData(color: AppColors.primaryContainer),
      ),

      // ElevatedButton — #7B0D1E maroon fill
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor:         AppColors.primaryContainer,
          foregroundColor:         AppColors.onPrimary,
          disabledBackgroundColor: AppColors.primaryFixed,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          padding:   const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
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
          padding:   const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
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
        filled:    true,
        fillColor: AppColors.background,
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
      cardTheme: CardThemeData(
        elevation:        2,
        color:            AppColors.background,
        surfaceTintColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
        ),
      ),

      // BottomNavigationBar — maroon selected
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        selectedItemColor:    AppColors.primary,
        unselectedItemColor:  AppColors.textSecondary,
        backgroundColor:      AppColors.background,
        type:                 BottomNavigationBarType.fixed,
        elevation:            8,
        selectedLabelStyle:   TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: TextStyle(fontSize: 11),
      ),

      // Chips
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.primary.withOpacity(0.08),
        selectedColor:   AppColors.primary,
        labelStyle:      AppTextStyles.label.copyWith(color: AppColors.primary),
        padding:         const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
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
  }

  // ── Dark theme ─────────────────────────────────────────────────────────────
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3:            true,
      scaffoldBackgroundColor: AppColors.backgroundDark,
      textTheme:               GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
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

      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.primaryDark,
        foregroundColor: AppColors.white,
        elevation:       0,
        centerTitle:     false,
        titleTextStyle:  GoogleFonts.inter(
          fontSize:   18,
          fontWeight: FontWeight.w600,
          color:      AppColors.white,
        ),
      ),

      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryLight,
          foregroundColor: AppColors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
          ),
          padding:   const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
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

      cardTheme: CardThemeData(
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
}
