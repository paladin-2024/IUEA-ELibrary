import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/auth_provider.dart';
import '../../data/repositories/progress_repository.dart';
import '../../data/models/progress_model.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _progressRepo             = ProgressRepository(ApiService());
  List<ProgressModel> _progresses = [];
  bool  _statsLoading             = true;

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
    final auth     = context.watch<AuthProvider>();
    final user     = auth.user;
    final finished = _progresses.where((p) => p.isCompleted).length;
    final hours    = _progresses.fold<int>(
      0, (s, p) => s + p.totalReadingMinutes) ~/ 60;
    final days     = _progresses
        .where((p) => p.lastReadAt != null).length;
    final goal     = user?.readingGoal ?? 20;
    final goalPct  = (finished / goal).clamp(0.0, 1.0);

    // Find currently reading book
    final currentlyReading = _progresses
        .where((p) => !p.isCompleted && p.percentComplete > 0)
        .toList()
      ..sort((a, b) => (b.lastReadAt ?? DateTime(0))
          .compareTo(a.lastReadAt ?? DateTime(0)));
    final current = currentlyReading.isNotEmpty ? currentlyReading.first : null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: user == null
          ? const Center(child: CircularProgressIndicator(
              color: AppColors.primary))
          : RefreshIndicator(
              color:     AppColors.primary,
              onRefresh: _loadStats,
              child: CustomScrollView(
                slivers: [
                  // ── Top bar ─────────────────────────────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 16, 0),
                      child: Row(children: [
                        Text('IUEA Library',
                          style: GoogleFonts.lora(
                            color: AppColors.primaryContainer, fontSize: 16,
                            fontWeight: FontWeight.w700)),
                        const Spacer(),
                        IconButton(
                          icon: const Icon(Icons.notifications_none_rounded,
                            color: AppColors.textPrimary, size: 22),
                          onPressed: () => context.push('/notifications'),
                        ),
                        CircleAvatar(
                          radius:          16,
                          backgroundColor: AppColors.primaryContainer,
                          backgroundImage: user.avatar != null
                              ? NetworkImage(user.avatar!) : null,
                          child: user.avatar == null
                              ? Text(user.initials,
                                  style: const TextStyle(
                                    color: AppColors.white, fontSize: 11,
                                    fontWeight: FontWeight.w700))
                              : null,
                        ),
                        const SizedBox(width: 4),
                      ]),
                    ),
                  ),

                  // ── Avatar + identity ─────────────────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
                      child: Column(
                        children: [
                          // Avatar
                          CircleAvatar(
                            radius:          44,
                            backgroundColor: AppColors.primaryContainer,
                            backgroundImage: user.avatar != null
                                ? NetworkImage(user.avatar!) : null,
                            child: user.avatar == null
                                ? Text(user.initials,
                                    style: GoogleFonts.lora(
                                      color:      AppColors.white,
                                      fontSize:   28,
                                      fontWeight: FontWeight.w700))
                                : null,
                          ),
                          const SizedBox(height: 12),

                          // Name
                          Text(user.name,
                            style: AppTextStyles.h2.copyWith(
                              fontSize: 20, color: AppColors.textPrimary),
                            textAlign: TextAlign.center),
                          const SizedBox(height: 4),

                          // Student ID
                          if (user.studentId != null)
                            Text('ID: ${user.studentId}',
                              style: AppTextStyles.bodySmall.copyWith(
                                color: AppColors.textSecondary)),
                          const SizedBox(height: 8),

                          // Faculty badge
                          if (user.faculty != null)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: AppColors.primary.withOpacity(0.3)),
                              ),
                              child: Text(
                                'FACULTY OF ${user.faculty!.toUpperCase()}',
                                style: AppTextStyles.label.copyWith(
                                  color:         AppColors.primary,
                                  fontWeight:    FontWeight.w600,
                                  letterSpacing: 0.8,
                                  fontSize:      10,
                                ),
                              ),
                            ),
                          const SizedBox(height: 14),

                          // Edit profile button
                          OutlinedButton.icon(
                            onPressed: () => _showEditProfile(context),
                            icon:  const Icon(Icons.edit_outlined,
                              size: 14, color: AppColors.primary),
                            label: const Text('Edit profile'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              side: const BorderSide(color: AppColors.border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                              textStyle: AppTextStyles.label.copyWith(
                                fontWeight: FontWeight.w500),
                            ),
                          ),
                          const SizedBox(height: 20),
                        ],
                      ),
                    ),
                  ),

                  // ── Stats row ─────────────────────────────────────────
                  if (!_statsLoading)
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Row(children: [
                          _StatCell(value: '$finished', label: 'Books'),
                          _divider(),
                          _StatCell(value: '$hours',    label: 'Hours'),
                          _divider(),
                          _StatCell(value: '$days',     label: 'Days'),
                        ]),
                      ),
                    ),
                  const SliverToBoxAdapter(child: SizedBox(height: 20)),

                  // ── Reading goal ──────────────────────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: _Card(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Reading Goal',
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.textSecondary,
                                fontWeight: FontWeight.w600)),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  '$goal books a year',
                                  style: AppTextStyles.body.copyWith(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500)),
                                Text(
                                  '${(goalPct * 100).toInt()}%',
                                  style: AppTextStyles.body.copyWith(
                                    color:      AppColors.primary,
                                    fontWeight: FontWeight.w700,
                                    fontSize:   13)),
                              ],
                            ),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value:           goalPct,
                              backgroundColor: AppColors.grey300,
                              valueColor: const AlwaysStoppedAnimation(
                                AppColors.primary),
                              minHeight:    5,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  // ── Currently reading ────────────────────────────────
                  if (current != null && current.book != null) ...[
                    const SliverToBoxAdapter(child: SizedBox(height: 16)),
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('CURRENTLY READING',
                              style: AppTextStyles.label.copyWith(
                                color:         AppColors.textHint,
                                letterSpacing: 1.2,
                                fontSize:      10)),
                            const SizedBox(height: 8),
                            _Card(
                              child: Row(children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(6),
                                  child: SizedBox(
                                    width: 44, height: 62,
                                    child: (current.book!.coverUrl?.isNotEmpty ?? false)
                                        ? CachedNetworkImage(
                                            imageUrl: current.book!.coverUrl!,
                                            fit: BoxFit.cover)
                                        : Container(
                                            color: AppColors.primary.withOpacity(0.1),
                                            child: const Icon(Icons.book,
                                              color: AppColors.primary, size: 22)),
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Expanded(child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(current.book!.title,
                                      style: AppTextStyles.body.copyWith(
                                        fontWeight: FontWeight.w600, fontSize: 13),
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis),
                                    const SizedBox(height: 2),
                                    Text('Page ${current.currentPage}',
                                      style: AppTextStyles.bodySmall.copyWith(
                                        fontSize: 11, color: AppColors.textHint)),
                                    const SizedBox(height: 6),
                                    LinearProgressIndicator(
                                      value: (current.percentComplete / 100)
                                          .clamp(0.0, 1.0),
                                      backgroundColor: AppColors.grey300,
                                      valueColor: const AlwaysStoppedAnimation(
                                        AppColors.primary),
                                      minHeight:    3,
                                      borderRadius: BorderRadius.circular(2),
                                    ),
                                  ],
                                )),
                              ]),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SliverToBoxAdapter(child: SizedBox(height: 20)),

                  // ── Settings tiles ───────────────────────────────────
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(children: [
                        _SettingsTile(
                          icon:  Icons.local_library_outlined,
                          label: 'My Loans',
                          onTap: () => context.push('/library/loans'),
                        ),
                        _SettingsTile(
                          icon:  Icons.local_fire_department_outlined,
                          label: 'Streaks & Badges',
                          onTap: () => context.push('/profile/streaks'),
                        ),
                        _SettingsTile(
                          icon:  Icons.settings_outlined,
                          label: 'Reading Preferences',
                          onTap: () => context.push('/profile/preferences'),
                        ),
                        _SettingsTile(
                          icon:  Icons.support_agent_outlined,
                          label: 'Library Support',
                          onTap: () => _showSupportDialog(context),
                        ),
                        const SizedBox(height: 20),
                        // Sign out
                        GestureDetector(
                          onTap: () async {
                            await auth.logout();
                            if (mounted) context.go('/login');
                          },
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            decoration: BoxDecoration(
                              color:        AppColors.error.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(12),
                              border:       Border.all(
                                color: AppColors.error.withOpacity(0.2)),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.logout_rounded,
                                  size: 16, color: AppColors.error),
                                const SizedBox(width: 8),
                                Text('Sign Out',
                                  style: AppTextStyles.body.copyWith(
                                    color:      AppColors.error,
                                    fontWeight: FontWeight.w600,
                                    fontSize:   14)),
                              ],
                            ),
                          ),
                        ),
                      ]),
                    ),
                  ),

                  // Footer
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 24),
                      child: Column(children: [
                        Text('POWERED BY GOOGLE',
                          style: GoogleFonts.inter(
                            fontSize: 9, letterSpacing: 1.4,
                            color: AppColors.textHint.withOpacity(0.6))),
                        const SizedBox(height: 4),
                        Row(mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _footerLink('Privacy'),
                            _footerDot(),
                            _footerLink('Terms'),
                            _footerDot(),
                            _footerLink('Koha ILS'),
                          ],
                        ),
                      ]),
                    ),
                  ),
                  const SliverToBoxAdapter(child: SizedBox(height: 8)),
                ],
              ),
            ),
      ),
    );
  }

  void _showEditProfile(BuildContext context) {
    final auth      = context.read<AuthProvider>();
    final nameCtrl  = TextEditingController(text: auth.user?.name ?? '');
    int   goalValue = auth.user?.readingGoal ?? 20;

    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModal) => Padding(
          padding: EdgeInsets.only(
            left: 20, right: 20, top: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(child: Container(
                width: 40, height: 4,
                decoration: BoxDecoration(
                  color: AppColors.grey300,
                  borderRadius: BorderRadius.circular(2)),
              )),
              const SizedBox(height: 16),
              Text('Edit Profile',
                style: AppTextStyles.h2.copyWith(fontSize: 18)),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Display Name',
                  labelStyle: AppTextStyles.label.copyWith(color: AppColors.textSecondary),
                  filled: true,
                  fillColor: AppColors.grey100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: BorderSide.none),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                ),
              ),
              const SizedBox(height: 12),
              Text('Annual Reading Goal: $goalValue books',
                style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
              Slider(
                value:     goalValue.toDouble(),
                min:       5, max: 100, divisions: 19,
                activeColor: AppColors.primary,
                label:     '$goalValue',
                onChanged: (v) => setModal(() => goalValue = v.toInt()),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    final ok = await auth.updateProfile({
                      'name': nameCtrl.text.trim(),
                      'readingGoal': goalValue,
                    });
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        content: Text(ok ? 'Profile updated!' : 'Could not update profile.'),
                        backgroundColor: ok ? AppColors.success : null,
                      ));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: AppColors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  child: const Text('Save Changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showSupportDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text('Library Support',
          style: AppTextStyles.h2.copyWith(fontSize: 18)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SupportRow(Icons.location_on_outlined, 'Kampala, Uganda — IUEA Campus'),
            const SizedBox(height: 10),
            _SupportRow(Icons.email_outlined, 'library@iuea.ac.ug'),
            const SizedBox(height: 10),
            _SupportRow(Icons.access_time_outlined, 'Mon – Fri, 8 AM – 6 PM'),
            const SizedBox(height: 10),
            _SupportRow(Icons.phone_outlined, '+256 700 000 000'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Close',
              style: AppTextStyles.label.copyWith(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }

  Widget _divider() => Container(
    width: 1, height: 36,
    color: AppColors.border,
    margin: const EdgeInsets.symmetric(horizontal: 16));

  Widget _footerLink(String t) => Text(t, style: GoogleFonts.inter(
    fontSize: 10,
    color: AppColors.textHint.withOpacity(0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withOpacity(0.3)));

  Widget _footerDot() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6),
    child: Text('·', style: TextStyle(
      fontSize: 10, color: AppColors.textHint.withOpacity(0.5))));
}

