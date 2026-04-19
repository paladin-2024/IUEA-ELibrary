import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';

class ReaderToolbar extends StatefulWidget {
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
  State<ReaderToolbar> createState() => _ReaderToolbarState();
}

class _ReaderToolbarState extends State<ReaderToolbar> {
  bool _bookmarked = false;

  @override
  Widget build(BuildContext context) {
    final isDark     = widget.reader.theme == 'dark';
    final iconColor  = isDark ? AppColors.white : AppColors.textPrimary;
    final labelColor = isDark
        ? AppColors.white.withOpacity(0.5)
        : AppColors.textSecondary;
    final barBg = isDark ? const Color(0xFF0D0D1A) : widget.bgColor;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Container(
          decoration: BoxDecoration(
            color: barBg.withOpacity(isDark ? 0.97 : 0.95),
            border: Border(
              top: BorderSide(
                color: isDark
                    ? Colors.white.withOpacity(0.09)
                    : Colors.black.withOpacity(0.07),
                width: 0.5,
              ),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // ── Progress bar ───────────────────────────────────────────────
              LinearProgressIndicator(
                value:           (widget.reader.percentComplete / 100).clamp(0.0, 1.0),
                color:           AppColors.primary,
                backgroundColor: isDark
                    ? Colors.white.withOpacity(0.08)
                    : Colors.black.withOpacity(0.05),
                minHeight: 2,
              ),

              // ── 5 action buttons ───────────────────────────────────────────
              SafeArea(
                top: false,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      // INDEX
                      _ToolBtn(
                        icon:    Icons.format_list_bulleted_rounded,
                        label:   'Index',
                        color:   widget.reader.showTOC ? AppColors.primary : iconColor,
                        lblClr:  widget.reader.showTOC ? AppColors.primary : labelColor,
                        onTap:   widget.onTOCTap,
                      ),
                      // STYLE
                      _ToolBtn(
                        icon:    Icons.text_fields_rounded,
                        label:   'Style',
                        color:   iconColor,
                        lblClr:  labelColor,
                        onTap:   widget.onFontTap,
                      ),
                      // BOOKMARK
                      _ToolBtn(
                        icon:    _bookmarked
                            ? Icons.bookmark_rounded
                            : Icons.bookmark_border_rounded,
                        label:   'Bookmark',
                        color:   _bookmarked ? AppColors.primary : iconColor,
                        lblClr:  _bookmarked ? AppColors.primary : labelColor,
                        onTap:   () => setState(() => _bookmarked = !_bookmarked),
                      ),
                      // FIND
                      _ToolBtn(
                        icon:    Icons.search_rounded,
                        label:   'Find',
                        color:   iconColor,
                        lblClr:  labelColor,
                        onTap:   () {},
                      ),
                      // AUDIO
                      _ToolBtn(
                        icon:    widget.reader.isPlaying
                            ? Icons.headphones_rounded
                            : Icons.headphones_outlined,
                        label:   'Audio',
                        color:   widget.reader.isPlaying ? AppColors.primary : iconColor,
                        lblClr:  widget.reader.isPlaying ? AppColors.primary : labelColor,
                        onTap:   widget.onTtsTap,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Individual toolbar button ────────────────────────────────────────────────
class _ToolBtn extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final Color        color;
  final Color        lblClr;
  final VoidCallback onTap;

  const _ToolBtn({
    required this.icon,
    required this.label,
    required this.color,
    required this.lblClr,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap:        onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 3),
            Text(
              label,
              style: TextStyle(
                fontFamily:    'Inter',
                fontSize:      9,
                color:         lblClr,
                letterSpacing: 0.3,
                fontWeight:    FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
