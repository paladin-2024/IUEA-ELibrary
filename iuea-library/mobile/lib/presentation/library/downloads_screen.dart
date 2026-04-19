import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'package:google_fonts/google_fonts.dart';

// Placeholder download item model
class _DownloadItem {
  final String title;
  final String size;
  final String format;
  final bool   isComplete;
  final double progress; // 0-1
  const _DownloadItem({
    required this.title,
    required this.size,
    required this.format,
    this.isComplete = true,
    this.progress   = 1.0,
  });
}

const _mockDownloads = [
  _DownloadItem(
    title:  'The Architecture of Li...',
    size:   '12.4 MB', format: 'PDF', isComplete: true),
  _DownloadItem(
    title:  'Digital Ethnography',
    size:   '45.8 MB', format: 'EPUB',
    isComplete: false, progress: 0.64),
  _DownloadItem(
    title:  'Principles of East Afri...',
    size:   '8.3 MB', format: 'PDF', isComplete: true),
  _DownloadItem(
    title:  "The Curator's Journa...",
    size:   '16.0 MB', format: 'MP3', isComplete: true),
];

class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const usedMb  = 240;
    const totalGb = 2.0;
    final usedPct = usedMb / (totalGb * 1024);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── App bar ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
              child: Row(children: [
                Image.asset(
                  'assets/images/iuea_logo.png',
                  width: 26, height: 26,
                  errorBuilder: (_, __, ___) =>
                    const Icon(Icons.school_rounded,
                      color: AppColors.primary, size: 22),
                ),
                const SizedBox(width: 8),
                Text('IUEA Library',
                  style: AppTextStyles.h3.copyWith(
                    color: AppColors.primary, fontSize: 15,
                    fontFamily: GoogleFonts.lora().fontFamily)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.notifications_none_rounded,
                    color: AppColors.textPrimary, size: 22),
                  onPressed: () {},
                ),
              ]),
            ),

            // ── Heading ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Offline Downloads',
                    style: AppTextStyles.h1.copyWith(
                      fontSize: 26, color: AppColors.textPrimary)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color:        AppColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.2)),
                    ),
                    child: Text(
                      'LIBRARY CURATOR ACCESS',
                      style: TextStyle(
                        fontSize:      9,
                        fontWeight:    FontWeight.w700,
                        letterSpacing: 1.2,
                        color:         AppColors.primary),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Storage bar ─────────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:        AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(
                        color: Colors.black.withOpacity(0.04),
                        blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('Using ${usedMb} MB of offline storage',
                              style: AppTextStyles.bodySmall.copyWith(
                                fontSize: 12, color: AppColors.textSecondary)),
                            Text('Total: ${totalGb.toStringAsFixed(1)} GB',
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.textHint)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value:           usedPct,
                          backgroundColor: AppColors.grey300,
                          valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                          minHeight:    6,
                          borderRadius: BorderRadius.circular(3)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // ── List ─────────────────────────────────────────────────────
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount:        _mockDownloads.length,
                separatorBuilder: (_, __) => const SizedBox(height: 10),
                itemBuilder:      (_, i) =>
                    _DownloadRow(item: _mockDownloads[i]),
              ),
            ),

            // ── Footer ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Column(children: [
                Text('POWERED BY GOOGLE',
                  style: TextStyle(
                    fontFamily: GoogleFonts.inter().fontFamily, fontSize: 9, letterSpacing: 1.4,
                    color: AppColors.textHint.withOpacity(0.6))),
                const SizedBox(height: 3),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  _fl('Privacy'), _fd(), _fl('Terms'), _fd(), _fl('Books API'),
                ]),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  static Widget _fl(String t) => Text(t, style: TextStyle(
    fontFamily: GoogleFonts.inter().fontFamily, fontSize: 10,
    color: AppColors.textHint.withOpacity(0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withOpacity(0.3)));
  static Widget _fd() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·', style: TextStyle(
      fontSize: 10, color: AppColors.textHint.withOpacity(0.5))));
}

// ── Download row ──────────────────────────────────────────────────────────────
class _DownloadRow extends StatelessWidget {
  final _DownloadItem item;
  const _DownloadRow({required this.item});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withOpacity(0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: Row(children: [
        // Format icon box
        Container(
          width: 44, height: 58,
          decoration: BoxDecoration(
            color:        AppColors.primary.withOpacity(0.07),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                item.format == 'MP3'
                  ? Icons.audio_file_rounded
                  : item.format == 'EPUB'
                    ? Icons.book_rounded
                    : Icons.picture_as_pdf_rounded,
                color: AppColors.primary, size: 22),
              const SizedBox(height: 2),
              Text(item.format,
                style: TextStyle(
                  fontFamily: GoogleFonts.inter().fontFamily, fontSize: 8,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary, letterSpacing: 0.5)),
            ],
          ),
        ),
        const SizedBox(width: 12),

        // Info
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.title,
              style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w600, fontSize: 13),
              maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(item.size,
              style: AppTextStyles.label.copyWith(
                color: AppColors.textHint, fontSize: 11)),
            const SizedBox(height: 6),
            if (!item.isComplete) ...[
              LinearProgressIndicator(
                value:           item.progress,
                backgroundColor: AppColors.grey300,
                valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                minHeight:    3,
                borderRadius: BorderRadius.circular(2)),
              const SizedBox(height: 3),
              Text('${(item.progress * 100).toInt()}% COMPLETE',
                style: AppTextStyles.label.copyWith(
                  fontSize: 10, color: AppColors.textHint)),
            ] else
              Row(children: [
                const Icon(Icons.check_circle_rounded,
                  color: AppColors.success, size: 13),
                const SizedBox(width: 4),
                Text('DOWNLOADED',
                  style: AppTextStyles.label.copyWith(
                    fontSize: 10, color: AppColors.success,
                    fontWeight: FontWeight.w700)),
              ]),
          ],
        )),

        // Delete
        IconButton(
          icon: const Icon(Icons.close_rounded,
            size: 18, color: AppColors.textHint),
          onPressed: () {},
        ),
      ]),
    );
  }
}
