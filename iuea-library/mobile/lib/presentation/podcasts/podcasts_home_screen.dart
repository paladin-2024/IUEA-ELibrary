import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import '../widgets/loading_widget.dart';

class PodcastsHomeScreen extends StatefulWidget {
  const PodcastsHomeScreen({super.key});

  @override
  State<PodcastsHomeScreen> createState() => _PodcastsHomeScreenState();
}

class _PodcastsHomeScreenState extends State<PodcastsHomeScreen> {
  String _category = 'All';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = context.read<PodcastProvider>();
      p.loadPodcasts();
      p.loadSubscriptions();
    });
  }

  void _applyCategory(String cat) {
    setState(() => _category = cat);
    context.read<PodcastProvider>().loadPodcasts(
      category: cat == 'All' ? null : cat);
  }

  @override
  Widget build(BuildContext context) {
    final provider  = context.watch<PodcastProvider>();
    final user      = context.watch<AuthProvider>().user;
    final featured  = provider.podcasts.isNotEmpty ? provider.podcasts.first : null;
    final popular   = provider.podcasts.length > 1
        ? provider.podcasts.sublist(1) : <dynamic>[];
    final recentlyPlayed = provider.subscriptions;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App bar ─────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
                child: Row(children: [
                  Text('Podcasts',
                    style: AppTextStyles.h2.copyWith(
                      fontSize: 20, color: AppColors.textPrimary)),
                  const Spacer(),
                  IconButton(
                    icon: const Icon(Icons.search_rounded,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.go('/search'),
                  ),
                  IconButton(
                    icon: const Icon(Icons.notifications_none_rounded,
                      color: AppColors.textPrimary, size: 22),
                    onPressed: () => context.push('/notifications'),
                  ),
                  CircleAvatar(
                    radius:          16,
                    backgroundColor: AppColors.primaryContainer,
                    backgroundImage: user?.avatar != null
                        ? NetworkImage(user!.avatar!) : null,
                    child: user?.avatar == null
                        ? Text(user?.initials ?? '?',
                            style: const TextStyle(
                              color: AppColors.white, fontSize: 11,
                              fontWeight: FontWeight.w700))
                        : null,
                  ),
                  const SizedBox(width: 4),
                ]),
              ),
            ),

            if (provider.isLoading)
              const SliverFillRemaining(child: LoadingWidget())
            else if (provider.error != null && provider.podcasts.isEmpty)
              SliverFillRemaining(
                child: AppErrorState(
                  icon: Icons.mic_none_outlined,
                  message: provider.error,
                  onRetry: () {
                    context.read<PodcastProvider>().loadPodcasts();
                    context.read<PodcastProvider>().loadSubscriptions();
                  },
                ),
              )
            else ...[

              // ── Featured banner ────────────────────────────────────────────
              if (featured != null)
                SliverToBoxAdapter(
                  child: GestureDetector(
                    onTap: () => context.push('/podcasts/${featured.id}'),
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      height: 175,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(16),
                        gradient: const LinearGradient(
                          colors: [AppColors.primaryDark, AppColors.primary],
                          begin: Alignment.topLeft,
                          end:   Alignment.bottomRight),
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          if (featured.coverUrl.isNotEmpty)
                            Positioned.fill(
                              child: CachedNetworkImage(
                                imageUrl:       featured.coverUrl,
                                fit:            BoxFit.cover,
                                color:          AppColors.primaryDark.withValues(alpha: 0.72),
                                colorBlendMode: BlendMode.darken),
                            ),
                          Padding(
                            padding: const EdgeInsets.all(18),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment:  MainAxisAlignment.end,
                              children: [
                                // Category badge
                                if (featured.category != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color:        AppColors.accent.withValues(alpha: 0.9),
                                      borderRadius: BorderRadius.circular(6)),
                                    child: Text(featured.category!,
                                      style: TextStyle(fontFamily: 'Inter', 
                                        fontSize: 9,
                                        fontWeight: FontWeight.w700,
                                        color: AppColors.primaryDark)),
                                  ),
                                const SizedBox(height: 6),
                                Text(featured.title,
                                  style: AppTextStyles.h2.copyWith(
                                    color: AppColors.white, fontSize: 17),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text(
                                  '${featured.author} · ${featured.episodes.length} episodes',
                                  style: AppTextStyles.bodySmall.copyWith(
                                    color: AppColors.white.withValues(alpha: 0.7),
                                    fontSize: 11)),
                              ],
                            ),
                          ),
                          // Play button
                          Positioned(
                            right: 16, bottom: 16,
                            child: Container(
                              width: 40, height: 40,
                              decoration: const BoxDecoration(
                                color: AppColors.accent, shape: BoxShape.circle),
                              child: const Icon(Icons.play_arrow_rounded,
                                color: AppColors.primaryDark, size: 22),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // ── Category chips ─────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 0, 0),
                  child: SizedBox(
                    height: 34,
                    child: ListView.separated(
                      scrollDirection:  Axis.horizontal,
                      itemCount:        provider.categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final c      = provider.categories[i];
                        final active = c == _category;
                        return GestureDetector(
                          onTap: () => _applyCategory(c),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 7),
                            decoration: BoxDecoration(
                              color:        active
                                  ? AppColors.primary : AppColors.white,
                              border: Border.all(
                                color: active
                                    ? AppColors.primary : AppColors.border),
                              borderRadius: BorderRadius.circular(20)),
                            child: Text(c,
                              style: AppTextStyles.label.copyWith(
                                fontWeight: FontWeight.w500,
                                color: active
                                    ? AppColors.white : AppColors.textSecondary)),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),

              // ── Your shows ─────────────────────────────────────────────────
              if (provider.subscriptions.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                    child: Row(children: [
                      Text('Your shows',
                        style: AppTextStyles.h3.copyWith(fontSize: 15)),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {},
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Text('SEE ALL',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8, fontSize: 10)),
                          const Icon(Icons.chevron_right_rounded,
                            size: 14, color: AppColors.primary),
                        ]),
                      ),
                    ]),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 95,
                    child: ListView.separated(
                      padding:          const EdgeInsets.symmetric(horizontal: 20),
                      scrollDirection:  Axis.horizontal,
                      itemCount:        provider.subscriptions.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 14),
                      itemBuilder: (_, i) {
                        final p = provider.subscriptions[i];
                        return GestureDetector(
                          onTap: () => context.push('/podcasts/${p.id}'),
                          child: SizedBox(
                            width: 66,
                            child: Column(children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: p.coverUrl.isNotEmpty
                                  ? CachedNetworkImage(imageUrl: p.coverUrl,
                                      width: 62, height: 62, fit: BoxFit.cover)
                                  : Container(
                                      width: 62, height: 62,
                                      color: AppColors.primary.withValues(alpha: 0.08),
                                      child: const Icon(Icons.mic_rounded,
                                        color: AppColors.primary, size: 28)),
                              ),
                              const SizedBox(height: 5),
                              Text(p.title,
                                style: AppTextStyles.label.copyWith(
                                  fontSize: 10, color: AppColors.textSecondary),
                                maxLines: 2, overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center),
                            ]),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],

              // ── Popular at IUEA ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                  child: Row(children: [
                    Text('Popular at IUEA',
                      style: AppTextStyles.h3.copyWith(fontSize: 15)),
                    const Spacer(),
                    Text('SEE ALL', style: AppTextStyles.label.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.w600,
                      letterSpacing: 0.8, fontSize: 10)),
                    const Icon(Icons.chevron_right_rounded,
                      size: 14, color: AppColors.primary),
                  ]),
                ),
              ),

              provider.podcasts.isEmpty
                ? SliverFillRemaining(
                    child: Center(child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.mic_none_outlined,
                          size: 56, color: AppColors.grey300),
                        const SizedBox(height: 8),
                        Text('No podcasts yet.',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey500)),
                      ],
                    )),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => GestureDetector(
                          onTap: () =>
                            context.push('/podcasts/${popular[i].id}'),
                          child: _PodcastCard(podcast: popular[i]),
                        ),
                        childCount: popular.length,
                      ),
                      gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount:   2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing:  12,
                          childAspectRatio: 0.74,
                        ),
                    ),
                  ),

              // ── Recently played ────────────────────────────────────────────
              if (recentlyPlayed.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                    child: Text('Recently played',
                      style: AppTextStyles.h3.copyWith(fontSize: 15)),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) {
                      final p = recentlyPlayed[i];
                      return GestureDetector(
                        onTap: () => context.push('/podcasts/${p.id}'),
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color:        AppColors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 8, offset: const Offset(0, 2))],
                          ),
                          child: Row(children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: p.coverUrl.isNotEmpty
                                ? CachedNetworkImage(imageUrl: p.coverUrl,
                                    width: 52, height: 52, fit: BoxFit.cover)
                                : Container(
                                    width: 52, height: 52,
                                    color: AppColors.primary.withValues(alpha: 0.08),
                                    child: const Icon(Icons.mic_rounded,
                                      color: AppColors.primary, size: 24)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.title,
                                  style: AppTextStyles.body.copyWith(
                                    fontSize: 13, fontWeight: FontWeight.w600),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text(p.author,
                                  style: AppTextStyles.label.copyWith(
                                    color: AppColors.textHint, fontSize: 11),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              ],
                            )),
                            IconButton(
                              icon: Container(
                                width: 34, height: 34,
                                decoration: BoxDecoration(
                                  color:  AppColors.primary.withValues(alpha: 0.08),
                                  shape:  BoxShape.circle),
                                child: const Icon(Icons.play_arrow_rounded,
                                  color: AppColors.primary, size: 18),
                              ),
                              onPressed: () =>
                                context.push('/podcasts/${p.id}'),
                            ),
                          ]),
                        ),
                      );
                    },
                    childCount: recentlyPlayed.length,
                  ),
                ),
              ],

              // ── Footer ────────────────────────────────────────────────────
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: _Footer(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Podcast card ──────────────────────────────────────────────────────────────
class _PodcastCard extends StatelessWidget {
  final dynamic podcast;
  const _PodcastCard({required this.podcast});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(
          color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
          offset: const Offset(0, 2))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(
          child: podcast.coverUrl.isNotEmpty
            ? CachedNetworkImage(
                imageUrl: podcast.coverUrl,
                fit: BoxFit.cover, width: double.infinity)
            : Container(
                color: AppColors.primary.withValues(alpha: 0.07),
                child: const Center(child: Icon(Icons.mic_rounded,
                  color: AppColors.primary, size: 40))),
        ),
        Padding(
          padding: const EdgeInsets.all(10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(podcast.title,
              style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w600, fontSize: 12),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(podcast.author,
              style: AppTextStyles.label.copyWith(
                color: AppColors.textHint, fontSize: 11),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            if (podcast.category != null) ...[
              const SizedBox(height: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color:        AppColors.primary.withValues(alpha: 0.07),
                  borderRadius: BorderRadius.circular(8)),
                child: Text(podcast.category!,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 9, color: AppColors.primary,
                    fontWeight: FontWeight.w600)),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer();
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text('POWERED BY GOOGLE',
        style: TextStyle(fontFamily: 'Inter', fontSize: 9,
          letterSpacing: 1.4, color: AppColors.textHint.withValues(alpha: 0.6))),
      const SizedBox(height: 4),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _t('Privacy'), _d(), _t('Terms'), _d(), _t('Books API'),
      ]),
    ]);
  }
  Widget _t(String s) => Text(s, style: TextStyle(
    fontSize: 10, color: AppColors.textHint.withValues(alpha: 0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withValues(alpha: 0.3)));
  Widget _d() => Padding(padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·', style: TextStyle(fontSize: 10,
      color: AppColors.textHint.withValues(alpha: 0.5))));
}
