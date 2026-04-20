import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../../data/models/streak_model.dart';
import '../../data/repositories/streak_repository.dart';
import '../../data/services/api_service.dart';

class StreaksScreen extends StatefulWidget {
  const StreaksScreen({super.key});

  @override
  State<StreaksScreen> createState() => _StreaksScreenState();
}

class _StreaksScreenState extends State<StreaksScreen> {
  final _repo = StreakRepository(ApiService());
  StreakModel? _data;
  bool         _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final data = await _repo.getStreak();
      if (mounted) setState(() { _data = data; _loading = false; });
    } catch (_) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.white,
        elevation:       0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: AppColors.textPrimary),
          onPressed: () => context.pop(),
        ),
        title: Text('Streaks & Badges', style: AppTextStyles.h2.copyWith(fontSize: 18)),
      ),
      body: _loading
        ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
        : RefreshIndicator(
            color:     AppColors.primary,
            onRefresh: _load,
            child: _data == null
              ? const Center(child: Text('Could not load streak data.'))
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _StreakHero(data: _data!),
                      const SizedBox(height: 16),
                      _XpCard(data: _data!),
                      const SizedBox(height: 12),
                      _GoalCard(data: _data!),
                      const SizedBox(height: 20),
                      Text('Badges',
                        style: AppTextStyles.h2.copyWith(fontSize: 18)),
                      const SizedBox(height: 12),
                      _BadgeGrid(badges: _data!.allBadges),
                    ],
                  ),
                ),
          ),
    );
  }
}

class _StreakHero extends StatelessWidget {
  final StreakModel data;
  const _StreakHero({required this.data});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF8A1228), Color(0xFF1E3A5F)],
          begin: Alignment.topLeft,
          end:   Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Text(data.currentStreak >= 30 ? '🔥' : data.currentStreak >= 7 ? '⚡' : '🔥',
            style: const TextStyle(fontSize: 48)),
          const SizedBox(height: 8),
          Text('${data.currentStreak}',
            style: AppTextStyles.h1.copyWith(
              fontSize: 56, color: Colors.white, fontWeight: FontWeight.w800)),
          Text('day streak${data.currentStreak != 1 ? "s" : ""}',
            style: AppTextStyles.body.copyWith(color: Colors.white70)),
          if (data.lastReadDate != null) ...[
            const SizedBox(height: 4),
            Text(
              'Last read ${_formatDate(data.lastReadDate!)}',
              style: AppTextStyles.label.copyWith(color: Colors.white54, fontSize: 12),
            ),
          ],
          const SizedBox(height: 20),
          Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: [
            _StatCol('${data.longestStreak}', 'Longest'),
            _StatCol('${data.totalXp}', 'Total XP'),
            _StatCol(
              '${data.totalReadingMinutes ~/ 60}h ${data.totalReadingMinutes % 60}m',
              'Time Read',
            ),
          ]),
        ],
      ),
    );
  }

  String _formatDate(DateTime d) =>
    '${d.day}/${d.month}/${d.year}';
}

class _StatCol extends StatelessWidget {
  final String value;
  final String label;
  const _StatCol(this.value, this.label);

  @override
  Widget build(BuildContext context) => Column(children: [
    Text(value, style: AppTextStyles.h2.copyWith(
      fontSize: 20, color: Colors.white, fontWeight: FontWeight.w700)),
    Text(label,  style: AppTextStyles.label.copyWith(color: Colors.white60, fontSize: 12)),
  ]);
}

class _XpCard extends StatelessWidget {
  final StreakModel data;
  const _XpCard({required this.data});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color:        AppColors.white,
      borderRadius: BorderRadius.circular(14),
      boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0,2))],
    ),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('Level ${data.level}',
            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
          Text('${data.xpProgress}/100 XP to Level ${data.level + 1}',
            style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
        ]),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(999),
          child: LinearProgressIndicator(
            value:           data.xpProgress / 100,
            minHeight:       10,
            backgroundColor: AppColors.grey100,
            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
          ),
        ),
      ],
    ),
  );
}

class _GoalCard extends StatelessWidget {
  final StreakModel data;
  const _GoalCard({required this.data});

  @override
  Widget build(BuildContext context) {
    final goalMinutes = data.readingGoal * 60;
    final progress    = (data.totalReadingMinutes / goalMinutes).clamp(0.0, 1.0);
    final pct         = (progress * 100).round();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 6, offset: const Offset(0,2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('Monthly Reading Goal',
              style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
            Text('$pct%',
              style: AppTextStyles.body.copyWith(
                color: AppColors.primary, fontWeight: FontWeight.w700)),
          ]),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value:           progress,
              minHeight:       10,
              backgroundColor: AppColors.grey100,
              valueColor: const AlwaysStoppedAnimation(AppColors.primary),
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${data.totalReadingMinutes ~/ 60}h ${data.totalReadingMinutes % 60}m read · Goal: ${data.readingGoal} hours',
            style: AppTextStyles.label.copyWith(color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}

class _BadgeGrid extends StatelessWidget {
  final List<BadgeModel> badges;
  const _BadgeGrid({required this.badges});

  @override
  Widget build(BuildContext context) => GridView.builder(
    shrinkWrap:  true,
    physics:     const NeverScrollableScrollPhysics(),
    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
      crossAxisCount:   3,
      crossAxisSpacing: 10,
      mainAxisSpacing:  10,
      childAspectRatio: 0.9,
    ),
    itemCount: badges.length,
    itemBuilder: (_, i) => _BadgeTile(badge: badges[i]),
  );
}

class _BadgeTile extends StatelessWidget {
  final BadgeModel badge;
  const _BadgeTile({required this.badge});

  @override
  Widget build(BuildContext context) => Opacity(
    opacity: badge.earned ? 1.0 : 0.4,
    child: Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color:        badge.earned ? AppColors.white : AppColors.grey100,
        border:       Border.all(
          color: badge.earned ? AppColors.primary.withOpacity(0.3) : AppColors.grey300),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(badge.emoji, style: const TextStyle(fontSize: 28)),
          const SizedBox(height: 6),
          Text(badge.label,
            textAlign: TextAlign.center,
            style: AppTextStyles.label.copyWith(
              fontWeight: FontWeight.w700, fontSize: 11, color: AppColors.textPrimary),
            maxLines: 2, overflow: TextOverflow.ellipsis),
          if (badge.earned) ...[
            const SizedBox(height: 4),
            Text('+${badge.xp} XP',
              style: AppTextStyles.label.copyWith(
                color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.w700)),
          ],
        ],
      ),
    ),
  );
}
