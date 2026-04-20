import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'package:google_fonts/google_fonts.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _silenced       = false;
  bool _newArrivals    = true;
  bool _readingRemind  = true;
  bool _newPodcasts    = false;
  bool _weeklySummary  = true;

  TimeOfDay _quietStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _quietEnd   = const TimeOfDay(hour: 7,  minute: 0);

  @override
  Widget build(BuildContext context) {
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
                  Text('Notifications',
                    style: AppTextStyles.h3.copyWith(
                      fontSize: 16, color: AppColors.textPrimary)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_rounded,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.pop(),
                  ),
                  const CircleAvatar(
                    radius: 16, backgroundColor: AppColors.primaryContainer,
                    child: Icon(Icons.person_rounded,
                      color: AppColors.white, size: 16)),
                  const SizedBox(width: 4),
                ]),
              ),
            ),

            // ── Heading ────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Curate Your\nExperience',
                      style: AppTextStyles.h1.copyWith(
                        fontSize: 26, color: AppColors.primary, height: 1.2)),
                    const SizedBox(height: 8),
                    Text(
                      'Tailor how IUEA Library reaches out to you. Balance academic immersion with focus.',
                      style: AppTextStyles.bodySmall.copyWith(
                        color: AppColors.textSecondary, height: 1.5)),
                    const SizedBox(height: 20),

                    // ── Master mute ────────────────────────────────────────
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color:        _silenced
                            ? AppColors.warning.withOpacity(0.07)
                            : AppColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _silenced
                              ? AppColors.warning.withOpacity(0.4)
                              : AppColors.border),
                        boxShadow: [BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                      child: Row(children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: (_silenced ? AppColors.warning : AppColors.grey300)
                                .withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10)),
                          child: Icon(
                            _silenced
                              ? Icons.notifications_off_outlined
                              : Icons.notifications_active_outlined,
                            color: _silenced ? AppColors.warning : AppColors.textSecondary,
                            size: 18),
                        ),
                        const SizedBox(width: 12),
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Notifications Silenced',
                              style: AppTextStyles.body.copyWith(
                                fontWeight: FontWeight.w600, fontSize: 14)),
                            const SizedBox(height: 2),
                            Text(
                              _silenced
                                ? 'Global Do Not Disturb is currently active on this device.'
                                : 'You are not currently muting all notifications.',
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.textSecondary, fontSize: 11,
                                height: 1.4)),
                          ],
                        )),
                        Switch(
                          value:          _silenced,
                          activeThumbColor:    AppColors.warning,
                          onChanged: (v) => setState(() => _silenced = v),
                        ),
                      ]),
                    ),
                    const SizedBox(height: 24),

                    // ── Alert categories ────────────────────────────────────
                    Text('Alert Categories',
                      style: AppTextStyles.h3.copyWith(fontSize: 16)),
                    const SizedBox(height: 12),
                  ],
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Column(children: [
                  _AlertTile(
                    icon:     Icons.auto_stories_outlined,
                    title:    'New arrivals',
                    subtitle: 'Fresh titles from your department.',
                    value:    _newArrivals,
                    onChanged: (v) => setState(() => _newArrivals = v),
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     Icons.schedule_rounded,
                    title:    'Reading reminders',
                    subtitle: 'Nudge on your active reading goals.',
                    value:    _readingRemind,
                    onChanged: (v) => setState(() => _readingRemind = v),
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     Icons.podcasts_rounded,
                    title:    'New podcasts',
                    subtitle: 'Faculty discussions & lecture notes.',
                    value:    _newPodcasts,
                    onChanged: (v) => setState(() => _newPodcasts = v),
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     Icons.bar_chart_rounded,
                    title:    'Weekly summary',
                    subtitle: 'Your library activity at a glance.',
                    value:    _weeklySummary,
                    onChanged: (v) => setState(() => _weeklySummary = v),
                  ),
                  const SizedBox(height: 24),

                  // ── Quiet hours ─────────────────────────────────────────
                  Align(
                    alignment: Alignment.centerLeft,
                    child: Text('Quiet Hours',
                      style: AppTextStyles.h3.copyWith(fontSize: 16)),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color:        AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(
                        color: Colors.black.withOpacity(0.04), blurRadius: 8,
                        offset: const Offset(0, 2))],
                    ),
                    child: Row(children: [
                      Expanded(child: _QuietTile(
                        label: 'START',
                        time:  _quietStart,
                        onTap: () async {
                          final t = await showTimePicker(
                            context: context, initialTime: _quietStart);
                          if (t != null) setState(() => _quietStart = t);
                        },
                      )),
                      Container(width: 1, height: 48, color: AppColors.border,
                        margin: const EdgeInsets.symmetric(horizontal: 16)),
                      Expanded(child: _QuietTile(
                        label: 'ENDING',
                        time:  _quietEnd,
                        onTap: () async {
                          final t = await showTimePicker(
                            context: context, initialTime: _quietEnd);
                          if (t != null) setState(() => _quietEnd = t);
                        },
                      )),
                    ]),
                  ),
                ]),
              ),
            ),

            // ── Footer ─────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(children: [
                  Text('IUEA LIBRARY DIGITAL CURATOR · 2025',
                    style: TextStyle(fontFamily: GoogleFonts.inter().fontFamily, fontSize: 9,
                      letterSpacing: 1.2,
                      color: AppColors.textHint.withOpacity(0.6))),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Alert tile ─────────────────────────────────────────────────────────────────
class _AlertTile extends StatelessWidget {
  final IconData icon;
  final String   title;
  final String   subtitle;
  final bool     value;
  final void Function(bool) onChanged;
  const _AlertTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.value,
    required this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withOpacity(0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color:        AppColors.primary.withOpacity(0.07),
            borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: AppTextStyles.body.copyWith(
              fontWeight: FontWeight.w600, fontSize: 14)),
            const SizedBox(height: 1),
            Text(subtitle, style: AppTextStyles.label.copyWith(
              color: AppColors.textHint, fontSize: 11)),
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

// ── Quiet tile ────────────────────────────────────────────────────────────────
class _QuietTile extends StatelessWidget {
  final String     label;
  final TimeOfDay  time;
  final VoidCallback onTap;
  const _QuietTile({required this.label, required this.time, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final h = time.hourOfPeriod == 0 ? 12 : time.hourOfPeriod;
    final m = time.minute.toString().padLeft(2, '0');
    final period = time.period == DayPeriod.am ? 'AM' : 'PM';
    return GestureDetector(
      onTap: onTap,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: AppTextStyles.label.copyWith(
          fontSize: 9, letterSpacing: 1.2, color: AppColors.textHint)),
        const SizedBox(height: 4),
        Text('$h:$m $period',
          style: AppTextStyles.h2.copyWith(
            fontSize: 22, color: AppColors.textPrimary)),
        Text('Quiet ${label == 'START' ? 'starts' : 'ends'}',
          style: AppTextStyles.label.copyWith(
            fontSize: 10, color: AppColors.textHint)),
      ]),
    );
  }
}
