import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';

const _languages = [
  {'code': 'en', 'name': 'English',     'native': 'English',     'flag': '🇬🇧'},
  {'code': 'sw', 'name': 'Swahili',     'native': 'Kiswahili',   'flag': '🇹🇿'},
  {'code': 'fr', 'name': 'French',      'native': 'Français',    'flag': '🇫🇷'},
  {'code': 'ar', 'name': 'Arabic',      'native': 'العربية',     'flag': '🇸🇦'},
  {'code': 'lg', 'name': 'Luganda',     'native': 'Olu-Ganda',   'flag': '🇺🇬'},
  {'code': 'rw', 'name': 'Kinyarwanda', 'native': 'Kinyarwanda', 'flag': '🇷🇼'},
  {'code': 'so', 'name': 'Somali',      'native': 'Af-Soomaali', 'flag': '🇸🇴'},
  {'code': 'am', 'name': 'Amharic',     'native': 'አማርኛ',        'flag': '🇪🇹'},
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
      final api = ApiService();
      await api.put(ApiConstants.authMe, data: {'preferredLanguages': names});
    } catch (_) {
      // Non-fatal — proceed regardless
    }
    if (!mounted) return;
    setState(() => _saving = false);
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.pagePadding,
            vertical:   AppSpacing.lg,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const SizedBox(height: AppSpacing.lg),

              // ── IUEA shield ───────────────────────────────────────────────
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

              Text('Choose your reading languages',
                style: AppTextStyles.h2.copyWith(fontSize: 22),
                textAlign: TextAlign.center),
              const SizedBox(height: 4),
              Text('Powered by Google Translate',
                style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
              const SizedBox(height: 8),
              Text(
                'Select all languages you\'d like content\ntranslated into. You can change this later in Settings.',
                style: AppTextStyles.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Language grid ─────────────────────────────────────────────
              GridView.count(
                crossAxisCount:   2,
                shrinkWrap:       true,
                physics:          const NeverScrollableScrollPhysics(),
                crossAxisSpacing: AppSpacing.sm,
                mainAxisSpacing:  AppSpacing.sm,
                childAspectRatio: 1.1,
                children: _languages.map((lang) {
                  final code       = lang['code']!;
                  final isSelected = _selected.contains(code);
                  return _LanguageCard(
                    flag:       lang['flag']!,
                    name:       lang['name']!,
                    native:     lang['native']!,
                    isSelected: isSelected,
                    onTap:      () => _toggle(code),
                  );
                }).toList(),
              ),
              const SizedBox(height: AppSpacing.xl),

              // ── Continue button ───────────────────────────────────────────
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _continue,
                  child: _saving
                      ? const SizedBox(
                          width: 20, height: 20,
                          child: CircularProgressIndicator(
                            color: AppColors.white, strokeWidth: 2))
                      : Text('Continue to Library', style: AppTextStyles.button),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Skip link ─────────────────────────────────────────────────
              TextButton(
                onPressed: () => context.go('/home'),
                child: Text('Skip for now',
                  style: AppTextStyles.bodySmall.copyWith(
                    color:      AppColors.textHint,
                    decoration: TextDecoration.underline,
                  )),
              ),
              const SizedBox(height: AppSpacing.lg),

              Text('International University of East Africa',
                style: AppTextStyles.label.copyWith(color: AppColors.textHint)),
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Language card ─────────────────────────────────────────────────────────────
class _LanguageCard extends StatelessWidget {
  const _LanguageCard({
    required this.flag,
    required this.name,
    required this.native,
    required this.isSelected,
    required this.onTap,
  });

  final String       flag;
  final String       name;
  final String       native;
  final bool         isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        children: [
          AnimatedContainer(
            duration: const Duration(milliseconds: 150),
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              color:        isSelected
                  ? AppColors.primary.withOpacity(0.05)
                  : AppColors.white,
              borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
              border: Border.all(
                color: isSelected ? AppColors.primary : AppColors.border,
                width: isSelected ? 2 : 1,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(flag, style: const TextStyle(fontSize: 32)),
                const SizedBox(height: 6),
                Text(name,
                  style: AppTextStyles.label.copyWith(
                    fontWeight: FontWeight.w600,
                    color: isSelected ? AppColors.primary : AppColors.textPrimary,
                  ),
                  textAlign: TextAlign.center),
                const SizedBox(height: 2),
                Text(native,
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textHint, fontSize: 11),
                  textAlign: TextAlign.center),
              ],
            ),
          ),

          // ── Checkmark badge ───────────────────────────────────────────────
          if (isSelected)
            Positioned(
              top:   8,
              right: 8,
              child: Container(
                width: 20, height: 20,
                decoration: const BoxDecoration(
                  color: AppColors.primary, shape: BoxShape.circle),
                child: const Icon(Icons.check, color: AppColors.white, size: 12),
              ),
            ),
        ],
      ),
    );
  }
}
