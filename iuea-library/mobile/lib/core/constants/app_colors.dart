import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── IUEA Brand Primitives ─────────────────────────────────────────────────
  // Primary maroon scale (--iuea-maroon-*)
  static const Color maroon950 = Color(0xFF2A050C);
  static const Color maroon900 = Color(0xFF3D0810);
  static const Color maroon800 = Color(0xFF5C0F1F);
  static const Color maroon700 = Color(0xFF8A1228); // primary brand
  static const Color maroon600 = Color(0xFFA6182F);
  static const Color maroon500 = Color(0xFFBD2640);
  static const Color maroon400 = Color(0xFFD05468);
  static const Color maroon300 = Color(0xFFE590A0);

  // Blush/cream scale (--iuea-blush-*)
  static const Color blush50  = Color(0xFFFDF4F2);
  static const Color blush100 = Color(0xFFFCE8E6); // primary app background
  static const Color blush200 = Color(0xFFF8D7D3);
  static const Color blush300 = Color(0xFFF2BEB8);
  static const Color blush400 = Color(0xFFE89F98);

  // Gold scale (--iuea-gold-*)
  static const Color gold300 = Color(0xFFD9B96B);
  static const Color gold500 = Color(0xFFB8964A); // primary gold accent
  static const Color gold700 = Color(0xFF8B6F2E);

  // Ink/neutral scale (--iuea-ink-*)
  static const Color ink900 = Color(0xFF1C0A0C); // body text
  static const Color ink700 = Color(0xFF3E2B2E);
  static const Color ink500 = Color(0xFF6B5456); // muted / captions
  static const Color ink300 = Color(0xFFA89597); // disabled / placeholder
  static const Color line   = Color(0xFFEBD2CF); // dividers on blush

  // ── Semantic / Material 3 tokens ─────────────────────────────────────────
  static const Color primary              = Color(0xFF8A1228); // maroon-700
  static const Color onPrimary            = Color(0xFFFDF4F2); // fg-on-maroon
  static const Color primaryContainer     = Color(0xFF8A1228); // same — one maroon
  static const Color onPrimaryContainer   = Color(0xFFFDF4F2);
  static const Color primaryFixed         = Color(0xFFF8D7D3); // blush-200
  static const Color primaryFixedDim      = Color(0xFFE89F98); // blush-400

  static const Color secondary            = Color(0xFFA6182F); // maroon-600
  static const Color onSecondary          = Color(0xFFFDF4F2);
  static const Color secondaryContainer   = Color(0xFFF8D7D3); // blush-200
  static const Color onSecondaryContainer = Color(0xFF5C0F1F); // maroon-800

  static const Color tertiary             = Color(0xFF8B6F2E); // gold-700
  static const Color onTertiary           = Color(0xFFFFFFFF);
  static const Color tertiaryContainer    = Color(0xFFB8964A); // gold-500
  static const Color onTertiaryContainer  = Color(0xFF3E2B2E); // ink-700
  static const Color tertiaryFixed        = Color(0xFFF5E8C9); // gold soft bg
  static const Color tertiaryFixedDim     = Color(0xFFD9B96B); // gold-300

  static const Color error                = Color(0xFFB5352F); // status-error
  static const Color onError              = Color(0xFFFFFFFF);
  static const Color errorContainer       = Color(0xFFFFDAD6);

  // ── Surfaces ──────────────────────────────────────────────────────────────
  static const Color surface                  = Color(0xFFFCE8E6); // blush-100 — primary bg
  static const Color onSurface               = Color(0xFF1C0A0C); // ink-900
  static const Color surfaceVariant           = Color(0xFFF8D7D3); // blush-200
  static const Color onSurfaceVariant         = Color(0xFF3E2B2E); // ink-700
  static const Color surfaceContainerLowest   = Color(0xFFFFFFFF); // card surface
  static const Color surfaceContainerLow      = Color(0xFFFDF4F2); // blush-50
  static const Color surfaceContainer         = Color(0xFFF8D7D3); // blush-200
  static const Color surfaceContainerHigh     = Color(0xFFF2BEB8); // blush-300
  static const Color surfaceContainerHighest  = Color(0xFFEBD2CF); // iuea-line

  static const Color background   = Color(0xFFFCE8E6); // = surface (blush-100)
  static const Color onBackground = Color(0xFF1C0A0C); // ink-900
  static const Color outline      = Color(0xFF6B5456); // ink-500
  static const Color outlineVariant = Color(0xFFEBD2CF); // iuea-line

  // ── Legacy aliases (kept so existing screens compile unchanged) ────────────
  static const Color primaryDark  = Color(0xFF3D0810); // maroon-900
  static const Color primaryLight = Color(0xFFA6182F); // maroon-600
  static const Color accent       = Color(0xFFB8964A); // gold-500
  static const Color accentLight  = Color(0xFFD9B96B); // gold-300
  static const Color surfaceDark  = Color(0xFF1A0F10); // bg-reader-dark
  static const Color backgroundDark = Color(0xFF1A0F10);
  static const Color textPrimary   = Color(0xFF1C0A0C); // ink-900
  static const Color textSecondary = Color(0xFF3E2B2E); // ink-700
  static const Color textHint      = Color(0xFFA89597); // ink-300
  static const Color border        = Color(0xFFEBD2CF); // iuea-line

  // ── Neutrals ──────────────────────────────────────────────────────────────
  static const Color white   = Color(0xFFFFFFFF);
  static const Color black   = Color(0xFF1C0A0C);
  static const Color grey100 = Color(0xFFF5F5F5);
  static const Color grey300 = Color(0xFFE0E0E0);
  static const Color grey500 = Color(0xFF9E9E9E);
  static const Color grey700 = Color(0xFF616161);

  // ── Semantic status ────────────────────────────────────────────────────────
  static const Color success = Color(0xFF2E7D5B); // status-success
  static const Color warning = Color(0xFFD07E1A); // status-warning
  static const Color info    = Color(0xFF8A1228); // = primary maroon

  // ── Reader themes ──────────────────────────────────────────────────────────
  static const Color readerLight = Color(0xFFFFFFFF);
  static const Color readerSepia = Color(0xFFF3E7CF); // bg-reader-sepia
  static const Color readerDark  = Color(0xFF1A0F10); // bg-reader-dark
}
