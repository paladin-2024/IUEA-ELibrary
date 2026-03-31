import 'package:flutter/material.dart';
import 'package:flutter_epub_viewer/flutter_epub_viewer.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../providers/reader_provider.dart';
import '../../providers/chat_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';
import 'widgets/reader_toolbar.dart';
import 'widgets/chat_sheet.dart';

class ReaderScreen extends StatefulWidget {
  final String bookId;
  const ReaderScreen({super.key, required this.bookId});

  @override
  State<ReaderScreen> createState() => _ReaderScreenState();
}

class _ReaderScreenState extends State<ReaderScreen> {
  final _epubController = EpubController();
  bool  _initialized    = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (book != null) {
        context.read<ReaderProvider>().setBook(book);
        setState(() => _initialized = true);
      }
    });
  }

  void _openChat() {
    context.read<ChatProvider>().loadHistory(widget.bookId);
    showModalBottomSheet(
      context:     context,
      isScrollControlled: true,
      shape:       const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (_) => ChatSheet(bookId: widget.bookId),
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
    final textColor = reader.theme == ReaderTheme.dark
        ? AppColors.white
        : AppColors.black;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: ReaderToolbar(
        book:       book,
        onBack:     () => context.pop(),
        onChat:     _openChat,
        onSettings: () => _showSettings(context, reader),
      ),
      body: book.fileType == 'epub' && book.fileUrl.isNotEmpty
          ? EpubViewer(
              epubSource:   EpubSource.fromUrl(book.fileUrl),
              epubController: _epubController,
              onChaptersLoaded: (chapters) {},
              onEpubLoaded:     () {},
              onRelocated: (value) {
                reader.setCfi(value.startCfi);
              },
            )
          : book.fileUrl.isNotEmpty
              ? _PdfView(url: book.fileUrl, bgColor: bgColor, textColor: textColor)
              : Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.book_outlined, size: 64, color: AppColors.grey300),
                      const SizedBox(height: 8),
                      Text('Book file not available',
                        style: TextStyle(color: textColor.withOpacity(0.5))),
                    ],
                  ),
                ),
    );
  }

  void _showSettings(BuildContext context, ReaderProvider reader) {
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
                    IconButton(icon: const Icon(Icons.text_decrease), onPressed: () => r.setFontSize(r.fontSize - 2)),
                    Text('${r.fontSize.toInt()}px'),
                    IconButton(icon: const Icon(Icons.text_increase), onPressed: () => r.setFontSize(r.fontSize + 2)),
                  ],
                ),
                const Text('Theme', style: TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Row(
                  children: ReaderTheme.values.map((t) => Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(t.name[0].toUpperCase() + t.name.substring(1)),
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
}

class _PdfView extends StatelessWidget {
  final String url;
  final Color  bgColor;
  final Color  textColor;
  const _PdfView({required this.url, required this.bgColor, required this.textColor});

  @override
  Widget build(BuildContext context) {
    // Show the PDF via a WebView-style approach or just direct link
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.picture_as_pdf, size: 64, color: AppColors.primary.withOpacity(0.5)),
            const SizedBox(height: 12),
            Text('PDF viewer', style: TextStyle(color: textColor, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Text('Open in browser:', style: TextStyle(color: textColor.withOpacity(0.6), fontSize: 12)),
            const SizedBox(height: 4),
            SelectableText(url, style: const TextStyle(color: AppColors.primary, fontSize: 12)),
          ],
        ),
      ),
    );
  }
}
