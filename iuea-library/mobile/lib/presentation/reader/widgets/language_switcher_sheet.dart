import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

class _LangEntry {
  final String name;
  final String subtitle;
  final String code;
  const _LangEntry(this.name, this.subtitle, this.code);
}

const _kLanguages = [
  _LangEntry('English',     'Original language',        'en'),
  _LangEntry('Swahili',     'Kiswahili • Translated',   'sw'),
  _LangEntry('French',      'Français • Translated',    'fr'),
  _LangEntry('Luganda',     'Olu-Ganda • Translated',   'lg'),
  _LangEntry('Arabic',      'العربية • Translated',     'ar'),
  _LangEntry('Kinyarwanda', 'Kinyarwanda • Translated', 'rw'),
  _LangEntry('Somali',      'Soomaali • Translated',    'so'),
  _LangEntry('Amharic',     'አማርኛ • Translated',       'am'),
];

class LanguageSwitcherSheet extends StatelessWidget {
  const LanguageSwitcherSheet({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize:     0.5,
      maxChildSize:     0.95,
      expand:           false,
      builder: (ctx, scrollController) {
        return Container(
          decoration: const BoxDecoration(
            color:        AppColors.surface,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // ── Drag handle ────────────────────────────────────────────────
              const SizedBox(height: 12),
              Center(
                child: Container(
                  width: 36, height: 4,
                  decoration: BoxDecoration(
                    color:        AppColors.grey300,
                    borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),

              // ── Header row ────────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Row(children: [
                  Container(
                    width: 36, height: 36,
                    decoration: BoxDecoration(
                      color:        AppColors.primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10)),
                    child: const Icon(Icons.translate_rounded,
                      color: AppColors.primary, size: 18),
                  ),
                  const SizedBox(width: 12),
                  Text('Switch language',
                    style: AppTextStyles.h3.copyWith(fontSize: 18)),
                  const Spacer(),
                  GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color:        AppColors.grey100,
                        borderRadius: BorderRadius.circular(16)),
                      child: const Icon(Icons.close_rounded,
                        size: 16, color: AppColors.textSecondary),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: 10),

              // ── "Translation by Google Translate" badge ───────────────────
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color:        AppColors.grey100,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(children: [
                    const Icon(Icons.g_translate_rounded,
                      size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 8),
                    Text('TRANSLATION BY GOOGLE TRANSLATE',
                      style: TextStyle(
                        fontFamily:    'Inter',
                        fontSize:      10,
                        color:         AppColors.textSecondary,
                        letterSpacing: 0.8,
                        fontWeight:    FontWeight.w500)),
                    const Spacer(),
                    const Icon(Icons.tune_rounded,
                      size: 14, color: AppColors.textHint),
                  ]),
                ),
              ),
              const SizedBox(height: 12),

              // ── Language list ─────────────────────────────────────────────
              Expanded(
                child: reader.isTranslating
                    ? Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const CircularProgressIndicator(
                              color: AppColors.primary),
                            const SizedBox(height: 12),
                            Text('Translating…',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        controller:   scrollController,
                        padding:      const EdgeInsets.symmetric(
                          horizontal: 20, vertical: 4),
                        itemCount:    _kLanguages.length,
                        separatorBuilder: (_, __) =>
                          const SizedBox(height: 8),
                        itemBuilder: (_, i) {
                          final lang     = _kLanguages[i];
                          final selected = reader.readingLanguage == lang.name;

                          return GestureDetector(
                            onTap: () async {
                              Navigator.of(context).pop();
                              if (lang.name == reader.readingLanguage) return;
                              if (lang.code == 'en') {
                                reader.setCurrentChapterText(
                                  reader.currentChapterText);
                                return;
                              }
                              await reader.translateCurrentChapter(lang.name);
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 14),
                              decoration: BoxDecoration(
                                color:        selected
                                    ? AppColors.primary.withOpacity(0.04)
                                    : AppColors.white,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: selected
                                      ? AppColors.primary
                                      : AppColors.border,
                                  width: selected ? 1.5 : 1,
                                ),
                              ),
                              child: Row(children: [
                                Expanded(child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(lang.name,
                                      style: AppTextStyles.body.copyWith(
                                        fontWeight: selected
                                            ? FontWeight.w600 : FontWeight.w500,
                                        color: selected
                                            ? AppColors.primary
                                            : AppColors.textPrimary,
                                        fontSize: 15)),
                                    const SizedBox(height: 2),
                                    Text(lang.subtitle,
                                      style: AppTextStyles.label.copyWith(
                                        color: AppColors.textHint,
                                        fontSize: 12)),
                                  ],
                                )),
                                if (selected)
                                  Container(
                                    width: 22, height: 22,
                                    decoration: const BoxDecoration(
                                      color:  AppColors.primary,
                                      shape:  BoxShape.circle),
                                    child: const Icon(Icons.check_rounded,
                                      color: AppColors.white, size: 14),
                                  )
                                else
                                  Container(
                                    width: 22, height: 22,
                                    decoration: BoxDecoration(
                                      shape:  BoxShape.circle,
                                      border: Border.all(
                                        color: AppColors.border, width: 1.5)),
                                  ),
                              ]),
                            ),
                          );
                        },
                      ),
              ),

              // ── Warning note ──────────────────────────────────────────────
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.info_outline_rounded,
                      size: 14, color: AppColors.primary),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Machine translation — verify critical content. Academic terminology may vary during automated conversion.',
                        style: AppTextStyles.label.copyWith(
                          fontSize: 11,
                          color:    AppColors.textSecondary,
                          height:   1.4),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
