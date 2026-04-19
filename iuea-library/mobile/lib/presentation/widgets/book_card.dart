import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/models/book_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

class BookCard extends StatelessWidget {
  final BookModel book;
  final double    width;
  final bool      showProgress;
  final double    progress; // 0.0 – 1.0

  const BookCard({
    super.key,
    required this.book,
    this.width        = 130,
    this.showProgress = false,
    this.progress     = 0,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/books/${book.id}'),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Cover ───────────────────────────────────────────────────────
            Stack(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                  child: AspectRatio(
                    aspectRatio: 2 / 3,
                    child: book.hasCover
                        ? CachedNetworkImage(
                            imageUrl:    book.coverUrl!,
                            fit:         BoxFit.cover,
                            placeholder: (_, __) => _shimmer(),
                            errorWidget: (_, __, ___) => _placeholder(),
                          )
                        : _placeholder(),
                  ),
                ),
                // Availability badge — top-right overlay
                if (book.availability != null)
                  Positioned(
                    top:   8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color:        _isAvailable
                            ? Colors.green.withOpacity(0.90)
                            : Colors.amber.withOpacity(0.90),
                        borderRadius: BorderRadius.circular(AppSpacing.chipRadius),
                      ),
                      child: Text(
                        _isAvailable
                            ? '${book.availability!['available']} avail.'
                            : 'Out',
                        style: const TextStyle(
                          color:      AppColors.white,
                          fontSize:   10,
                          fontWeight: FontWeight.w500,
                          height:     1,
                        ),
                      ),
                    ),
                  ),

                // Progress bar overlay
                if (showProgress && progress > 0)
                  Positioned(
                    bottom: 0,
                    left:   0,
                    right:  0,
                    child: Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(
                          bottom: Radius.circular(AppSpacing.cardRadius),
                        ),
                        color: Colors.black.withOpacity(0.35),
                      ),
                      padding: const EdgeInsets.fromLTRB(6, 4, 6, 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          LinearProgressIndicator(
                            value:            progress,
                            color:            AppColors.primary,
                            backgroundColor:  AppColors.white.withOpacity(0.3),
                            minHeight:        3,
                            borderRadius:     BorderRadius.circular(2),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            '${(progress * 100).round()}% complete',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.white, fontSize: 9),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),

            const SizedBox(height: 6),

            // ── Title ────────────────────────────────────────────────────────
            Text(
              book.title,
              style:    AppTextStyles.body.copyWith(
                fontSize: 12, fontWeight: FontWeight.w600),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),

            // ── Author ───────────────────────────────────────────────────────
            if (book.author.isNotEmpty)
              Text(
                book.author,
                style:    AppTextStyles.label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),

            // ── Language badges ───────────────────────────────────────────────
            if (book.languages.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Wrap(
                  spacing: 4,
                  runSpacing: 2,
                  children: book.languages.take(2).map((lang) => Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color:        AppColors.primaryContainer.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                    child: Text(
                      lang,
                      style: const TextStyle(
                        color:    AppColors.primaryContainer,
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  )).toList(),
                ),
              ),

          ],
        ),
      ),
    );
  }

  bool get _isAvailable =>
      (book.availability?['available'] as int? ?? 0) > 0;

  Widget _placeholder() => Container(
    color: AppColors.primary.withOpacity(0.08),
    child: const Center(
      child: Icon(Icons.book_outlined, color: AppColors.primary, size: 28),
    ),
  );

  Widget _shimmer() => Shimmer.fromColors(
    baseColor:      AppColors.grey300,
    highlightColor: AppColors.grey100,
    child: Container(color: AppColors.grey300),
  );
}
