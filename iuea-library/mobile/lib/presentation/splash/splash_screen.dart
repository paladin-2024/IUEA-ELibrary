import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/services/firebase_service.dart';
import '../../data/services/api_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  bool _showWelcome = false;
  String _selectedLanguage = 'English';
  late final AnimationController _fadeCtrl;
  late final Animation<double> _fadeAnim;

  static const _languages = ['English', 'French', 'Arabic', 'Swahili'];

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
    ));
    _fadeCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    // Init Firebase notifications (needs BuildContext, so post-frame)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseService(ApiService()).init(context);
    });
    _init();
  }

  Future<void> _init() async {
    await Future.delayed(const Duration(milliseconds: 300));
    const storage = FlutterSecureStorage();
    final token   = await storage.read(key: 'jwt_token');
    if (!mounted) return;

    if (token != null) {
      await Future.delayed(const Duration(milliseconds: 800));
      if (!mounted) return;
      context.go('/home');
      return;
    }

    final onboardingSeen = await storage.read(key: 'onboarding_seen');
    if (!mounted) return;

    if (onboardingSeen != 'true') {
      // First-time user — send directly to onboarding
      await Future.delayed(const Duration(milliseconds: 600));
      if (!mounted) return;
      context.go('/onboarding');
    } else {
      // Returning user, not logged in — show welcome CTA
      setState(() => _showWelcome = true);
      _fadeCtrl.forward();
    }
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: SafeArea(
        top: false,
        child: Stack(
          children: [
            // Subtle radial glow behind logo
            Positioned(
              top: -60,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  width: 340,
                  height: 340,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Colors.white.withValues(alpha: 0.07),
                        Colors.transparent,
                      ],
                    ),
                  ),
                ),
              ),
            ),

            Column(
              children: [
                // ── Logo area ───────────────────────────────────────────────
                Expanded(
                  flex: 5,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // White circle with IUEA logo
                      Container(
                        width: 110,
                        height: 110,
                        decoration: BoxDecoration(
                          color: AppColors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.25),
                              blurRadius: 24,
                              offset: const Offset(0, 8),
                            ),
                          ],
                        ),
                        child: ClipOval(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Image.asset(
                              'assets/images/iuea_logo.png',
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),
                      // App name
                      Text(
                        'IUEA Library',
                        style: AppTextStyles.h1.copyWith(
                          color: AppColors.white,
                          fontSize: 32,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      // Tagline
                      Text(
                        'Your knowledge. Unlimited access.',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.white.withValues(alpha: 0.82),
                          fontSize: 15,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                ),

                // ── Welcome CTA (shown only when no token) ──────────────────
                Expanded(
                  flex: 3,
                  child: _showWelcome
                      ? FadeTransition(
                          opacity: _fadeAnim,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              // Get Started button
                              Padding(
                                padding: const EdgeInsets.symmetric(horizontal: 40),
                                child: SizedBox(
                                  width: double.infinity,
                                  height: 52,
                                  child: ElevatedButton(
                                    onPressed: () => context.go('/login'),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: AppColors.white,
                                      foregroundColor: AppColors.primary,
                                      elevation: 0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(14),
                                      ),
                                    ),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Get Started',
                                          style: AppTextStyles.button.copyWith(
                                            color: AppColors.primary,
                                            fontSize: 16,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Icon(
                                          Icons.arrow_forward_rounded,
                                          size: 18,
                                          color: AppColors.primary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(height: 16),
                              // Already have account
                              TextButton(
                                onPressed: () => context.go('/login'),
                                style: TextButton.styleFrom(
                                  foregroundColor: AppColors.white.withValues(alpha: 0.75),
                                ),
                                child: Text(
                                  'Already have an account? Sign in',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.white.withValues(alpha: 0.75),
                                    decoration: TextDecoration.underline,
                                    decorationColor: AppColors.white.withValues(alpha: 0.4),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )
                      : const SizedBox.shrink(),
                ),

                // ── Language selector ────────────────────────────────────────
                if (_showWelcome)
                  FadeTransition(
                    opacity: _fadeAnim,
                    child: Padding(
                      padding: EdgeInsets.only(
                        bottom: bottom + 20,
                        left: 24,
                        right: 24,
                      ),
                      child: Column(
                        children: [
                          // Language picker row
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.language_rounded,
                                size: 14,
                                color: AppColors.white.withValues(alpha: 0.55),
                              ),
                              const SizedBox(width: 6),
                              DropdownButtonHideUnderline(
                                child: DropdownButton<String>(
                                  value: _selectedLanguage,
                                  dropdownColor: AppColors.primaryDark,
                                  icon: Icon(
                                    Icons.keyboard_arrow_down_rounded,
                                    size: 16,
                                    color: AppColors.white.withValues(alpha: 0.55),
                                  ),
                                  style: AppTextStyles.label.copyWith(
                                    color: AppColors.white.withValues(alpha: 0.75),
                                    fontSize: 12,
                                  ),
                                  items: _languages.map((lang) {
                                    return DropdownMenuItem(
                                      value: lang,
                                      child: Text(lang),
                                    );
                                  }).toList(),
                                  onChanged: (val) {
                                    if (val != null) {
                                      setState(() => _selectedLanguage = val);
                                    }
                                  },
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'POWERED BY GOOGLE TRANSLATE',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.white.withValues(alpha: 0.35),
                              fontSize: 9,
                              letterSpacing: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                if (!_showWelcome)
                  SizedBox(height: bottom + 20),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
