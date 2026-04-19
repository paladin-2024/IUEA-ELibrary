import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Stitch / Material 3 Brand Tokens ─────────────────────────────────────
  static const Color primary              = Color(0xFF56000F); // deep maroon
  static const Color onPrimary            = Color(0xFFFFFFFF);
  static const Color primaryContainer     = Color(0xFF7B0D1E); // mid maroon — buttons
  static const Color onPrimaryContainer   = Color(0xFFFF8185);
  static const Color primaryFixed         = Color(0xFFFFDAD9);
  static const Color primaryFixedDim      = Color(0xFFFFB3B3);

  static const Color secondary            = Color(0xFF984447);
  static const Color onSecondary          = Color(0xFFFFFFFF);
  static const Color secondaryContainer   = Color(0xFFFF9697);
  static const Color onSecondaryContainer = Color(0xFF782C2F);

  static const Color tertiary             = Color(0xFF755B00);
  static const Color onTertiary          = Color(0xFFFFFFFF);
  static const Color tertiaryContainer    = Color(0xFFC9A84C); // gold
  static const Color onTertiaryContainer  = Color(0xFF503D00);
  static const Color tertiaryFixed        = Color(0xFFFFE08F);
  static const Color tertiaryFixedDim     = Color(0xFFE6C364);

  static const Color error               = Color(0xFFBA1A1A);
  static const Color onError             = Color(0xFFFFFFFF);
  static const Color errorContainer      = Color(0xFFFFDAD6);

  // ── Surfaces ─────────────────────────────────────────────────────────────
  static const Color surface                 = Color(0xFFFFF8F7);
  static const Color onSurface              = Color(0xFF2D1418);
  static const Color surfaceVariant          = Color(0xFFFFD9DC);
  static const Color onSurfaceVariant        = Color(0xFF584141);
  static const Color surfaceContainerLowest  = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow     = Color(0xFFFFF0F0);
  static const Color surfaceContainer        = Color(0xFFFFE9EA);
  static const Color surfaceContainerHigh    = Color(0xFFFFE1E3);
  static const Color surfaceContainerHighest = Color(0xFFFFD9DC);

  static const Color background          = Color(0xFFFFF8F7);
  static const Color onBackground        = Color(0xFF2D1418);
  static const Color outline             = Color(0xFF8B7170);
  static const Color outlineVariant      = Color(0xFFDFBFBE);

  // ── Legacy aliases kept for existing code ─────────────────────────────────
  static const Color primaryDark  = Color(0xFF4A0810);
  static const Color primaryLight = Color(0xFF9B2D3E);
  static const Color accent       = Color(0xFFC9A84C);  // = tertiaryContainer
  static const Color accentLight  = Color(0xFFE8C97A);
  static const Color surfaceDark  = Color(0xFF2A0D12);
  static const Color backgroundDark = Color(0xFF1A0508);
  static const Color textPrimary   = Color(0xFF2D1418);  // = onSurface
  static const Color textSecondary = Color(0xFF584141);  // = onSurfaceVariant
  static const Color textHint      = Color(0xFF8B7170);  // = outline
  static const Color border        = Color(0xFFDFBFBE);  // = outlineVariant

  // ── Neutrals ─────────────────────────────────────────────────────────────
  static const Color white   = Color(0xFFFFFFFF);
  static const Color black   = Color(0xFF1A0508);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey700 = Color(0xFF616161);

  // ── Semantic ─────────────────────────────────────────────────────────────
  static const Color success = Color(0xFF16A34A);
  static const Color warning = Color(0xFFF59E0B);
  static const Color info    = Color(0xFF01579B);

  // ── Reader themes ────────────────────────────────────────────────────────
  static const Color readerLight = Color(0xFFFFFFFF);
  static const Color readerSepia = Color(0xFFF4E4C1);
  static const Color readerDark  = Color(0xFF1A1A2E);
}
