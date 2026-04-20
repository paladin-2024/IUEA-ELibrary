import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

// ── Page metadata ─────────────────────────────────────────────────────────────
class _PageData {
  final String  title;
  final String  subtitle;
  final String  body;
  final String  cta;
  final String? boldPhrase;
  const _PageData({
    required this.title,
    required this.subtitle,
    required this.body,
    required this.cta,
    this.boldPhrase,
  });
}

const _kPages = [
  _PageData(
    title:    'Welcome to your\nDigital Library',
    subtitle: 'IUEA — International University of East Africa',
    body:     'Access over 100,000 academic books, research papers, and journals — all in one place.',
    cta:      'Next',
  ),
  _PageData(
    title:      'Read or Listen',
    subtitle:   'SEAMLESS LEARNING',
    body:       'Switch seamlessly between reading and high-quality audio narration powered by Google TTS.',
    cta:        'Next',
    boldPhrase: 'Google TTS',
  ),
  _PageData(
    title:    'Your AI Study\nPartner',
    subtitle: 'POWERED BY GOOGLE AI',
    body:     'Get instant summaries, translations, and explanations from our AI assistant specialized in academic content.',
    cta:      'Get Started',
  ),
];

const _kStorage = FlutterSecureStorage();

// ── Main screen ───────────────────────────────────────────────────────────────
class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final _pageCtrl = PageController();

  late final AnimationController _loopCtrl;
  late final AnimationController _textCtrl;
  late final Animation<double>   _textFade;
  late final Animation<Offset>   _textSlide;

  int _page = 0;

  @override
  void initState() {
    super.initState();

    _loopCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 2600),
    )..repeat(reverse: true);

    _textCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 400),
    );

    _textFade  = CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut);
    _textSlide = Tween<Offset>(
      begin: const Offset(0, 0.18),
      end:   Offset.zero,
    ).animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOutCubic));

    _textCtrl.forward();
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    _loopCtrl.dispose();
    _textCtrl.dispose();
    super.dispose();
  }

  Future<void> _finishOnboarding() async {
    await _kStorage.write(key: 'onboarding_seen', value: 'true');
    if (mounted) context.go('/login');
  }

  void _goNext() {
    if (_page < 2) {
      _pageCtrl.nextPage(
        duration: const Duration(milliseconds: 380),
        curve:    Curves.easeInOut,
      );
    } else {
      _finishOnboarding();
    }
  }

  void _skip() => _finishOnboarding();

  @override
  Widget build(BuildContext context) {
    final pd = _kPages[_page];

    return Scaffold(
      backgroundColor: const Color(0xFFF7F0EE),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
              child: Row(
                children: [
                  // Logo + wordmark
                  Row(children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color:        AppColors.primary,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [BoxShadow(
                          color:      AppColors.primary.withOpacity(0.35),
                          blurRadius: 12,
                          offset:     const Offset(0, 4))],
                      ),
                      padding: const EdgeInsets.all(7),
                      child: Image.asset(
                        'assets/images/iuea_logo.png',
                        color: AppColors.white,
                        errorBuilder: (_, __, ___) => const Icon(
                          Icons.school_rounded,
                          color: AppColors.white, size: 22),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('IUEA',
                          style: TextStyle(
                            fontFamily:    'Inter',
                            fontSize:      13,
                            fontWeight:    FontWeight.w800,
                            color:         AppColors.primary,
                            letterSpacing: 1.4,
                          )),
                        Text('Digital Library',
                          style: TextStyle(
                            fontFamily: 'Inter',
                            fontSize:   10,
                            color:      AppColors.textSecondary,
                            letterSpacing: 0.3,
                          )),
                      ],
                    ),
                  ]),
                  const Spacer(),
                  AnimatedOpacity(
                    opacity:  _page < 2 ? 1.0 : 0.0,
                    duration: const Duration(milliseconds: 200),
                    child: GestureDetector(
                      onTap: _page < 2 ? _skip : null,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 7),
                        decoration: BoxDecoration(
                          color:        AppColors.primary.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('Skip',
                          style: TextStyle(
                            fontFamily:  'Inter',
                            fontSize:    13,
                            fontWeight:  FontWeight.w600,
                            color:       AppColors.primary,
                          )),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 4),

            // ── Swiping pages ─────────────────────────────────────────────────
            Expanded(
              child: PageView(
                controller:    _pageCtrl,
                onPageChanged: (i) {
                  setState(() => _page = i);
                  _textCtrl.forward(from: 0);
                },
                children: [
                  _Page1(loop: _loopCtrl, textAnim: _textFade, slideAnim: _textSlide),
                  _Page2(loop: _loopCtrl, textAnim: _textFade, slideAnim: _textSlide),
                  _Page3(loop: _loopCtrl, textAnim: _textFade, slideAnim: _textSlide),
                ],
              ),
            ),

            // ── Fixed bottom ──────────────────────────────────────────────────
            _BottomSection(
              page:     _page,
              pageData: pd,
              fade:     _textFade,
              onNext:   _goNext,
              onBack:   () => _pageCtrl.animateToPage(0,
                duration: const Duration(milliseconds: 400),
                curve:    Curves.easeInOut),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Bottom section ────────────────────────────────────────────────────────────
class _BottomSection extends StatelessWidget {
  final int       page;
  final _PageData pageData;
  final Animation<double> fade;
  final VoidCallback onNext;
  final VoidCallback onBack;

  const _BottomSection({
    required this.page,
    required this.pageData,
    required this.fade,
    required this.onNext,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Dot indicators ────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (i) {
              final active = i == page;
              return AnimatedContainer(
                duration: const Duration(milliseconds: 280),
                curve:    Curves.easeInOut,
                margin:   const EdgeInsets.symmetric(horizontal: 3),
                width:    active ? 28 : 8,
                height:   8,
                decoration: BoxDecoration(
                  color:        active ? AppColors.primary : AppColors.grey300,
                  borderRadius: BorderRadius.circular(4)),
              );
            }),
          ),
          const SizedBox(height: 22),

          // ── CTA button ────────────────────────────────────────────────────
          SizedBox(
            width:  double.infinity,
            height: 56,
            child: ElevatedButton(
              onPressed: onNext,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                elevation:       0,
                shadowColor:     AppColors.primary.withOpacity(0.40),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
                splashFactory: InkRipple.splashFactory,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(pageData.cta,
                    style: const TextStyle(
                      fontFamily:    'Inter',
                      fontSize:      16,
                      fontWeight:    FontWeight.w700,
                      color:         AppColors.white,
                      letterSpacing: 0.3)),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_rounded, size: 18),
                ],
              ),
            ),
          ),

          AnimatedCrossFade(
            duration:     const Duration(milliseconds: 220),
            firstChild:   const SizedBox(height: 12),
            secondChild:  Padding(
              padding: const EdgeInsets.only(top: 12),
              child: GestureDetector(
                onTap: onBack,
                child: Text('Back to basics',
                  style: TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   14,
                    color:      AppColors.textSecondary)),
              ),
            ),
            crossFadeState: page == 2
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
          ),

          const SizedBox(height: 10),

          // ── Footer ────────────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 16, height: 16,
                decoration: BoxDecoration(
                  color:        AppColors.primary,
                  borderRadius: BorderRadius.circular(4),
                ),
                padding: const EdgeInsets.all(2.5),
                child: Image.asset(
                  'assets/images/iuea_logo.png',
                  color: AppColors.white,
                  errorBuilder: (_, __, ___) =>
                      const Icon(Icons.school_rounded, color: AppColors.white, size: 10),
                ),
              ),
              const SizedBox(width: 6),
              Text('IUEA Library · ${page + 1} of 3',
                style: TextStyle(
                  fontFamily:    'Inter',
                  fontSize:      9,
                  letterSpacing: 1.1,
                  color:         AppColors.textHint.withOpacity(0.6))),
            ],
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — Welcome / Digital Library
// ─────────────────────────────────────────────────────────────────────────────
class _Page1 extends StatelessWidget {
  final AnimationController loop;
  final Animation<double>   textAnim;
  final Animation<Offset>   slideAnim;
  const _Page1({required this.loop, required this.textAnim, required this.slideAnim});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          const SizedBox(height: 8),

