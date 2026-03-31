import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import '../../data/models/podcast_model.dart';
import '../../core/constants/app_colors.dart';

class EpisodePlayerSheet extends StatefulWidget {
  final EpisodeModel episode;
  final String       podcastTitle;
  const EpisodePlayerSheet({super.key, required this.episode, required this.podcastTitle});

  @override
  State<EpisodePlayerSheet> createState() => _EpisodePlayerSheetState();
}

class _EpisodePlayerSheetState extends State<EpisodePlayerSheet> {
  final AudioPlayer _player = AudioPlayer();
  bool _isLoading = true;
  bool _isPlaying = false;
  Duration _position = Duration.zero;
  Duration _duration  = Duration.zero;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      await _player.setUrl(widget.episode.audioUrl);
      _duration = _player.duration ?? Duration.zero;
      _player.positionStream.listen((p) { if (mounted) setState(() => _position = p); });
      _player.playerStateStream.listen((s) { if (mounted) setState(() => _isPlaying = s.playing); });
      await _player.play();
    } catch (_) {}
    if (mounted) setState(() => _isLoading = false);
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  String _fmt(Duration d) {
    final m = d.inMinutes;
    final s = d.inSeconds % 60;
    return '$m:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color:        AppColors.primaryDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 40, height: 4, margin: const EdgeInsets.only(bottom: 20),
            decoration: BoxDecoration(color: AppColors.grey500, borderRadius: BorderRadius.circular(2))),

          Container(width: 120, height: 120, decoration: BoxDecoration(
            color:        AppColors.primary, borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.mic, color: AppColors.accent, size: 60)),
          const SizedBox(height: 20),

          Text(widget.podcastTitle, style: const TextStyle(color: AppColors.primaryLight, fontSize: 12)),
          const SizedBox(height: 4),
          Text(widget.episode.title, style: const TextStyle(color: AppColors.white, fontSize: 16, fontWeight: FontWeight.w700),
            textAlign: TextAlign.center),
          const SizedBox(height: 24),

          if (_isLoading)
            const CircularProgressIndicator(color: AppColors.accent)
          else ...[
            // Seek bar
            Slider(
              value:       _position.inSeconds.toDouble().clamp(0, _duration.inSeconds.toDouble()),
              max:         _duration.inSeconds.toDouble().clamp(1, double.infinity),
              activeColor: AppColors.accent,
              inactiveColor: AppColors.grey700,
              onChanged:   (v) => _player.seek(Duration(seconds: v.toInt())),
            ),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(_fmt(_position), style: const TextStyle(color: AppColors.grey500, fontSize: 11)),
                Text(_fmt(_duration),  style: const TextStyle(color: AppColors.grey500, fontSize: 11)),
              ],
            ),
            const SizedBox(height: 16),

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(icon: const Icon(Icons.replay_10, color: AppColors.white, size: 30),
                  onPressed: () => _player.seek(Duration(seconds: (_position.inSeconds - 10).clamp(0, _duration.inSeconds)))),
                const SizedBox(width: 16),
                GestureDetector(
                  onTap: () => _isPlaying ? _player.pause() : _player.play(),
                  child: Container(
                    width: 60, height: 60,
                    decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                    child: Icon(_isPlaying ? Icons.pause : Icons.play_arrow, color: AppColors.primaryDark, size: 32),
                  ),
                ),
                const SizedBox(width: 16),
                IconButton(icon: const Icon(Icons.forward_10, color: AppColors.white, size: 30),
                  onPressed: () => _player.seek(Duration(seconds: (_position.inSeconds + 10).clamp(0, _duration.inSeconds)))),
              ],
            ),
          ],
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
