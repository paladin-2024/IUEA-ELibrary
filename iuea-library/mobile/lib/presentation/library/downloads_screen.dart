import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

class DownloadsScreen extends StatelessWidget {
  const DownloadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        title: Text('Offline Downloads', style: AppTextStyles.h3),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
            child: Text('LIBRARY CURATOR ACCESS',
              style: AppTextStyles.label.copyWith(color: AppColors.primary)),
          ),
        ],
      ),
      body: const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.download_done_outlined, size: 64, color: AppColors.grey300),
            SizedBox(height: 12),
            Text('No downloads yet', style: TextStyle(color: AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }
}
