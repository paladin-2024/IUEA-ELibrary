/// Spacing constants — use these everywhere instead of raw doubles.
/// Keeps the design system consistent across the app.
class AppSpacing {
  AppSpacing._();

  static const double xs   =  4.0;
  static const double sm   =  8.0;
  static const double md   = 16.0;
  static const double lg   = 24.0;
  static const double xl   = 32.0;
  static const double xxl  = 48.0;
  static const double xxxl = 64.0;

  // ── Layout ─────────────────────────────────────────────────────────────────
  static const double pagePadding   = 16.0;
  static const double cardPadding   = 16.0;
  static const double sectionGap    = 24.0;
  static const double itemGap       = 12.0;

  // ── Border radii ───────────────────────────────────────────────────────────
  static const double cardRadius    = 12.0;
  static const double btnRadius     =  8.0;
  static const double inputRadius   =  6.0;
  static const double chipRadius    = 20.0;
  static const double avatarRadius  = 50.0;
}

/// Semantic radius tokens — matches Stitch design system exactly.
class AppRadius {
  AppRadius._();

  static const double sm   =  4.0;   // Stitch "DEFAULT"
  static const double md   =  8.0;   // Stitch "lg"
  static const double lg   = 12.0;   // Stitch "xl"
  static const double xl   = 16.0;   // 16px
  static const double xxl  = 20.0;   // rounded-2xl
  static const double xxxl = 24.0;   // rounded-3xl
  static const double full = 999.0;  // pill / circle
}
