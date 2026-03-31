import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/constants/app_text_styles.dart';

class _Language {
  final String code;
  final String name;
  final String native;
  final String flag;
  const _Language(this.code, this.name, this.native, this.flag);
}

const _kLanguages = [
  _Language('en',  'English',    'English',   '🇬🇧'),
  _Language('fr',  'French',     'Français',  '🇫🇷'),
  _Language('ar',  'Arabic',     'العربية',   '🇸🇦'),
  _Language('sw',  'Swahili',    'Kiswahili', '🇹🇿'),
  _Language('lg',  'Luganda',    'Luganda',   '🇺🇬'),
  _Language('es',  'Spanish',    'Español',   '🇪🇸'),
  _Language('pt',  'Portuguese', 'Português', '🇧🇷'),
  _Language('hi',  'Hindi',      'हिन्दी',   '🇮🇳'),
];

class LanguageSwitcherSheet extends StatelessWidget {
  final String currentChapterText;
  const LanguageSwitcherSheet({super.key, required this.currentChapterText});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return DraggableScrollableSheet(
      initialChildSize: 0.65,
      minChildSize:     0.4,
      maxChildSize:     0.9,
      expand:           false,
      builder: (_, scrollCtrl) {
        return Container(
          decoration: const BoxDecoration(
            color:        AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle
              const SizedBox(height: 10),
              Container(
                width:  40, height: 4,
                decoration: BoxDecoration(
                  color:        AppColors.grey300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),

              // Header
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
                child: Row(
                  children: [
                    const Icon(Icons.translate, color: AppColors.primary, size: 20),
                    const SizedBox(width: 8),
                    Text('Reading Language', style: AppTextStyles.h3),
                  ],
                ),
              ),
              const SizedBox(height: 8),

              // Warning banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color:        const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(AppSpacing.cardRadius),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_outlined,
                        color: Color(0xFFF59E0B), size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Machine translation via MyMemory API. Quality may vary.',
                          style: AppTextStyles.label.copyWith(color: const Color(0xFF92400E)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),

              // Language list
              Expanded(
                child: reader.isTranslating
                    ? const Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            CircularProgressIndicator(color: AppColors.primary),
                            SizedBox(height: 12),
                            Text('Translating…',
                              style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        controller:  scrollCtrl,
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.pagePadding),
                        itemCount:   _kLanguages.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final lang      = _kLanguages[i];
                          final isSelected = reader.readingLanguage == lang.code;
                          return ListTile(
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 0, vertical: 2),
                            leading: Text(lang.flag,
                              style: const TextStyle(fontSize: 28)),
                            title: Text(lang.name,
                              style: AppTextStyles.body.copyWith(
                                fontWeight: isSelected ? FontWeight.w600 : null,
                                color:      isSelected ? AppColors.primary : null,
                              )),
                            subtitle: Text(lang.native,
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.textHint)),
                            trailing: isSelected
                                ? const Icon(Icons.check_circle,
                                    color: AppColors.primary, size: 18)
                                : null,
                            onTap: () async {
                              if (lang.code == 'en') {
                                reader.clearTranslation();
                                Navigator.of(context).pop();
                                return;
                              }
                              await reader.translateCurrentChapter(
                                currentChapterText, lang.code);
                              if (context.mounted) Navigator.of(context).pop();
                            },
                          );
                        },
                      ),
              ),

              // Attribution footer
              Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Text('Powered by MyMemory Translation API',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textHint, fontSize: 10),
                  textAlign: TextAlign.center,
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
