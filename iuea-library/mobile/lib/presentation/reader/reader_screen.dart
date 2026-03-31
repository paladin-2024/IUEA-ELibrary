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
  const ReaderScreen({super.key, required this.bookId});

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final _epubController = EpubController();
  bool   _initialized   = false;
  Timer? _autoSaveTimer;
  String _currentChapterText = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (!mounted || book == null) return;
      final reader = context.read<ReaderProvider>();
      reader.setBook(book);
      await reader.loadProgress();
      setState(() => _initialized = true);
      // Start auto-save every 30 s
      _autoSaveTimer = Timer.periodic(const Duration(seconds: 30), (_) {
        context.read<ReaderProvider>().saveProgress();
      });
    });
  }

  @override
  void dispose() {
    _autoSaveTimer?.cancel();
    // Save on exit
    context.read<ReaderProvider>().saveProgress();
    super.dispose();
  }

  Future<bool> _onWillPop() async {
    await context.read<ReaderProvider>().saveProgress();
    return true;
  }

  void _openLanguageSwitcher() {
    showModalBottomSheet(
      context:            context,
      isScrollControlled: true,
      backgroundColor:    Colors.transparent,
      builder: (_) => ChangeNotifierProvider.value(
        value: context.read<ReaderProvider>(),
        child: LanguageSwitcherSheet(
          currentChapterText: _currentChapterText,
        ),
      ),
    );
  }

  void _showSettings() {
    final reader = context.read<ReaderProvider>();
    showModalBottomSheet(
      context: context,
      builder: (_) => ChangeNotifierProvider.value(
        value: reader,
        child: Consumer<ReaderProvider>(
          builder: (_, r, __) => Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Font Size', style: TextStyle(fontWeight: FontWeight.w600)),
                Row(
                  children: [
                    IconButton(
                      icon:      const Icon(Icons.text_decrease),
                      onPressed: () => r.setFontSize(r.fontSize - 2),
                    ),
                    Text('${r.fontSize.toInt()}px'),
                    IconButton(
                      icon:      const Icon(Icons.text_increase),
                      onPressed: () => r.setFontSize(r.fontSize + 2),
                    ),
                  ],
                ),
                const Text('Theme', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  children: ReaderTheme.values.map((t) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label:    Text(t.name[0].toUpperCase() + t.name.substring(1)),
                      selected: r.theme == t,
                      onSelected: (_) => r.setTheme(t),
                    ),
                  )).toList(),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final reader = context.watch<ReaderProvider>();
    final book   = reader.book;

    if (!_initialized || book == null) {
      return const Scaffold(body: LoadingWidget());
    }

    final bgColor = switch (reader.theme) {
      ReaderTheme.sepia => AppColors.readerSepia,
      ReaderTheme.dark  => AppColors.readerDark,
      _                 => AppColors.readerLight,
    };

    return WillPopScope(
      onWillPop: _onWillPop,
      child: Scaffold(
        backgroundColor: bgColor,
        body: SafeArea(
          child: Stack(
            children: [
              // ── EPUB viewer ──────────────────────────────────────────
              Positioned.fill(
                bottom: 72, // leave space for bottom toolbar
                child: book.fileType == 'epub' && book.fileUrl.isNotEmpty
                    ? EpubViewer(
                        epubSource:       EpubSource.fromUrl(book.fileUrl),
                        epubController:   _epubController,
                        onChaptersLoaded: (_) {},
                        onEpubLoaded:     () {},
                        onRelocated: (value) {
                          reader.setCfi(value.startCfi);
                        },
                      )
                    : book.fileUrl.isNotEmpty
                        ? _PdfFallback(url: book.fileUrl, bgColor: bgColor)
                        : Center(
                            child: Text(
                              'No file available.',
                              style: TextStyle(
                                color: reader.theme == ReaderTheme.dark
                                    ? AppColors.white
                                    : AppColors.textSecondary,
                              ),
                            ),
                          ),
              ),

              // ── Translated overlay ───────────────────────────────────
              if (reader.translatedContent != null)
                Positioned.fill(
                  bottom: 72,
                  child: ColoredBox(
                    color: bgColor,
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(16),
                      child: Text(
                        reader.translatedContent!,
                        style: TextStyle(
                          fontSize:   reader.fontSize,
                          height:     reader.lineHeight,
                          color:      reader.theme == ReaderTheme.dark
                              ? AppColors.white
                              : AppColors.textPrimary,
                        ),
                      ),
                    ),
                  ),
                ),

              // ── Bottom toolbar ───────────────────────────────────────
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: ReaderBottomToolbar(
                  book:                book,
                  reader:              reader,
                  onBack:              () { context.pop(); },
                  onSettings:          _showSettings,
                  onLanguageSwitcher:  _openLanguageSwitcher,
                  onTts:               () => reader.speakCurrentChapter(_currentChapterText),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _PdfFallback extends StatelessWidget {
  final String url;
  final Color  bgColor;
  const _PdfFallback({required this.url, required this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.picture_as_pdf, size: 64, color: AppColors.primary.withOpacity(0.5)),
            const SizedBox(height: 12),
            const Text('PDF Viewer', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SelectableText(url, style: const TextStyle(color: AppColors.primary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
