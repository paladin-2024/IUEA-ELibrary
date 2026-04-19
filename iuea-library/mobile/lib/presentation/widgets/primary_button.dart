import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

enum ButtonVariant { primary, secondary, ghost, danger }

class PrimaryButton extends StatelessWidget {
  final String        label;
  final VoidCallback? onPressed;
  final bool          isLoading;
  final bool          isFullWidth;
  final IconData?     icon;
  final ButtonVariant variant;

  const PrimaryButton({
    super.key,
    required this.label,
    this.onPressed,
    this.isLoading   = false,
    this.isFullWidth = true,
    this.icon,
    this.variant     = ButtonVariant.primary,
  });

  @override
  Widget build(BuildContext context) {
    final child = isLoading
        ? const SizedBox(
            width:  20,
            height: 20,
            child:  CircularProgressIndicator(
              strokeWidth: 2,
              color:       AppColors.white,
            ),
          )
        : Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: AppSpacing.sm),
              ],
              Text(label, style: AppTextStyles.button),
            ],
          );

    final shape = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
    );

    final minSize = isFullWidth
        ? const Size(double.infinity, 52)
        : const Size(0, 52);

    Widget button;

    switch (variant) {
      case ButtonVariant.secondary:
        button = OutlinedButton(
          onPressed: isLoading ? null : onPressed,
          style: OutlinedButton.styleFrom(
            foregroundColor: AppColors.primary,
            side:            const BorderSide(color: AppColors.primary, width: 2),
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical:   AppSpacing.md,
            ),
            shape:       shape,
            minimumSize: minSize,
          ),
          child: child,
        );

      case ButtonVariant.ghost:
        button = TextButton(
          onPressed: isLoading ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: AppColors.primary,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical:   AppSpacing.md,
            ),
            shape:       shape,
            minimumSize: minSize,
          ),
          child: child,
        );

      case ButtonVariant.danger:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.error,
            foregroundColor: AppColors.white,
            elevation:       0,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical:   AppSpacing.md,
            ),
            shape:       shape,
            minimumSize: minSize,
          ),
          child: child,
        );

      case ButtonVariant.primary:
      default:
        button = ElevatedButton(
          onPressed: isLoading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primaryContainer, // #7B0D1E maroon
            foregroundColor: AppColors.onPrimary,
            elevation:       0,
            shadowColor:     Colors.transparent,
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical:   AppSpacing.md,
            ),
            shape:       shape,
            minimumSize: minSize,
          ),
          child: child,
        );
    }

    return isFullWidth ? SizedBox(width: double.infinity, child: button) : button;
  }
}
