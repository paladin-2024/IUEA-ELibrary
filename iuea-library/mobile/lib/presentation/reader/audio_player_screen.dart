import 'package:flutter/material.dart';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../data/models/book_model.dart';
import '../../providers/reader_provider.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import 'widgets/language_switcher_sheet.dart';

// flutter_tts on Android: 0.5 ≈ normal, 1.0 ≈ 2× fast
const _kSpeedOptions = [0.25, 0.4, 0.5, 0.7, 1.0];
const _kSpeedLabels  = ['0.5×', '0.8×', '1×', '1.4×', '2×'];
const _kCreamBg      = Color(0xFFFDF4F2); // blush-50

class AudioPlayerScreen extends StatefulWidget {
  final String bookId;
  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  State<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends State<AudioPlayerScreen>
    with TickerProviderStateMixin {
  late AnimationController _waveCtrl;
  ReaderProvider? _reader; // kept for dispose()

  // Chapter / text chunking
  List<String> _chunks       = [];
  int          _chunkIndex   = 0;
  bool         _initialized  = false;
  bool         _loadFailed   = false;
  bool         _chaptersOpen = true;

  static const _chunkSize = 800; // chars per "chapter" chunk
  final _api = ApiService();

  @override
  void initState() {
    super.initState();
    _waveCtrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 700),
    );
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final reader0 = context.read<ReaderProvider>();
      _reader = reader0;
      await reader0.initTts();
      if (!mounted) return;

