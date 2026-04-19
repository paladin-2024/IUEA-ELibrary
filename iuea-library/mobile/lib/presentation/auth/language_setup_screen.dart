import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'package:google_fonts/google_fonts.dart';

const _languages = [
  {'code': 'en', 'name': 'English',     'flag': '🇬🇧'},
  {'code': 'sw', 'name': 'Swahili',     'flag': '🇹🇿'},
  {'code': 'fr', 'name': 'French',      'flag': '🇫🇷'},
  {'code': 'ar', 'name': 'Arabic',      'flag': '🇸🇦'},
  {'code': 'lg', 'name': 'Luganda',     'flag': '🇺🇬'},
  {'code': 'rw', 'name': 'Kinyarwanda', 'flag': '🇷🇼'},
  {'code': 'so', 'name': 'Somali',      'flag': '🇸🇴'},
  {'code': 'am', 'name': 'Amharic',     'flag': '🇪🇹'},
];

class LanguageSetupScreen extends StatefulWidget {
  const LanguageSetupScreen({super.key});

  @override
  State<LanguageSetupScreen> createState() => _LanguageSetupScreenState();
}

class _LanguageSetupScreenState extends State<LanguageSetupScreen> {
  final Set<String> _selected = {'en'};
  bool _saving = false;

  void _toggle(String code) {
    setState(() {
      if (_selected.contains(code)) {
        if (_selected.length > 1) _selected.remove(code);
      } else {
        _selected.add(code);
      }
    });
  }

  Future<void> _continue() async {
    setState(() => _saving = true);
    try {
      final names = _selected
          .map((c) => _languages.firstWhere((l) => l['code'] == c)['name']!)
          .toList();
      await ApiService().put(ApiConstants.authMe,
        data: {'preferredLanguages': names});
    } catch (_) {}
    if (!mounted) return;
    setState(() => _saving = false);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final bottom = MediaQuery.of(context).padding.bottom;
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.fromLTRB(24, 32, 24, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // ── Logo ───────────────────────────────────────────────
                    Container(
                      width: 72, height: 72,
                      decoration: const BoxDecoration(
                        color: AppColors.white,
                        shape: BoxShape.circle,
                        boxShadow: [BoxShadow(
                          color: Color(0x1A7B0D1E),
                          blurRadius: 16, offset: Offset(0, 4))],
                      ),
                      child: ClipOval(
                        child: Padding(
                          padding: const EdgeInsets.all(10),
                          child: Image.asset(
                            'assets/images/iuea_logo.png',
                            fit: BoxFit.contain),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // ── Heading ────────────────────────────────────────────
                    Text(
                      'Choose your reading\nlanguages',
                      style: AppTextStyles.h1.copyWith(
                        fontSize: 24, color: AppColors.textPrimary,
                        height: 1.25),
                      textAlign: TextAlign.center),
                    const SizedBox(height: 6),
                    Text(
                      'POWERED BY GOOGLE TRANSLATE',
                      style: TextStyle(
                        fontSize:      9,
                        letterSpacing: 1.6,
                        color:         AppColors.textHint),
                    ),
                    const SizedBox(height: 28),

                    // ── Language grid ──────────────────────────────────────
                    GridView.count(
                      crossAxisCount:   2,
                      shrinkWrap:       true,
                      physics:          const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 10,
                      mainAxisSpacing:  10,
                      childAspectRatio: 1.15,
                      children: _languages.map((lang) {
                        final code       = lang['code']!;
                        final isSelected = _selected.contains(code);
                        return _LanguageCard(
                          flag:       lang['flag']!,
                          name:       lang['name']!,
                          isSelected: isSelected,
                          onTap:      () => _toggle(code),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 28),

                    // ── Continue ───────────────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _saving ? null : _continue,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryContainer,
                          foregroundColor: AppColors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12))),
                        child: _saving
                          ? const SizedBox(width: 20, height: 20,
                              child: CircularProgressIndicator(
                                color: AppColors.white, strokeWidth: 2))
                          : Row(mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text('Continue', style: AppTextStyles.button),
                                const SizedBox(width: 8),
                                const Icon(Icons.arrow_forward_rounded, size: 16),
                              ]),
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),

            // ── Footer ──────────────────────────────────────────────────────
            Padding(
              padding: EdgeInsets.only(bottom: bottom + 12, top: 4),
              child: Text(
                'INTERNATIONAL UNIVERSITY OF EAST AFRICA',
                style: TextStyle(
                  fontFamily: GoogleFonts.inter().fontFamily, fontSize: 9, letterSpacing: 1.2,
                  color: AppColors.textHint.withOpacity(0.6)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Language card ─────────────────────────────────────────────────────────────
class _LanguageCard extends StatelessWidget {
  final String       flag;
  final String       name;
  final bool         isSelected;
  final VoidCallback onTap;
  const _LanguageCard({
    required this.flag,
    required this.name,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        decoration: BoxDecoration(
          color:        isSelected
              ? AppColors.primary.withOpacity(0.04) : AppColors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1),
          boxShadow: [BoxShadow(
            color:     Colors.black.withOpacity(0.03),
            blurRadius: 6, offset: const Offset(0, 2))],
        ),
        child: Stack(
          children: [
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(flag, style: const TextStyle(fontSize: 34)),
                  const SizedBox(height: 8),
                  Text(
                    name,
                    style: TextStyle(
                      fontSize:    13,
                      fontWeight:  FontWeight.w600,
                      color: isSelected
                          ? AppColors.primary : AppColors.textPrimary),
                    textAlign: TextAlign.center),
                ],
              ),
            ),

            // Checkmark
            if (isSelected)
              Positioned(
                top: 8, right: 8,
                child: Container(
                  width: 20, height: 20,
                  decoration: const BoxDecoration(
                    color: AppColors.primary, shape: BoxShape.circle),
                  child: const Icon(Icons.check_rounded,
                    color: AppColors.white, size: 12),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
