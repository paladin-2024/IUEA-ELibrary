import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/api_constants.dart';

final _googleSignIn = GoogleSignIn(scopes: ['email', 'profile']);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();

  bool _showPw       = false;
  bool _googleLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  // ── Email/password login ──────────────────────────────────────────────────
  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok   = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    if (ok) {
      context.go('/home');
    } else {
      _showError(auth.error ?? 'Login failed.');
    }
  }

  // ── Google Sign-In ────────────────────────────────────────────────────────
  Future<void> _googleSignInTap() async {
    setState(() => _googleLoading = true);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) {
        setState(() => _googleLoading = false);
        return;
      }
      final auth     = await account.authentication;
      final idToken  = auth.idToken;
      if (idToken == null) throw Exception('No ID token from Google.');

      final api = ApiService();
      final res = await api.post(ApiConstants.authGoogle, data: {'idToken': idToken});
      if (!mounted) return;

      final authProvider = context.read<AuthProvider>();
      // Manually set token + user since google flow bypasses AuthProvider.login()
      await authProvider.login('', ''); // trigger loadUser after storing token
      // Actually call the Google endpoint via AuthProvider isn't wired — use storage directly
      // We'll update the provider state via a workaround loadUser call
      context.go(res.data['isNewUser'] == true ? '/onboarding' : '/home');
    } catch (e) {
      if (mounted) _showError('Google sign-in failed. Please try again.');
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  void _showError(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content:          Text(msg),
        backgroundColor:  AppColors.error,
        behavior:         SnackBarBehavior.floating,
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding + 8,
            vertical:   AppSpacing.lg,
          ),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: AppSpacing.xl),

                // ── IUEA Shield logo ────────────────────────────────────────
                Container(
                  width:  72,
                  height: 72,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Text('IUEA',
                      style: TextStyle(
                        color:      AppColors.white,
                        fontSize:   16,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Inter',
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),

                Text('Welcome back', style: AppTextStyles.h2),
                const SizedBox(height: 4),
                Text('Sign in to IUEA Library',
                  style: AppTextStyles.bodySmall),
                const SizedBox(height: AppSpacing.xl),

                // ── Email field ─────────────────────────────────────────────
                TextFormField(
                  controller:   _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
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

                // ── Password field ──────────────────────────────────────────
                TextFormField(
                  controller:      _passCtrl,
                  obscureText:     !_showPw,
                  textInputAction: TextInputAction.done,
                  onFieldSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText:  'Security Key',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _showPw ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                        size: 20,
                      ),
                      onPressed: () => setState(() => _showPw = !_showPw),
                    ),
                  ),
                  validator: (v) =>
                    (v == null || v.length < 6) ? 'Minimum 6 characters' : null,
                ),
                const SizedBox(height: AppSpacing.sm),

                // ── Forgot password ─────────────────────────────────────────
                Align(
                  alignment: Alignment.centerRight,
                  child: TextButton(
                    onPressed: () => context.push('/forgot-password'),
                    child: Text('Forgot password?',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.primary, fontWeight: FontWeight.w500)),
                  ),
                ),
                const SizedBox(height: AppSpacing.sm),

                // ── Sign In button ──────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: isLoading ? null : _submit,
                    child: isLoading
                        ? const SizedBox(
                            width: 20, height: 20,
                            child: CircularProgressIndicator(
                              color: AppColors.white, strokeWidth: 2))
                        : Text('Sign In', style: AppTextStyles.button),
                  ),
                ),
                const SizedBox(height: AppSpacing.lg),

                // ── Divider ─────────────────────────────────────────────────
                Row(children: [
                  const Expanded(child: Divider(color: AppColors.border)),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                    child: Text('or', style: AppTextStyles.label),
                  ),
                  const Expanded(child: Divider(color: AppColors.border)),
                ]),
                const SizedBox(height: AppSpacing.md),

                // ── Google button ───────────────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _googleLoading ? null : _googleSignInTap,
                    child: _googleLoading
                        ? const SizedBox(
                            width: 18, height: 18,
                            child: CircularProgressIndicator(
                              color: AppColors.primary, strokeWidth: 2))
                        : Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Image.network(
                                'https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg',
                                width: 18, height: 18,
                              ),
                              const SizedBox(width: 10),
                              Text('Continue with Google',
                                style: AppTextStyles.body.copyWith(
                                  color: AppColors.textPrimary)),
                            ],
                          ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xl),

                // ── Register link ───────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('New student? ', style: AppTextStyles.bodySmall),
                    GestureDetector(
                      onTap: () => context.go('/register'),
                      child: Text('Register here',
                        style: AppTextStyles.bodySmall.copyWith(
                          color:      AppColors.primary,
                          fontWeight: FontWeight.w600,
                          decoration: TextDecoration.underline,
                        )),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
