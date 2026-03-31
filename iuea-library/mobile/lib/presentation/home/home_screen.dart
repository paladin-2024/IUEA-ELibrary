import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../providers/book_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../widgets/book_card.dart';
import '../widgets/loading_widget.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BookProvider>().loadFeatured();
      context.read<BookProvider>().loadBooks();
    });
  }

  @override
  Widget build(BuildContext context) {
    final books = context.watch<BookProvider>();
    final user  = context.watch<AuthProvider>().user;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // App Bar
          SliverAppBar(
            expandedHeight: 180,
            pinned:         true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [AppColors.primaryDark, AppColors.primary],
                    begin:  Alignment.topLeft,
                    end:    Alignment.bottomRight,
                  ),
                ),
                padding: const EdgeInsets.fromLTRB(20, 60, 20, 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user != null ? 'Hello, ${user.name.split(' ').first}!' : AppStrings.appName,
                      style: const TextStyle(color: AppColors.white, fontSize: 22, fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 4),
                    const Text('What would you like to read today?',
                      style: TextStyle(color: AppColors.primaryLight, fontSize: 14)),
                    const SizedBox(height: 12),
                    // Search bar
                    GestureDetector(
                      onTap: () => context.go('/search'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                        decoration: BoxDecoration(
                          color:        AppColors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Row(
                          children: [
                            Icon(Icons.search, color: AppColors.white, size: 18),
                            SizedBox(width: 8),
                            Text('Search books, authors…',
                              style: TextStyle(color: AppColors.primaryLight, fontSize: 14)),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          SliverToBoxAdapter(
            child: books.isLoading && books.featured.isEmpty
                ? const Padding(padding: EdgeInsets.symmetric(vertical: 60), child: LoadingWidget())
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Featured
                      _sectionHeader(context, AppStrings.featured, '/search'),
                      SizedBox(
                        height: 210,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding:         const EdgeInsets.symmetric(horizontal: 16),
                          itemCount:       books.featured.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder:     (_, i) => BookCard(book: books.featured[i]),
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Recently Added
                      _sectionHeader(context, AppStrings.recentlyAdded, '/search'),
                      SizedBox(
                        height: 210,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          padding:         const EdgeInsets.symmetric(horizontal: 16),
                          itemCount:       books.books.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 12),
                          itemBuilder:     (_, i) => BookCard(book: books.books[i]),
                        ),
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
          ),
        ],
      ),
    );
  }

  Widget _sectionHeader(BuildContext context, String title, String route) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
      child: Row(
        children: [
          Text(title, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
          const Spacer(),
          TextButton(
            onPressed: () => context.go(route),
            child:     const Text('See all', style: TextStyle(color: AppColors.primary)),
          ),
        ],
      ),
    );
  }
}
