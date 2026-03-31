import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import '../../data/models/book_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class BookCard extends StatelessWidget {
  final BookModel book;
  final double    width;
  const BookCard({super.key, required this.book, this.width = 130});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => context.push('/books/${book.id}'),
      child: SizedBox(
        width: width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: AspectRatio(
                aspectRatio: 2 / 3,
                child: book.coverUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl:   book.coverUrl,
                        fit:        BoxFit.cover,
                        placeholder: (_, __) => Shimmer.fromColors(
                          baseColor:     AppColors.grey300,
                          highlightColor: AppColors.grey100,
                          child: Container(color: AppColors.grey300),
                        ),
                        errorWidget: (_, __, ___) => _placeholder(),
                      )
                    : _placeholder(),
              ),
            ),
            const SizedBox(height: 6),
            Text(
              book.title,
              style:     AppTextStyles.subtitle2,
              maxLines:  2,
              overflow:  TextOverflow.ellipsis,
            ),
            if (book.author.isNotEmpty)
              Text(
                book.author.first,
                style:    AppTextStyles.caption,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
      ),
    );
  }

  Widget _placeholder() => Container(
    color: AppColors.primary.withOpacity(0.08),
    child: const Center(
      child: Icon(Icons.book_outlined, color: AppColors.primary, size: 32),
    ),
  );
}
