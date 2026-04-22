import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';
import '../podcasts/episode_player_screen.dart';

/// Persistent mini-player bar — sits between content and bottom nav.
/// Appears when a podcast episode or book TTS is playing.
class MiniPlayer extends StatelessWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer2<PodcastProvider, ReaderProvider>(
      builder: (context, podcast, reader, _) {
        final hasPodcast = podcast.currentEpisode != null;
        final hasBook    = reader.isPlaying && reader.currentBook != null;
        final show       = hasPodcast || hasBook;

        return AnimatedSize(
          duration: const Duration(milliseconds: 280),
          curve:    Curves.easeInOut,
          child: show
            ? (hasPodcast
                ? _PodcastBar(provider: podcast)
                : _BookBar(reader: reader))
            : const SizedBox.shrink(),
        );
      },
    );
  }
}

// ── Podcast mini-player ───────────────────────────────────────────────────────
class _PodcastBar extends StatelessWidget {
  final PodcastProvider provider;
  const _PodcastBar({required this.provider});

  @override
  Widget build(BuildContext context) {
    final episode = provider.currentEpisode!;
    final cover   = provider.current?.coverUrl;
    final pct     = provider.duration.inMilliseconds > 0
        ? (provider.position.inMilliseconds / provider.duration.inMilliseconds)
            .clamp(0.0, 1.0)
        : 0.0;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        if (provider.current == null) return;
        showModalBottomSheet(
          context:            context,
          isScrollControlled: true,
          backgroundColor:    Colors.transparent,
          builder: (_) => ChangeNotifierProvider.value(
            value: provider,
            child: EpisodePlayerSheet(
              episode:      episode,
              podcastTitle: provider.current!.title,
              coverUrl:     cover,
            ),
          ),
        );
      },
      child: Container(
        height: 68,
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        decoration: BoxDecoration(
          color:        AppColors.primaryDark,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(
            color: Colors.black.withValues(alpha: 0.3),
            blurRadius: 14, offset: const Offset(0, 4))],
        ),
        child: Row(children: [
          // Cover
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(
              left: Radius.circular(14)),
            child: (cover != null && cover.isNotEmpty)
              ? CachedNetworkImage(
                  imageUrl: cover, width: 68, height: 68,
                  fit: BoxFit.cover)
              : Container(
                  width: 68, height: 68,
                  color: AppColors.primary,
                  child: const Icon(Icons.mic_rounded,
                    color: AppColors.accent, size: 28)),
          ),
          const SizedBox(width: 10),

          // Info + progress
          Expanded(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(episode.title,
                style: const TextStyle(
                  fontFamily:  'Inter',
                  fontSize:    12,
                  fontWeight:  FontWeight.w600,
                  color:       AppColors.white),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text(provider.current?.title ?? '',
                style: TextStyle(
                  fontFamily: 'Inter', fontSize: 10,
                  color: AppColors.white.withValues(alpha: 0.55)),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 5),
              LinearProgressIndicator(
                value:            pct,
                backgroundColor:  AppColors.white.withValues(alpha: 0.15),
                valueColor: const AlwaysStoppedAnimation(AppColors.accent),
                minHeight:        2,
                borderRadius:     BorderRadius.circular(1),
              ),
            ],
          )),

          // Controls
          _IconBtn(
            icon:    Icons.replay_30_rounded,
            onTap:   () => provider.seekDelta(-30),
          ),
          _PlayPauseBtn(
            isPlaying: provider.isPlaying,
            onTap:     provider.togglePlay,
          ),
          _IconBtn(
            icon:  Icons.forward_30_rounded,
            onTap: () => provider.seekDelta(30),
          ),
          _IconBtn(
            icon:    Icons.close_rounded,
            size:    18,
            opacity: 0.45,
            onTap:   provider.stopAndClear,
          ),
          const SizedBox(width: 4),
        ]),
      ),
    );
  }
}

// ── Book TTS mini-player ──────────────────────────────────────────────────────
class _BookBar extends StatelessWidget {
  final ReaderProvider reader;
  const _BookBar({required this.reader});

  @override
  Widget build(BuildContext context) {
    final book = reader.currentBook!;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap:    () => context.push('/audio/${book.id}'),
      child: Container(
        height: 68,
        margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin:  Alignment.topLeft,
            end:    Alignment.bottomRight),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [BoxShadow(
            color:      AppColors.primary.withValues(alpha: 0.35),
            blurRadius: 14, offset: const Offset(0, 4))],
        ),
        child: Row(children: [
          // Cover
          ClipRRect(
            borderRadius: const BorderRadius.horizontal(
              left: Radius.circular(14)),
            child: book.hasCover
              ? CachedNetworkImage(
                  imageUrl: book.coverUrl!,
                  width: 68, height: 68, fit: BoxFit.cover)
              : Container(
                  width: 68, height: 68,
                  color: AppColors.primaryDark,
                  child: const Icon(Icons.book_outlined,
                    color: AppColors.accent, size: 28)),
          ),
          const SizedBox(width: 10),

          // Info
          Expanded(child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(book.title,
                style: const TextStyle(
                  fontFamily:  'Inter',
                  fontSize:    12,
                  fontWeight:  FontWeight.w600,
                  color:       AppColors.white),
                maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 2),
              Text('Reading aloud · Text-to-speech',
                style: TextStyle(
                  fontFamily: 'Inter', fontSize: 10,
                  color: AppColors.white.withValues(alpha: 0.55))),
              const SizedBox(height: 5),
              LinearProgressIndicator(
                value:           (reader.percentComplete / 100).clamp(0.0, 1.0),
                backgroundColor: AppColors.white.withValues(alpha: 0.15),
                valueColor: const AlwaysStoppedAnimation(AppColors.accent),
                minHeight:       2,
                borderRadius:    BorderRadius.circular(1),
              ),
            ],
          )),

          // Controls
          _PlayPauseBtn(
            isPlaying: reader.isPlaying,
            onTap:     reader.isPlaying
                ? reader.stopSpeaking : reader.speakCurrentChapter,
            size: 28,
          ),
          _IconBtn(
            icon:    Icons.close_rounded,
            size:    18,
            opacity: 0.45,
            onTap:   reader.stopSpeaking,
          ),
          const SizedBox(width: 4),
        ]),
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────────────────────────
class _PlayPauseBtn extends StatelessWidget {
  final bool         isPlaying;
  final VoidCallback onTap;
  final double       size;
  const _PlayPauseBtn({
    required this.isPlaying, required this.onTap, this.size = 26});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 40, height: 40,
      alignment: Alignment.center,
      child: Icon(
        isPlaying ? Icons.pause_rounded : Icons.play_arrow_rounded,
        color: AppColors.white, size: size),
    ),
  );
}

class _IconBtn extends StatelessWidget {
  final IconData     icon;
  final VoidCallback onTap;
  final double       size;
  final double       opacity;
  const _IconBtn({
    required this.icon, required this.onTap,
    this.size = 20, this.opacity = 1.0});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      width: 34, height: 34,
      alignment: Alignment.center,
      child: Icon(icon,
        color: AppColors.white.withValues(alpha: opacity), size: size),
    ),
  );
}
