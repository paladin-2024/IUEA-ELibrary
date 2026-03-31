import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';

class CustomInput extends StatefulWidget {
  final String        label;
  final String?       hint;
  final bool          isPassword;
  final TextEditingController controller;
  final TextInputType keyboardType;
  final String?       Function(String?)? validator;
  final IconData?     prefixIcon;

  const CustomInput({
    super.key,
    required this.label,
    required this.controller,
    this.hint,
    this.isPassword   = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.prefixIcon,
  });

  @override
  State<CustomInput> createState() => _CustomInputState();
}

class _CustomInputState extends State<CustomInput> {
  bool _obscure = true;

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller:    widget.controller,
      keyboardType:  widget.keyboardType,
      obscureText:   widget.isPassword && _obscure,
      validator:     widget.validator,
      decoration: InputDecoration(
        labelText:   widget.label,
        hintText:    widget.hint,
        prefixIcon:  widget.prefixIcon != null ? Icon(widget.prefixIcon, color: AppColors.grey500) : null,
        suffixIcon:  widget.isPassword
            ? IconButton(
                icon:     Icon(_obscure ? Icons.visibility_off : Icons.visibility, color: AppColors.grey500),
                onPressed: () => setState(() => _obscure = !_obscure),
              )
            : null,
      ),
    );
  }
}
