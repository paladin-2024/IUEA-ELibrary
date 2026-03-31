import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/book_card.dart';
import '../widgets/loading_widget.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchCtrl = TextEditingController();
  bool  _hasSearched = false;

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _search() {
    final q = _searchCtrl.text.trim();
    if (q.isEmpty) return;
    setState(() => _hasSearched = true);
    context.read<BookProvider>().searchBooks(q);
  }

  @override
  Widget build(BuildContext context) {
    final books = context.watch<BookProvider>();

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller:  _searchCtrl,
          autofocus:   true,
          style:       const TextStyle(color: AppColors.white),
          cursorColor: AppColors.accent,
          decoration:  const InputDecoration(
            hintText:     'Search books, authors…',
            hintStyle:    TextStyle(color: AppColors.primaryLight),
            border:       InputBorder.none,
          ),
          onSubmitted: (_) => _search(),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.search), onPressed: _search),
        ],
      ),
      body: books.isLoading
          ? const LoadingWidget()
          : !_hasSearched
              ? _emptyPrompt()
              : books.searchResults.isEmpty
                  ? _noResults()
                  : GridView.builder(
                      padding:     const EdgeInsets.all(16),
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount:   2,
                        crossAxisSpacing: 12,
                        mainAxisSpacing:  12,
                        childAspectRatio: 0.55,
                      ),
                      itemCount:   books.searchResults.length,
                      itemBuilder: (_, i) => BookCard(book: books.searchResults[i], width: double.infinity),
                    ),
    );
  }

  Widget _emptyPrompt() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.search, size: 64, color: AppColors.grey300),
        const SizedBox(height: 12),
        const Text('Search for books, authors or topics',
          style: TextStyle(color: AppColors.grey500)),
      ],
    ),
  );

  Widget _noResults() => Center(
    child: Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(Icons.search_off, size: 64, color: AppColors.grey300),
        const SizedBox(height: 12),
        Text('No results for "${_searchCtrl.text}"',
          style: const TextStyle(color: AppColors.grey500)),
      ],
    ),
  );
}
