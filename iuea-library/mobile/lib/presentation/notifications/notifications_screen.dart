import 'dart:async';
import 'package:flutter/material.dart';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../core/constants/api_constants.dart';
import '../../data/services/api_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _api = ApiService();
  Timer? _saveTimer;

  bool _silenced       = false;
  bool _newArrivals    = true;
  bool _readingRemind  = true;
  bool _newPodcasts    = false;
  bool _weeklySummary  = true;

  TimeOfDay _quietStart = const TimeOfDay(hour: 22, minute: 0);
  TimeOfDay _quietEnd   = const TimeOfDay(hour: 7,  minute: 0);

  @override
  void initState() {
    super.initState();
    _loadPrefs();
  }

  @override
  void dispose() {
    _saveTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadPrefs() async {
    try {
      final res  = await _api.get(ApiConstants.notificationPrefs);
      final prefs = (res.data as Map<String, dynamic>?)?['prefs'] as Map<String, dynamic>?;
      if (prefs == null || !mounted) return;
      setState(() {
        _silenced      = prefs['silenced']      as bool? ?? false;
        _newArrivals   = prefs['newArrivals']   as bool? ?? true;
        _readingRemind = prefs['readingRemind'] as bool? ?? true;
        _newPodcasts   = prefs['newPodcasts']   as bool? ?? false;
        _weeklySummary = prefs['weeklySummary'] as bool? ?? true;
        final qs = prefs['quietStart'] as String?;
        final qe = prefs['quietEnd']   as String?;
        if (qs != null) {
          final parts = qs.split(':');
          if (parts.length == 2) {
            _quietStart = TimeOfDay(
              hour:   int.tryParse(parts[0]) ?? 22,
              minute: int.tryParse(parts[1]) ?? 0,
            );
          }
        }
        if (qe != null) {
          final parts = qe.split(':');
          if (parts.length == 2) {
            _quietEnd = TimeOfDay(
              hour:   int.tryParse(parts[0]) ?? 7,
              minute: int.tryParse(parts[1]) ?? 0,
            );
          }
        }
      });
    } catch (_) {}
  }

  void _scheduleSave() {
    _saveTimer?.cancel();
    _saveTimer = Timer(const Duration(seconds: 1), _savePrefs);
  }

  Future<void> _savePrefs() async {
    try {
      await _api.patch(ApiConstants.notificationPrefs, data: {
        'prefs': {
          'silenced':      _silenced,
          'newArrivals':   _newArrivals,
          'readingRemind': _readingRemind,
          'newPodcasts':   _newPodcasts,
          'weeklySummary': _weeklySummary,
          'quietStart':    '${_quietStart.hour.toString().padLeft(2,'0')}:${_quietStart.minute.toString().padLeft(2,'0')}',
          'quietEnd':      '${_quietEnd.hour.toString().padLeft(2,'0')}:${_quietEnd.minute.toString().padLeft(2,'0')}',
        },
      });
    } catch (_) {}
  }

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
                    icon: const Icon(AppIcons.arrowBack,
                      size: 18, color: AppColors.textPrimary),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text('Notifications',
                    style: AppTextStyles.h3.copyWith(
                      fontSize: 16, color: AppColors.textPrimary)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(AppIcons.notification,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.pop(),
                  ),
                  const CircleAvatar(
                    radius: 16, backgroundColor: AppColors.primaryContainer,
                    child: Icon(AppIcons.person,
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
                            ? AppColors.warning.withValues(alpha: 0.07)
                            : AppColors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: _silenced
                              ? AppColors.warning.withValues(alpha: 0.4)
                              : AppColors.border),
                        boxShadow: [BoxShadow(
                          color: Colors.black.withValues(alpha: 0.04),
                          blurRadius: 8, offset: const Offset(0, 2))],
                      ),
                      child: Row(children: [
                        Container(
                          width: 36, height: 36,
                          decoration: BoxDecoration(
                            color: (_silenced ? AppColors.warning : AppColors.grey300)
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(10)),
                          child: Icon(
                            _silenced
                              ? AppIcons.notificationOff
                              : AppIcons.notificationActive,
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
                          onChanged: (v) {
                            setState(() => _silenced = v);
                            _scheduleSave();
                          },
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
                    icon:     AppIcons.bookpen,
                    title:    'New arrivals',
                    subtitle: 'Fresh titles from your department.',
                    value:    _newArrivals,
                    onChanged: (v) { setState(() => _newArrivals = v); _scheduleSave(); },
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     AppIcons.clock,
                    title:    'Reading reminders',
                    subtitle: 'Nudge on your active reading goals.',
                    value:    _readingRemind,
                    onChanged: (v) { setState(() => _readingRemind = v); _scheduleSave(); },
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     AppIcons.podcasts,
                    title:    'New podcasts',
                    subtitle: 'Faculty discussions & lecture notes.',
                    value:    _newPodcasts,
                    onChanged: (v) { setState(() => _newPodcasts = v); _scheduleSave(); },
                  ),
                  const SizedBox(height: 10),
                  _AlertTile(
                    icon:     AppIcons.grid,
                    title:    'Weekly summary',
                    subtitle: 'Your library activity at a glance.',
                    value:    _weeklySummary,
                    onChanged: (v) { setState(() => _weeklySummary = v); _scheduleSave(); },
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
                        color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
                        offset: const Offset(0, 2))],
                    ),
                    child: Row(children: [
                      Expanded(child: _QuietTile(
                        label: 'START',
                        time:  _quietStart,
                        onTap: () async {
                          final t = await showTimePicker(
                            context: context, initialTime: _quietStart);
                          if (t != null) {
                            setState(() => _quietStart = t);
                            _scheduleSave();
                          }
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
                          if (t != null) {
                            setState(() => _quietEnd = t);
                            _scheduleSave();
                          }
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
                    style: TextStyle(fontFamily: 'Inter', fontSize: 9,
                      letterSpacing: 1.2,
                      color: AppColors.textHint.withValues(alpha: 0.6))),
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
          color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: Row(children: [
        Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color:        AppColors.primary.withValues(alpha: 0.07),
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
