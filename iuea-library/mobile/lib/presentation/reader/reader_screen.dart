import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/reader_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';
import 'widgets/reader_toolbar.dart';
import 'widgets/language_switcher_sheet.dart';

class ReaderScreen extends StatefulWidget {
  final String bookId;
  final bool   audioMode;

  const ReaderScreen({
    super.key,
    required this.bookId,
    this.audioMode = false,
  });

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final _epubController = EpubController();
  Timer?  _autoSaveTimer;
  bool    _initialized  = false;
  String  _mode         = 'read'; // 'read' | 'audio'

  @override
  void initState() {
    super.initState();
    _mode = widget.audioMode ? 'audio' : 'read';
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final reader = context.read<ReaderProvider>();
      await reader.initTts();

      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted || book == null) return;

      reader.currentBook = book;
      await reader.loadProgress(widget.bookId);
      setState(() => _initialized = true);

      // Auto-save every 30 seconds
      _autoSaveTimer = Timer.periodic(
        const Duration(seconds: 30),
        (_) => reader.saveProgress(widget.bookId),
      );
    });
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    await context.read<ReaderProvider>().saveProgress(widget.bookId);
    return true;
  }

  Color _bgColor(ReaderProvider reader) {
    return switch (reader.theme) {
      'sepia' => const Color(0xFFF5ECD7),
      'dark'  => const Color(0xFF1A1A2E),
      _       => AppColors.white,
    };
  }

  Color _textColor(ReaderProvider reader) =>
      reader.theme == 'dark' ? AppColors.white : AppColors.textPrimary;

  void _openLanguageSwitcher() {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ReaderProvider>(),
        child: const LanguageSwitcherSheet(),
      ),
    );
  }

  void _showFontSheet(ReaderProvider reader) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ChangeNotifierProvider.value(
        value: reader,
        child: Consumer<ReaderProvider>(
          builder: (_, r, __) => _FontSheet(reader: r),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();
    final book   = reader.currentBook;

    if (!_initialized || book == null) {
      return const Scaffold(body: LoadingWidget());
    }

    final bg   = _bgColor(reader);
    final fg   = _textColor(reader);

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: bg,
        body: SafeArea(
          child: Stack(
            children: [
              // ── EPUB / Audio content ───────────────────────────────────
              Positioned.fill(
                bottom: 64, // toolbar height
                child: _mode == 'audio'
                    ? _AudioPlayerWidget(reader: reader, book: book)
                    : book.fileUrl != null && book.fileUrl!.isNotEmpty
                        ? EpubViewer(
                            epubSource:     EpubSource.fromUrl(book.fileUrl!),
                            epubController: _epubController,
                            onChaptersLoaded: (_) {},
                            onEpubLoaded:     () {},
                            onRelocated: (value) {
                              reader.setCurrentCfi(value.startCfi);
                              if (value.progress != null) {
                                reader.setPage(
                                  reader.currentPage,
                                  (value.progress! * 100),
                                );
                              }
                            },
                          )
                        : Center(
                            child: Text(
                              'No readable file available.',
                              style: TextStyle(color: fg),
                            ),
                          ),
              ),

              // ── Translated text overlay ────────────────────────────────
              if (reader.translatedContent != null && _mode == 'read')
                Positioned.fill(
                  bottom: 64,
                  child: ColoredBox(
                    color: bg,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 16),
                      child: Text(
                        reader.translatedContent!,
                        style: TextStyle(
                          fontSize:   reader.fontSize,
                          height:     reader.lineHeight,
                          color:      fg,
                          fontFamily: 'Lora',
                        ),
                      ),
                    ),
                  ),
                ),

              // ── TOC overlay ───────────────────────────────────────────
              if (reader.showTOC)
                Positioned.fill(
                  child: GestureDetector(
                    onTap: reader.toggleTOC,
                    child: ColoredBox(
                      color: Colors.black54,
                      child: Align(
                        alignment: Alignment.centerLeft,
                        child: Container(
                          width: 260,
                          color: AppColors.background,
                          child: const Center(
                            child: Text('TOC', style: TextStyle(color: AppColors.textSecondary)),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

              // ── Bottom toolbar ────────────────────────────────────────
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: ReaderToolbar(
                  reader:              reader,
                  onFontTap:           () => _showFontSheet(reader),
                  onLanguageTap:       _openLanguageSwitcher,
                  onTtsTap:            () => reader.isPlaying
                      ? reader.stopSpeaking()
                      : reader.speakCurrentChapter(),
                  onModeTap:           () => setState(() {
                    _mode = _mode == 'read' ? 'audio' : 'read';
                    reader.setReadingMode(_mode);
                  }),
                  onTOCTap:            reader.toggleTOC,
                  onChatTap:           reader.toggleChatbot,
                  bgColor:             bg,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Inline audio player widget ─────────────────────────────────────────────────
class _AudioPlayerWidget extends StatelessWidget {
  final ReaderProvider reader;
  final dynamic        book;
  const _AudioPlayerWidget({required this.reader, required this.book});

  @override
  Widget build(BuildContext context) {
    final fg = reader.theme == 'dark' ? AppColors.white : AppColors.textPrimary;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (book.coverUrl != null && book.coverUrl!.isNotEmpty)
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              book.coverUrl!,
              width: 180, height: 240, fit: BoxFit.cover,
            ),
          )
        else
          Container(
            width: 180, height: 240,
            decoration: BoxDecoration(
              color:        AppColors.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.book_outlined, size: 64, color: AppColors.primary),
          ),

        const SizedBox(height: 24),
        Text(book.title,
          style: TextStyle(
            fontSize: 18, fontWeight: FontWeight.bold, color: fg),
          textAlign: TextAlign.center,
          maxLines: 2,
        ),
        const SizedBox(height: 8),
        Text(book.author,
          style: TextStyle(fontSize: 13, color: fg.withOpacity(0.6)),
        ),
        const SizedBox(height: 4),
        Text(
          'Audio by your device\'s speech engine',
          style: TextStyle(
            fontSize: 11,
            color:    AppColors.textHint,
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 32),
        // Play/stop control
        GestureDetector(
          onTap: reader.isPlaying
              ? reader.stopSpeaking
              : reader.speakCurrentChapter,
          child: Container(
            width: 72, height: 72,
            decoration: const BoxDecoration(
              color: AppColors.primary, shape: BoxShape.circle),
            child: Icon(
              reader.isPlaying ? Icons.stop : Icons.play_arrow,
              color: AppColors.white, size: 36,
            ),
          ),
        ),
      ],
    );
  }
}

// ── Font / theme settings sheet ────────────────────────────────────────────────
class _FontSheet extends StatelessWidget {
  final ReaderProvider reader;
  const _FontSheet({required this.reader});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Font Size',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          Row(
            children: [
              IconButton(
                icon:      const Icon(Icons.text_decrease),
                onPressed: () => reader.setFontSize(reader.fontSize - 2),
              ),
              Text('${reader.fontSize.toInt()}px'),
              IconButton(
                icon:      const Icon(Icons.text_increase),
                onPressed: () => reader.setFontSize(reader.fontSize + 2),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text('Theme',
            style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(height: 8),
          Row(
            children: [
              for (final t in ['white', 'sepia', 'dark'])
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label:    Text(t[0].toUpperCase() + t.substring(1)),
                    selected: reader.theme == t,
                    onSelected: (_) => reader.setTheme(t),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}