      // Register auto-advance when TTS completes a chunk
      reader0.setChunkCompletionCallback(_onChunkComplete);

      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted) return;
      if (book == null) {
        setState(() => _loadFailed = true);
        return;
      }
      final reader = context.read<ReaderProvider>();
      reader.currentBook = book;
      await reader.loadProgress(widget.bookId);

      // Try Gemini-generated narration first; fall back to metadata narration
      String fullText;
      try {
        final res = await _api.get(ApiConstants.audioNarrate(widget.bookId));
        final narration = (res.data as Map<String, dynamic>)['narration'] as String?;
        fullText = (narration != null && narration.trim().isNotEmpty)
            ? narration.trim()
            : _buildNarrationText(book);
      } catch (_) {
        fullText = _buildNarrationText(book);
      }

      _chunks = _splitIntoChunks(fullText);
      _chunkIndex = 0;
      reader.setCurrentChapterText(_chunks.isNotEmpty ? _chunks[0] : fullText);

      setState(() => _initialized = true);
    });
  }

  @override
  void dispose() {
    _waveCtrl.dispose();
    _reader
      ?..stopSpeaking()
      ..clearChunkCompletionCallback();
    super.dispose();
  }

  // Called by ReaderProvider when TTS finishes the current chunk
  void _onChunkComplete() {
    if (!mounted) return;
    final reader = context.read<ReaderProvider>();
    if (_chunkIndex + 1 < _chunks.length) {
      setState(() => _chunkIndex++);
      reader.setCurrentChapterText(_chunks[_chunkIndex]);
      reader.speakCurrentChapter();
    } else {
      // All chunks done
      _waveCtrl.stop();
    }
  }

  Future<void> _toggleTts(ReaderProvider reader) async {
    if (reader.isPlaying) {
      await reader.stopSpeaking();
      _waveCtrl.stop();
    } else {
      reader.speakCurrentChapter();
      _waveCtrl.repeat(reverse: true);
    }
  }

  Future<void> _rewind(ReaderProvider reader) async {
    await reader.stopSpeaking();
    _waveCtrl.stop();
    setState(() { if (_chunkIndex > 0) _chunkIndex--; });
    reader.setCurrentChapterText(_chunks[_chunkIndex]);
    reader.speakCurrentChapter();
    _waveCtrl.repeat(reverse: true);
  }

  Future<void> _forward(ReaderProvider reader) async {
    await reader.stopSpeaking();
    _waveCtrl.stop();
    setState(() { if (_chunkIndex + 1 < _chunks.length) _chunkIndex++; });
    reader.setCurrentChapterText(_chunks[_chunkIndex]);
    reader.speakCurrentChapter();
    _waveCtrl.repeat(reverse: true);
  }

  Future<void> _jumpToChunk(ReaderProvider reader, int index) async {
    await reader.stopSpeaking();
    _waveCtrl.stop();
    setState(() => _chunkIndex = index);
    reader.setCurrentChapterText(_chunks[index]);
    reader.speakCurrentChapter();
    _waveCtrl.repeat(reverse: true);
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

    if (_loadFailed) {
      return Scaffold(
        backgroundColor: _kCreamBg,
        appBar: AppBar(
          backgroundColor: _kCreamBg,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(AppIcons.arrowBack,
              color: AppColors.textPrimary, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: AppErrorState(
          message: context.read<BookProvider>().error,
          onRetry: () async {
            final bp = context.read<BookProvider>();
            final rp = context.read<ReaderProvider>();
            setState(() { _loadFailed = false; _initialized = false; });
            final b = await bp.getBook(widget.bookId);
            if (!mounted) return;
            if (b == null) { setState(() => _loadFailed = true); return; }
            rp.currentBook = b;
            final full = _buildNarrationText(b);
            _chunks = _splitIntoChunks(full);
            _chunkIndex = 0;
            rp.setCurrentChapterText(_chunks.isNotEmpty ? _chunks[0] : full);
            if (mounted) setState(() => _initialized = true);
          },
        ),
      );
    }

    if (!_initialized || reader.currentBook == null) {
      return const Scaffold(
        backgroundColor: _kCreamBg,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final book = reader.currentBook!;

    // Sync wave animation with play state
    if (reader.isPlaying && !_waveCtrl.isAnimating) {
      _waveCtrl.repeat(reverse: true);
    } else if (!reader.isPlaying && _waveCtrl.isAnimating) {
      _waveCtrl.stop();
    }

    return Scaffold(
      backgroundColor: _kCreamBg,
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(children: [
                IconButton(
                  icon: const Icon(AppIcons.arrowBack,
                    color: AppColors.textPrimary, size: 18),
                  onPressed: () => context.pop(),
                ),
                Expanded(child: Column(
                  children: [
                    Text('NOW PLAYING',
                      style: TextStyle(
                        fontFamily:    'Inter',
                        fontSize:      9,
                        letterSpacing: 1.4,
                        color:         AppColors.textHint,
                        fontWeight:    FontWeight.w500)),
                    Text('Text-to-Speech',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.textSecondary, fontSize: 11)),
                  ],
                )),
                IconButton(
                  icon: Icon(
                    AppIcons.translate,
                    color: reader.readingLanguage != 'English'
                        ? AppColors.primary : AppColors.textHint,
                    size: 20),
                  onPressed: () => _openLanguageSwitcher(reader),
                  tooltip: 'Translate',
                ),
                IconButton(
                  icon: const Icon(AppIcons.bookpen,
                    color: AppColors.textHint, size: 20),
                  onPressed: () => context.go('/reader/${widget.bookId}'),
                  tooltip: 'Read mode',
                ),
              ]),
            ),

            // ── Book cover ─────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 48),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: AspectRatio(
                  aspectRatio: 3 / 4,
                  child: book.hasCover
                      ? CachedNetworkImage(
                          imageUrl: book.coverUrl!,
                          fit:      BoxFit.cover,
                          errorWidget: (_, __, ___) => _coverFallback())
                      : _coverFallback(),
                ),
              ),
            ),
            const SizedBox(height: 16),

            // ── Title & chunk ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                Text(book.title,
                  style: AppTextStyles.h2.copyWith(
                    fontSize: 18, color: AppColors.textPrimary),
                  textAlign: TextAlign.center, maxLines: 2,
                  overflow: TextOverflow.ellipsis),
                const SizedBox(height: 4),
                Text(
                  _chunks.length > 1
                    ? 'Part ${_chunkIndex + 1} of ${_chunks.length}'
                    : book.author,
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textHint, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ]),
            ),
            const SizedBox(height: 12),

            // ── TTS error banner ───────────────────────────────────────────
            if (reader.ttsError != null)
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color:        Colors.red.shade50,
                    border:       Border.all(color: Colors.red.shade200),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(children: [
                    Icon(AppIcons.warning,
                      color: Colors.red.shade700, size: 16),
                    const SizedBox(width: 8),
                    Expanded(child: Text(
                      'Audio engine error. Make sure Text-to-Speech is enabled in device settings.',
                      style: TextStyle(
                        fontFamily: 'Inter', fontSize: 11,
                        color: Colors.red.shade800),
                    )),
                  ]),
                ),
              ),

            // ── Waveform ───────────────────────────────────────────────────
            SizedBox(
              height: 44,
              child: AnimatedBuilder(
                animation: _waveCtrl,
                builder: (_, __) {
                  return Row(
                    mainAxisAlignment:  MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: List.generate(24, (i) {
                      final t  = _waveCtrl.value;
                      final h  = reader.isPlaying
                          ? 6.0 + 28.0 * ((t + i * 0.07) % 1.0) : 4.0;
                      return Container(
                        width:  4,
                        height: h,
                        margin: const EdgeInsets.symmetric(horizontal: 1.5),
                        decoration: BoxDecoration(
                          color: reader.isPlaying
                              ? AppColors.primary.withValues(alpha: 0.75)
                              : AppColors.primary.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(2)),
                      );
                    }),
                  );
                },
              ),
            ),
            const SizedBox(height: 8),

            // ── Progress bar (chunk-based) ─────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24),
              child: Column(children: [
                SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor:   AppColors.primary,
                    inactiveTrackColor: AppColors.border,
                    thumbColor:         AppColors.primary,
                    overlayColor:       AppColors.primary.withValues(alpha: 0.12),
                    trackHeight:        3,
                    thumbShape: const RoundSliderThumbShape(
                      enabledThumbRadius: 7),
                  ),
                  child: Slider(
                    value: _chunks.isEmpty
                        ? 0
                        : _chunkIndex / (_chunks.length - 1).clamp(1, double.infinity),
                    onChanged: _chunks.length > 1
                        ? (v) {
                            final idx = (v * (_chunks.length - 1)).round();
                            _jumpToChunk(reader, idx);
                          }
                        : null,
                  ),
                ),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Part ${_chunkIndex + 1}',
                      style: AppTextStyles.label.copyWith(
                        fontSize: 11, color: AppColors.textHint)),
                    Text('${_chunks.length} parts',
                      style: AppTextStyles.label.copyWith(
                        fontSize: 11, color: AppColors.textHint)),
                  ],
                ),
              ]),
            ),

            // ── Speed pills ────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 4),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(_kSpeedOptions.length, (i) {
                  final s   = _kSpeedOptions[i];
                  final lbl = _kSpeedLabels[i];
                  final sel = (reader.playbackSpeed - s).abs() < 0.01;
                  return GestureDetector(
                    onTap: () => reader.setPlaybackSpeed(s),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 5),
                      decoration: BoxDecoration(
                        color:        sel
                            ? AppColors.primary.withValues(alpha: 0.12)
                            : Colors.transparent,
                        border: Border.all(
                          color: sel ? AppColors.primary : AppColors.border),
                        borderRadius: BorderRadius.circular(20)),
                      child: Text(lbl,
                        style: TextStyle(
                          fontFamily:  'Inter',
                          fontSize:    11,
                          fontWeight:  FontWeight.w600,
                          color:       sel
                              ? AppColors.primary : AppColors.textHint)),
                    ),
                  );
                }),
              ),
            ),

            // ── Main controls ──────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 6, 24, 0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Rewind (previous chunk)
                  IconButton(
                    iconSize: 30,
                    icon: const Icon(AppIcons.rewind,
                      color: AppColors.textPrimary),
                    onPressed: _chunks.length > 1
                        ? () => _rewind(reader) : null,
                    tooltip: 'Previous part',
                  ),
                  const SizedBox(width: 16),

                  // Play / Pause
                  GestureDetector(
                    onTap: () => _toggleTts(reader),
                    child: Container(
                      width: 64, height: 64,
                      decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                      child: Icon(
                        reader.isPlaying
                            ? AppIcons.pause : AppIcons.play,
                        color: AppColors.onPrimary, size: 32),
                    ),
                  ),

                  const SizedBox(width: 16),
                  // Forward (next chunk)
                  IconButton(
                    iconSize: 30,
                    icon: const Icon(AppIcons.skipForward,
                      color: AppColors.textPrimary),
                    onPressed: _chunkIndex + 1 < _chunks.length
                        ? () => _forward(reader) : null,
                    tooltip: 'Next part',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // ── Chapter list (collapsible) ─────────────────────────────────
            Expanded(
              child: Container(
                margin: const EdgeInsets.fromLTRB(16, 0, 16, 0),
                decoration: BoxDecoration(
                  color:        AppColors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                child: Column(children: [
                  GestureDetector(
                    onTap: () =>
                        setState(() => _chaptersOpen = !_chaptersOpen),
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
                      child: Row(children: [
                        Text('Chapter List',
                          style: AppTextStyles.h3.copyWith(
                            fontSize: 13, color: AppColors.textPrimary)),
                        const Spacer(),
                        Icon(
                          _chaptersOpen
                              ? AppIcons.chevronUp
                              : AppIcons.chevronDown,
                          color: AppColors.textHint, size: 18),
                      ]),
                    ),
                  ),
                  const Divider(height: 1, color: AppColors.border),
                  if (_chaptersOpen)
                    Expanded(
                      child: ListView.builder(
                        padding:   EdgeInsets.zero,
                        itemCount: _chunks.length,
                        itemBuilder: (_, i) {
                          final active = i == _chunkIndex;
                          return ListTile(
                            dense:          true,
                            selected:       active,
                            selectedTileColor:
                              AppColors.primary.withValues(alpha: 0.06),
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 2),
                            leading: active
                              ? const Icon(AppIcons.volume,
                                  color: AppColors.primary, size: 16)
                              : null,
                            title: Text(
                              'Part ${i + 1}',
                              style: AppTextStyles.body.copyWith(
                                fontSize: 12,
                                color: active
                                    ? AppColors.primary : AppColors.textSecondary,
                                fontWeight: active
                                    ? FontWeight.w600 : FontWeight.normal)),
                            subtitle: Text(
                              _chunkPreview(_chunks[i]),
                              style: AppTextStyles.label.copyWith(
                                fontSize: 10, color: AppColors.textHint),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                            onTap: () => _jumpToChunk(reader, i),
                          );
                        },
                      ),
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

  // Split full text into readable chunks
  List<String> _splitIntoChunks(String text) {
    if (text.isEmpty) return [text];
    final chunks = <String>[];
    int i = 0;
    while (i < text.length) {
      final end = (i + _chunkSize).clamp(0, text.length);
      // Try to end at sentence boundary
      int cut = end;
      if (cut < text.length) {
        final dot = text.lastIndexOf('.', end);
        if (dot > i + 200) cut = dot + 1;
      }
      chunks.add(text.substring(i, cut).trim());
      i = cut;
    }
    return chunks.where((c) => c.isNotEmpty).toList();
  }

  String _buildNarrationText(BookModel b) {
    final parts = <String>[];

    // Introduction
    parts.add('${b.title}. By ${b.author}.');
    if (b.publishedYear != null) {
      parts.add('Published in ${b.publishedYear}.');
    }
    if (b.category.isNotEmpty) {
      parts.add('Category: ${b.category}.');
    }
    if (b.pageCount != null && b.pageCount! > 0) {
      parts.add('This book contains approximately ${b.pageCount} pages.');
    }

    // Description — up to 4000 chars
    if (b.description != null && b.description!.isNotEmpty) {
      final desc = b.description!.trim();
      parts.add(desc.length > 4000 ? '${desc.substring(0, 4000)}…' : desc);
    }

    // Tags / topics
    if (b.tags.isNotEmpty) {
      parts.add('Key topics covered in this book include: ${b.tags.take(8).join('; ')}.');
    }

    // Faculty relevance
    if (b.faculty.isNotEmpty) {
      parts.add('This book is relevant to the following fields: ${b.faculty.take(4).join(', ')}.');
    }

    // Rating
    if (b.ratingCount > 0) {
      final stars = b.rating.toStringAsFixed(1);
      parts.add('This book has a reader rating of $stars out of 5, based on ${b.ratingCount} reviews.');
    }

    // Closing
    parts.add('You are now listening to the text-to-speech narration of ${b.title}. '
        'Use the chapter list below to jump to any section, '
        'or adjust the playback speed using the speed controls above.');

    return parts.join(' ');
  }

  String _chunkPreview(String chunk) {
    final s = chunk.trim();
    return s.length > 60 ? '${s.substring(0, 60)}…' : s;
  }

  Widget _coverFallback() => Container(
    color: AppColors.primaryFixed,
    child: const Center(child: Icon(AppIcons.book,
      color: AppColors.primary, size: 64)));
}
