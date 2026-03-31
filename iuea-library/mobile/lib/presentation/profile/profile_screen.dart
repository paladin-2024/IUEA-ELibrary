import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../data/repositories/progress_repository.dart';
import '../../data/models/progress_model.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _progressRepo                  = ProgressRepository(ApiService());
  List<ProgressModel> _progresses      = [];
  bool                _statsLoading    = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    try {
      final data = await _progressRepo.getAllProgress();
      if (mounted) setState(() { _progresses = data; _statsLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _statsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user;

    final finished  = _progresses.where((p) => p.isCompleted).length;
    final hours     = _progresses.fold<int>(0, (s, p) => s + p.totalReadingMinutes) ~/ 60;
    final goal      = user?.readingGoal ?? 20;
    final goalPct   = (finished / goal).clamp(0.0, 1.0);

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation:       0,
        title:           const Text('Profile',
            style: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.w700)),
        actions: [
          TextButton.icon(
            onPressed: () {},
            icon:  const Icon(Icons.edit_outlined, size: 16, color: AppColors.primary),
            label: const Text('Edit', style: TextStyle(color: AppColors.primary, fontSize: 13)),
          ),
        ],
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : RefreshIndicator(
              color:     AppColors.primary,
              onRefresh: _loadStats,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // ── Avatar & identity ──────────────────────────────────
                  Row(
                    children: [
                      CircleAvatar(
                        radius:          36,
                        backgroundColor: AppColors.primary,
                        backgroundImage: user.avatar != null
                            ? NetworkImage(user.avatar!) : null,
                        child: user.avatar == null
                            ? Text(user.initials,
                                style: const TextStyle(color: AppColors.white,
                                    fontSize: 26, fontWeight: FontWeight.w700))
                            : null,
                      ),
                      const SizedBox(width: 16),
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(user.name,
                              style: const TextStyle(fontFamily: 'Playfair Display',
                                  fontSize: 18, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 2),
                          Text(user.email,
                              style: const TextStyle(color: AppColors.textSecondary, fontSize: 13)),
                          const SizedBox(height: 6),
                          Wrap(spacing: 6, children: [
                            if (user.studentId != null)
                              _Chip(label: user.studentId!, color: AppColors.grey300,
                                  textColor: AppColors.textSecondary),
                            if (user.faculty != null)
                              _Chip(label: user.faculty!, color: AppColors.accent.withOpacity(0.2),
                                  textColor: AppColors.accent, borderColor: AppColors.accent.withOpacity(0.4)),
                            _Chip(label: user.role.toUpperCase(), color: AppColors.primary.withOpacity(0.1),
                                textColor: AppColors.primary),
                          ]),
                        ],
                      )),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // ── Stats row ──────────────────────────────────────────
                  if (!_statsLoading)
                    Row(children: [
                      _StatCard(label: 'Books Read',  value: '$finished'),
                      const SizedBox(width: 10),
                      _StatCard(label: 'Hours Read',  value: '$hours'),
                      const SizedBox(width: 10),
                      _StatCard(label: 'Languages',
                          value: '${user.preferredLanguages.length}'),
                    ]),
                  const SizedBox(height: 16),

                  // ── Reading goal ──────────────────────────────────────
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:        AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04),
                          blurRadius: 8, offset: const Offset(0, 2))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('Annual Reading Goal',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                            Text('${(goalPct * 100).toInt()}%',
                                style: const TextStyle(color: AppColors.primary,
                                    fontWeight: FontWeight.w700, fontSize: 13)),
                          ],
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value:           goalPct,
                          backgroundColor: AppColors.grey300,
                          valueColor:      const AlwaysStoppedAnimation(AppColors.primary),
                          minHeight:       6,
                          borderRadius:    BorderRadius.circular(3),
                        ),
                        const SizedBox(height: 6),
                        Text('$finished of $goal books · keep it up!',
                            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                  const SizedBox(height: 20),

                  // ── Settings tiles ─────────────────────────────────────
                  _SettingsTile(
                    icon:     Icons.text_fields_outlined,
                    label:    'Reading Preferences',
                    subtitle: 'Font, theme, line spacing',
                    onTap:    () => context.push('/profile/preferences'),
                  ),
                  _SettingsTile(
                    icon:     Icons.language_outlined,
                    label:    'Language Preferences',
                    subtitle: 'Translation & AI language',
                    onTap:    () => context.push('/profile/language-prefs'),
                  ),
                  _SettingsTile(
                    icon:     Icons.notifications_outlined,
                    label:    'Notifications',
                    subtitle: 'Alerts & reminders',
                    onTap:    () {},
                  ),
                  const SizedBox(height: 24),

                  // ── Sign out ───────────────────────────────────────────
                  OutlinedButton.icon(
                    onPressed: () => auth.logout(),
                    icon:  const Icon(Icons.logout, color: AppColors.error, size: 18),
                    label: const Text('Sign Out',
                        style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w600)),
                    style: OutlinedButton.styleFrom(
                      side:    const BorderSide(color: AppColors.error),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape:   RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String  label;
  final Color   color;
  final Color   textColor;
  final Color?  borderColor;
  const _Chip({required this.label, required this.color, required this.textColor, this.borderColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color:        color,
        borderRadius: BorderRadius.circular(12),
        border: borderColor != null ? Border.all(color: borderColor!) : null,
      ),
      child: Text(label,
          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: textColor)),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  const _StatCard({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color:        AppColors.background,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
        ),
        child: Column(children: [
          Text(value,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700,
                  color: AppColors.primary)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
        ]),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String   label;
  final String   subtitle;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.label, required this.subtitle, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color:        AppColors.background,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8)],
      ),
      child: ListTile(
        onTap:        onTap,
        leading: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color:        AppColors.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        title:    Text(label,    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
        subtitle: Text(subtitle, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
        trailing: const Icon(Icons.chevron_right, color: AppColors.grey500, size: 20),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}
