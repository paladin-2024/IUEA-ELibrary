import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';

/// ShimmerCard — loading placeholder matching BookCard proportions.
class ShimmerCard extends StatelessWidget {
  /// Set [isGrid] = true for full-width grid variant.
  final bool   isGrid;
  final double width;

  const ShimmerCard({
    super.key,
    this.isGrid = false,
    this.width  = 140,
  });

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor:      AppColors.grey300,
      highlightColor: Colors.grey[100]!,
      child: SizedBox(
        width: isGrid ? double.infinity : width,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Cover placeholder
            AspectRatio(
              aspectRatio: 2 / 3,
              child: Container(
                decoration: BoxDecoration(
                  color:        Colors.white,
                  borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                ),
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            // Title line
            Container(
              height:       12,
              width:        double.infinity * 0.85,
              decoration: BoxDecoration(
                color:        Colors.white,
                borderRadius: BorderRadius.circular(AppSpacing.sm),
              ),
            ),

            const SizedBox(height: AppSpacing.xs),

            // Author line
            Container(
              height: 10,
              width:  isGrid ? 120 : 80,
              decoration: BoxDecoration(
                color:        Colors.white,
                borderRadius: BorderRadius.circular(AppSpacing.sm),
              ),
            ),

            const SizedBox(height: AppSpacing.sm),

            // Progress bar line
            Container(
              height: 6,
              width:  double.infinity,
              decoration: BoxDecoration(
                color:        Colors.white,
                borderRadius: BorderRadius.circular(AppSpacing.sm),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Horizontal row of shimmer cards for carousels.
class ShimmerCardRow extends StatelessWidget {
  final int count;
  const ShimmerCardRow({super.key, this.count = 4});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 220,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
        itemCount:   count,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpacing.sm),
        itemBuilder:      (_, __)  => const ShimmerCard(),
      ),
    );
  }
}

/// 2-column shimmer grid.
class ShimmerCardGrid extends StatelessWidget {
  final int count;
  const ShimmerCardGrid({super.key, this.count = 6});

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics:    const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount:   2,
        crossAxisSpacing: AppSpacing.sm,
        mainAxisSpacing:  AppSpacing.md,
        childAspectRatio: 0.58,
      ),
      itemCount:   count,
      itemBuilder: (_, __) => const ShimmerCard(isGrid: true),
    );
  }
}
