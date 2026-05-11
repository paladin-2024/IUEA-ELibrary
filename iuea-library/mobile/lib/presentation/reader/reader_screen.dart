import 'dart:async';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/reader_provider.dart';
import '../../providers/chat_provider.dart';
import '../../data/services/download_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import '../widgets/loading_widget.dart';
import 'widgets/reader_toolbar.dart';
import 'widgets/language_switcher_sheet.dart';
import 'widgets/table_of_contents_sheet.dart';
import 'widgets/chatbot_sheet.dart';

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
  Timer? _autoSaveTimer;
  Timer? _epubBlankTimer;
  Timer? _textExtractDebounce;
  bool    _initialized      = false;
  bool    _loadFailed        = false;
  bool    _epubBlank         = false;
  bool    _epubLoading       = false;
  bool    _downloading       = false;
  double  _downloadProgress  = 0.0;
  String  _mode              = 'read';
  String? _localFilePath;
  List<EpubChapter> _chapters = [];

  // Track last-applied epub settings so we only push changes, not every rebuild
  double? _epubFontSize;
  String? _epubThemeKey;

  @override
  void initState() {
    super.initState();
    _mode = widget.audioMode ? 'audio' : 'read';
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final reader = context.read<ReaderProvider>();
      await reader.initTts();

      // ignore: use_build_context_synchronously
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted) return;
      if (book == null) {
        setState(() => _loadFailed = true);
        return;
      }

      reader.currentBook = book;
      await reader.loadProgress(widget.bookId);

      // Check for an already-downloaded local copy
      String? localPath = await DownloadService().getLocalPath(widget.bookId);

      // If no local copy and it's an EPUB with a URL, download it now.
      // EpubSource.fromUrl() is unreliable (CORS, redirects, large files);
      // downloading first and using fromFile() is the only robust approach.
      if (localPath == null &&
          book.fileUrl != null &&
          book.fileUrl!.isNotEmpty &&
          book.fileFormat != 'pdf') {
        if (mounted) setState(() => _downloading = true);
        try {
          final dl = await DownloadService().downloadBook(
            book,
            onProgress: (pct) {
              if (mounted) setState(() => _downloadProgress = pct);
            },
          );
          localPath = dl.localPath;
        } catch (_) {
          // download failed — we'll show the no-file state below
        }
        if (mounted) setState(() => _downloading = false);
      }

      if (mounted) _localFilePath = localPath;

      setState(() => _initialized = true);

      // Start loading state + blank timer for ANY epub source (local or URL fallback)
      final isEpub = book.fileFormat != 'pdf';
      final hasEpubSource = localPath != null ||
          (book.fileUrl != null && book.fileUrl!.isNotEmpty);
      if (isEpub && hasEpubSource) {
        if (mounted) setState(() => _epubLoading = true);
        _startEpubBlankTimer();
      }

      _autoSaveTimer = Timer.periodic(
        const Duration(seconds: 30),
        (_) => reader.saveProgress(widget.bookId),
      );
    });
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    _epubBlankTimer?.cancel();
    _textExtractDebounce?.cancel();
    // ignore: use_build_context_synchronously
    context.read<ReaderProvider>().removeListener(_syncEpubSettings);
    super.dispose();
  }

  void _startEpubBlankTimer() {
    _epubBlankTimer?.cancel();
    _epubBlank = false;
    // 20 s — generous for slow mobile networks
    _epubBlankTimer = Timer(const Duration(seconds: 60), () {
      if (mounted && !_epubBlank) {
        setState(() {
          _epubBlank   = true;
          _epubLoading = false;
        });
      }
    });
  }

  void _onEpubChaptersLoaded(List<EpubChapter> chapters) {
    _epubBlankTimer?.cancel();
    _chapters = chapters;
    if (mounted) {
      setState(() {
        _epubLoading = false;
        if (_epubBlank) _epubBlank = false;
      });
    }
    _scheduleTextExtract();
  }

  void _onEpubLoaded() {
    _epubBlankTimer?.cancel();
    if (mounted) setState(() => _epubLoading = false);
    _scheduleTextExtract();
    // Start watching for font/theme changes to push to the epub WebView
    context.read<ReaderProvider>().addListener(_syncEpubSettings);
  }

  // Push font-size and theme changes into the epub WebView without reloading it
  void _syncEpubSettings() {
    if (_epubController.webViewController == null || !mounted) return;
    final reader = context.read<ReaderProvider>();
    if (reader.fontSize != _epubFontSize) {
      _epubFontSize = reader.fontSize;
      _epubController.setFontSize(fontSize: reader.fontSize);
    }
    if (reader.theme != _epubThemeKey) {
      _epubThemeKey = reader.theme;
      _epubController.updateTheme(theme: _buildEpubTheme(reader.theme));
    }
  }

  static EpubTheme _buildEpubTheme(String theme) {
    switch (theme) {
      case 'dark':
        return EpubTheme.dark();
      case 'sepia':
        return EpubTheme.custom(
          backgroundDecoration: const BoxDecoration(color: Color(0xFFF5ECD7)),
          foregroundColor: const Color(0xFF3B2A1A),
        );
      default:
        return EpubTheme.light();
    }
  }

  // Match a CFI to its chapter by checking each chapter's href against the CFI string.
  // Falls back to progress-based estimate if no match is found.
  int _findChapterIndex(String cfi) {
    if (_chapters.isEmpty) return 0;
    for (int i = _chapters.length - 1; i >= 0; i--) {
      final href = _chapters[i].href.split('#').first;
      if (href.isNotEmpty && cfi.contains(href)) return i;
      if (_chapters[i].id.isNotEmpty && cfi.contains(_chapters[i].id)) return i;
    }
    return 0;
  }

  void _scheduleTextExtract() {
    _textExtractDebounce?.cancel();
    _textExtractDebounce = Timer(const Duration(milliseconds: 600), () async {
      try {
        final result = await _epubController.extractCurrentPageText();
        final text = result.text;
        if (mounted && text != null && text.isNotEmpty) {
          // ignore: use_build_context_synchronously
          context.read<ReaderProvider>().setCurrentChapterText(text);
        }
      } catch (_) {}
    });
  }

  Future<bool> _onWillPop() async {
    await context.read<ReaderProvider>().saveProgress(widget.bookId);
    return true;
  }

  String _pageLabel(ReaderProvider reader, dynamic book) {
    final chap = 'CH ${reader.currentChapter + 1}';
    if (book.pageCount != null && book.pageCount! > 0 && reader.currentPage > 0) {
      return '$chap · P ${reader.currentPage}/${book.pageCount}';
    }
    if (reader.percentComplete > 0) {
      return '$chap · ${reader.percentComplete.toStringAsFixed(0)}%';
    }
    return chap;
  }

  Color _bgColor(ReaderProvider reader) {
    return switch (reader.theme) {
      'sepia' => const Color(0xFFF5ECD7),
      'dark'  => AppColors.readerDark,
      _       => AppColors.white,
    };
  }

  Color _fgColor(ReaderProvider reader) =>
      reader.theme == 'dark' ? AppColors.white : AppColors.textPrimary;

  void _openTOC() {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ReaderProvider>(),
        child: TableOfContentsSheet(bookId: widget.bookId),
      ),
    );
  }

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

  void _openChatbot() {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: context.read<ReaderProvider>()),
          ChangeNotifierProvider.value(value: context.read<ChatProvider>()),
        ],
        child: ChatbotSheet(bookId: widget.bookId),
      ),
    );
  }

  void _showStyleSheet(ReaderProvider reader) {
    showModalBottomSheet(
      context: context,
      builder: (_) => ChangeNotifierProvider.value(
        value: reader,
        child: Consumer<ReaderProvider>(
          builder: (_, r, __) => _StyleSheet(reader: r),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();
    final book   = reader.currentBook;

    if (_loadFailed) {
      return Scaffold(
        body: AppErrorState(
          message: context.read<BookProvider>().error,
          onRetry: () {
            setState(() { _loadFailed = false; _initialized = false; });
            WidgetsBinding.instance.addPostFrameCallback((_) async {
              final bookProvider = context.read<BookProvider>();
              final reader = context.read<ReaderProvider>();
              final b = await bookProvider.getBook(widget.bookId);
              if (!mounted || b == null) {
                setState(() => _loadFailed = true);
                return;
              }
              reader.currentBook = b;
              await reader.loadProgress(widget.bookId);
              if (mounted) setState(() => _initialized = true);
            });
          },
        ),
      );
    }

    // Show download progress before _initialized — the progress overlay inside
    // the Stack is unreachable until after download completes, so we hoist it.
    if (_downloading) {
      return Scaffold(
        backgroundColor: Colors.white,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 40),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: const Icon(AppIcons.book,
                      size: 32, color: AppColors.primary),
                  ),
                  const SizedBox(height: 24),
                  Text(
                    _downloadProgress > 0
                        ? 'Downloading… ${(_downloadProgress * 100).toStringAsFixed(0)}%'
                        : 'Preparing book…',
                    style: const TextStyle(
                      fontFamily: 'Inter', fontSize: 14,
                      color: Color(0xFF475569), fontWeight: FontWeight.w500),
                  ),
                  const SizedBox(height: 16),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: LinearProgressIndicator(
                      value:           _downloadProgress > 0 ? _downloadProgress : null,
                      color:           AppColors.primary,
                      backgroundColor: AppColors.primary.withValues(alpha: 0.10),
                      minHeight:       6,
                    ),
                  ),
                  if (_downloadProgress > 0) ...[
                    const SizedBox(height: 10),
                    Text(
                      'This may take a moment on slow networks',
                      style: const TextStyle(
                        fontFamily: 'Inter', fontSize: 11,
                        color: Color(0xFF94A3B8)),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ],
              ),
            ),
          ),
        ),
      );
    }

    if (!_initialized || book == null) {
      return const Scaffold(body: LoadingWidget());
    }

    final bg = _bgColor(reader);
    final fg = _fgColor(reader);
    final isDark = reader.theme == 'dark';

    // Top bar colors
    final barBg     = isDark ? const Color(0xFF0D0D1A) : bg;
    final barFg     = isDark ? AppColors.white : AppColors.textPrimary;
    final barSub    = isDark ? Colors.white.withValues(alpha: 0.5) : AppColors.textHint;
    final barBorder = isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.07);

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (!didPop) {
          await _onWillPop();
          // ignore: use_build_context_synchronously
          if (mounted) context.pop();
        }
      },
      child: Scaffold(
        backgroundColor: bg,
        body: SafeArea(
          bottom: false,
          child: Column(
            children: [
              // ── Top bar ─────────────────────────────────────────────────────
              ClipRect(
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child: Container(
                    decoration: BoxDecoration(
                      color: barBg.withValues(alpha: isDark ? 0.97 : 0.96),
                      border: Border(
                        bottom: BorderSide(color: barBorder, width: 0.5)),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 4, vertical: 6),
                    child: Row(children: [
                      IconButton(
                        icon: Icon(AppIcons.arrowBack,
                          size: 18, color: barFg),
                        onPressed: () async {
                          await reader.saveProgress(widget.bookId);
                          // ignore: use_build_context_synchronously
                          if (mounted) context.pop();
                        },
                      ),
                      Expanded(
                        child: Column(
                          children: [
                            Text(book.title,
                              style: AppTextStyles.body.copyWith(
                                fontSize:   14,
                                fontWeight: FontWeight.w600,
                                color:      barFg),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis),
                            Text(
                              _pageLabel(reader, book),
                              style: TextStyle(
                                fontFamily:    'Inter',
                                fontSize:      10,
                                letterSpacing: 0.6,
                                color:         barSub),
                            ),
                          ],
                        ),
                      ),
                      // Translate & Chat in top bar
                      IconButton(
                        icon: Icon(AppIcons.translate,
                          size: 20,
                          color: reader.readingLanguage != 'English'
                              ? AppColors.primary : barFg),
                        onPressed: _openLanguageSwitcher,
                        tooltip: 'Switch language',
                      ),
                      IconButton(
                        icon: Icon(AppIcons.bot,
                          size: 20, color: barFg),
                        onPressed: _openChatbot,
                        tooltip: 'Ask Digital Curator',
                      ),
                      PopupMenuButton<String>(
                        icon: Icon(AppIcons.moreVert,
                          size: 20, color: barFg),
                        color: isDark
                            ? const Color(0xFF1A1A2E) : AppColors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                        onSelected: (v) {
                          if (v == 'mode') {
                            setState(() {
                              _mode = _mode == 'read' ? 'audio' : 'read';
                              reader.setReadingMode(_mode);
                            });
                          } else if (v == 'toc') {
                            _openTOC();
                          }
                        },
                        itemBuilder: (_) => [
                          PopupMenuItem(
                            value: 'mode',
                            child: Row(children: [
                              Icon(_mode == 'read'
                                  ? AppIcons.headphones
                                  : AppIcons.bookpen,
                                size: 18, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Text(_mode == 'read'
                                  ? 'Switch to Audio' : 'Switch to Reading',
                                style: AppTextStyles.body.copyWith(
                                  fontSize: 13)),
                            ]),
                          ),
                          PopupMenuItem(
                            value: 'toc',
                            child: Row(children: [
                              const Icon(AppIcons.list,
                                size: 18, color: AppColors.primary),
                              const SizedBox(width: 10),
                              Text('Table of Contents',
                                style: AppTextStyles.body.copyWith(
                                  fontSize: 13)),
                            ]),
                          ),
                        ],
                      ),
                    ]),
                  ),
                ),
              ),

              // ── Content area ────────────────────────────────────────────────
              Expanded(
                child: Stack(
                  children: [
                    // EPUB viewer or audio widget
                    Positioned.fill(
                      child: _mode == 'audio'
                          ? _AudioWidget(reader: reader, book: book, fg: fg)
                          : _epubBlank
                              ? _NoFileState(
                                  fg: fg, bg: bg,
                                  onSwitchToAudio: () => setState(() {
                                    _mode = 'audio';
                                    reader.setReadingMode('audio');
                                  }),
                                )
                              : book.fileFormat == 'pdf'
                                  ? _PdfNotSupportedState(
                                      fg: fg, bg: bg,
                                      onSwitchToAudio: () => setState(() {
                                        _mode = 'audio';
                                        reader.setReadingMode('audio');
                                      }),
                                    )
                                  : (_localFilePath != null || (book.fileUrl != null && book.fileUrl!.isNotEmpty))
                                      ? EpubViewer(
                                          epubSource: _localFilePath != null
                                              ? EpubSource.fromFile(File(_localFilePath!))
                                              : EpubSource.fromUrl(book.fileUrl!),
                                          epubController:   _epubController,
                                          initialCfi:       reader.currentCfi,
                                          displaySettings:  EpubDisplaySettings(
                                            fontSize:  reader.fontSize.toInt(),
                                            spread:    EpubSpread.none,
                                            flow:      EpubFlow.paginated,
                                            snap:      true,
                                            theme:     _buildEpubTheme(reader.theme),
                                          ),
                                          onChaptersLoaded: _onEpubChaptersLoaded,
                                          onEpubLoaded:     _onEpubLoaded,
                                          onRelocated: (value) {
                                            reader.setCurrentCfi(value.startCfi);
                                            // Calculate page from progress × total pages
                                            final total = book.pageCount ?? 0;
                                            reader.setPage(
                                              total > 0
                                                  ? (value.progress * total)
                                                      .round()
                                                      .clamp(1, total)
                                                  : 0,
                                              value.progress * 100,
                                            );
                                            // Match CFI to chapter by href, not by index
                                            if (_chapters.isNotEmpty) {
                                              reader.setCurrentChapter(
                                                _findChapterIndex(value.startCfi));
                                            }
                                            _scheduleTextExtract();
                                          },
                                        )
                                      : _NoFileState(
                                          fg: fg, bg: bg,
                                          onSwitchToAudio: () => setState(() {
                                            _mode = 'audio';
                                            reader.setReadingMode('audio');
                                          }),
                                        ),
                    ),

                    // Loading overlay — shown while EpubViewer initialises
                    if (_epubLoading && !_downloading && _mode == 'read')
                      Positioned.fill(
                        child: Container(
                          color: bg,
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const CircularProgressIndicator(
                                  color: AppColors.primary, strokeWidth: 2.5),
                              const SizedBox(height: 18),
                              Text(
                                'Opening book…',
                                style: TextStyle(
                                  fontFamily: 'Inter',
                                  fontSize:   13,
                                  color:      fg.withValues(alpha: 0.55),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                    // Translated text overlay
                    if (reader.translatedContent != null && _mode == 'read')
                      Positioned.fill(
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
                                fontFamily: reader.fontFamily == 'sans'
                                    ? 'Inter' : 'Lora',
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),

              // ── Bottom toolbar ──────────────────────────────────────────────
              ReaderToolbar(
                reader:        reader,
                bgColor:       bg,
                onFontTap:     () => _showStyleSheet(reader),
                onLanguageTap: _openLanguageSwitcher,
                onTtsTap:      () => reader.isPlaying
                    ? reader.stopSpeaking()
                    : reader.speakCurrentChapter(),
                onModeTap:     () => setState(() {
                  _mode = _mode == 'read' ? 'audio' : 'read';
                  reader.setReadingMode(_mode);
                }),
                onTOCTap:      _openTOC,
                onChatTap:     _openChatbot,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Inline audio widget (when in audio mode inside reader) ────────────────────
class _AudioWidget extends StatelessWidget {
  final ReaderProvider reader;
  final dynamic        book;
  final Color          fg;
  const _AudioWidget({
    required this.reader, required this.book, required this.fg});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (book.hasCover)
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(
              book.coverUrl!, width: 180, height: 240, fit: BoxFit.cover),
          )
        else
          Container(
            width: 180, height: 240,
            decoration: BoxDecoration(
              color:        AppColors.primary.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(16)),
            child: const Icon(AppIcons.book,
              size: 64, color: AppColors.primary),
          ),
        const SizedBox(height: 24),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Text(book.title,
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold,
              color: fg),
            textAlign: TextAlign.center, maxLines: 2),
        ),
        const SizedBox(height: 6),
        Text(book.author,
          style: TextStyle(fontSize: 13, color: fg.withValues(alpha: 0.6))),
        const SizedBox(height: 32),
        GestureDetector(
          onTap: reader.isPlaying
              ? reader.stopSpeaking
              : reader.speakCurrentChapter,
          child: Container(
            width: 72, height: 72,
            decoration: const BoxDecoration(
              color: AppColors.primary, shape: BoxShape.circle),
            child: Icon(
              reader.isPlaying ? Icons.stop_rounded : AppIcons.play,
              color: AppColors.white, size: 36),
          ),
        ),
      ],
    );
  }
}

// ── PDF-not-supported state ───────────────────────────────────────────────────
class _PdfNotSupportedState extends StatelessWidget {
  final Color        fg;
  final Color        bg;
  final VoidCallback onSwitchToAudio;
  const _PdfNotSupportedState({
    required this.fg, required this.bg, required this.onSwitchToAudio});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: bg,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(AppIcons.pdf,
              size: 64, color: fg.withValues(alpha: 0.25)),
          const SizedBox(height: 20),
          Text(
            'PDF format',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Newsreader',
              fontSize:   20,
              fontWeight: FontWeight.w700,
              color:      fg,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'This book is a PDF file. In-app PDF reading is coming soon. '
            'You can download it for offline use or listen to an audio summary.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize:   14,
              height:     1.6,
              color:      fg.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: onSwitchToAudio,
            icon:  const Icon(AppIcons.headphones, size: 18),
            label: const Text('Switch to Audio Mode'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(
                  horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── No-file empty state ───────────────────────────────────────────────────────
class _NoFileState extends StatelessWidget {
  final Color    fg;
  final Color    bg;
  final VoidCallback onSwitchToAudio;
  const _NoFileState({
    required this.fg, required this.bg, required this.onSwitchToAudio});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: bg,
      padding: const EdgeInsets.symmetric(horizontal: 32),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(AppIcons.bookpen,
            size: 64, color: fg.withValues(alpha: 0.25)),
          const SizedBox(height: 20),
          Text(
            'No digital copy available',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'PlayfairDisplay',
              fontSize:   20,
              fontWeight: FontWeight.w700,
              color:      fg,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            'This book doesn\'t have an online readable file yet. '
            'Visit the IUEA Library to borrow a physical copy, '
            'or listen to an audio summary.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Inter',
              fontSize:   14,
              height:     1.6,
              color:      fg.withValues(alpha: 0.55),
            ),
          ),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: onSwitchToAudio,
            icon:  const Icon(AppIcons.headphones, size: 18),
            label: const Text('Switch to Audio Mode'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: AppColors.white,
              padding: const EdgeInsets.symmetric(
                horizontal: 24, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Style / theme sheet ───────────────────────────────────────────────────────
class _StyleSheet extends StatelessWidget {
  final ReaderProvider reader;
  const _StyleSheet({required this.reader});

  static const _fonts = [
    {'id': 'serif',    'label': 'Serif',    'family': 'Lora'},
    {'id': 'sans',     'label': 'Sans',     'family': 'Inter'},
    {'id': 'dyslexic', 'label': 'Dyslexic', 'family': 'Inter'},
  ];

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(children: [
              Text('Reading Style',
                style: AppTextStyles.h3.copyWith(fontSize: 16)),
              const Spacer(),
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: const Icon(AppIcons.close,
                  size: 20, color: AppColors.textSecondary),
              ),
            ]),
            const SizedBox(height: 16),

            // Font family
            Text('Font',
              style: AppTextStyles.label.copyWith(
                fontSize: 11, letterSpacing: 0.8, color: AppColors.textHint)),
            const SizedBox(height: 8),
            Row(
              children: _fonts.map((f) {
                final sel = reader.fontFamily == f['id'];
                return Expanded(
                  child: GestureDetector(
                    onTap: () => reader.setFontFamily(f['id']!),
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 3),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      decoration: BoxDecoration(
                        color: sel
                            ? AppColors.primary.withValues(alpha: 0.07)
                            : Colors.transparent,
                        border: Border.all(
                          color: sel ? AppColors.primary : AppColors.border,
                          width: sel ? 1.5 : 1),
                        borderRadius: BorderRadius.circular(10)),
                      child: Column(children: [
                        Text('Aa',
                          style: TextStyle(
                            fontFamily: f['family'],
                            fontSize:   20,
                            color:      AppColors.textPrimary)),
                        const SizedBox(height: 4),
                        Text(f['label']!,
                          style: TextStyle(
                            fontSize:   11,
                            color:      sel ? AppColors.primary
                                : AppColors.textSecondary,
                            fontWeight: sel ? FontWeight.w600 : null)),
                      ]),
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Font size
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Font Size',
                  style: AppTextStyles.label.copyWith(
                    fontSize: 11, letterSpacing: 0.8,
                    color: AppColors.textHint)),
                Text('${reader.fontSize.toInt()}px',
                  style: AppTextStyles.body.copyWith(
                    color:      AppColors.primary,
                    fontWeight: FontWeight.w700,
                    fontSize:   13)),
              ],
            ),
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor:   AppColors.primary,
                inactiveTrackColor: AppColors.grey300,
                thumbColor:         AppColors.primary,
                trackHeight:        3,
              ),
              child: Slider(
                value:     reader.fontSize.clamp(14.0, 24.0),
                min:       14, max: 24, divisions: 10,
                onChanged: reader.setFontSize,
              ),
            ),
            const SizedBox(height: 8),

            // Theme
            Text('Theme',
              style: AppTextStyles.label.copyWith(
                fontSize: 11, letterSpacing: 0.8, color: AppColors.textHint)),
            const SizedBox(height: 8),
            Row(children: [
              for (final t in [
                {'id': 'white', 'label': 'White', 'bg': 0xFFFFFFFF},
                {'id': 'sepia', 'label': 'Sepia', 'bg': 0xFFF5ECD7},
                {'id': 'dark',  'label': 'Dark',  'bg': 0xFF1A1A2E},
              ])
                Padding(
                  padding: const EdgeInsets.only(right: 10),
                  child: GestureDetector(
                    onTap: () => reader.setTheme(t['id'] as String),
                    child: Column(children: [
                      Container(
                        width: 44, height: 44,
                        decoration: BoxDecoration(
                          color:  Color(t['bg'] as int),
                          shape:  BoxShape.circle,
                          border: Border.all(
                            color: reader.theme == t['id']
                                ? AppColors.primary : AppColors.border,
                            width: reader.theme == t['id'] ? 2 : 1)),
                        child: reader.theme == t['id']
                            ? const Icon(AppIcons.check,
                                color: AppColors.primary, size: 18)
                            : null,
                      ),
                      const SizedBox(height: 4),
                      Text(t['label'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          color: reader.theme == t['id']
                              ? AppColors.primary : AppColors.textSecondary)),
                    ]),
                  ),
                ),
            ]),
            const SizedBox(height: 4),
          ],
        ),
      ),
    );
  }
}
