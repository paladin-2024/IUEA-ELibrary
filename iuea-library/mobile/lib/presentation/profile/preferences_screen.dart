import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

const _kFonts = [
  {'id': 'serif',    'label': 'SERIF',    'family': 'Lora',  'sample': 'Aa'},
  {'id': 'sans',     'label': 'SANS',     'family': 'Inter', 'sample': 'Aa'},
  {'id': 'dyslexic', 'label': 'DYSLEXIC','family': 'Inter', 'sample': 'Aa'},
];

const _kThemes = [
  {'id': 'white', 'label': 'White', 'bg': 0xFFFFFFFF, 'text': 0xFF1A0508},
  {'id': 'sepia', 'label': 'Sepia', 'bg': 0xFFF5ECD7, 'text': 0xFF3B2F1A},
  {'id': 'dark',  'label': 'Dark',  'bg': 0xFF1A1A2E, 'text': 0xFFE5E5E5},
];

class PreferencesScreen extends StatefulWidget {
  const PreferencesScreen({super.key});

  @override
  State<PreferencesScreen> createState() => _PreferencesScreenState();
}

class _PreferencesScreenState extends State<PreferencesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReaderProvider>().loadReadingPrefs();
    });
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App bar ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      size: 18, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text('Reading Preferences',
                    style: AppTextStyles.h3.copyWith(
                      fontSize: 16, color: AppColors.textPrimary)),
                  const Spacer(),
                ]),
              ),
            ),

            // ── Subtitle ───────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
                child: Text(
                  'Customize your reading experience to match your comfort. Your preferences are saved across all devices.',
                  style: AppTextStyles.bodySmall.copyWith(
                    color: AppColors.textSecondary, height: 1.5)),
              ),
            ),

            // ── Typography section ─────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _SectionCard(
                  icon:  Icons.text_fields_rounded,
                  title: 'Typography',
                  child: Column(
                    children: [
                      // Font family row
                      Row(
                        children: _kFonts.map((f) {
                          final sel = reader.fontFamily == f['id'];
                          return Expanded(
                            child: GestureDetector(
                              onTap: () =>
                                reader.setFontFamily(f['id'] as String),
                              child: Container(
                                margin: const EdgeInsets.symmetric(horizontal: 3),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14),
                                decoration: BoxDecoration(
                                  color: sel
                                      ? AppColors.primary.withValues(alpha: 0.06)
                                      : Colors.transparent,
                                  border: Border.all(
                                    color: sel ? AppColors.primary : AppColors.border,
                                    width: sel ? 1.5 : 1),
                                  borderRadius: BorderRadius.circular(10)),
                                child: Column(children: [
                                  Text(f['sample'] as String,
                                    style: TextStyle(
                                      fontFamily: f['family'] as String,
                                      fontSize:   22,
                                      fontWeight: FontWeight.w500,
                                      color:      AppColors.textPrimary)),
                                  const SizedBox(height: 4),
                                  Text(f['label'] as String,
                                    style: TextStyle(
                                      fontSize:      10,
                                      letterSpacing: 0.6,
                                      color:         sel
                                          ? AppColors.primary
                                          : AppColors.textSecondary,
                                      fontWeight:    sel
                                          ? FontWeight.w600 : FontWeight.w500)),
                                ]),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                      const SizedBox(height: 20),

                      // Font size slider
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Font Size',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 13, color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500)),
                          Text('${reader.fontSize.toInt()}px',
                            style: AppTextStyles.body.copyWith(
                              color:      AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize:   14)),
                        ],
                      ),
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor:   AppColors.primary,
                          inactiveTrackColor: AppColors.grey300,
                          thumbColor:         AppColors.primary,
                          overlayColor:       AppColors.primary.withValues(alpha: 0.1),
                          trackHeight:        4,
                          thumbShape: const RoundSliderThumbShape(
                            enabledThumbRadius: 7),
                        ),
                        child: Slider(
                          value:     reader.fontSize.clamp(14.0, 24.0),
                          min:       14, max: 24, divisions: 10,
                          onChanged: reader.setFontSize,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Line spacing slider
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Line Spacing',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 13, color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500)),
                          Text(reader.lineHeight.toStringAsFixed(1),
                            style: AppTextStyles.body.copyWith(
                              color:      AppColors.primary,
                              fontWeight: FontWeight.w700,
                              fontSize:   14)),
                        ],
                      ),
                      SliderTheme(
                        data: SliderTheme.of(context).copyWith(
                          activeTrackColor:   AppColors.primary,
                          inactiveTrackColor: AppColors.grey300,
                          thumbColor:         AppColors.primary,
                          overlayColor:       AppColors.primary.withValues(alpha: 0.1),
                          trackHeight:        4,
                          thumbShape: const RoundSliderThumbShape(
                            enabledThumbRadius: 7),
                        ),
                        child: Slider(
                          value:     reader.lineHeight.clamp(1.2, 2.0),
                          min:       1.2, max: 2.0, divisions: 8,
                          onChanged: reader.setLineHeight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Environment (theme) section ────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _SectionCard(
                  icon:  Icons.palette_outlined,
                  title: 'Environment',
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.start,
                    children: _kThemes.map((t) {
                      final sel = reader.theme == t['id'];
                      return Padding(
                        padding: const EdgeInsets.only(right: 20),
                        child: GestureDetector(
                          onTap: () => reader.setTheme(t['id'] as String),
                          child: Column(children: [
                            Container(
                              width:  56,
                              height: 56,
                              decoration: BoxDecoration(
                                color:  Color(t['bg'] as int),
                                shape:  BoxShape.circle,
                                border: Border.all(
                                  color: sel ? AppColors.primary : AppColors.border,
                                  width: sel ? 2.5 : 1.5),
                                boxShadow: [BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.06),
                                  blurRadius: 6, offset: const Offset(0, 2))],
                              ),
                              child: sel
                                  ? Icon(Icons.check_rounded,
                                      color: Color(t['text'] as int), size: 22)
                                  : null,
                            ),
                            const SizedBox(height: 6),
                            Text(t['label'] as String,
                              style: AppTextStyles.label.copyWith(
                                fontSize:   11,
                                color:      sel
                                    ? AppColors.primary : AppColors.textSecondary,
                                fontWeight: sel ? FontWeight.w600 : null)),
                          ]),
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Toggles section ────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Container(
                  decoration: BoxDecoration(
                    color:        AppColors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(
                      color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
                      offset: const Offset(0, 2))],
                  ),
                  child: Column(children: [
                    _ToggleRow(
                      icon:     Icons.bookmark_added_outlined,
                      title:    'Auto-save progress',
                      subtitle: 'Resume where you left off',
                      value:    reader.autoSave,
                      onChanged: reader.setAutoSave,
                      isFirst:  true,
                    ),
                    const Divider(height: 1, indent: 16, endIndent: 16,
                      color: AppColors.border),
                    _ToggleRow(
                      icon:     Icons.cloud_download_outlined,
                      title:    'Offline reading',
                      subtitle: 'Download for later use',
                      value:    reader.offlineReading,
                      onChanged: reader.setOfflineReading,
                      isFirst:  false,
                    ),
                  ]),
                ),
              ),
            ),

            // ── Footer ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 28),
                child: Column(children: [
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    _Lnk('Privacy'), _Sep(),
                    _Lnk('Terms'),   _Sep(),
                    _Lnk('Koha API'),
                  ]),
                  const SizedBox(height: 6),
                  Text('POWERED BY GOOGLE',
                    style: TextStyle(
                      fontSize:      9,
                      letterSpacing: 1.4,
                      color:         AppColors.textHint.withValues(alpha: 0.6))),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Section card ──────────────────────────────────────────────────────────────
class _SectionCard extends StatelessWidget {
  final IconData icon;
  final String   title;
  final Widget   child;
  const _SectionCard({
    required this.icon, required this.title, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color:        AppColors.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: 10),
            Text(title,
              style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w600, fontSize: 15)),
          ]),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

// ── Toggle row ────────────────────────────────────────────────────────────────
class _ToggleRow extends StatelessWidget {
  final IconData icon;
  final String   title;
  final String   subtitle;
  final bool     value;
  final void Function(bool) onChanged;
  final bool     isFirst;
  const _ToggleRow({
    required this.icon, required this.title, required this.subtitle,
    required this.value, required this.onChanged, required this.isFirst});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(16, isFirst ? 14 : 10, 16, 14),
      child: Row(children: [
        Container(
          width: 32, height: 32,
          decoration: BoxDecoration(
            color:        AppColors.primary.withValues(alpha: 0.07),
            borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: AppColors.primary, size: 16),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title,
              style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w600, fontSize: 14)),
            Text(subtitle,
              style: AppTextStyles.label.copyWith(
                color: AppColors.textHint, fontSize: 12)),
          ],
        )),
        Switch(
          value:       value,
          activeThumbColor: AppColors.primary,
          onChanged:   onChanged,
        ),
      ]),
    );
  }
}

// ── Footer helpers ────────────────────────────────────────────────────────────
class _Lnk extends StatelessWidget {
  final String t;
  const _Lnk(this.t);
  @override
  Widget build(BuildContext context) => Text(t,
    style: TextStyle(fontFamily: 'Inter', fontSize: 10,
      color: AppColors.textHint.withValues(alpha: 0.7),
      decoration: TextDecoration.underline,
      decorationColor: AppColors.textHint.withValues(alpha: 0.4)));
}

class _Sep extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·',
      style: TextStyle(fontSize: 10,
        color: AppColors.textHint.withValues(alpha: 0.5))));
}
