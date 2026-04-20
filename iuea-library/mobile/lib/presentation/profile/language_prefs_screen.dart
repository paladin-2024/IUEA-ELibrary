import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'package:google_fonts/google_fonts.dart';

const _appLanguages = [
  'English (United Kingdom)',
  'English (United States)',
  'French',
  'Arabic',
  'Swahili',
  'Luganda',
];

const _voices = [
  {'name': 'British Male (Arthur)',   'code': 'en-GB-Arthur'},
  {'name': 'East African Female (Zara)', 'code': 'en-KE-Zara'},
];

class LanguagePrefsScreen extends StatefulWidget {
  const LanguagePrefsScreen({super.key});

  @override
  State<LanguagePrefsScreen> createState() => _LanguagePrefsScreenState();
}

class _LanguagePrefsScreenState extends State<LanguagePrefsScreen> {
  String  _appLang       = 'English (United Kingdom)';
  String  _chatbotMode   = 'same'; // 'same' | 'custom'
  bool    _autoTranslate = true;
  String  _voice         = 'en-GB-Arthur';
  double  _speechRate    = 1.2;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App bar ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(8, 8, 16, 0),
                child: Row(children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                      size: 18, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text('Language & Audio',
                    style: AppTextStyles.h3.copyWith(
                      fontSize: 16, color: AppColors.textPrimary)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_rounded,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.push('/notifications'),
                  ),
                  const CircleAvatar(
                    radius: 16, backgroundColor: AppColors.primaryContainer,
                    child: Icon(Icons.person_rounded,
                      color: AppColors.white, size: 16)),
                  const SizedBox(width: 4),
                ]),
              ),
            ),

            // ── Heading ──────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("The Curator's Voice",
                      style: AppTextStyles.h1.copyWith(
                        fontSize: 26, color: AppColors.primary)),
                    const SizedBox(height: 6),
                    Text(
                      'Tailor your linguistic experience across the IUEA digital library.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary, height: 1.5)),
                  ],
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 24)),

            // ── App Language ──────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _Section(
                  icon:  Icons.translate_rounded,
                  title: 'App Language',
                  child: _StyledDropdown(
                    value:    _appLang,
                    options:  _appLanguages,
                    onChanged: (v) => setState(() => _appLang = v),
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Chatbot Response ──────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _Section(
                  icon:  Icons.smart_toy_outlined,
                  title: 'Chatbot Response',
                  subtitle: 'The Digital Curator AI will reply in this language.',
                  child: Row(children: [
                    _ToggleBtn(
                      label:    'Same as App',
                      active:   _chatbotMode == 'same',
                      onTap:    () => setState(() => _chatbotMode = 'same'),
                      isFirst:  true,
                    ),
                    _ToggleBtn(
                      label:    'Select Custom',
                      active:   _chatbotMode == 'custom',
                      onTap:    () => setState(() => _chatbotMode = 'custom'),
                      isFirst:  false,
                    ),
                  ]),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Auto-translate ────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _Section(
                  icon:  Icons.auto_stories_outlined,
                  title: 'Auto-translate books',
                  subtitle: 'Instantly translate book text.',
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _autoTranslate ? 'Enabled' : 'Disabled',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: _autoTranslate
                              ? AppColors.primary : AppColors.textHint)),
                      Switch(
                        value:          _autoTranslate,
                        activeThumbColor:    AppColors.primary,
                        onChanged: (v) => setState(() => _autoTranslate = v),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 16)),

            // ── Voice Selection ───────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: _Section(
                  icon:  Icons.record_voice_over_outlined,
                  title: 'Voice Selection',
                  child: Column(
                    children: [
                      ..._voices.map((v) => _VoiceRow(
                        name:     v['name']!,
                        code:     v['code']!,
                        selected: _voice == v['code'],
                        onTap:    () => setState(() => _voice = v['code']!),
                      )),
                      const Divider(color: AppColors.border, height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SPEECH RATE',
                                style: AppTextStyles.label.copyWith(
                                  fontSize: 10, letterSpacing: 1.1,
                                  color: AppColors.textHint)),
                              const SizedBox(height: 2),
                              Text('${_speechRate.toStringAsFixed(1)}x',
                                style: AppTextStyles.body.copyWith(
                                  fontWeight: FontWeight.w600, fontSize: 14,
                                  color: AppColors.textPrimary)),
                            ],
                          ),
                          Expanded(
                            child: Padding(
                              padding: const EdgeInsets.only(left: 16),
                              child: SliderTheme(
                                data: SliderTheme.of(context).copyWith(
                                  activeTrackColor:  AppColors.primary,
                                  thumbColor:        AppColors.primary,
                                  inactiveTrackColor: AppColors.grey300,
                                  trackHeight:       3,
                                  thumbShape: const RoundSliderThumbShape(
                                    enabledThumbRadius: 7),
                                ),
                                child: Slider(
                                  value:    _speechRate,
                                  min:      0.5,
                                  max:      2.0,
                                  divisions: 6,
                                  onChanged: (v) =>
                                    setState(() => _speechRate = v),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),

            // ── Footer ────────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(children: [
                  Text('POWERED BY GOOGLE · TRANSLATE',
                    style: TextStyle(fontFamily: GoogleFonts.inter().fontFamily, fontSize: 9,
                      letterSpacing: 1.4,
                      color: AppColors.textHint.withOpacity(0.6))),
                  const SizedBox(height: 4),
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    _fl('Privacy'), _fd(), _fl('Terms'), _fd(), _fl('Koha ILS'),
                  ]),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fl(String t) => Text(t, style: TextStyle(
    fontSize: 10, color: AppColors.textHint.withOpacity(0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withOpacity(0.3)));
  Widget _fd() => Padding(padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·', style: TextStyle(fontSize: 10,
      color: AppColors.textHint.withOpacity(0.5))));
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────
class _Section extends StatelessWidget {
  final IconData icon;
  final String   title;
  final String?  subtitle;
  final Widget   child;
  const _Section({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withOpacity(0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            Container(
              width: 32, height: 32,
              decoration: BoxDecoration(
                color:        AppColors.primary.withOpacity(0.08),
                borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: 10),
            Text(title, style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.w600, fontSize: 14)),
          ]),
          if (subtitle != null) ...[
            const SizedBox(height: 6),
            Text(subtitle!, style: AppTextStyles.bodySmall.copyWith(
              fontSize: 12, color: AppColors.textSecondary)),
          ],
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }
}

