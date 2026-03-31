import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/primary_button.dart';
import '../widgets/loading_widget.dart';
import '../widgets/language_badge.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  const BookDetailScreen({super.key, required this.bookId});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookProvider>().getBook(widget.bookId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final bookProvider = context.watch<BookProvider>();
    final auth         = context.watch<AuthProvider>();
    final book         = bookProvider.current;

    if (bookProvider.isLoading || book == null) {
      return const Scaffold(body: LoadingWidget());
    }

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            pinned:         true,
            expandedHeight: 280,
            flexibleSpace:  FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  book.coverUrl.isNotEmpty
                      ? CachedNetworkImage(imageUrl: book.coverUrl, fit: BoxFit.cover)
                      : Container(color: AppColors.primary),
                  Container(color: AppColors.black.withOpacity(0.45)),
                ],
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(book.title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Text(book.authorDisplay, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 10),

                  // Tags
                  Wrap(
                    spacing: 8, runSpacing: 6,
                    children: [
                      if (book.category.isNotEmpty) Chip(label: Text(book.category)),
                      LanguageBadge(code: book.language),
                      if (book.publishedYear != null) Chip(label: Text(book.publishedYear!)),
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (book.description.isNotEmpty) ...[
                    Text('About', style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 6),
                    Text(book.description, style: const TextStyle(height: 1.6, color: AppColors.grey700)),
                    const SizedBox(height: 20),
                  ],

                  // Actions
                  if (auth.isLoggedIn) ...[
                    PrimaryButton(
                      label:    'Read Now',
                      icon:     Icons.menu_book_outlined,
                      onPressed: () => context.push('/reader/${book.id}'),
                    ),
                    const SizedBox(height: 10),
                    PrimaryButton(
                      label:      'Listen',
                      icon:       Icons.headphones_outlined,
                      isOutlined: true,
                      onPressed:  () => context.push('/audio/${book.id}'),
                    ),
                  ] else
                    PrimaryButton(
                      label:     'Login to Read',
                      onPressed: () => context.go('/login'),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
