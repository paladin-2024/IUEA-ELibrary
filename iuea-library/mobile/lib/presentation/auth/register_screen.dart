import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

const _faculties = [
  'Law', 'Medicine', 'Engineering', 'Business',
  'IT', 'Education', 'Arts', 'Science',
];

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey        = GlobalKey<FormState>();
  final _nameCtrl       = TextEditingController();
  final _studentIdCtrl  = TextEditingController();
  final _emailCtrl      = TextEditingController();
  final _passCtrl       = TextEditingController();
  final _confirmCtrl    = TextEditingController();

  String? _faculty;
  bool    _showPw       = false;
  bool    _showCpw      = false;
  bool    _terms        = false;

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
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isLoading = context.watch<AuthProvider>().isLoading;

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation:       0,
        leading: IconButton(
          icon:      const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => context.go('/login'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding + 8,
            vertical:   AppSpacing.md,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // ── Logo ──────────────────────────────────────────────────
                Container(
                  width: 64, height: 64,
                  decoration: const BoxDecoration(
                    color: AppColors.primary, shape: BoxShape.circle),
                  child: const Center(
                    child: Text('IUEA',
                      style: TextStyle(
                        color: AppColors.white, fontSize: 14,
                        fontWeight: FontWeight.bold, fontFamily: 'Inter')),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Text('Create account', style: AppTextStyles.h2),
                const SizedBox(height: 4),
                Text('Join the IUEA digital library',
                  style: AppTextStyles.bodySmall),
                const SizedBox(height: AppSpacing.lg),

                // ── Full name ─────────────────────────────────────────────
                TextFormField(
                  controller:      _nameCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText:  'Full Name',
                    prefixIcon: Icon(Icons.person_outline),
                  ),
                  validator: (v) =>
                    (v == null || v.trim().isEmpty) ? 'Full name is required' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Student ID ────────────────────────────────────────────
                TextFormField(
                  controller:      _studentIdCtrl,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText:  'Student / Staff ID',
                    hintText:   'IUEA/STU/2024-001',
                    prefixIcon: Icon(Icons.badge_outlined),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Email ─────────────────────────────────────────────────
                TextFormField(
                  controller:      _emailCtrl,
                  keyboardType:    TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText:  'University Email',
                    hintText:   'you@iuea.ac.ug',
                    prefixIcon: Icon(Icons.email_outlined),
                  ),
                  validator: (v) =>
                    (v == null || !v.contains('@')) ? 'Enter a valid email' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Faculty ───────────────────────────────────────────────
                DropdownButtonFormField<String>(
                  value:      _faculty,
                  decoration: const InputDecoration(
                    labelText:  'Faculty',
                    prefixIcon: Icon(Icons.school_outlined),
                  ),
                  hint: const Text('Select faculty'),
                  items: _faculties
                    .map((f) => DropdownMenuItem(value: f, child: Text(f)))
                    .toList(),
                  onChanged: (v) => setState(() => _faculty = v),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Password ──────────────────────────────────────────────
                TextFormField(
                  controller:      _passCtrl,
                  obscureText:     !_showPw,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText:  'Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showPw
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _showPw = !_showPw),
                    ),
                  ),
                  validator: (v) =>
                    (v == null || v.length < 8) ? 'Minimum 8 characters' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Confirm password ──────────────────────────────────────
                TextFormField(
                  controller:      _confirmCtrl,
                  obscureText:     !_showCpw,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText:  'Confirm Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showCpw
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _showCpw = !_showCpw),
                    ),
                  ),
                  validator: (v) =>
                    (v == null || v.isEmpty) ? 'Please confirm your password' : null,
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Terms checkbox ────────────────────────────────────────
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Checkbox(
                      value:           _terms,
                      activeColor:     AppColors.primary,
                      onChanged: (v)   => setState(() => _terms = v ?? false),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: Text.rich(
                          TextSpan(
                            style: AppTextStyles.bodySmall,
                            children: [
                              const TextSpan(text: 'I agree to the '),
                              TextSpan(
                                text: 'Library Terms of Use',
                                style: AppTextStyles.bodySmall.copyWith(
                                  color: AppColors.primary,
                                  decoration: TextDecoration.underline,
                                ),
                              ),
                              const TextSpan(text: ' and data storage policy.'),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),

                // ── Create Account button ─────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _submit,
                    child: isLoading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.white, strokeWidth: 2))
                        : Text('Create Account', style: AppTextStyles.button),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                // ── Sign in link ──────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('Already have an account? ', style: AppTextStyles.bodySmall),
                    GestureDetector(
                      onTap: () => context.go('/login'),
                      child: Text('Sign in',
                        style: AppTextStyles.bodySmall.copyWith(
                          color:      AppColors.primary,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        )),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
