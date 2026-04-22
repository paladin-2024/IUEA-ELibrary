import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:go_router/go_router.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import 'auth_widgets.dart';

final _googleSignIn = GoogleSignIn(
  scopes:         ['email', 'profile'],
  // serverClientId is required on Android to obtain an idToken
  serverClientId: dotenv.env['GOOGLE_CLIENT_ID'],
);

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey   = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();

  bool _showPw        = false;
  bool _googleLoading = false;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

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

  Future<void> _googleSignInTap() async {
    setState(() => _googleLoading = true);
    try {
      final account = await _googleSignIn.signIn();
      if (account == null) { setState(() => _googleLoading = false); return; }
      final gAuth   = await account.authentication;
      final idToken = gAuth.idToken;
      if (idToken == null) throw Exception('No ID token from Google.');

      if (!mounted) return;
      final auth   = context.read<AuthProvider>();
      final result = await auth.googleLogin(idToken);
      if (!mounted) return;

      if (result.success) {
        context.go(result.isNewUser ? '/onboarding' : '/home');
      } else {
        _showError(auth.error ?? 'Google sign-in failed.');
      }
    } catch (e) {
      if (mounted) _showError('Google sign-in failed: $e');
    } finally {
      if (mounted) setState(() => _googleLoading = false);
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
                  vertical:   AppSpacing.lg,
                ),
                child: Form(
                  key: _formKey,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const SizedBox(height: AppSpacing.lg),

                      // ── Logo ──────────────────────────────────────────────
                      Container(
                        width: 76, height: 76,
                        decoration: const BoxDecoration(
                          color: AppColors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color:  Color(0x1A7B0D1E),
                              blurRadius: 16,
                              offset: Offset(0, 4),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Padding(
                            padding: const EdgeInsets.all(10),
                            child: Image.asset(
                              'assets/images/iuea_logo.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // ── App name + tagline ────────────────────────────────
                      Text(
                        'IUEA Library',
                        style: AppTextStyles.h2.copyWith(
                          color: AppColors.textPrimary,
                          letterSpacing: 0.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'DIGITAL CURATOR',
                        style: AppTextStyles.label.copyWith(
                          letterSpacing: 2.5,
                          fontSize:      10,
                          color:         AppColors.textHint,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      // ── Welcome heading ───────────────────────────────────
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Welcome back',
                          style: AppTextStyles.h1.copyWith(
                            fontSize: 26,
                            color:    AppColors.textPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Align(
                        alignment: Alignment.centerLeft,
                        child: Text(
                          'Access your academic resources.',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ── Email ─────────────────────────────────────────────
                      const AuthFieldLabel('UNIVERSITY EMAIL'),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _emailCtrl,
                        keyboardType:    TextInputType.emailAddress,
                        textInputAction: TextInputAction.next,
                        autocorrect:     false,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.textPrimary, height: 1),
                        decoration: authInputDeco(
                          hint:   'student.name@iuea.ac.ug',
                          prefix: Icons.email_outlined,
                        ),
                        validator: (v) =>
                          (v == null || !v.contains('@'))
                            ? 'Enter a valid email'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.md),

                      // ── Password label row ────────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const AuthFieldLabel('PASSWORD'),
                          TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            style: TextButton.styleFrom(
                              padding:      EdgeInsets.zero,
                              minimumSize:  Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                            child: Text(
                              'Forgot password?',
                              style: AppTextStyles.label.copyWith(
                                color:      AppColors.primary,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller:      _passCtrl,
                        obscureText:     !_showPw,
                        textInputAction: TextInputAction.done,
                        onFieldSubmitted: (_) => _submit(),
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
                          (v == null || v.length < 6)
                            ? 'Minimum 6 characters'
                            : null,
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ── Sign In button ────────────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: isLoading ? null : _submit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryContainer,
                            foregroundColor: AppColors.onPrimary,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          ),
                          child: isLoading
                            ? const SizedBox(
                                width: 20, height: 20,
                                child: CircularProgressIndicator(
                                  color: AppColors.white, strokeWidth: 2))
                            : Text('Sign In', style: AppTextStyles.button),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.lg),

                      // ── OR divider ────────────────────────────────────────
                      Row(children: [
                        const Expanded(child: Divider(color: AppColors.border)),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          child: Text('or', style: AppTextStyles.label),
                        ),
                        const Expanded(child: Divider(color: AppColors.border)),
                      ]),
                      const SizedBox(height: AppSpacing.md),

                      // ── Google button ─────────────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: OutlinedButton(
                          onPressed: _googleLoading ? null : _googleSignInTap,
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          ),
                          child: _googleLoading
                            ? const SizedBox(
                                width: 18, height: 18,
                                child: CircularProgressIndicator(
                                  color: AppColors.primary, strokeWidth: 2))
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Image.asset(
                                    'assets/images/google_logo.png',
                                    width: 18, height: 18,
                                    errorBuilder: (_, __, ___) => const Icon(
                                      Icons.language_rounded,
                                      size: 18,
                                      color: Color(0xFF4285F4),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  Text(
                                    'Continue with Google',
                                    style: AppTextStyles.body.copyWith(
                                      color:    AppColors.textPrimary,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xl),

                      // ── Register link ─────────────────────────────────────
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('New student? ',
                            style: AppTextStyles.bodySmall),
                          GestureDetector(
                            onTap: () => context.go('/register'),
                            child: Text(
                              'Register here',
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
                  Text(
                    'POWERED BY GOOGLE',
                    style: TextStyle(
                      fontFamily:    'Inter',
                      fontSize:      9,
                      letterSpacing: 1.4,
                      color: AppColors.textHint.withAlpha(153),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const AuthFooterLink('Privacy'),
                      authFooterDot(),
                      const AuthFooterLink('Terms'),
                    ],
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
