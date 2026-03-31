import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/constants/app_text_styles.dart';

class ReaderToolbar extends StatelessWidget {
  final ReaderProvider reader;
  final VoidCallback   onFontTap;
  final VoidCallback   onLanguageTap;
  final VoidCallback   onTtsTap;
  final VoidCallback   onModeTap;
  final VoidCallback   onTOCTap;
  final VoidCallback   onChatTap;
  final Color          bgColor;

  const ReaderToolbar({
    super.key,
    required this.reader,
    required this.onFontTap,
    required this.onLanguageTap,
    required this.onTtsTap,
    required this.onModeTap,
    required this.onTOCTap,
    required this.onChatTap,
    required this.bgColor,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = reader.theme == 'dark';
    final iconColor  = isDark ? AppColors.white  : AppColors.textPrimary;
    final labelColor = isDark ? AppColors.white.withOpacity(0.6)
                               : AppColors.textSecondary;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          decoration: BoxDecoration(
            color: bgColor.withOpacity(0.92),
            border: Border(
              top: BorderSide(
                color: isDark
                    ? Colors.white.withOpacity(0.12)
                    : Colors.black.withOpacity(0.08),
                width: 0.5,
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── 7 action buttons ────────────────────────────────────────
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    vertical: AppSpacing.xs),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _ToolItem(
                        icon:     Icons.format_size,
                        label:    'Font',
                        color:    iconColor,
                        lblColor: labelColor,
                        onTap:    onFontTap,
                      ),
                      _ToolItem(
                        icon:     Icons.brightness_6,
                        label:    'Theme',
                        color:    iconColor,
                        lblColor: labelColor,
                        onTap: () {
                          const cycle = ['white', 'sepia', 'dark'];
                          final idx   = cycle.indexOf(reader.theme);
                          reader.setTheme(cycle[(idx + 1) % cycle.length]);
                        },
                      ),
                      _ToolItem(
                        icon:     reader.isPlaying
                            ? Icons.stop_circle_outlined
                            : Icons.mic,
                        label:    reader.isPlaying ? 'Stop' : 'Listen',
                        color:    reader.isPlaying ? AppColors.primary : iconColor,
                        lblColor: reader.isPlaying ? AppColors.primary : labelColor,
                        onTap:    onTtsTap,
                      ),
                      _ToolItem(
                        icon:     Icons.translate,
                        label:    'Translate',
                        color:    reader.readingLanguage != 'English'
                            ? AppColors.primary
                            : iconColor,
                        lblColor: reader.readingLanguage != 'English'
                            ? AppColors.primary
                            : labelColor,
                        onTap:    onLanguageTap,
                      ),
                      _ToolItem(
                        icon:     Icons.menu_book_outlined,
                        label:    'Contents',
                        color:    reader.showTOC ? AppColors.primary : iconColor,
                        lblColor: reader.showTOC ? AppColors.primary : labelColor,
                        onTap:    onTOCTap,
                      ),
                      _ToolItem(
                        icon:     Icons.highlight,
                        label:    'Highlight',
                        color:    iconColor,
                        lblColor: labelColor,
                        onTap:    () {}, // selection-based, always active
                      ),
                      _ToolItem(
                        icon:     Icons.smart_toy_outlined,
                        label:    'Ask AI',
                        color:    reader.showChatbot ? AppColors.primary : iconColor,
                        lblColor: reader.showChatbot ? AppColors.primary : labelColor,
                        onTap:    onChatTap,
                      ),
                    ],
                  ),
                ),
              ),

              // ── Progress bar ─────────────────────────────────────────────
              LinearProgressIndicator(
                value:            (reader.percentComplete / 100).clamp(0.0, 1.0),
                color:            AppColors.primary,
                backgroundColor:  isDark
                    ? Colors.white.withOpacity(0.1)
                    : Colors.black.withOpacity(0.08),
                minHeight:        3,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Individual toolbar icon + label ──────────────────────────────────────────
class _ToolItem extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final Color        color;
  final Color        lblColor;
  final VoidCallback onTap;

  const _ToolItem({
    required this.icon,
    required this.label,
    required this.color,
    required this.lblColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap:        onTap,
      borderRadius: BorderRadius.circular(AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.xs, vertical: AppSpacing.xs + 2),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTextStyles.label.copyWith(
                fontSize: 9, color: lblColor),
            ),
          ],
        ),
      ),
    );
  }
}
