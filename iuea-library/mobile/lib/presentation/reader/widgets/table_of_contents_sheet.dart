import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class TableOfContentsSheet extends StatelessWidget {
  final String bookId;
  const TableOfContentsSheet({super.key, required this.bookId});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();
    final book   = reader.currentBook;
    final pct    = reader.percentComplete.clamp(0.0, 100.0);

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize:     0.5,
      maxChildSize:     0.92,
      expand:           false,
      builder: (ctx, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color:        AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // ── Handle ─────────────────────────────────────────────────────
              const SizedBox(height: 12),
              Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color:        AppColors.grey300,
                    borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

              // ── Header ─────────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('DIGITAL CURATOR',
                        style: const TextStyle(
                          fontFamily:    'Inter',
                          fontSize:      9,
                          letterSpacing: 1.2,
                          color:         AppColors.textHint,
                          fontWeight:    FontWeight.w500)),
                      const SizedBox(height: 2),
                      Text('Contents',
                        style: AppTextStyles.h1.copyWith(
                          fontSize: 22, color: AppColors.textPrimary)),
                    ],
                  ),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color:        AppColors.grey100,
                        borderRadius: BorderRadius.circular(16)),
                      child: const Icon(Icons.close_rounded,
                        size: 16, color: AppColors.textSecondary),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 12),

              // ── Progress row ───────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(children: [
                  Text('${pct.toInt()}% Completed',
                    style: AppTextStyles.label.copyWith(
                      color:      AppColors.primary,
                      fontWeight: FontWeight.w600,
                      fontSize:   12)),
                  const Spacer(),
                  Text('Premium Access',
                    style: AppTextStyles.label.copyWith(
                      color:      AppColors.accent,
                      fontSize:   12,
                      fontWeight: FontWeight.w600)),
                ]),
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value:           pct / 100,
                    color:           AppColors.primary,
                    backgroundColor: AppColors.border,
                    minHeight:       3,
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // ── Book info card ─────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color:        AppColors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(
                      color: Colors.black.withOpacity(0.04), blurRadius: 8,
                      offset: const Offset(0, 2))],
                  ),
                  child: Row(children: [
                    Container(
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        color:        AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(10)),
                      child: const Icon(Icons.menu_book_rounded,
                        color: AppColors.primary, size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(book?.title ?? 'Book',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.w600, fontSize: 14),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                        Text(book?.author ?? '',
                          style: AppTextStyles.label.copyWith(
                            color: AppColors.textHint, fontSize: 12)),
                      ],
                    )),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Chapter ${reader.currentChapter + 1}',
                          style: AppTextStyles.label.copyWith(
                            color:      AppColors.primary,
                            fontWeight: FontWeight.w600,
                            fontSize:   12)),
                        if (book?.pageCount != null)
                          Text('of ${book!.pageCount} pages',
                            style: AppTextStyles.label.copyWith(
                              color:    AppColors.textHint,
                              fontSize: 11)),
                      ],
                    ),
                  ]),
                ),
              ),

              const Spacer(),

              // ── Reading language info ──────────────────────────────────────
              if (reader.readingLanguage != 'English')
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color:        AppColors.primary.withOpacity(0.06),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.2)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.translate_rounded,
                        size: 14, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text(
                        'Reading in ${reader.readingLanguage}',
                        style: AppTextStyles.label.copyWith(
                          color: AppColors.primary, fontSize: 12)),
                    ]),
                  ),
                ),

              // ── Save Progress button ───────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                child: SafeArea(
                  top: false,
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        await reader.saveProgress(bookId);
                        if (context.mounted) Navigator.of(context).pop();
                      },
                      icon:  const Icon(Icons.bookmark_rounded, size: 18),
                      label: const Text('Save Progress'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12))),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
