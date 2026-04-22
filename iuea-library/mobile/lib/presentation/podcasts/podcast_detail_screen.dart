import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import '../widgets/loading_widget.dart';
import 'episode_player_screen.dart';

class PodcastDetailScreen extends StatefulWidget {
  final String podcastId;
  const PodcastDetailScreen({super.key, required this.podcastId});

  @override
  State<PodcastDetailScreen> createState() => _PodcastDetailScreenState();
}

class _PodcastDetailScreenState extends State<PodcastDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PodcastProvider>().getPodcast(widget.podcastId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PodcastProvider>();
    final auth     = context.watch<AuthProvider>();
    final podcast  = provider.current;

    if (provider.isLoading) {
      return const Scaffold(
        backgroundColor: AppColors.surface,
        body: LoadingWidget());
    }

    if (podcast == null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: AppColors.surface,
          elevation:       0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        body: AppErrorState(
          icon: Icons.mic_none_outlined,
          message: provider.error,
          onRetry: () =>
              context.read<PodcastProvider>().getPodcast(widget.podcastId),
        ),
      );
    }

    final isSubscribed = provider.subscriptions
        .any((s) => s.id == podcast.id);

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Hero cover ─────────────────────────────────────────────────────
          SliverAppBar(
            expandedHeight:  260,
            pinned:          true,
            backgroundColor: AppColors.primary,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.white, size: 18),
              onPressed: () => Navigator.pop(context),
            ),
            actions: const [],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  podcast.coverUrl.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl:       podcast.coverUrl,
                        fit:            BoxFit.cover,
                        color:          AppColors.primaryDark.withValues(alpha: 0.5),
                        colorBlendMode: BlendMode.darken)
                    : Container(color: AppColors.primary),
                  // Gradient fade
                  const DecoratedBox(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end:   Alignment.bottomCenter,
                        colors: [Colors.transparent, AppColors.surface],
                        stops: [0.5, 1.0]),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── Content ────────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Host label
                  Text(
                    'HOST: ${podcast.author.toUpperCase()}',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.primary, letterSpacing: 0.8,
                      fontSize: 10)),
                  const SizedBox(height: 6),

                  // Title
                  Text(podcast.title,
                    style: AppTextStyles.h1.copyWith(
                      fontSize: 22, color: AppColors.textPrimary)),
                  const SizedBox(height: 12),

                  // About
                  if (podcast.description.isNotEmpty)
                    Text(podcast.description,
                      style: AppTextStyles.body.copyWith(
                        color: AppColors.textSecondary,
                        fontSize: 13, height: 1.6),
                      maxLines: 4, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 16),

                  // Subscribe button
                  if (auth.isLoggedIn)
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final nowSubscribed = provider.isSubscribed(podcast.id);
                          final subscribed = nowSubscribed
                            ? await provider.unsubscribe(podcast.id)
                            : await provider.subscribe(podcast.id);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(subscribed
                                  ? 'Subscribed!' : 'Unsubscribed'),
                                backgroundColor: AppColors.primary,
                                behavior: SnackBarBehavior.floating,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8)),
                              ),
                            );
                          }
                        },
                        icon: Icon(
                          isSubscribed
                            ? Icons.notifications_active_rounded
                            : Icons.notifications_none_rounded,
                          size: 18),
                        label: Text(
                          isSubscribed ? 'Subscribed' : '▶  Subscribe'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: isSubscribed
                              ? AppColors.primaryDark : AppColors.primary,
                          foregroundColor: AppColors.white,
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10))),
                      ),
                    ),
                  const SizedBox(height: 20),

                  // Episodes header
                  Row(children: [
                    Text('Episodes',
                      style: AppTextStyles.h3.copyWith(fontSize: 16)),
                    const SizedBox(width: 8),
                    Text('${podcast.episodes.length} TOTAL',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.textHint, fontSize: 10)),
                  ]),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ── Episodes list ──────────────────────────────────────────────────
          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) {
                final ep = podcast.episodes[i];
                return GestureDetector(
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    backgroundColor: Colors.transparent,
                    builder: (_) => EpisodePlayerSheet(
                      episode: ep, podcastTitle: podcast.title),
                  ),
                  child: Container(
                    margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color:        AppColors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04), blurRadius: 8,
                        offset: const Offset(0, 2))],
                    ),
                    child: Row(children: [
                      // Play circle
                      Container(
                        width: 42, height: 42,
                        decoration: BoxDecoration(
                          color:  AppColors.primary.withValues(alpha: 0.08),
                          shape:  BoxShape.circle),
                        child: const Icon(Icons.play_arrow_rounded,
                          color: AppColors.primary, size: 22),
                      ),
                      const SizedBox(width: 12),
                      Expanded(child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(ep.title,
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.w600, fontSize: 13),
                            maxLines: 2, overflow: TextOverflow.ellipsis),
                          const SizedBox(height: 3),
                          Row(children: [
                            if (ep.duration > 0) ...[
                              const Icon(Icons.access_time_rounded,
                                size: 11, color: AppColors.textHint),
                              const SizedBox(width: 3),
                              Text(ep.durationFormatted,
                                style: AppTextStyles.label.copyWith(
                                  color: AppColors.textHint, fontSize: 11)),
                            ],
                          ]),
                        ],
                      )),
                    ]),
                  ),
                );
              },
              childCount: podcast.episodes.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 32)),
        ],
      ),
    );
  }
}
