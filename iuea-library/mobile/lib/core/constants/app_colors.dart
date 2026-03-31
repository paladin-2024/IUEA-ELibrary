import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // ── Brand ──────────────────────────────────────────────────────────────────
  static const Color primary      = Color(0xFF7B0D1E);
  static const Color primaryDark  = Color(0xFF4A0810);
  static const Color primaryLight = Color(0xFF9B2D3E);
  static const Color accent       = Color(0xFFC9A84C);
  static const Color accentLight  = Color(0xFFE8C97A);

  // ── Surfaces ───────────────────────────────────────────────────────────────
  static const Color surface      = Color(0xFFFDF6F7);
  static const Color surfaceDark  = Color(0xFF2A0D12);
  static const Color background   = Color(0xFFFFFFFF);
  static const Color backgroundDark = Color(0xFF1A0508);

  // ── Text ───────────────────────────────────────────────────────────────────
  static const Color textPrimary   = Color(0xFF1A0508);
  static const Color textSecondary = Color(0xFF6B7280);
  static const Color textHint      = Color(0xFF9CA3AF);

  // ── Borders ────────────────────────────────────────────────────────────────
  static const Color border       = Color(0xFFE5D0D2);

  // ── Neutral aliases (kept for existing screen usage) ──────────────────────
  static const Color white        = Color(0xFFFFFFFF);
  static const Color black        = Color(0xFF1A0508);
  static const Color grey100      = Color(0xFFF5F5F5);
  static const Color grey300      = Color(0xFFE0E0E0);
  static const Color grey500      = Color(0xFF9E9E9E);
  static const Color grey700      = Color(0xFF616161);

  // ── Semantic ───────────────────────────────────────────────────────────────
  static const Color success      = Color(0xFF16A34A);
  static const Color error        = Color(0xFFDC2626);
  static const Color warning      = Color(0xFFF59E0B);
  static const Color info         = Color(0xFF01579B);

  // ── Reader themes ──────────────────────────────────────────────────────────
  static const Color readerLight  = Color(0xFFFFFFFF);
  static const Color readerSepia  = Color(0xFFF4E4C1);
  static const Color readerDark   = Color(0xFF1A1A2E);
}
