import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import 'auth_widgets.dart';

const _faculties = [
  'Faculty of Law',
  'Faculty of Medicine & Health Sciences',
  'Faculty of Engineering & Technology',
  'Faculty of Business & Management',
  'Faculty of Information Technology',
  'Faculty of Education',
  'Faculty of Arts & Social Sciences',
  'Faculty of Science',
];

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey       = GlobalKey<FormState>();
  final _nameCtrl      = TextEditingController();
  final _studentIdCtrl = TextEditingController();
  final _emailCtrl     = TextEditingController();
  final _passCtrl      = TextEditingController();
  final _confirmCtrl   = TextEditingController();

  String? _faculty;
  bool    _showPw  = false;
  bool    _showCpw = false;
  bool    _terms   = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _studentIdCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (!_terms) {
      _showError('Please accept the terms to continue.');
      return;
    }
    if (_passCtrl.text != _confirmCtrl.text) {
      _showError('Passwords do not match.');
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok   = await auth.register({
      'name':      _nameCtrl.text.trim(),
      'studentId': _studentIdCtrl.text.trim(),
      'email':     _emailCtrl.text.trim(),
      'faculty':   _faculty,
      'password':  _passCtrl.text,
    });
    if (!mounted) return;
    if (ok) {
      context.go('/onboarding');
    } else {
      _showError(auth.error ?? 'Registration failed.');
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:         Text(msg),
        backgroundColor: AppColors.error,
        behavior:        SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;
    final bottom    = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 28,
                  vertical:   AppSpacing.md,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: AppSpacing.md),

                      // ── Logo (maroon circle with white logo) ──────────────
                      Container(
                        width: 76, height: 76,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color:     Color(0x337B0D1E),
                              blurRadius: 16,
                              offset:    Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Padding(
                            padding: const EdgeInsets.all(14),
                            child: Image.asset(
                              'assets/images/iuea_logo.png',
                              fit:   BoxFit.contain,
                              color: AppColors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 14),

                      // ── Heading ───────────────────────────────────────────
                      Text(
                        'Create Account',
                        style: AppTextStyles.h1.copyWith(
                          color:    AppColors.primary,
                          fontSize: 26,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Join the Digital Curator community',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ── Full Name ─────────────────────────────────────────
                      const AuthFieldLabel('FULL NAME'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:         _nameCtrl,
                        textInputAction:    TextInputAction.next,
                        textCapitalization: TextCapitalization.words,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   'John Doe',
                          prefix: Icons.person_outline_rounded,
                        ),
                        validator: (v) =>
                          (v == null || v.trim().isEmpty)
                            ? 'Full name is required'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Student/Staff ID ──────────────────────────────────
                      const AuthFieldLabel('STUDENT/STAFF ID'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _studentIdCtrl,
                        textInputAction: TextInputAction.next,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   'IUEA-2024-000',
                          prefix: Icons.badge_outlined,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Email ─────────────────────────────────────────────
                      const AuthFieldLabel('EMAIL'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _emailCtrl,
                        keyboardType:    TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect:     false,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   'example@iuea.ac.ug',
                          prefix: Icons.email_outlined,
                        ),
                        validator: (v) =>
                          (v == null || !v.contains('@'))
                            ? 'Enter a valid email'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Faculty/Department ────────────────────────────────
                      const AuthFieldLabel('FACULTY/DEPARTMENT'),
                      const SizedBox(height: 6),
                      DropdownButtonFormField<String>(
                        initialValue:      _faculty,
                        isExpanded: true,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          filled:     true,
                          fillColor:  AppColors.white,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 14),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: AppColors.border),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(
                              color: AppColors.primary, width: 1.5),
                          ),
                        ),
                        hint: const Text(
                          'Select Faculty',
                          style: TextStyle(
                            color: Color(0xFFBDBDBD),
                            fontSize: 13,
                          ),
                        ),
                        icon: const Icon(
                          Icons.keyboard_arrow_down_rounded,
                          color: AppColors.textHint,
                        ),
                        dropdownColor: AppColors.white,
                        borderRadius:  BorderRadius.circular(10),
                        items: _faculties
                          .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                          .toList(),
                        onChanged: (v) => setState(() => _faculty = v),
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Password ──────────────────────────────────────────
                      const AuthFieldLabel('PASSWORD'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _passCtrl,
                        obscureText:     !_showPw,
                        textInputAction: TextInputAction.next,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   '••••••••',
                          prefix: Icons.lock_outline_rounded,
                          suffix: IconButton(
                            icon: Icon(
                              _showPw
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                              size: 18,
                              color: AppColors.textHint,
                            ),
                            onPressed: () => setState(() => _showPw = !_showPw),
                          ),
                        ),
                        validator: (v) =>
                          (v == null || v.length < 8)
                            ? 'Minimum 8 characters'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Confirm Password ──────────────────────────────────
                      const AuthFieldLabel('CONFIRM PASSWORD'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _confirmCtrl,
                        obscureText:     !_showCpw,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   '••••••••',
                          prefix: Icons.lock_outline_rounded,
                          suffix: IconButton(
                            icon: Icon(
                              _showCpw
                                ? Icons.visibility_off_outlined
                                : Icons.visibility_outlined,
                              size: 18,
                              color: AppColors.textHint,
                            ),
                            onPressed: () => setState(() => _showCpw = !_showCpw),
                          ),
                        ),
                        validator: (v) =>
                          (v == null || v.isEmpty)
                            ? 'Please confirm your password'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Terms checkbox ────────────────────────────────────
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          SizedBox(
                            width: 24, height: 24,
                            child: Checkbox(
                              value:       _terms,
                              activeColor: AppColors.primary,
                              materialTapTargetSize:
                                MaterialTapTargetSize.shrinkWrap,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4)),
                              onChanged: (v) =>
                                setState(() => _terms = v ?? false),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text.rich(
                              TextSpan(
                                style: AppTextStyles.bodySmall.copyWith(
                                  fontSize: 12,
                                  color:    AppColors.textSecondary,
                                  height:   1.5,
                                ),
                                children: [
                                  const TextSpan(text: 'I agree to '),
                                  TextSpan(
                                    text: 'IUEA Library Terms',
                                    style: AppTextStyles.bodySmall.copyWith(
                                      fontSize:        12,
                                      color:           AppColors.primary,
                                      decoration:      TextDecoration.underline,
                                      decorationColor: AppColors.primary,
                                    ),
                                  ),
                                  const TextSpan(
                                    text: ' and privacy policy for digital resources.'),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ── Create Account button ─────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryContainer,
                            foregroundColor: AppColors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          ),
                          child: isLoading
                            ? const SizedBox(
                                width: 20, height: 20,
                                child: CircularProgressIndicator(
                                  color: AppColors.white, strokeWidth: 2))
                            : Text('Create Account', style: AppTextStyles.button),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Sign In link ──────────────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('Already have an account? ',
                            style: AppTextStyles.bodySmall),
                          GestureDetector(
                            onTap: () => context.go('/login'),
                            child: Text(
                              'Sign in',
                              style: AppTextStyles.bodySmall.copyWith(
                                color:           AppColors.primary,
                                fontWeight:      FontWeight.w600,
                                decoration:      TextDecoration.underline,
                                decorationColor: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.lg),
                    ],
                  ),
                ),
              ),
            ),

            // ── Footer ──────────────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.only(bottom: bottom + 12, top: 8),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const AuthFooterLink('Privacy'),
                      authFooterDot(),
                      const AuthFooterLink('Terms'),
                      authFooterDot(),
                      const AuthFooterLink('Translate'),
                      authFooterDot(),
                      const AuthFooterLink('Koha ILS'),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'POWERED BY GOOGLE',
                    style: TextStyle(
                      fontSize:      9,
                      letterSpacing: 1.4,
                      color: AppColors.textHint.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
