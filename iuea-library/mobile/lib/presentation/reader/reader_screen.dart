import 'dart:async';
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
  bool   _initialized   = false;
  String _mode          = 'read'; // 'read' | 'audio'
  String? _localFilePath;         // set when offline copy exists

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

      // Prefer local offline copy over network URL
      final localPath = await DownloadService().getLocalPath(widget.bookId);
      if (mounted) _localFilePath = localPath;

      setState(() => _initialized = true);

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

    if (!_initialized || book == null) {
      return const Scaffold(body: LoadingWidget());
    }

    final bg = _bgColor(reader);
    final fg = _fgColor(reader);
    final isDark = reader.theme == 'dark';

    // Top bar colors
    final barBg     = isDark ? const Color(0xFF0D0D1A) : bg;
    final barFg     = isDark ? AppColors.white : AppColors.textPrimary;
    final barSub    = isDark ? Colors.white.withOpacity(0.5) : AppColors.textHint;
    final barBorder = isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.07);

    return WillPopScope(
      onWillPop: _onWillPop,
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
                      color: barBg.withOpacity(isDark ? 0.97 : 0.96),
                      border: Border(
                        bottom: BorderSide(color: barBorder, width: 0.5)),
                    ),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 4, vertical: 6),
                    child: Row(children: [
                      IconButton(
                        icon: Icon(Icons.arrow_back_ios_new_rounded,
                          size: 18, color: barFg),
                        onPressed: () async {
                          await reader.saveProgress(widget.bookId);
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
                              'CHAPTER ${reader.currentChapter + 1} · PAGE ${reader.currentPage > 0 ? reader.currentPage : '—'}',
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
                        icon: Icon(Icons.translate_rounded,
                          size: 20,
                          color: reader.readingLanguage != 'English'
                              ? AppColors.primary : barFg),
                        onPressed: _openLanguageSwitcher,
                        tooltip: 'Switch language',
                      ),
                      IconButton(
                        icon: Icon(Icons.smart_toy_outlined,
                          size: 20, color: barFg),
                        onPressed: _openChatbot,
                        tooltip: 'Ask Digital Curator',
                      ),
                      PopupMenuButton<String>(
                        icon: Icon(Icons.more_vert_rounded,
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
                                  ? Icons.headphones_outlined
                                  : Icons.menu_book_outlined,
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
                              const Icon(Icons.format_list_bulleted_rounded,
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
                          : (_localFilePath != null || (book.fileUrl != null && book.fileUrl!.isNotEmpty))
                              ? EpubViewer(
                                  epubSource: _localFilePath != null
                                      ? EpubSource.fromFile(_localFilePath!)
                                      : EpubSource.fromUrl(book.fileUrl!),
                                  epubController: _epubController,
                                  onChaptersLoaded: (_) {},
                                  onEpubLoaded:     () {},
                                  onRelocated: (value) {
                                    reader.setCurrentCfi(value.startCfi);
                                    if (value.progress != null) {
                                      reader.setPage(
                                        reader.currentPage,
                                        value.progress! * 100,
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
              color:        AppColors.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(16)),
            child: const Icon(Icons.book_outlined,
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
          style: TextStyle(fontSize: 13, color: fg.withOpacity(0.6))),
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
              reader.isPlaying ? Icons.stop_rounded : Icons.play_arrow_rounded,
              color: AppColors.white, size: 36),
          ),
        ),
      ],
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
                child: const Icon(Icons.close_rounded,
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
                            ? AppColors.primary.withOpacity(0.07)
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
                            ? const Icon(Icons.check_rounded,
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
