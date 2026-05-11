import 'dart:async';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class OtpVerificationScreen extends StatefulWidget {
  final String email;
  /// If true, this OTP is for password reset (not email verification)
  final bool   isPasswordReset;

  const OtpVerificationScreen({
    super.key,
    required this.email,
    this.isPasswordReset = false,
  });

  @override
  State<OtpVerificationScreen> createState() => _OtpVerificationScreenState();
}

class _OtpVerificationScreenState extends State<OtpVerificationScreen> {
  final List<TextEditingController> _ctls =
      List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _nodes = List.generate(6, (_) => FocusNode());

  bool _loading     = false;
  bool _resending   = false;
  int  _resendCool  = 60; // seconds before resend is enabled
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCooldown();
  }

  @override
  void dispose() {
    _timer?.cancel();
    for (final c in _ctls)  c.dispose();
    for (final n in _nodes) n.dispose();
    super.dispose();
  }

  void _startCooldown() {
    _resendCool = 60;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) { t.cancel(); return; }
      setState(() {
        if (_resendCool > 0) {
          _resendCool--;
        } else {
          t.cancel();
        }
      });
    });
  }

  String get _otp => _ctls.map((c) => c.text).join();

  void _onDigit(int index, String value) {
    if (value.length > 1) {
      // Handle paste: distribute digits across boxes
      final digits = value.replaceAll(RegExp(r'\D'), '').split('');
      for (int i = 0; i < 6 && i < digits.length; i++) {
        _ctls[i].text = digits[i];
      }
      final next = (digits.length).clamp(0, 5);
      _nodes[next].requestFocus();
    } else if (value.isNotEmpty) {
      if (index < 5) _nodes[index + 1].requestFocus();
    }
    setState(() {});
    if (_otp.length == 6) _submit();
  }

  void _onBackspace(int index) {
    if (_ctls[index].text.isEmpty && index > 0) {
      _nodes[index - 1].requestFocus();
      _ctls[index - 1].clear();
      setState(() {});
    }
  }

  Future<void> _submit() async {
    if (_otp.length < 6 || _loading) return;
    setState(() => _loading = true);

    final auth = context.read<AuthProvider>();

    if (widget.isPasswordReset) {
      // Navigate to reset-password screen carrying email + OTP
      setState(() => _loading = false);
      context.go('/reset-password', extra: {'email': widget.email, 'otp': _otp});
      return;
    }

    final ok = await auth.verifyEmail(widget.email, _otp);
    if (!mounted) return;
    setState(() => _loading = false);

    if (ok) {
      context.go('/onboarding');
    } else {
      _showError(auth.error ?? 'Invalid or expired code.');
      for (final c in _ctls) c.clear();
      _nodes[0].requestFocus();
    }
  }

  Future<void> _resend() async {
    if (_resendCool > 0 || _resending) return;
    setState(() => _resending = true);
    await context.read<AuthProvider>().resendOtp(widget.email);
    if (!mounted) return;
    setState(() => _resending = false);
    _startCooldown();
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content:         Text('A new code has been sent to your email.'),
        behavior:        SnackBarBehavior.floating,
        backgroundColor: AppColors.primaryDark,
      ),
    );
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:         Text(msg),
        backgroundColor: AppColors.error,
        behavior:        SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final masked = _maskedEmail(widget.email);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation:       0,
        leading: IconButton(
          icon: const Icon(AppIcons.arrowBack,
            color: AppColors.textPrimary, size: 18),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: 16),

              // Icon
              Container(
                width: 72, height: 72,
                decoration: BoxDecoration(
                  color:        AppColors.primary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(AppIcons.checkCircle,
                  color: AppColors.primary, size: 36),
              ),
              const SizedBox(height: 20),

              Text(
                widget.isPasswordReset ? 'Reset Code Sent' : 'Verify Your Email',
                style: AppTextStyles.h1.copyWith(
                  color: AppColors.primary, fontSize: 24),
              ),
              const SizedBox(height: 8),
              Text(
                'Enter the 6-digit code sent to',
                style: AppTextStyles.bodySmall.copyWith(
                  color: AppColors.textSecondary),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 2),
              Text(
                masked,
                style: AppTextStyles.body.copyWith(
                  color:      AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize:   14),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 36),

              // OTP boxes
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(6, (i) => _OtpBox(
                  controller: _ctls[i],
                  focusNode:  _nodes[i],
                  onChanged:  (v) => _onDigit(i, v),
                  onBackspace: () => _onBackspace(i),
                )),
              ),
              const SizedBox(height: 36),

              // Verify button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: (_otp.length == 6 && !_loading) ? _submit : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    disabledBackgroundColor: AppColors.border,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _loading
                    ? const SizedBox(
                        width: 20, height: 20,
                        child: CircularProgressIndicator(
                          color: AppColors.white, strokeWidth: 2))
                    : Text('Verify Code', style: AppTextStyles.button),
                ),
              ),
              const SizedBox(height: 24),

              // Resend
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text("Didn't receive it? ",
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.textSecondary)),
                  GestureDetector(
                    onTap: _resendCool == 0 ? _resend : null,
                    child: _resending
                      ? const SizedBox(
                          width: 14, height: 14,
                          child: CircularProgressIndicator(
                            color: AppColors.primary, strokeWidth: 2))
                      : Text(
                          _resendCool > 0
                            ? 'Resend in ${_resendCool}s'
                            : 'Resend code',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: _resendCool == 0
                              ? AppColors.primary : AppColors.textHint,
                            fontWeight: FontWeight.w600,
                            decoration: _resendCool == 0
                              ? TextDecoration.underline : TextDecoration.none,
                            decorationColor: AppColors.primary,
                          ),
                        ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  String _maskedEmail(String email) {
    final parts = email.split('@');
    if (parts.length != 2) return email;
    final local  = parts[0];
    final domain = parts[1];
    if (local.length <= 2) return email;
    return '${local[0]}${'*' * (local.length - 2)}${local[local.length - 1]}@$domain';
  }
}

