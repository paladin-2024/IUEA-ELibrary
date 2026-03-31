import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
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

    if (provider.isLoading || podcast == null) {
      return const Scaffold(body: LoadingWidget());
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned:         true,
            expandedHeight: 220,
            flexibleSpace: FlexibleSpaceBar(
              background: podcast.coverUrl.isNotEmpty
                  ? CachedNetworkImage(imageUrl: podcast.coverUrl, fit: BoxFit.cover)
                  : Container(color: AppColors.primary),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    Expanded(child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(podcast.title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                        if (podcast.author.isNotEmpty)
                          Text(podcast.author, style: const TextStyle(color: AppColors.primary)),
                      ],
                    )),
                    if (auth.isLoggedIn)
                      OutlinedButton.icon(
                        onPressed: () async {
                          final subscribed = await provider.toggleSubscribe(podcast.id);
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(subscribed ? 'Subscribed!' : 'Unsubscribed')),
                            );
                          }
                        },
                        icon:  const Icon(Icons.notifications_outlined, size: 16),
                        label: const Text('Subscribe'),
                      ),
                  ]),
                  if (podcast.description.isNotEmpty) ...[
                    const SizedBox(height: 12),
                    Text(podcast.description, style: const TextStyle(color: AppColors.grey700, height: 1.5)),
                  ],
                  const Divider(height: 28),
                  Text('${podcast.episodes.length} Episodes',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),

          SliverList(
            delegate: SliverChildBuilderDelegate(
              (_, i) {
                final ep = podcast.episodes[i];
                return ListTile(
                  leading:  CircleAvatar(
                    backgroundColor: AppColors.primary.withOpacity(0.1),
                    child: const Icon(Icons.play_arrow, color: AppColors.primary),
                  ),
                  title:    Text(ep.title, style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14)),
                  subtitle: ep.duration > 0 ? Text(ep.durationFormatted, style: const TextStyle(fontSize: 12)) : null,
                  onTap: () => showModalBottomSheet(
                    context: context,
                    isScrollControlled: true,
                    builder: (_) => EpisodePlayerSheet(episode: ep, podcastTitle: podcast.title),
                  ),
                );
              },
              childCount: podcast.episodes.length,
            ),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 24)),
        ],
      ),
    );
  }
}
