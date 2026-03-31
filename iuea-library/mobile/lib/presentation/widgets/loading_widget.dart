import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class LoadingWidget extends StatelessWidget {
  final double size;
  const LoadingWidget({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: SizedBox(
        width:  size,
        height: size,
        child:  const CircularProgressIndicator(
          strokeWidth:  3,
          valueColor:   AlwaysStoppedAnimation<Color>(AppColors.primary),
        ),
      ),
    );
  }
}

class ShimmerCard extends StatelessWidget {
  final double height;
  final double? width;
  final double  borderRadius;
  const ShimmerCard({super.key, this.height = 100, this.width, this.borderRadius = 8});

  @override
  Widget build(BuildContext context) {
    return Container(
      height:       height,
      width:        width,
      decoration:   BoxDecoration(
        color:        AppColors.grey300,
        borderRadius: BorderRadius.circular(borderRadius),
      ),
    );
  }
}