// ── Single OTP digit box ──────────────────────────────────────────────────────
class _OtpBox extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode             focusNode;
  final ValueChanged<String>  onChanged;
  final VoidCallback          onBackspace;

  const _OtpBox({
    required this.controller,
    required this.focusNode,
    required this.onChanged,
    required this.onBackspace,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width:  46,
      height: 56,
      margin: const EdgeInsets.symmetric(horizontal: 5),
      decoration: BoxDecoration(
        color:  AppColors.white,
        border: Border.all(
          color: focusNode.hasFocus
            ? AppColors.primary
            : (controller.text.isNotEmpty ? AppColors.primary.withValues(alpha: 0.4) : AppColors.border),
          width: focusNode.hasFocus ? 2 : 1,
        ),
        borderRadius: BorderRadius.circular(10),
        boxShadow: focusNode.hasFocus
          ? [BoxShadow(
              color:      AppColors.primary.withValues(alpha: 0.15),
              blurRadius: 8, offset: const Offset(0, 2))]
          : null,
      ),
      child: KeyboardListener(
        focusNode: FocusNode(),
        onKeyEvent: (e) {
          if (e is KeyDownEvent &&
              e.logicalKey == LogicalKeyboardKey.backspace &&
              controller.text.isEmpty) {
            onBackspace();
          }
        },
        child: TextField(
          controller:     controller,
          focusNode:      focusNode,
          keyboardType:   TextInputType.number,
          textAlign:      TextAlign.center,
          maxLength:      1,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          style: const TextStyle(
            fontFamily:  'Inter',
            fontSize:    22,
            fontWeight:  FontWeight.w700,
            color:       AppColors.primary,
          ),
          decoration: const InputDecoration(
            counterText: '',
            border:      InputBorder.none,
          ),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
