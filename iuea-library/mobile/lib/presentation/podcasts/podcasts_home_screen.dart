import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';

const _categories = ['All', 'Education', 'Science', 'Literature', 'Law', 'Technology', 'Culture'];

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
      category: cat == 'All' ? null : cat,
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PodcastProvider>();
    final featured = provider.podcasts.isNotEmpty ? provider.podcasts.first : null;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── App bar ──────────────────────────────────────────────────────
          SliverAppBar(
            pinned:          true,
            backgroundColor: AppColors.background,
            elevation:       0,
            title:           const Text('Podcasts',
                style: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.w700,
                    color: AppColors.primary)),
          ),

          if (provider.isLoading)
            const SliverFillRemaining(child: LoadingWidget())
          else ...[
            // ── Featured banner ──────────────────────────────────────────
            if (featured != null)
              SliverToBoxAdapter(
                child: GestureDetector(
                  onTap: () => context.push('/podcasts/${featured.id}'),
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    height: 160,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(16),
                      gradient: const LinearGradient(
                        colors: [AppColors.primaryDark, AppColors.primary],
                        begin:  Alignment.topLeft,
                        end:    Alignment.bottomRight,
                      ),
                    ),
                    child: Stack(
                      children: [
                        if (featured.coverUrl.isNotEmpty)
                          ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: CachedNetworkImage(
                              imageUrl:   featured.coverUrl,
                              fit:        BoxFit.cover,
                              width:      double.infinity,
                              height:     double.infinity,
                              color:      AppColors.primaryDark.withOpacity(0.7),
                              colorBlendMode: BlendMode.darken,
                            ),
                          ),
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.accent.withOpacity(0.9),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Text('Featured',
                                    style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700,
                                        color: AppColors.primaryDark)),
                              ),
                              const SizedBox(height: 6),
                              Text(featured.title,
                                  style: const TextStyle(color: AppColors.white,
                                      fontSize: 16, fontWeight: FontWeight.w700),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              Text(featured.author,
                                  style: const TextStyle(color: AppColors.grey300, fontSize: 12)),
                            ],
                          ),
                        ),
                        Positioned(
                          right: 16, bottom: 16,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Row(mainAxisSize: MainAxisSize.min, children: [
                              Icon(Icons.play_arrow, color: AppColors.primaryDark, size: 16),
                              SizedBox(width: 4),
                              Text('Listen', style: TextStyle(color: AppColors.primaryDark,
                                  fontSize: 12, fontWeight: FontWeight.w700)),
                            ]),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

            // ── Subscriptions horizontal scroll ──────────────────────────
            if (provider.subscriptions.isNotEmpty)
              SliverToBoxAdapter(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.fromLTRB(16, 20, 16, 10),
                      child:   Text('Your Subscriptions',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
                    ),
                    SizedBox(
                      height: 100,
                      child:  ListView.separated(
                        padding:          const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection:  Axis.horizontal,
                        itemCount:        provider.subscriptions.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 14),
                        itemBuilder: (_, i) {
                          final p = provider.subscriptions[i];
                          return GestureDetector(
                            onTap: () => context.push('/podcasts/${p.id}'),
                            child: SizedBox(
                              width: 64,
                              child: Column(children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(14),
                                  child: p.coverUrl.isNotEmpty
                                      ? CachedNetworkImage(imageUrl: p.coverUrl,
                                          width: 60, height: 60, fit: BoxFit.cover)
                                      : Container(width: 60, height: 60,
                                          color: AppColors.primary.withOpacity(0.1),
                                          child: const Icon(Icons.mic, color: AppColors.primary, size: 28)),
                                ),
                                const SizedBox(height: 4),
                                Text(p.title,
                                    style: const TextStyle(fontSize: 10, color: AppColors.textSecondary),
                                    maxLines: 2, overflow: TextOverflow.ellipsis, textAlign: TextAlign.center),
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),

            // ── Category pills ───────────────────────────────────────────
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child:  ListView.separated(
                  padding:          const EdgeInsets.fromLTRB(16, 10, 16, 0),
                  scrollDirection:  Axis.horizontal,
                  itemCount:        _categories.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (_, i) {
                    final c      = _categories[i];
                    final active = c == _category;
                    return GestureDetector(
                      onTap: () => _applyCategory(c),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                        decoration: BoxDecoration(
                          color:        active ? AppColors.primary : AppColors.background,
                          border:       Border.all(color: active ? AppColors.primary : AppColors.border),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(c,
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500,
                                color: active ? AppColors.white : AppColors.textSecondary)),
                      ),
                    );
                  },
                ),
              ),
            ),

            // ── Popular grid heading ─────────────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 8),
                child:   Text('Popular',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
              ),
            ),

            // ── Grid ─────────────────────────────────────────────────────
            provider.podcasts.isEmpty
                ? SliverFillRemaining(
                    child: Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.mic_none_outlined, size: 56, color: AppColors.grey300),
                      const SizedBox(height: 8),
                      const Text('No podcasts yet.', style: TextStyle(color: AppColors.grey500)),
                    ])),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    sliver:  SliverGrid(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) {
                          final p = provider.podcasts[i];
                          return GestureDetector(
                            onTap: () => context.push('/podcasts/${p.id}'),
                            child: _PodcastCard(podcast: p),
                          );
                        },
                        childCount: provider.podcasts.length,
                      ),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount:   2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing:  12,
                        childAspectRatio: 0.72,
                      ),
                    ),
                  ),
          ],
        ],
      ),
    );
  }
}

class _PodcastCard extends StatelessWidget {
  final dynamic podcast;
  const _PodcastCard({required this.podcast});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color:        AppColors.background,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: podcast.coverUrl.isNotEmpty
                ? CachedNetworkImage(imageUrl: podcast.coverUrl, fit: BoxFit.cover, width: double.infinity)
                : Container(
                    color: AppColors.primary.withOpacity(0.08),
                    child: const Center(child: Icon(Icons.mic, color: AppColors.primary, size: 40))),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(podcast.title,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(podcast.author,
                    style: const TextStyle(color: AppColors.grey500, fontSize: 11),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                if (podcast.category != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(podcast.category!,
                          style: const TextStyle(fontSize: 10, color: AppColors.primary, fontWeight: FontWeight.w500)),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
