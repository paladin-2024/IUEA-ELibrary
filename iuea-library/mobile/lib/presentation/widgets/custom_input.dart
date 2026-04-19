import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

class CustomInput extends StatefulWidget {
  final String                       label;
  final String?                      hint;
  final String?                      error;
  final bool                         isPassword;
  final TextEditingController        controller;
  final TextInputType                keyboardType;
  final String? Function(String?)?   validator;
  final IconData?                    prefixIcon;
  final TextInputAction?             textInputAction;
  final void Function(String)?       onChanged;
  final void Function(String)?       onFieldSubmitted;
  final bool                         readOnly;
  final int                          maxLines;

  const CustomInput({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.error,
    this.isPassword      = false,
    this.keyboardType    = TextInputType.text,
    this.validator,
    this.prefixIcon,
    this.textInputAction,
    this.onChanged,
    this.onFieldSubmitted,
    this.readOnly        = false,
    this.maxLines        = 1,
  });

  @override
  State<CustomInput> createState() => _CustomInputState();
}

class _CustomInputState extends State<CustomInput> {
  bool _obscure = true;

  OutlineInputBorder _border(Color color, {double width = 1}) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        borderSide:   BorderSide(color: color, width: width),
      );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        // Label
        Text(
          widget.label,
          style: AppTextStyles.label.copyWith(
            fontWeight: FontWeight.w600,
            color:      AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: AppSpacing.sm),

        // Field
        TextFormField(
          controller:       widget.controller,
          keyboardType:     widget.keyboardType,
          obscureText:      widget.isPassword && _obscure,
          validator:        widget.validator,
          textInputAction:  widget.textInputAction,
          onChanged:        widget.onChanged,
          onFieldSubmitted: widget.onFieldSubmitted,
          readOnly:         widget.readOnly,
          maxLines:         widget.isPassword ? 1 : widget.maxLines,
          style: AppTextStyles.body.copyWith(fontSize: 15),
          decoration: InputDecoration(
            hintText:       widget.hint,
            hintStyle:      AppTextStyles.bodySmall,
            errorText:      widget.error,
            filled:         true,
            fillColor:      Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical:   AppSpacing.md,
            ),

            // Prefix icon
            prefixIcon: widget.prefixIcon != null
                ? Icon(
                    widget.prefixIcon,
                    color: AppColors.textHint,
                    size:  20,
                  )
                : null,

            // Password toggle
            suffixIcon: widget.isPassword
                ? IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                      color: AppColors.textHint,
                      size:  20,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )
                : null,

            // Borders
            border: _border(AppColors.border),
            enabledBorder: _border(AppColors.border),
            focusedBorder: _border(AppColors.primary, width: 2),
            errorBorder:   _border(AppColors.error),
            focusedErrorBorder: _border(AppColors.error, width: 2),
            disabledBorder: _border(AppColors.border.withOpacity(0.5)),

            // Error style
            errorStyle: AppTextStyles.label.copyWith(
              color:    AppColors.error,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
