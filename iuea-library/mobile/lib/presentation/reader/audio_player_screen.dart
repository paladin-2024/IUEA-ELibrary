import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';
import 'widgets/language_switcher_sheet.dart';
import 'package:google_fonts/google_fonts.dart';

const _kSpeedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

// ── Mock chapter data for UI (replaced by real data when available) ───────────
const _kMockChapters = [
  {'title': 'Chapter 5 – The Algorithmic Curators', 'duration': '14:50'},
  {'title': 'Chapter 6 – Failure of Paper',          'duration': '12:43'},
  {'title': 'Chapter 7 – The Digital Commons',       'duration': '09:15'},
];

class AudioPlayerScreen extends StatefulWidget {
  final String bookId;
  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  State<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends State<AudioPlayerScreen>
    with TickerProviderStateMixin {
  late AnimationController _waveCtrl;
  String _chapterText   = '';
  bool   _initialized   = false;
  double _playbackSpeed = 1.0;

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 700),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted || book == null) return;
      final reader = context.read<ReaderProvider>();
      reader.currentBook = book;
      await reader.loadProgress(widget.bookId);
      setState(() {
        _chapterText = book.description ?? book.title;
        _initialized = true;
      });
    });
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    context.read<ReaderProvider>().stopSpeaking();
    super.dispose();
  }

  void _toggleTts(ReaderProvider reader) {
    if (reader.isPlaying) {
      reader.stopSpeaking();
      _waveCtrl.stop();
    } else {
      reader.speakCurrentChapter();
      _waveCtrl.repeat(reverse: true);
    }
  }

  void _openLanguageSwitcher(ReaderProvider reader) {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: reader,
        child: const LanguageSwitcherSheet(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    if (!_initialized || reader.currentBook == null) {
      return const Scaffold(
        backgroundColor: AppColors.readerDark,
        body: Center(child: CircularProgressIndicator(color: AppColors.white)),
      );
    }

    final book = reader.currentBook!;

    if (reader.isPlaying && !_waveCtrl.isAnimating) {
      _waveCtrl.repeat(reverse: true);
    } else if (!reader.isPlaying && _waveCtrl.isAnimating) {
      _waveCtrl.stop();
    }

    return Scaffold(
      backgroundColor: AppColors.readerDark,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ──────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
              child: Row(children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back_ios_new_rounded,
                    color: AppColors.white, size: 18),
                  onPressed: () => context.pop(),
                ),
                Expanded(child: Column(
                  children: [
                    Text('NOW PLAYING',
                      style: const TextStyle(
                        fontSize:      9,
                        letterSpacing: 1.4,
                        color:         AppColors.grey500,
                        fontWeight:    FontWeight.w500)),
                    Text('IUEA Digital Curator',
                      style: const TextStyle(
                        fontSize:      12,
                        color:         AppColors.white,
                        fontWeight:    FontWeight.w500)),
                  ],
                )),
                IconButton(
                  icon: const Icon(Icons.more_vert_rounded,
                    color: AppColors.white, size: 22),
                  onPressed: () {},
                ),
              ]),
            ),

            // ── Book cover ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 1,
                  child: book.hasCover
                      ? CachedNetworkImage(
                          imageUrl: book.coverUrl!,
                          fit:      BoxFit.cover,
                          errorWidget: (_, __, ___) => _coverFallback())
                      : _coverFallback(),
                ),
              ),
            ),
            const SizedBox(height: 20),

            // ── Title & chapter ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                Text(book.title,
                  style: const TextStyle(
                    fontFamily:  'Lora',
                    fontSize:    22,
                    fontWeight:  FontWeight.w700,
                    color:       AppColors.white),
                  textAlign: TextAlign.center, maxLines: 2,
                  overflow:  TextOverflow.ellipsis),
                const SizedBox(height: 6),
                Text(
                  'Chapter ${reader.currentChapter + 1}: ${_chapterTitle(reader)}',
                  style: const TextStyle(
                    fontSize:   13,
                    color:      AppColors.grey500),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text('POWERED BY TEXT-TO-SPEECH',
                  style: const TextStyle(
                    fontSize:      9,
                    letterSpacing: 1.2,
                    color:         AppColors.grey700,
                    fontWeight:    FontWeight.w500)),
              ]),
            ),
            const SizedBox(height: 16),

            // ── Waveform ─────────────────────────────────────────────────────
            SizedBox(
              height: 48,
              child: AnimatedBuilder(
                animation: _waveCtrl,
                builder: (_, __) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(24, (i) {
                      final t  = _waveCtrl.value;
                      final h  = reader.isPlaying
                          ? 6.0 + 30.0 * ((t + i * 0.07) % 1.0)
                          : 4.0;
                      final op = reader.isPlaying ? 0.9 : 0.3;
                      return Container(
                        width:  4,
                        height: h,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: BoxDecoration(
                          color:        AppColors.accent.withOpacity(op),
                          borderRadius: BorderRadius.circular(2)),
                      );
                    }),
                  );
                },
              ),
            ),
            const SizedBox(height: 12),

            // ── Seek bar placeholder ─────────────────────────────────────────
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
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 7),
                  ),
                  child: Slider(
                    value:     reader.percentComplete / 100,
                    onChanged: (_) {},
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _fmt(Duration(
                        minutes: (reader.percentComplete * 0.5).toInt())),
                      style: GoogleFonts.inter(
                        fontSize: 11, color: AppColors.grey500)),
                    Text('—',
                      style: GoogleFonts.inter(
                        fontSize: 11, color: AppColors.grey700)),
                  ],
                ),
              ]),
            ),

            // ── Speed pills ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: _kSpeedOptions.map((s) {
                  final sel = _playbackSpeed == s;
                  return GestureDetector(
                    onTap: () => setState(() => _playbackSpeed = s),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color:        sel
                            ? AppColors.accent.withOpacity(0.15)
                            : Colors.transparent,
                        border: Border.all(
                          color: sel ? AppColors.accent : AppColors.grey700),
                        borderRadius: BorderRadius.circular(20)),
                      child: Text('${s}×',
                        style: TextStyle(
                          fontSize:   11,
                          fontWeight: FontWeight.w600,
                          color:      sel ? AppColors.accent : AppColors.grey500)),
                    ),
                  );
                }).toList(),
              ),
            ),

            // ── Main controls ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Read mode
                  IconButton(
                    icon: const Icon(Icons.menu_book_outlined,
                      color: AppColors.white, size: 26),
                    onPressed: () => context.go('/reader/${widget.bookId}'),
                    tooltip: 'Read mode',
                  ),
                  const SizedBox(width: 16),

                  // Play / Stop
                  GestureDetector(
                    onTap: () => _toggleTts(reader),
                    child: Container(
                      width: 64, height: 64,
                      decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                      child: Icon(
                        reader.isPlaying
                            ? Icons.pause_rounded : Icons.play_arrow_rounded,
                        color: AppColors.white, size: 32),
                    ),
                  ),

                  const SizedBox(width: 16),
                  // Translate
                  IconButton(
                    icon: Icon(
                      Icons.translate_rounded,
                      color: reader.readingLanguage != 'English'
                          ? AppColors.accent : AppColors.white,
                      size: 26),
                    onPressed: () => _openLanguageSwitcher(reader),
                    tooltip: 'Translate',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // ── Chapter list ─────────────────────────────────────────────────
            Expanded(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                decoration: BoxDecoration(
                  color:        Colors.white.withOpacity(0.05),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.08)),
                ),
                child: Column(children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                    child: Row(children: [
                      const Text('Chapter List',
                        style: TextStyle(
                          fontSize:   13,
                          fontWeight: FontWeight.w600,
                          color:      AppColors.white)),
                      const Spacer(),
                      const Icon(Icons.keyboard_arrow_down_rounded,
                        color: AppColors.grey500, size: 18),
                    ]),
                  ),
                  const Divider(height: 1, color: Color(0xFF2A2A3E)),
                  Expanded(
                    child: ListView.builder(
                      padding: EdgeInsets.zero,
                      itemCount: _kMockChapters.length,
                      itemBuilder: (_, i) {
                        final ch = _kMockChapters[i];
                        return ListTile(
                          dense:      true,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 2),
                          title: Text(ch['title']!,
                            style: const TextStyle(
                              fontSize:   12,
                              color:      AppColors.grey300)),
                          trailing: Text(ch['duration']!,
                            style: const TextStyle(
                              fontSize:   11,
                              color:      AppColors.grey500)),
                        );
                      },
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Text('© 2025 · POWERED BY GOOGLE',
                      style: const TextStyle(
                        fontSize:      9,
                        letterSpacing: 1.0,
                        color:         AppColors.grey700)),
                  ),
                ]),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  String _chapterTitle(ReaderProvider reader) {
    if (_chapterText.length > 40) {
      return '${_chapterText.substring(0, 40)}…';
    }
    return _chapterText;
  }

  String _fmt(Duration d) {
    final m = d.inMinutes.remainder(60).toString().padLeft(2, '0');
    final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  Widget _coverFallback() => Container(
    color: AppColors.primary,
    child: const Center(child: Icon(Icons.book_outlined,
      color: AppColors.accent, size: 72)));
}
