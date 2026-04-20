import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/constants/api_constants.dart';
import '../../data/services/api_service.dart';
import 'auth_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool    _loading = false;
  bool    _sent    = false;
  String? _apiError;

  @override
  void dispose() {
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() { _loading = true; _apiError = null; });
    try {
      await ApiService().post(
        ApiConstants.authForgotPassword,
        data: {'email': _emailCtrl.text.trim()},
      );
      if (mounted) setState(() { _loading = false; _sent = true; });
    } catch (e) {
      final msg = (() {
        try { return (e as dynamic).response?.data?['message'] as String?; }
        catch (_) { return null; }
      })() ?? 'Something went wrong. Please try again.';
      if (mounted) setState(() { _loading = false; _apiError = msg; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            // ── Back bar ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(8, 8, 8, 0),
              child: Row(children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    size: 18, color: AppColors.textPrimary),
                  onPressed: () => context.pop(),
                ),
                Text('Reset Password', style: AppTextStyles.h3.copyWith(
                  fontSize: 16, color: AppColors.textPrimary)),
              ]),
            ),

            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: _sent ? _sentState() : _formState(),
              ),
            ),

            // ── Footer ──────────────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.only(bottom: bottom + 12, top: 8),
              child: Column(children: [
                Text('ACADEMIC PORTAL',
                  style: TextStyle(
                    fontFamily: 'Inter', fontSize: 9, letterSpacing: 1.4,
                    color: AppColors.textHint.withOpacity(0.6))),
                const SizedBox(height: 3),
                Text('POWERED BY GOOGLE',
                  style: TextStyle(
                    fontFamily: 'Inter', fontSize: 9, letterSpacing: 1.4,
                    color: AppColors.textHint.withOpacity(0.5))),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _formState() {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 32),

          // ── Icon ─────────────────────────────────────────────────────────
          Center(
            child: Container(
              width: 80, height: 80,
              decoration: BoxDecoration(
                color:        AppColors.white,
                shape:        BoxShape.circle,
                boxShadow: [BoxShadow(
                  color:     AppColors.primary.withOpacity(0.12),
                  blurRadius: 20,
                  offset:    const Offset(0, 6))],
              ),
              child: const Icon(
                Icons.lock_reset_rounded,
                color: AppColors.primary, size: 38),
            ),
          ),
          const SizedBox(height: 32),

          // ── Heading ───────────────────────────────────────────────────────
          Text('Forgot your keys?',
            style: AppTextStyles.h1.copyWith(
              fontSize: 24, color: AppColors.textPrimary)),
          const SizedBox(height: 10),
          Text(
            'Enter your email address below and we will send you a secure link to reset your library credentials.',
            style: AppTextStyles.bodySmall.copyWith(
              color: AppColors.textSecondary, height: 1.6)),
          const SizedBox(height: 28),

          // ── Email field ───────────────────────────────────────────────────
          const AuthFieldLabel('EMAIL ADDRESS'),
          const SizedBox(height: 6),
          TextFormField(
            controller:   _emailCtrl,
            keyboardType: TextInputType.emailAddress,
            autocorrect:  false,
            style: AppTextStyles.body.copyWith(
              color: AppColors.textPrimary, height: 1),
            decoration: authInputDeco(
              hint:   'yourname@iuea.ac.ug',
              prefix: Icons.email_outlined,
            ),
            validator: (v) =>
              (v == null || !v.contains('@'))
                ? 'Enter a valid email' : null,
          ),
          const SizedBox(height: 16),

          // ── API error ─────────────────────────────────────────────────────
          if (_apiError != null)
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color:        AppColors.error.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8),
                border:       Border.all(color: AppColors.error.withOpacity(0.2)),
              ),
              child: Row(children: [
                const Icon(Icons.error_outline_rounded,
                  color: AppColors.error, size: 16),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    _apiError!,
                    style: AppTextStyles.bodySmall.copyWith(
                      color: AppColors.error, fontSize: 12),
                  ),
                ),
              ]),
            ),

          // ── Submit button ─────────────────────────────────────────────────
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryContainer,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
              ),
              child: _loading
                ? const SizedBox(width: 20, height: 20,
                    child: CircularProgressIndicator(
                      color: AppColors.white, strokeWidth: 2))
                : Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Text('Send reset link',
                      style: AppTextStyles.button),
                    const SizedBox(width: 8),
                    const Icon(Icons.arrow_forward_rounded, size: 16),
                  ]),
            ),
          ),
          const SizedBox(height: 20),

          // ── Back to sign in ───────────────────────────────────────────────
          Center(
            child: GestureDetector(
              onTap: () => context.go('/login'),
              child: Row(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.arrow_back_rounded,
                  size: 14, color: AppColors.primary),
                const SizedBox(width: 4),
                Text('Back to sign in',
                  style: AppTextStyles.bodySmall.copyWith(
                    color:      AppColors.primary,
                    fontWeight: FontWeight.w500)),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _sentState() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 60),
        Container(
          width: 80, height: 80,
          decoration: BoxDecoration(
            color:  AppColors.success.withOpacity(0.1),
            shape:  BoxShape.circle,
          ),
          child: const Icon(Icons.mark_email_read_rounded,
            color: AppColors.success, size: 40),
        ),
        const SizedBox(height: 28),
        Text('Check your inbox',
          style: AppTextStyles.h1.copyWith(
            fontSize: 24, color: AppColors.textPrimary),
          textAlign: TextAlign.center),
        const SizedBox(height: 10),
        Text(
          'A reset link has been sent to\n${_emailCtrl.text}',
          style: AppTextStyles.bodySmall.copyWith(
            color: AppColors.textSecondary, height: 1.6),
          textAlign: TextAlign.center),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: () => context.go('/login'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryContainer,
              foregroundColor: AppColors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12))),
            child: Text('Back to sign in', style: AppTextStyles.button),
          ),
        ),
      ],
    );
  }
}
