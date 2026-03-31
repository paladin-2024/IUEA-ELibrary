import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/constants/app_text_styles.dart';

// Mirrors shared/languages.json — keeping in sync manually avoids a JSON load
// dependency inside a widget build.
class _LangEntry {
  final String name;
  final String native;
  final String code;
  final String flag;
  const _LangEntry(this.name, this.native, this.code, this.flag);
}

const _kLanguages = [
  _LangEntry('English',     'English',     'en', '🇬🇧'),
  _LangEntry('Swahili',     'Kiswahili',   'sw', '🇹🇿'),
  _LangEntry('French',      'Français',    'fr', '🇫🇷'),
  _LangEntry('Arabic',      'العربية',     'ar', '🇸🇦'),
  _LangEntry('Luganda',     'Luganda',     'lg', '🇺🇬'),
  _LangEntry('Kinyarwanda', 'Kinyarwanda', 'rw', '🇷🇼'),
  _LangEntry('Somali',      'Soomaali',    'so', '🇸🇴'),
  _LangEntry('Amharic',     'አማርኛ',      'am', '🇪🇹'),
];

class LanguageSwitcherSheet extends StatelessWidget {
  const LanguageSwitcherSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      minChildSize:     0.4,
      maxChildSize:     0.9,
      expand:           false,
      builder: (ctx, scrollController) {
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
                  color: AppColors.grey300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: AppSpacing.md),

              // ── Header ────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.pagePadding),
                child: Row(
                  children: [
                    const Icon(Icons.translate,
                      color: AppColors.primary, size: 20),
                    const SizedBox(width: AppSpacing.sm),
                    Text('Switch Language', style: AppTextStyles.h3),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.xs),
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.pagePadding),
                child: Text(
                  'Free translation by MyMemory · mymemory.translated.net',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textHint, fontSize: 10),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Warning chip ──────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.pagePadding),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: AppSpacing.xs + 2),
                  decoration: BoxDecoration(
                    color:        const Color(0xFFFEF3C7),
                    borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
                    border: Border.all(color: const Color(0xFFFDE68A)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.warning_amber_outlined,
                        color: Color(0xFFF59E0B), size: 14),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Machine translation — quality may vary. '
                          'Not suitable for academic citation.',
                          style: AppTextStyles.label.copyWith(
                            color: const Color(0xFF92400E), fontSize: 10),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),

              // ── Language list ──────────────────────────────────────────
              Expanded(
                child: reader.isTranslating
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(
                              color: AppColors.primary),
                            const SizedBox(height: AppSpacing.sm),
                            Text(
                              'Translating…',
                              style: AppTextStyles.bodySmall,
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        controller:  scrollController,
                        itemCount:   _kLanguages.length,
                        separatorBuilder: (_, __) => const Divider(
                          height: 1, indent: 56),
                        itemBuilder: (_, i) {
                          final lang     = _kLanguages[i];
                          final selected = reader.readingLanguage == lang.name;

                          return InkWell(
                            onTap: () async {
                              Navigator.of(context).pop();
                              if (lang.name == reader.readingLanguage) return;
                              if (lang.code == 'en') {
                                reader.setCurrentChapterText(
                                  reader.currentChapterText); // clears translation
                                return;
                              }
                              await reader.translateCurrentChapter(lang.name);
                            },
                            child: Container(
                              decoration: BoxDecoration(
                                border: selected
                                    ? const Border(
                                        left: BorderSide(
                                          color: AppColors.primary, width: 3))
                                    : null,
                              ),
                              child: ListTile(
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: selected
                                      ? AppSpacing.pagePadding - 3
                                      : AppSpacing.pagePadding,
                                  vertical: 2,
                                ),
                                leading: Text(
                                  lang.flag,
                                  style: const TextStyle(fontSize: 26),
                                ),
                                title: Text(
                                  lang.name,
                                  style: AppTextStyles.body.copyWith(
                                    fontWeight: selected
                                        ? FontWeight.w600 : null,
                                    color: selected
                                        ? AppColors.primary : null,
                                  ),
                                ),
                                subtitle: Text(
                                  lang.native,
                                  style: AppTextStyles.label.copyWith(
                                    color: AppColors.textHint),
                                ),
                                trailing: selected
                                    ? const Icon(Icons.check_circle,
                                        color: AppColors.primary, size: 18)
                                    : null,
                              ),
                            ),
                          );
                        },
                      ),
              ),

              const SizedBox(height: AppSpacing.sm),
            ],
          ),
        );
      },
    );
  }
}