          // ── Hero card ─────────────────────────────────────────────────────
          Expanded(
            flex: 5,
            child: Stack(
              clipBehavior: Clip.none,
              alignment:    Alignment.bottomCenter,
              children: [
                // Background card
                Container(
                  width:        double.infinity,
                  clipBehavior: Clip.hardEdge,
                  decoration:   BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: const LinearGradient(
                      begin:  Alignment.topLeft,
                      end:    Alignment.bottomRight,
                      colors: [
                        Color(0xFF3A0810),
                        Color(0xFF680D1A),
                        Color(0xFF7A1828),
                      ],
                    ),
                  ),
                  child: Stack(children: [
                    // Top-right glow
                    Positioned(
                      top: -30, right: -30,
                      child: Container(
                        width: 220, height: 220,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(colors: [
                            const Color(0xFFC9A84C).withOpacity(0.40),
                            Colors.transparent,
                          ]),
                        ),
                      ),
                    ),
                    // Left glow
                    Positioned(
                      bottom: 20, left: -40,
                      child: Container(
                        width: 160, height: 160,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(colors: [
                            const Color(0xFF9B2D3E).withOpacity(0.30),
                            Colors.transparent,
                          ]),
                        ),
                      ),
                    ),

                    // Gothic arch shapes
                    Positioned(
                      left: -12, top: 16,
                      child: _Arch(width: 84, height: 140, opacity: 0.11)),
                    Positioned(
                      left: 0, right: 0, top: 8,
                      child: Center(
                        child: _Arch(width: 116, height: 170, opacity: 0.20))),
                    Positioned(
                      right: -12, top: 16,
                      child: _Arch(width: 84, height: 140, opacity: 0.11)),

                    // Book spines
                    ..._buildBookSpines(left: 6,   count: 5, heights: [38, 32, 44, 36, 40]),
                    ..._buildBookSpines(left: 260, count: 4, heights: [36, 42, 30, 38]),

                    // Floor vignette
                    Positioned(
                      bottom: 0, left: 0, right: 0,
                      child: Container(
                        height: 72,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            begin:  Alignment.topCenter,
                            end:    Alignment.bottomCenter,
                            colors: [Colors.transparent, Color(0x4A2A0810)],
                          ),
                        ),
                      ),
                    ),

                    // Top label inside card
                    Positioned(
                      top: 16, left: 0, right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                          decoration: BoxDecoration(
                            color:        Colors.white.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(
                              color: Colors.white.withOpacity(0.20), width: 1),
                          ),
                          child: const Text('IUEA DIGITAL LIBRARY',
                            style: TextStyle(
                              fontFamily:    'Inter',
                              fontSize:      9,
                              fontWeight:    FontWeight.w700,
                              color:         Colors.white,
                              letterSpacing: 1.8,
                            )),
                        ),
                      ),
                    ),

                    // ── Central IUEA logo ──────────────────────────────────
                    Center(child: AnimatedBuilder(
                      animation: loop,
                      builder:   (_, __) => Transform.translate(
                        offset: Offset(0, -5 + 5 * loop.value),
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 96, height: 96,
                              decoration: BoxDecoration(
                                color:        Colors.white.withOpacity(0.13),
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(
                                  color: Colors.white.withOpacity(0.25), width: 1.5),
                                boxShadow: [
                                  BoxShadow(
                                    color:     Colors.black.withOpacity(0.25),
                                    blurRadius: 24,
                                    offset:    const Offset(0, 10)),
                                ],
                              ),
                              padding: const EdgeInsets.all(16),
                              child: Image.asset(
                                'assets/images/iuea_logo.png',
                                color: Colors.white,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.school_rounded,
                                  color: Colors.white, size: 48),
                              ),
                            ),
                            const SizedBox(height: 10),
                            Text('IUEA',
                              style: TextStyle(
                                fontFamily:    'Inter',
                                fontSize:      18,
                                fontWeight:    FontWeight.w900,
                                color:         Colors.white,
                                letterSpacing: 4,
                              )),
                            const SizedBox(height: 2),
                            Text('Est. 1994 · Kampala, Uganda',
                              style: TextStyle(
                                fontFamily: 'Inter',
                                fontSize:   9,
                                color:      Colors.white.withOpacity(0.55),
                                letterSpacing: 1.0,
                              )),
                          ],
                        ),
                      ),
                    )),

                    // Corner book stacks
                    Positioned(
                      left: 22, bottom: 36,
                      child: _BookStack(opacity: 0.38, widths: [28, 34, 22])),
                    Positioned(
                      right: 26, bottom: 40,
                      child: _BookStack(opacity: 0.28, widths: [32, 24, 30])),
                  ]),
                ),

                // Badge overlapping bottom edge
                Positioned(
                  bottom: -24,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color:        AppColors.white,
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: [
                        BoxShadow(
                          color:     AppColors.primary.withOpacity(0.22),
                          blurRadius: 18,
                          offset:    const Offset(0, 6)),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.menu_book_rounded,
                          color: AppColors.primary, size: 18),
                        const SizedBox(width: 6),
                        Text('100,000+ resources',
                          style: TextStyle(
                            fontFamily:  'Inter',
                            fontSize:    12,
                            fontWeight:  FontWeight.w700,
                            color:       AppColors.primary,
                          )),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 44),

          // ── Text block ────────────────────────────────────────────────────
          FadeTransition(
            opacity: textAnim,
            child: SlideTransition(
              position: slideAnim,
              child: _PageText(
                title:    'Welcome to your\nDigital Library',
                subtitle: 'IUEA — International University of East Africa',
                body:     'Access over 100,000 academic books, research papers, and journals — all in one place.',
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }

  static List<Widget> _buildBookSpines({
    required double left,
    required int count,
    required List<int> heights,
  }) {
    const colors = [
      Color(0x3DFFFFFF),
      Color(0x28FFFFFF),
      Color(0x33FFFFFF),
      Color(0x22FFFFFF),
      Color(0x2BFFFFFF),
    ];
    final spines = <Widget>[];
    double x = left;
    for (int i = 0; i < count && i < heights.length; i++) {
      final h = heights[i].toDouble();
      spines.add(Positioned(
        left:   x,
        bottom: 36,
        child:  Container(
          width:  10,
          height: h,
          margin: const EdgeInsets.only(right: 2),
          decoration: BoxDecoration(
            color:        colors[i % colors.length],
            borderRadius: const BorderRadius.vertical(top: Radius.circular(2)),
          ),
        ),
      ));
      x += 12;
    }
    return spines;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — Read or Listen
// ─────────────────────────────────────────────────────────────────────────────
class _Page2 extends StatelessWidget {
  final AnimationController loop;
  final Animation<double>   textAnim;
  final Animation<Offset>   slideAnim;
  const _Page2({required this.loop, required this.textAnim, required this.slideAnim});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          const SizedBox(height: 8),

          Expanded(
            flex: 5,
            child: Container(
              width:        double.infinity,
              clipBehavior: Clip.hardEdge,
              decoration:   BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  begin:  Alignment.topLeft,
                  end:    Alignment.bottomRight,
                  colors: [
                    Color(0xFF0C0C18),
                    Color(0xFF190A12),
                    Color(0xFF140E1E),
                  ],
                ),
              ),
              child: Stack(children: [
                // Warm spotlight
                Positioned(
                  top: -10, left: 0, right: 0,
                  child: Center(
                    child: AnimatedBuilder(
                      animation: loop,
                      builder:   (_, __) => Container(
                        width: 240, height: 240,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          gradient: RadialGradient(colors: [
                            const Color(0xFFC9A84C)
                                .withOpacity(0.18 + 0.07 * loop.value),
                            Colors.transparent,
                          ]),
                        ),
                      ),
                    ),
                  ),
                ),

                // Sound wave rings
                Center(child: AnimatedBuilder(
                  animation: loop,
                  builder:   (_, __) => CustomPaint(
                    size: const Size(300, 300),
                    painter: _WaveRingPainter(progress: loop.value),
                  ),
                )),

                // Central headphones
                Center(child: AnimatedBuilder(
                  animation: loop,
                  builder:   (_, __) => Transform.translate(
                    offset: Offset(0, -5 + 5 * loop.value),
                    child: Container(
                      width: 94, height: 94,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white.withOpacity(0.07),
                        border: Border.all(
                          color: Colors.white.withOpacity(0.16), width: 1.5)),
                      child: const Icon(Icons.headphones_rounded,
                        size: 48, color: Colors.white),
                    ),
                  ),
                )),

                // IUEA logo badge — top left
                Positioned(
                  top: 14, left: 14,
                  child: AnimatedBuilder(
                    animation: loop,
                    builder:   (_, __) => Transform.translate(
                      offset: Offset(0, -2 + 2 * loop.value),
                      child: Container(
                        width: 40, height: 40,
                        decoration: BoxDecoration(
                          color:        AppColors.primary,
                          borderRadius: BorderRadius.circular(11),
                          boxShadow: [BoxShadow(
                            color:      AppColors.primary.withOpacity(0.45),
                            blurRadius: 10,
                            offset:     const Offset(0, 4))]),
                        padding: const EdgeInsets.all(7),
                        child: Image.asset(
                          'assets/images/iuea_logo.png',
                          color: AppColors.white,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.school_rounded, color: AppColors.white, size: 18),
                        ),
                      ),
                    ),
                  ),
                ),

                // Bookmark badge — top right
                Positioned(
                  top: 14, right: 14,
                  child: AnimatedBuilder(
                    animation: loop,
                    builder:   (_, __) => Transform.translate(
                      offset: Offset(0, -1 + 1 * loop.value),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 7),
                        decoration: BoxDecoration(
                          color:        Colors.white.withOpacity(0.10),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(
                            color: Colors.white.withOpacity(0.18))),
                        child: Text('IU',
                          style: TextStyle(
                            fontFamily:  'Lora',
                            color:       AppColors.white,
                            fontSize:    13,
                            fontWeight:  FontWeight.w700)),
                      ),
                    ),
                  ),
                ),

                // Bottom gradient
                Positioned(
                  bottom: 0, left: 0, right: 0,
                  child: Container(
                    height: 60,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        begin:  Alignment.topCenter,
                        end:    Alignment.bottomCenter,
                        colors: [Colors.transparent, Color(0x441A0A12)],
                      ),
                    ),
                  ),
                ),
              ]),
            ),
          ),
          const SizedBox(height: 28),

          FadeTransition(
            opacity: textAnim,
            child: SlideTransition(
              position: slideAnim,
              child: _PageText(
                title:      'Read or Listen',
                subtitle:   'SEAMLESS LEARNING',
                body:       'Switch seamlessly between reading text and high-quality audio narration powered by Google TTS.',
                boldPhrase: 'Google TTS',
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — AI Study Partner
// ─────────────────────────────────────────────────────────────────────────────
class _Page3 extends StatelessWidget {
  final AnimationController loop;
  final Animation<double>   textAnim;
  final Animation<Offset>   slideAnim;
  const _Page3({required this.loop, required this.textAnim, required this.slideAnim});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Column(
        children: [
          const SizedBox(height: 8),

          Expanded(
            flex: 5,
            child: Container(
              width:        double.infinity,
              clipBehavior: Clip.hardEdge,
              decoration:   BoxDecoration(
                borderRadius: BorderRadius.circular(24),
                gradient: const LinearGradient(
                  begin:  Alignment.topLeft,
                  end:    Alignment.bottomRight,
                  colors: [Color(0xFF1A0A1E), Color(0xFF2A0A18), Color(0xFF0E0E1A)],
                ),
              ),
              child: LayoutBuilder(
                builder: (_, box) {
                  final cx = box.maxWidth  / 2;
                  final cy = box.maxHeight / 2;
                  return AnimatedBuilder(
                    animation: loop,
                    builder: (_, __) {
                      final float = -6 + 6 * loop.value;
                      return Stack(children: [
                        // Background glow
                        Positioned(
                          left: cx - 80, top: cy - 80,
                          child: Container(
                            width: 160, height: 160,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: RadialGradient(colors: [
                                AppColors.primary.withOpacity(0.22),
                                Colors.transparent,
                              ]),
                            ),
                          ),
                        ),

                        // IUEA logo — top-left corner
                        Positioned(
                          top: 14, left: 14,
                          child: Transform.translate(
                            offset: Offset(0, -2 + 2 * loop.value),
                            child: Container(
                              width: 40, height: 40,
                              decoration: BoxDecoration(
                                color:        AppColors.primary,
                                borderRadius: BorderRadius.circular(11),
                                boxShadow: [BoxShadow(
                                  color:      AppColors.primary.withOpacity(0.45),
                                  blurRadius: 10,
                                  offset:     const Offset(0, 4))]),
                              padding: const EdgeInsets.all(7),
                              child: Image.asset(
                                'assets/images/iuea_logo.png',
                                color: AppColors.white,
                                errorBuilder: (_, __, ___) => const Icon(
                                  Icons.school_rounded, color: AppColors.white, size: 18),
                              ),
                            ),
                          ),
                        ),

                        // Orbital icons
                        Positioned(
                          left: cx + 44,
                          top:  cy - 88 + float * 0.5,
                          child: _FloatingIcon(
                            icon: Icons.translate_rounded,
                            bg:   AppColors.primary, iconClr: AppColors.white,
                            size: 46, glow: true),
                        ),
                        Positioned(
                          left: cx - 116,
                          top:  cy - 20 + float * 0.7,
                          child: _FloatingIcon(
                            icon: Icons.share_rounded,
                            bg:   AppColors.white, iconClr: AppColors.primary,
                            size: 52, shadow: true),
                        ),
                        Positioned(
                          left: cx + 62,
                          top:  cy + 28 - float * 0.4,
                          child: _FloatingIcon(
                            icon: Icons.menu_book_rounded,
                            bg:   AppColors.white, iconClr: AppColors.primary,
                            size: 40, shadow: true),
                        ),
                        Positioned(
                          left: cx - 90,
                          top:  cy + 52 - float * 0.6,
                          child: _FloatingIcon(
                            icon: Icons.spellcheck_rounded,
                            bg:   AppColors.accent.withOpacity(0.15),
                            iconClr: AppColors.accent,
                            size: 38),
                        ),
                        Positioned(
                          left: cx - 86,
                          top:  cy - 72 + float * 0.3,
                          child: _FloatingIcon(
                            icon: Icons.mic_rounded,
                            bg:   AppColors.surface, iconClr: AppColors.textSecondary,
                            size: 36, shadow: true),
                        ),

                        // Central robot
                        Positioned(
                          left: cx - 52,
                          top:  cy - 52 + float,
                          child: Container(
                            width: 104, height: 104,
                            decoration: BoxDecoration(
                              color:  AppColors.primary,
                              shape:  BoxShape.circle,
                              boxShadow: [BoxShadow(
                                color:     AppColors.primary.withOpacity(0.40),
                                blurRadius: 32,
                                offset:    const Offset(0, 12))],
                            ),
                            child: const Icon(Icons.smart_toy_rounded,
                              color: AppColors.white, size: 54),
                          ),
                        ),
                      ]);
                    },
                  );
                },
              ),
            ),
          ),
          const SizedBox(height: 28),

          FadeTransition(
            opacity: textAnim,
            child: SlideTransition(
              position: slideAnim,
              child: _PageText(
                title:    'Your AI Study\nPartner',
                subtitle: 'POWERED BY GOOGLE AI',
                body:     'Get instant summaries, translations, and explanations from our AI assistant specialized in academic content.',
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────────────────────
class _Arch extends StatelessWidget {
  final double width;
  final double height;
  final double opacity;
  const _Arch({required this.width, required this.height, required this.opacity});

  @override
  Widget build(BuildContext context) {
    return Container(
      width:  width,
      height: height,
      decoration: BoxDecoration(
        color:        Colors.white.withOpacity(opacity),
        borderRadius: BorderRadius.only(
          topLeft:  Radius.circular(width / 2),
          topRight: Radius.circular(width / 2)),
      ),
    );
  }
}

class _BookStack extends StatelessWidget {
  final double       opacity;
  final List<double> widths;
  const _BookStack({required this.opacity, required this.widths});

  @override
  Widget build(BuildContext context) {
    const h = 6.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: widths.asMap().entries.map((e) {
        final ratio = 1.0 - e.key * 0.08;
        return Container(
          width:  e.value,
          height: h,
          margin: const EdgeInsets.only(bottom: 2),
          decoration: BoxDecoration(
            color:        Colors.white.withOpacity(opacity * ratio),
            borderRadius: BorderRadius.circular(2)),
        );
      }).toList(),
    );
  }
}

class _WaveRingPainter extends CustomPainter {
  final double progress;
  const _WaveRingPainter({required this.progress});

  @override
  void paint(Canvas canvas, Size size) {
    final cx   = size.width  / 2;
    final cy   = size.height / 2;
    final base = Paint()
      ..style       = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    for (int i = 0; i < 5; i++) {
      final frac    = (i + 1) / 6;
      final r       = 44.0 + frac * 96;
      final opacity = (1 - frac) * 0.28 * (0.5 + 0.5 * progress);
      base.color    = const Color(0xFFC9A84C).withOpacity(opacity);
      canvas.drawCircle(Offset(cx, cy), r, base);
    }
  }

  @override
  bool shouldRepaint(_WaveRingPainter old) => old.progress != progress;
}

class _FloatingIcon extends StatelessWidget {
  final IconData icon;
  final Color    bg;
  final Color    iconClr;
  final double   size;
  final bool     shadow;
  final bool     glow;

  const _FloatingIcon({
    required this.icon,
    required this.bg,
    required this.iconClr,
    required this.size,
    this.shadow = false,
    this.glow   = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width:  size,
      height: size,
      decoration: BoxDecoration(
        color:  bg,
        shape:  BoxShape.circle,
        boxShadow: [
          if (shadow)
            BoxShadow(
              color:     Colors.black.withOpacity(0.10),
              blurRadius: 14,
              offset:    const Offset(0, 4)),
          if (glow)
            BoxShadow(
              color:     iconClr.withOpacity(0.35),
              blurRadius: 16,
              offset:    const Offset(0, 4)),
        ],
      ),
      child: Icon(icon, color: iconClr, size: size * 0.46),
    );
  }
}

class _PageText extends StatelessWidget {
  final String  title;
  final String  subtitle;
  final String  body;
  final String? boldPhrase;
  const _PageText({
    required this.title,
    required this.subtitle,
    required this.body,
    this.boldPhrase,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        // Subtitle chip
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color:        AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(subtitle,
            style: TextStyle(
              fontFamily:    'Inter',
              fontSize:      9,
              fontWeight:    FontWeight.w700,
              color:         AppColors.primary,
              letterSpacing: 1.4,
            )),
        ),
        const SizedBox(height: 10),

        // Title
        Text(title,
          textAlign: TextAlign.center,
          style: AppTextStyles.h1.copyWith(
            fontSize:   26,
            height:     1.28,
            color:      AppColors.primary,
            fontWeight: FontWeight.w700)),

        const SizedBox(height: 12),

        // Body
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: boldPhrase != null
              ? _BoldBody(text: body, bold: boldPhrase!)
              : Text(body,
                  textAlign: TextAlign.center,
                  style: AppTextStyles.body.copyWith(
                    fontSize: 15,
                    height:   1.65,
                    color:    AppColors.textSecondary)),
        ),
      ],
    );
  }
}

class _BoldBody extends StatelessWidget {
  final String text;
  final String bold;
  const _BoldBody({required this.text, required this.bold});

  @override
  Widget build(BuildContext context) {
    final idx = text.indexOf(bold);
    if (idx < 0) {
      return Text(text,
        textAlign: TextAlign.center,
        style: AppTextStyles.body.copyWith(
          fontSize: 15, height: 1.65, color: AppColors.textSecondary));
    }
    return Text.rich(
      textAlign: TextAlign.center,
      TextSpan(
        style: AppTextStyles.body.copyWith(
          fontSize: 15, height: 1.65, color: AppColors.textSecondary),
        children: [
          TextSpan(text: text.substring(0, idx)),
          TextSpan(
            text:  bold,
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color:      AppColors.primary)),
          TextSpan(text: text.substring(idx + bold.length)),
        ],
      ),
    );
  }
}
