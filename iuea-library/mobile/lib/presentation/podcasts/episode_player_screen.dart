import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../data/models/podcast_model.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import 'package:google_fonts/google_fonts.dart';

const _speeds   = [0.75, 1.0, 1.25, 1.5, 2.0];
const _barCount = 22;

class EpisodePlayerSheet extends StatefulWidget {
  final EpisodeModel episode;
  final String       podcastTitle;
  final String?      coverUrl;

  const EpisodePlayerSheet({
    super.key,
    required this.episode,
    required this.podcastTitle,
    this.coverUrl,
  });

  @override
  State<EpisodePlayerSheet> createState() => _EpisodePlayerSheetState();
}

class _EpisodePlayerSheetState extends State<EpisodePlayerSheet>
    with SingleTickerProviderStateMixin {
  late AnimationController _waveCtrl;
  bool _detailsExpanded = true;
  final _rng = math.Random(42); // seeded so bars don't jump on rebuild

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 500))
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
    final provider  = context.watch<PodcastProvider>();
    final isPlaying = provider.isPlaying;
    final position  = provider.position;
    final duration  = provider.duration;
    final maxSecs   = duration.inSeconds.toDouble().clamp(1.0, double.infinity);

    return Container(
      decoration: const BoxDecoration(
        color:        AppColors.surfaceDark,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        top: false,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Drag handle ──────────────────────────────────────────────────
            const SizedBox(height: 12),
            Center(
              child: Container(
                width: 36, height: 4,
                decoration: BoxDecoration(
                  color:        Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 8),

            // ── Top bar ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8),
              child: Row(children: [
                IconButton(
                  icon: const Icon(Icons.keyboard_arrow_down_rounded,
                    color: AppColors.white, size: 26),
                  onPressed: () => Navigator.of(context).pop(),
                ),
                Expanded(
                  child: Text('Now Playing',
                    style: const TextStyle(
                      fontSize:      12,
                      color:         AppColors.grey500,
                      letterSpacing: 0.6,
                      fontWeight:    FontWeight.w500),
                    textAlign: TextAlign.center),
                ),
                IconButton(
                  icon: const Icon(Icons.more_vert_rounded,
                    color: AppColors.white, size: 22),
                  onPressed: () {},
                ),
              ]),
            ),

            // ── Cover art ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(28, 4, 28, 0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: (widget.coverUrl?.isNotEmpty ?? false)
                      ? CachedNetworkImage(
                          imageUrl: widget.coverUrl!, fit: BoxFit.cover)
                      : Container(
                          color: AppColors.primaryDark,
                          child: const Center(child: Icon(
                            Icons.mic_rounded,
                            color: AppColors.accent, size: 72))),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Episode title ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                Text(widget.episode.title,
                  style: const TextStyle(
                    fontFamily:  'Lora',
                    fontSize:    18,
                    fontWeight:  FontWeight.w700,
                    color:       AppColors.white),
                  textAlign: TextAlign.center,
                  maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Text(widget.podcastTitle,
                  style: const TextStyle(
                    fontSize:   12,
                    color:      AppColors.grey500)),
              ]),
            ),
            const SizedBox(height: 12),

            // ── Waveform ─────────────────────────────────────────────────────
            SizedBox(
              height: 40,
              child: AnimatedBuilder(
                animation: _waveCtrl,
                builder: (_, __) => Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: List.generate(_barCount, (i) {
                    final h = isPlaying
                        ? 4.0 + (_waveCtrl.value + i * 0.06).remainder(1.0) * 28
                        : 4.0;
                    return Container(
                      width:  4,
                      height: h,
                      margin: const EdgeInsets.symmetric(horizontal: 1.5),
                      decoration: BoxDecoration(
                        color:        AppColors.accent.withOpacity(
                          isPlaying ? 0.85 : 0.3),
                        borderRadius: BorderRadius.circular(2)),
                    );
                  }),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // ── Seek bar ─────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(children: [
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor:   AppColors.accent,
                    inactiveTrackColor: AppColors.grey700,
                    thumbColor:         AppColors.accent,
                    overlayColor:       AppColors.accent.withOpacity(0.15),
                    trackHeight:        3,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 7),
                  ),
                  child: Slider(
                    value:     position.inSeconds.toDouble().clamp(0, maxSecs),
                    max:       maxSecs,
                    onChanged: (v) =>
                        provider.seek(Duration(seconds: v.toInt())),
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(_fmt(position),
                      style: GoogleFonts.inter(
                        color: AppColors.grey500, fontSize: 11)),
                    Text(_fmt(duration),
                      style: GoogleFonts.inter(
                        color: AppColors.grey500, fontSize: 11)),
                  ],
                ),
              ]),
            ),

            // ── Controls row ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 4, 24, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    iconSize: 28,
                    icon: const Icon(Icons.replay_10_rounded,
                      color: AppColors.white),
                    onPressed: () => provider.seekDelta(-10),
                  ),
                  const SizedBox(width: 16),
                  GestureDetector(
                    onTap: provider.togglePlay,
                    child: Container(
                      width: 60, height: 60,
                      decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                      child: Icon(
                        isPlaying
                            ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: AppColors.white, size: 30),
                    ),
                  ),
                  const SizedBox(width: 16),
                  IconButton(
                    iconSize: 28,
                    icon: const Icon(Icons.forward_10_rounded,
                      color: AppColors.white),
                    onPressed: () => provider.seekDelta(10),
                  ),
                ],
              ),
            ),

            // ── Action row (Like / Share / Save) ─────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(32, 8, 32, 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _ActionBtn(
                    icon:  Icons.favorite_border_rounded,
                    label: 'Like',
                    onTap: () {},
                  ),
                  _ActionBtn(
                    icon:  Icons.share_outlined,
                    label: 'Share',
                    onTap: () {},
                  ),
                  _ActionBtn(
                    icon:  Icons.download_outlined,
                    label: 'Save',
                    onTap: () {},
                  ),
                ],
              ),
            ),

            // ── Speed pills ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: _speeds.map((s) {
                  final active = provider.speed == s;
                  return GestureDetector(
                    onTap: () => provider.setSpeed(s),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 11, vertical: 4),
                      decoration: BoxDecoration(
                        color: active
                            ? AppColors.accent.withOpacity(0.12) : null,
                        border: Border.all(
                          color: active ? AppColors.accent : AppColors.grey700),
                        borderRadius: BorderRadius.circular(20)),
                      child: Text('${s}×',
                        style: TextStyle(
                          fontSize:   11,
                          fontWeight: FontWeight.w600,
                          color:      active ? AppColors.accent : AppColors.grey500)),
                    ),
                  );
                }).toList(),
              ),
            ),

            // ── Episode details ──────────────────────────────────────────────
            GestureDetector(
              onTap: () => setState(() => _detailsExpanded = !_detailsExpanded),
              child: Container(
                padding: const EdgeInsets.fromLTRB(20, 10, 20, 10),
                decoration: BoxDecoration(
                  color:  Colors.white.withOpacity(0.04),
                  border: Border(
                    top: BorderSide(
                      color: Colors.white.withOpacity(0.08)))),
                child: Row(children: [
                  Text('Episode Details',
                    style: const TextStyle(
                      fontSize:   13,
                      fontWeight: FontWeight.w600,
                      color:      AppColors.white)),
                  const Spacer(),
                  Icon(
                    _detailsExpanded
                        ? Icons.keyboard_arrow_up_rounded
                        : Icons.keyboard_arrow_down_rounded,
                    color: AppColors.grey500, size: 20),
                ]),
              ),
            ),
            if (_detailsExpanded && widget.episode.description.isNotEmpty)
              Container(
                constraints: const BoxConstraints(maxHeight: 90),
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 8),
                color: Colors.white.withOpacity(0.04),
                child: SingleChildScrollView(
                  child: Text(widget.episode.description,
                    style: const TextStyle(
                      fontSize:   12,
                      height:     1.6,
                      color:      AppColors.grey500)),
                ),
              ),

            // ── Footer ───────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text(
                'IUEA ACADEMIC SERIES · POWERED BY GOOGLE',
                style: const TextStyle(
                  fontSize:      8,
                  letterSpacing: 1.2,
                  color:         AppColors.grey700)),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Action button (Like/Share/Save) ───────────────────────────────────────────
class _ActionBtn extends StatelessWidget {
  final IconData     icon;
  final String       label;
  final VoidCallback onTap;
  const _ActionBtn({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, color: AppColors.grey500, size: 22),
        const SizedBox(height: 4),
        Text(label,
          style: const TextStyle(
            fontSize:   10,
            color:      AppColors.grey500)),
      ]),
    );
  }
}