class _StyledDropdown extends StatelessWidget {
  final String         value;
  final List<String>   options;
  final void Function(String) onChanged;
  const _StyledDropdown({
    required this.value,
    required this.options,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
      decoration: BoxDecoration(
        color:        AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border:       Border.all(color: AppColors.border)),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value:       value,
          isExpanded:  true,
          style:       AppTextStyles.body.copyWith(
            color: AppColors.textPrimary, fontSize: 13),
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
            color: AppColors.textHint),
          dropdownColor: AppColors.white,
          items: options.map((o) => DropdownMenuItem(
            value: o, child: Text(o))).toList(),
          onChanged: (v) { if (v != null) onChanged(v); },
        ),
      ),
    );
  }
}

class _ToggleBtn extends StatelessWidget {
  final String       label;
  final bool         active;
  final VoidCallback onTap;
  final bool         isFirst;
  const _ToggleBtn({
    required this.label,
    required this.active,
    required this.onTap,
    required this.isFirst,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 9),
        decoration: BoxDecoration(
          color: active ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.horizontal(
            left:  isFirst ? const Radius.circular(8) : Radius.zero,
            right: isFirst ? Radius.zero : const Radius.circular(8)),
          border: Border.all(
            color: active ? AppColors.primary : AppColors.border)),
        child: Text(label,
          style: AppTextStyles.label.copyWith(
            color:      active ? AppColors.white : AppColors.textSecondary,
            fontWeight: FontWeight.w600)),
      ),
    );
  }
}

class _VoiceRow extends StatelessWidget {
  final String       name;
  final String       code;
  final bool         selected;
  final VoidCallback onTap;
  const _VoiceRow({
    required this.name,
    required this.code,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(children: [
          Icon(Icons.person_outline_rounded,
            size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 10),
          Expanded(child: Text(name,
            style: AppTextStyles.body.copyWith(fontSize: 13))),
          Container(
            width: 20, height: 20,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: selected ? AppColors.primary : AppColors.border,
                width: selected ? 5 : 2)),
          ),
        ]),
      ),
    );
  }
}
