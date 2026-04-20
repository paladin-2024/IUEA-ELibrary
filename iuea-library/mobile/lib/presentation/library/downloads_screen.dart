import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/services/download_service.dart';

class DownloadsScreen extends StatefulWidget {
  const DownloadsScreen({super.key});

  @override
  State<DownloadsScreen> createState() => _DownloadsScreenState();
}

class _DownloadsScreenState extends State<DownloadsScreen> {
  final _service = DownloadService();
  late Future<List<DownloadedBook>> _future;

  @override
  void initState() {
    super.initState();
    _reload();
  }

  void _reload() => setState(() => _future = _service.getDownloads());

  Future<void> _delete(DownloadedBook book) async {
    await _service.deleteDownload(book.id);
    _reload();
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('"${book.title}" removed from offline.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── App bar ─────────────────────────────────────────────────────
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
                    fontFamily: GoogleFonts.playfairDisplay().fontFamily)),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.notifications_none_rounded,
                    color: AppColors.textPrimary, size: 22),
                  onPressed: () => context.push('/notifications'),
                ),
              ]),
            ),

            // ── Heading ─────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
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
                      'READ WITHOUT INTERNET',
                      style: TextStyle(
                        fontSize: 9, fontWeight: FontWeight.w700,
                        letterSpacing: 1.2, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),

            // ── List ────────────────────────────────────────────────────────
            Expanded(
              child: FutureBuilder<List<DownloadedBook>>(
                future: _future,
                builder: (context, snap) {
                  if (snap.connectionState == ConnectionState.waiting) {
                    return const Center(
                      child: CircularProgressIndicator(
                        color: AppColors.primary));
                  }

                  final books = snap.data ?? [];

                  if (books.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.download_outlined,
                            size: 56,
                            color: AppColors.textHint.withOpacity(0.4)),
                          const SizedBox(height: 12),
                          Text('No offline books yet',
                            style: AppTextStyles.body.copyWith(
                              color: AppColors.textHint)),
                          const SizedBox(height: 6),
                          Text(
                            'Open a book and tap "Download for Offline"',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 12, color: AppColors.textHint)),
                        ],
                      ),
                    );
                  }

                  // Storage summary
                  final totalBytes = books.fold<int>(
                    0, (sum, b) => sum + b.fileSizeBytes);
                  final usedMb  = totalBytes / (1024 * 1024);
                  const limitMb = 2048.0;
                  final pct     = (usedMb / limitMb).clamp(0.0, 1.0);

                  return Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
                        child: Container(
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
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    'Using ${usedMb.toStringAsFixed(1)} MB',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize: 12,
                                      color: AppColors.textSecondary)),
                                  Text('Limit: 2.0 GB',
                                    style: AppTextStyles.label.copyWith(
                                      color: AppColors.textHint)),
                                ],
                              ),
                              const SizedBox(height: 8),
                              LinearProgressIndicator(
                                value:           pct,
                                backgroundColor: AppColors.grey300,
                                valueColor: const AlwaysStoppedAnimation(
                                  AppColors.primary),
                                minHeight:    6,
                                borderRadius: BorderRadius.circular(3)),
                            ],
                          ),
                        ),
                      ),
                      Expanded(
                        child: ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount:   books.length,
                          separatorBuilder: (_, __) =>
                            const SizedBox(height: 10),
                          itemBuilder: (_, i) => _DownloadRow(
                            book:     books[i],
                            onDelete: () => _delete(books[i]),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ),

            // ── Footer ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 14),
              child: Column(children: [
                Text('POWERED BY GOOGLE',
                  style: TextStyle(
                    fontFamily: GoogleFonts.inter().fontFamily,
                    fontSize: 9, letterSpacing: 1.4,
                    color: AppColors.textHint.withOpacity(0.6))),
              ]),
            ),
          ],
        ),
      ),
    );
  }
}

class _DownloadRow extends StatelessWidget {
  final DownloadedBook book;
  final VoidCallback   onDelete;
  const _DownloadRow({required this.book, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Row(children: [
        // Format icon
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
                book.fileFormat == 'pdf'
                  ? Icons.picture_as_pdf_rounded
                  : Icons.book_rounded,
                color: AppColors.primary, size: 22),
              const SizedBox(height: 2),
              Text(book.fileFormat.toUpperCase(),
                style: TextStyle(
                  fontFamily: GoogleFonts.inter().fontFamily,
                  fontSize: 8, fontWeight: FontWeight.w700,
                  color: AppColors.primary, letterSpacing: 0.5)),
            ],
          ),
        ),
        const SizedBox(width: 12),

        // Info
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(book.title,
              style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w600, fontSize: 13),
              maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Text(book.author,
              style: AppTextStyles.label.copyWith(
                color: AppColors.textSecondary, fontSize: 11),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 4),
            Row(children: [
              const Icon(Icons.check_circle_rounded,
                color: AppColors.success, size: 13),
              const SizedBox(width: 4),
              Text(book.sizeLabel,
                style: AppTextStyles.label.copyWith(
                  fontSize: 10, color: AppColors.textHint)),
            ]),
          ],
        )),

        // Delete
        IconButton(
          icon: const Icon(Icons.close_rounded,
            size: 18, color: AppColors.textHint),
          onPressed: () => showDialog(
            context: context,
            builder: (_) => AlertDialog(
              title: const Text('Remove offline copy?'),
              content: Text(
                '"${book.title}" will be removed from your device.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel')),
                TextButton(
                  onPressed: () { Navigator.pop(context); onDelete(); },
                  child: const Text('Remove',
                    style: TextStyle(color: AppColors.primary))),
              ],
            ),
          ),
        ),
      ]),
    );
  }
}
