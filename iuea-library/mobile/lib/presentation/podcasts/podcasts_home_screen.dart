import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';

class PodcastsHomeScreen extends StatefulWidget {
  const PodcastsHomeScreen({super.key});

  @override
  State<PodcastsHomeScreen> createState() => _PodcastsHomeScreenState();
}

class _PodcastsHomeScreenState extends State<PodcastsHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PodcastProvider>().loadPodcasts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PodcastProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Podcasts')),
      body: provider.isLoading
          ? const LoadingWidget()
          : provider.podcasts.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.mic_none_outlined, size: 64, color: AppColors.grey300),
                    const SizedBox(height: 8),
                    const Text('No podcasts available yet', style: TextStyle(color: AppColors.grey500)),
                  ]),
                )
              : GridView.builder(
                  padding:     const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount:   2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing:  12,
                    childAspectRatio: 0.75,
                  ),
                  itemCount:   provider.podcasts.length,
                  itemBuilder: (_, i) {
                    final p = provider.podcasts[i];
                    return GestureDetector(
                      onTap: () => context.push('/podcasts/${p.id}'),
                      child: Card(
                        clipBehavior: Clip.antiAlias,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: p.coverUrl.isNotEmpty
                                  ? CachedNetworkImage(imageUrl: p.coverUrl, fit: BoxFit.cover, width: double.infinity)
                                  : Container(color: AppColors.primary.withOpacity(0.1),
                                      child: const Center(child: Icon(Icons.mic, color: AppColors.primary, size: 40))),
                            ),
                            Padding(
                              padding: const EdgeInsets.all(8),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                  Text('${p.episodes.length} episodes',
                                    style: const TextStyle(color: AppColors.grey500, fontSize: 11)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
