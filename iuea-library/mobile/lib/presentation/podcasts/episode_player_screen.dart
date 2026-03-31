import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../data/models/podcast_model.dart';
import '../../core/constants/app_colors.dart';

const _speeds    = [0.75, 1.0, 1.25, 1.5, 2.0];
const _barCount  = 20;

class EpisodePlayerScreen extends StatefulWidget {
  final EpisodeModel episode;
  final String       podcastTitle;
  final String?      coverUrl;

  const EpisodePlayerScreen({
    super.key,
    required this.episode,
    required this.podcastTitle,
    this.coverUrl,
  });

  @override
  State<EpisodePlayerScreen> createState() => _EpisodePlayerScreenState();
}

class _EpisodePlayerScreenState extends State<EpisodePlayerScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _waveCtrl;

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 400))
      ..repeat(reverse: true);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PodcastProvider>().playEpisode(widget.episode);
    });
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60);
    final s = d.inSeconds.remainder(60);
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<PodcastProvider>();
    final isPlaying = provider.isPlaying;
    final position  = provider.position;
    final duration  = provider.duration;
    final maxSecs   = duration.inSeconds.toDouble().clamp(1.0, double.infinity);

    return Scaffold(
      backgroundColor: AppColors.surfaceDark,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child:   Row(
                children: [
                  IconButton(
                    icon:      const Icon(Icons.arrow_back, color: AppColors.white),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      const Text('Now Playing',
                          style: TextStyle(fontSize: 11, color: AppColors.grey500,
                              letterSpacing: 1.2, fontWeight: FontWeight.w500)),
                      Text(widget.podcastTitle,
                          style: const TextStyle(fontSize: 13, color: AppColors.white,
                              fontWeight: FontWeight.w600),
                          maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  )),
                  const SizedBox(width: 48),
                ],
              ),
            ),

            // ── Cover ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(32, 16, 32, 0),
              child:   ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: (widget.coverUrl?.isNotEmpty ?? false)
                      ? CachedNetworkImage(imageUrl: widget.coverUrl!, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.primary,
                          child: const Icon(Icons.mic, color: AppColors.accent, size: 80)),
                ),
              ),
            ),

            // ── Episode title ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 0),
              child: Column(children: [
                Text(widget.episode.title,
                    style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700,
                        color: AppColors.white),
                    textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(widget.podcastTitle,
                    style: const TextStyle(fontSize: 13, color: AppColors.grey500)),
              ]),
            ),

            // ── Waveform ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
              child:   AnimatedBuilder(
                animation: _waveCtrl,
                builder: (_, __) {
                  final rng = math.Random();
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(_barCount, (i) {
                      final h = isPlaying ? 4.0 + rng.nextDouble() * 28 : 4.0;
                      return Container(
                        width:  5,
                        height: h,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: BoxDecoration(
                          color:        AppColors.accent.withOpacity(isPlaying ? 0.7 : 0.3),
                          borderRadius: BorderRadius.circular(3),
                        ),
                      );
                    }),
                  );
                },
              ),
            ),

            const Spacer(),

            // ── Seek bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor:   AppColors.accent,
                    inactiveTrackColor: AppColors.grey700,
                    thumbColor:         AppColors.accent,
                    overlayColor:       AppColors.accent.withOpacity(0.15),
                    trackHeight:        3,
                    thumbShape:         const RoundSliderThumbShape(enabledThumbRadius: 7),
                  ),
                  child: Slider(
                    value:     position.inSeconds.toDouble().clamp(0, maxSecs),
                    max:       maxSecs,
                    onChanged: (v) => provider.seek(Duration(seconds: v.toInt())),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_fmt(position), style: const TextStyle(color: AppColors.grey500, fontSize: 12)),
                    Text(_fmt(duration), style: const TextStyle(color: AppColors.grey500, fontSize: 12)),
                  ],
                ),
              ]),
            ),

            // ── Speed pills ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
              child:   Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: _speeds.map((s) {
                  final active = provider.speed == s;
                  return GestureDetector(
                    onTap: () => provider.setSpeed(s),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color:        active ? AppColors.accent.withOpacity(0.15) : Colors.transparent,
                        border:       Border.all(color: active ? AppColors.accent : AppColors.grey700),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text('${s}×',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600,
                              color: active ? AppColors.accent : AppColors.grey500)),
                    ),
                  );
                }).toList(),
              ),
            ),

            // ── Controls ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
              child:   Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    iconSize: 32,
                    icon: const Icon(Icons.skip_previous, color: AppColors.white),
                    onPressed: () => provider.seek(Duration.zero),
                  ),
                  IconButton(
                    iconSize: 30,
                    icon: const Icon(Icons.replay_10, color: AppColors.white),
                    onPressed: () => provider.seekDelta(-10),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: provider.togglePlay,
                    child: Container(
                      width: 64, height: 64,
                      decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                      child: Icon(
                        isPlaying ? Icons.pause : Icons.play_arrow,
                        color: AppColors.primaryDark, size: 34,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    iconSize: 30,
                    icon: const Icon(Icons.forward_10, color: AppColors.white),
                    onPressed: () => provider.seekDelta(10),
                  ),
                  IconButton(
                    iconSize: 32,
                    icon: Icon(Icons.skip_next, color: AppColors.white.withOpacity(0.3)),
                    onPressed: null,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
