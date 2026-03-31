import 'dart:async';
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../widgets/loading_widget.dart';
import 'widgets/language_switcher_sheet.dart';

const _kSpeedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];

class AudioPlayerScreen extends StatefulWidget {
  final String bookId;
  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  State<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends State<AudioPlayerScreen>
    with TickerProviderStateMixin {
  late AnimationController _waveController;
  String _chapterText = '';
  bool   _initialized = false;

  @override
  void initState() {
    super.initState();
    _waveController = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 800),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted || book == null) return;
      final reader = context.read<ReaderProvider>();
      reader.setBook(book);
      await reader.loadProgress();
      // Use description as fallback text for TTS
      setState(() {
        _chapterText = book.description ?? book.title;
        _initialized = true;
      });
    });
  }

  @override
  void dispose() {
    _waveController.dispose();
    context.read<ReaderProvider>().stopSpeaking();
    super.dispose();
  }

  void _toggleTts(ReaderProvider reader) {
    if (reader.isTtsPlaying) {
      reader.stopSpeaking();
      _waveController.stop();
    } else {
      reader.speakCurrentChapter(_chapterText);
      _waveController.repeat(reverse: true);
    }
  }

  void _openLanguageSwitcher(ReaderProvider reader) {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: reader,
        child: LanguageSwitcherSheet(currentChapterText: _chapterText),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();

    if (!_initialized || reader.book == null) {
      return const Scaffold(
        backgroundColor: AppColors.primaryDark,
        body: const Center(child: CircularProgressIndicator(color: AppColors.white)),
      );
    }

    final book = reader.book!;

    // Keep wave in sync with TTS state
    if (reader.isTtsPlaying && !_waveController.isAnimating) {
      _waveController.repeat(reverse: true);
    } else if (!reader.isTtsPlaying && _waveController.isAnimating) {
      _waveController.stop();
    }

    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header ──────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.pagePadding, vertical: AppSpacing.sm),
              child: Row(
                children: [
                  IconButton(
                    icon:      const Icon(Icons.arrow_back, color: AppColors.white),
                    onPressed: () => context.pop(),
                  ),
                  const Spacer(),
                  const Text('Audio Mode',
                    style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  IconButton(
                    icon:      const Icon(Icons.translate, color: AppColors.white),
                    onPressed: () => _openLanguageSwitcher(reader),
                    tooltip:   'Translate',
                  ),
                ],
              ),
            ),

            const Spacer(),

            // ── Cover ────────────────────────────────────────────────────
            Center(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: book.hasCover
                    ? CachedNetworkImage(
                        imageUrl: book.coverUrl!,
                        width:    200, height: 270, fit: BoxFit.cover)
                    : Container(
                        width: 200, height: 270,
                        color: AppColors.primary,
                        child: const Icon(Icons.book_outlined,
                          color: AppColors.accent, size: 72)),
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // ── Title / Author ────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.pagePadding),
              child: Column(
                children: [
                  Text(book.title,
                    style: const TextStyle(
                      color: AppColors.white, fontSize: 18, fontWeight: FontWeight.w700),
                    textAlign: TextAlign.center, maxLines: 2,
                    overflow:  TextOverflow.ellipsis),
                  const SizedBox(height: 4),
                  Text(book.author,
                    style: const TextStyle(color: AppColors.primaryLight, fontSize: 13)),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // ── Waveform ──────────────────────────────────────────────────
            SizedBox(
              height: 40,
              child: AnimatedBuilder(
                animation: _waveController,
                builder: (_, __) {
                  return Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(20, (i) {
                      final t = _waveController.value;
                      final h = reader.isTtsPlaying
                          ? 8.0 + 24.0 * ((t + i * 0.1) % 1.0)
                          : 4.0;
                      return Container(
                        width:  4,
                        height: h,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: BoxDecoration(
                          color:        AppColors.accent,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      );
                    }),
                  );
                },
              ),
            ),

            const SizedBox(height: AppSpacing.lg),

            // ── Speed pills ───────────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: _kSpeedOptions.map((s) {
                final selected = reader.playbackSpeed == s;
                return GestureDetector(
                  onTap: () => reader.setPlaybackSpeed(s),
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color:        selected ? AppColors.accent : Colors.transparent,
                      border:       Border.all(
                        color: selected ? AppColors.accent : AppColors.white.withOpacity(0.24),
                      ),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      '${s}×',
                      style: TextStyle(
                        color:      selected ? AppColors.primaryDark : AppColors.white,
                        fontSize:   12,
                        fontWeight: selected ? FontWeight.w700 : FontWeight.normal,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),

            const Spacer(),

            // ── Play controls ─────────────────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Switch to reading mode
                IconButton(
                  icon:      const Icon(Icons.menu_book_outlined,
                    color: AppColors.white, size: 28),
                  onPressed: () => context.go('/reader/${widget.bookId}'),
                  tooltip:   'Read mode',
                ),
                const SizedBox(width: AppSpacing.lg),

                // Play/Stop
                GestureDetector(
                  onTap: () => _toggleTts(reader),
                  child: Container(
                    width: 68, height: 68,
                    decoration: const BoxDecoration(
                      color: AppColors.accent, shape: BoxShape.circle),
                    child: Icon(
                      reader.isTtsPlaying ? Icons.stop : Icons.play_arrow,
                      color: AppColors.primaryDark, size: 36,
                    ),
                  ),
                ),

                const SizedBox(width: AppSpacing.lg),
                // Translate
                IconButton(
                  icon:      Icon(
                    reader.translatedContent != null
                        ? Icons.translate
                        : Icons.translate_outlined,
                    color: reader.translatedContent != null
                        ? AppColors.accent
                        : AppColors.white,
                    size: 28,
                  ),
                  onPressed: () => _openLanguageSwitcher(reader),
                  tooltip:   'Translate',
                ),
              ],
            ),

            const SizedBox(height: AppSpacing.xl),
          ],
        ),
      ),
    );
  }
}
