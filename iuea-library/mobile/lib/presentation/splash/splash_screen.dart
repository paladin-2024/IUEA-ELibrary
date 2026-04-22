import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/constants/app_colors.dart';
import '../../data/services/firebase_service.dart';
import '../../data/services/api_service.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  bool _showWelcome = false;

  late final AnimationController _logoCtrl;
  late final AnimationController _contentCtrl;
  late final Animation<double>   _logoFade;
  late final Animation<double>   _logoScale;
  late final Animation<double>   _contentFade;
  late final Animation<Offset>   _contentSlide;

  @override
  void initState() {
    super.initState();
    SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
      statusBarColor:            Colors.transparent,
      statusBarIconBrightness:   Brightness.light,
      systemNavigationBarColor:  AppColors.primary,
    ));

    _logoCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 700),
    );
    _contentCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 600),
    );

    _logoFade  = CurvedAnimation(parent: _logoCtrl,    curve: Curves.easeOut);
    _logoScale = Tween<double>(begin: 0.75, end: 1.0).animate(
      CurvedAnimation(parent: _logoCtrl, curve: Curves.easeOutBack));

    _contentFade  = CurvedAnimation(parent: _contentCtrl, curve: Curves.easeOut);
    _contentSlide = Tween<Offset>(
      begin: const Offset(0, 0.12), end: Offset.zero,
    ).animate(CurvedAnimation(parent: _contentCtrl, curve: Curves.easeOut));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      FirebaseService(ApiService()).init(context);
    });
    _init();
  }

  Future<void> _init() async {
    await Future.delayed(const Duration(milliseconds: 200));
    _logoCtrl.forward();

    const storage = FlutterSecureStorage();
    final token   = await storage.read(key: 'jwt_token');
    if (!mounted) return;

    if (token != null) {
      await Future.delayed(const Duration(milliseconds: 900));
      if (!mounted) return;
      context.go('/home');
      return;
    }

    final onboardingSeen = await storage.read(key: 'onboarding_seen');
    if (!mounted) return;

    if (onboardingSeen != 'true') {
      await Future.delayed(const Duration(milliseconds: 700));
      if (!mounted) return;
      context.go('/onboarding');
    } else {
      await Future.delayed(const Duration(milliseconds: 400));
      if (!mounted) return;
      setState(() => _showWelcome = true);
      _contentCtrl.forward();
    }
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _contentCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size   = MediaQuery.of(context).size;
    final bottom = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Stack(
        children: [
          // ── Decorative background circles ──────────────────────────────────
          Positioned(
            top:   -size.width * 0.35,
            right: -size.width * 0.25,
            child: _DecorCircle(
              diameter: size.width * 0.85,
              color: AppColors.white.withValues(alpha: 0.04),
            ),
          ),
          Positioned(
            bottom: -size.width * 0.20,
            left:   -size.width * 0.30,
            child: _DecorCircle(
              diameter: size.width * 0.75,
              color: AppColors.accent.withValues(alpha: 0.07),
            ),
          ),
          Positioned(
            top:  size.height * 0.55,
            right: size.width * 0.05,
            child: _DecorCircle(
              diameter: size.width * 0.18,
              color: AppColors.gold300.withValues(alpha: 0.12),
            ),
          ),

          // ── Main content ──────────────────────────────────────────────────
          SafeArea(
            top: false,
            child: Column(
              children: [
                // Logo + brand (upper ~60%)
                Expanded(
                  flex: 6,
                  child: FadeTransition(
                    opacity: _logoFade,
                    child: ScaleTransition(
                      scale: _logoScale,
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 48),

                          // Logo badge
                          Container(
                            width:  120,
                            height: 120,
                            decoration: BoxDecoration(
                              color: AppColors.white,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color:     Colors.black.withValues(alpha: 0.22),
                                  blurRadius: 32,
                                  offset:    const Offset(0, 10),
                                ),
                              ],
                            ),
                            child: ClipOval(
                              child: Padding(
                                padding: const EdgeInsets.all(14),
                                child: Image.asset(
                                  'assets/images/iuea_logo.png',
                                  fit: BoxFit.contain,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 32),

                          // App name
                          Text(
                            'IUEA Library',
                            style: const TextStyle(
                              fontFamily:  'PlayfairDisplay',
                              fontSize:    36,
                              fontWeight:  FontWeight.w700,
                              color:       AppColors.white,
                              letterSpacing: 0.2,
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Gold rule + tagline
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                width: 28, height: 1,
                                color: AppColors.gold500.withValues(alpha: 0.70),
                              ),
                              const SizedBox(width: 10),
                              Text(
                                'DIGITAL CURATOR',
                                style: TextStyle(
                                  fontFamily:    'Inter',
                                  fontSize:      11,
                                  fontWeight:    FontWeight.w600,
                                  color:         AppColors.gold300,
                                  letterSpacing: 2.4,
                                ),
                              ),
                              const SizedBox(width: 10),
                              Container(
                                width: 28, height: 1,
                                color: AppColors.gold500.withValues(alpha: 0.70),
                              ),
                            ],
                          ),
                          const SizedBox(height: 20),

                          Text(
                            'Your knowledge.\nUnlimited access.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontFamily: 'Inter',
                              fontSize:   16,
                              height:     1.6,
                              color:      AppColors.white.withValues(alpha: 0.75),
                              fontWeight: FontWeight.w300,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // CTA area (lower ~40%)
                Expanded(
                  flex: 4,
                  child: _showWelcome
                      ? FadeTransition(
                          opacity: _contentFade,
                          child: SlideTransition(
                            position: _contentSlide,
                            child: Padding(
                              padding: EdgeInsets.fromLTRB(32, 0, 32, bottom + 32),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                children: [
                                  // Get Started
                                  SizedBox(
                                    width:  double.infinity,
                                    height: 54,
                                    child: ElevatedButton(
                                      onPressed: () => context.go('/login'),
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.white,
                                        foregroundColor: AppColors.primary,
                                        elevation:    0,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16)),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: const [
                                          Text(
                                            'Get Started',
                                            style: TextStyle(
                                              fontFamily:  'Inter',
                                              fontSize:    16,
                                              fontWeight:  FontWeight.w700,
                                            ),
                                          ),
                                          SizedBox(width: 8),
                                          Icon(Icons.arrow_forward_rounded, size: 18),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 16),

                                  // Sign in link
                                  GestureDetector(
                                    onTap: () => context.go('/login'),
                                    child: Text(
                                      'Already have an account?  Sign in',
                                      style: TextStyle(
                                        fontFamily: 'Inter',
                                        fontSize:   13,
                                        color:      AppColors.white.withValues(alpha: 0.60),
                                        decoration: TextDecoration.underline,
                                        decorationColor: AppColors.white.withValues(alpha: 0.30),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        )
                      : SizedBox(height: bottom + 32),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DecorCircle extends StatelessWidget {
  final double diameter;
  final Color  color;
  const _DecorCircle({required this.diameter, required this.color});

  @override
  Widget build(BuildContext context) => Container(
    width: diameter, height: diameter,
    decoration: BoxDecoration(shape: BoxShape.circle, color: color),
  );
}
