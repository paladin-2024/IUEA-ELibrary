import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';

const _fonts = [
  {'id': 'serif',    'label': 'Serif',    'sample': 'Aa'},
  {'id': 'sans',     'label': 'Sans',     'sample': 'Aa'},
  {'id': 'dyslexic', 'label': 'Dyslexic', 'sample': 'Aa'},
];

const _themes = [
  {'id': 'light', 'label': 'White', 'bg': 0xFFFFFFFF, 'text': 0xFF1A0508},
  {'id': 'sepia', 'label': 'Sepia', 'bg': 0xFFF4E4C1, 'text': 0xFF3B2F1A},
  {'id': 'dark',  'label': 'Dark',  'bg': 0xFF1A1A2E, 'text': 0xFFE5E5E5},
];

class PreferencesScreen extends StatelessWidget {
  const PreferencesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation:       0,
        title:           const Text('Reading Preferences',
            style: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.w700)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Font family ────────────────────────────────────────────────
          _SectionCard(
            title: 'Font Family',
            child: Row(
              children: _fonts.map((f) {
                final selected = reader.fontFamily == f['id'];
                return Expanded(
                  child: GestureDetector(
                    onTap: () => reader.setFontFamily(f['id'] as String),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color:        selected ? AppColors.primary.withOpacity(0.07) : Colors.transparent,
                        border:       Border.all(
                            color: selected ? AppColors.primary : AppColors.border, width: 1.5),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(children: [
                        Text(f['sample'] as String,
                            style: TextStyle(
                              fontSize:   22,
                              fontFamily: f['id'] == 'serif' ? 'Playfair Display' : null,
                              fontWeight: FontWeight.w500,
                              color:      AppColors.textPrimary,
                            )),
                        const SizedBox(height: 4),
                        Text(f['label'] as String,
                            style: TextStyle(fontSize: 12,
                                color:      selected ? AppColors.primary : AppColors.textSecondary,
                                fontWeight: selected ? FontWeight.w600 : FontWeight.normal)),
                      ]),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Font size ──────────────────────────────────────────────────
          _SectionCard(
            title: 'Font Size',
            trailing: Text('${reader.fontSize.toInt()}px',
                style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary, fontSize: 13)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor:   AppColors.primary,
                    inactiveTrackColor: AppColors.grey300,
                    thumbColor:         AppColors.primary,
                    overlayColor:       AppColors.primary.withOpacity(0.12),
                    trackHeight:        4,
                  ),
                  child: Slider(
                    value:     reader.fontSize.clamp(14.0, 24.0),
                    min:       14,
                    max:       24,
                    divisions: 10,
                    onChanged: (v) => reader.setFontSize(v),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('14px', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    Text('24px', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                  ],
                ),
                const SizedBox(height: 10),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color:        AppColors.surface,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'The quick brown fox jumps over the lazy dog.',
                    style: TextStyle(fontSize: reader.fontSize, color: AppColors.textPrimary,
                        height: 1.6),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // ── Theme swatches ─────────────────────────────────────────────
          _SectionCard(
            title: 'Theme',
            child: Row(
              children: _themes.map((t) {
                final selected = reader.theme == t['id'];
                return Expanded(
                  child: GestureDetector(
                    onTap: () => reader.setTheme(t['id'] as String),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      decoration: BoxDecoration(
                        color:        Color(t['bg'] as int),
                        border:       Border.all(
                            color: selected ? AppColors.primary : AppColors.border,
                            width: selected ? 2 : 1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Column(children: [
                        if (selected)
                          const Icon(Icons.check_circle, color: AppColors.primary, size: 18),
                        if (!selected) const SizedBox(height: 18),
                        const SizedBox(height: 4),
                        Text(t['label'] as String,
                            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                                color: Color(t['text'] as int))),
                      ]),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // ── Toggles ────────────────────────────────────────────────────
          _SectionCard(
            title: 'Options',
            child: Column(children: [
              SwitchListTile(
                value:       reader.autoSave,
                onChanged:   (v) => reader.setAutoSave(v),
                activeColor: AppColors.primary,
                title:       const Text('Auto-save position', style: TextStyle(fontSize: 14)),
                subtitle:    const Text('Resume where you left off', style: TextStyle(fontSize: 12)),
                contentPadding: EdgeInsets.zero,
              ),
              const Divider(height: 1),
              SwitchListTile(
                value:       reader.offlineReading,
                onChanged:   (v) => reader.setOfflineReading(v),
                activeColor: AppColors.primary,
                title:       const Text('Offline reading', style: TextStyle(fontSize: 14)),
                subtitle:    const Text('Cache books for offline access', style: TextStyle(fontSize: 12)),
                contentPadding: EdgeInsets.zero,
              ),
            ]),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String  title;
  final Widget? trailing;
  final Widget  child;
  const _SectionCard({required this.title, this.trailing, required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.background,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8,
            offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14,
                  color: AppColors.textPrimary)),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}
