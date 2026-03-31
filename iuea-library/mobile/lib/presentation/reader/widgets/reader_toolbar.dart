import 'package:flutter/material.dart';
import '../../../data/models/book_model.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';

class ReaderBottomToolbar extends StatelessWidget {
  final BookModel        book;
  final ReaderProvider   reader;
  final VoidCallback     onBack;
  final VoidCallback     onSettings;
  final VoidCallback     onLanguageSwitcher;
  final VoidCallback     onTts;

  const ReaderBottomToolbar({
    super.key,
    required this.book,
    required this.reader,
    required this.onBack,
    required this.onSettings,
    required this.onLanguageSwitcher,
    required this.onTts,
  });

  Color get _bgColor => switch (reader.theme) {
    ReaderTheme.sepia => AppColors.readerSepia,
    ReaderTheme.dark  => AppColors.readerDark,
    _                 => AppColors.readerLight,
  };

  Color get _fgColor => reader.theme == ReaderTheme.dark
      ? AppColors.white
      : AppColors.textPrimary;

  Color get _borderColor => reader.theme == ReaderTheme.dark
      ? Colors.white12
      : Colors.black12;

  @override
  Widget build(BuildContext context) {
    final pct = reader.percentComplete.clamp(0, 100).toDouble();

    return Material(
      color:   _bgColor,
      elevation: 0,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Progress bar
          Container(
            height: 3,
            color:  _borderColor,
            child: FractionallySizedBox(
              widthFactor: pct / 100,
              alignment:   Alignment.centerLeft,
              child: Container(color: AppColors.primary),
            ),
          ),

          // Toolbar buttons
          Container(
            decoration: BoxDecoration(
              border: Border(top: BorderSide(color: _borderColor, width: 0.5)),
            ),
            child: SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _ToolBtn(
                      icon:    Icons.arrow_back,
                      label:   'Back',
                      color:   _fgColor,
                      onTap:   onBack,
                    ),
                    _ToolBtn(
                      icon:    Icons.menu_book_outlined,
                      label:   'Contents',
                      color:   _fgColor,
                      onTap:   () => reader.toggleTOC(),
                      active:  reader.showTOC,
                    ),
                    _ToolBtn(
                      icon:    Icons.translate,
                      label:   'Translate',
                      color:   _fgColor,
                      onTap:   onLanguageSwitcher,
                      active:  reader.translatedContent != null,
                    ),
                    _ToolBtn(
                      icon:    Icons.text_fields,
                      label:   'Font',
                      color:   _fgColor,
                      onTap:   onSettings,
                    ),
                    _ToolBtn(
                      icon:    Icons.brightness_4_outlined,
                      label:   'Theme',
                      color:   _fgColor,
                      onTap:   () {
                        final next = switch (reader.theme) {
                          ReaderTheme.light => ReaderTheme.sepia,
                          ReaderTheme.sepia => ReaderTheme.dark,
                          ReaderTheme.dark  => ReaderTheme.light,
                        };
                        reader.setTheme(next);
                      },
                    ),
                    _ToolBtn(
                      icon:    reader.isTtsPlaying
                          ? Icons.stop_circle_outlined
                          : Icons.volume_up_outlined,
                      label:   reader.isTtsPlaying ? 'Stop' : 'Listen',
                      color:   _fgColor,
                      onTap:   onTts,
                      active:  reader.isTtsPlaying,
                    ),
                    _ToolBtn(
                      icon:    Icons.chat_bubble_outline,
                      label:   'Ask AI',
                      color:   _fgColor,
                      onTap:   () => reader.toggleChat(),
                      active:  reader.isChatOpen,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ToolBtn extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final Color        color;
  final VoidCallback onTap;
  final bool         active;

  const _ToolBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
    this.active = false,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveColor = active ? AppColors.primary : color;
    return InkWell(
      onTap:        onTap,
      borderRadius: BorderRadius.circular(AppSpacing.sm),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: effectiveColor),
            const SizedBox(height: 2),
            Text(
              label,
              style: TextStyle(fontSize: 9, color: effectiveColor),
            ),
          ],
        ),
      ),
    );
  }
}