// ── Sub-widgets ───────────────────────────────────────────────────────────────
class _StatCell extends StatelessWidget {
  final String value;
  final String label;
  const _StatCell({required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(children: [
        Text(value, style: AppTextStyles.h2.copyWith(
          color: AppColors.textPrimary, fontSize: 22)),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.label.copyWith(
          color: AppColors.textSecondary)),
      ]),
    );
  }
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color:      Colors.black.withOpacity(0.04),
          blurRadius: 8,
          offset:     const Offset(0, 2))],
      ),
      child: child,
    );
  }
}

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String   label;
  final VoidCallback onTap;
  const _SettingsTile({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withOpacity(0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      child: ListTile(
        onTap:       onTap,
        leading: Container(
          width: 36, height: 36,
          decoration: BoxDecoration(
            color:        AppColors.primary.withOpacity(0.08),
            borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, color: AppColors.primary, size: 18),
        ),
        title: Text(label, style: AppTextStyles.body.copyWith(
          fontSize: 14, fontWeight: FontWeight.w500)),
        trailing: const Icon(Icons.chevron_right_rounded,
          color: AppColors.grey500, size: 20),
        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

class _SupportRow extends StatelessWidget {
  final IconData icon;
  final String   text;
  const _SupportRow(this.icon, this.text);

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, size: 16, color: AppColors.primary),
    const SizedBox(width: 10),
    Expanded(child: Text(text,
      style: AppTextStyles.body.copyWith(fontSize: 13, color: AppColors.textPrimary))),
  ]);
}
