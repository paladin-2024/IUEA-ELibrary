import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../data/repositories/progress_repository.dart';
import '../../data/models/progress_model.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';

const _tabs = ['All', 'Reading', 'Finished', 'Saved'];

class MyLibraryScreen extends StatefulWidget {
  const MyLibraryScreen({super.key});

  @override
  State<MyLibraryScreen> createState() => _MyLibraryScreenState();
}

class _MyLibraryScreenState extends State<MyLibraryScreen>
    with SingleTickerProviderStateMixin {
  final _repo          = ProgressRepository(ApiService());
  late TabController   _tabController;
  List<ProgressModel>  _all       = [];
  bool                 _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _load();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await _repo.getAllProgress();
      setState(() { _all = data; _isLoading = false; });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  List<ProgressModel> _filtered(int tab) {
    switch (tab) {
      case 1: return _all.where((p) => p.percentComplete > 0 && !p.isCompleted).toList();
      case 2: return _all.where((p) => p.isCompleted).toList();
      case 3: return _all.where((p) => p.percentComplete == 0).toList();
      default: return _all;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation:       0,
        title:           const Text('My Library',
            style: TextStyle(fontFamily: 'Playfair Display', fontWeight: FontWeight.w700)),
        bottom: TabBar(
          controller:       _tabController,
          labelColor:       AppColors.primary,
          unselectedLabelColor: AppColors.grey500,
          indicatorColor:   AppColors.primary,
          indicatorWeight:  2,
          labelStyle:       const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          tabs:             _tabs.map((t) => Tab(text: t)).toList(),
        ),
      ),
      body: _isLoading
          ? const LoadingWidget()
          : TabBarView(
              controller: _tabController,
              children: List.generate(_tabs.length, (i) {
                final items = _filtered(i);
                if (items.isEmpty) {
                  return Center(
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.book_outlined, size: 56, color: AppColors.grey300),
                      const SizedBox(height: 10),
                      Text(
                        i == 1 ? 'No books in progress.' :
                        i == 2 ? 'No finished books yet.' :
                        i == 3 ? 'No saved books.' :
                                 'Your library is empty.',
                        style: const TextStyle(color: AppColors.grey500, fontSize: 14),
                      ),
                    ]),
                  );
                }
                return RefreshIndicator(
                  color:        AppColors.primary,
                  onRefresh:    _load,
                  child:        ListView.separated(
                    padding:          const EdgeInsets.all(16),
                    itemCount:        items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder:      (_, idx) => _BookCard(
                      progress: items[idx],
                      onTap:    () {
                        final b = items[idx].book;
                        if (b != null) context.push('/reader/${b.id}');
                      },
                    ),
                  ),
                );
              }),
            ),
    );
  }
}

class _BookCard extends StatelessWidget {
  final ProgressModel progress;
  final VoidCallback  onTap;
  const _BookCard({required this.progress, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final book = progress.book;
    final pct  = progress.percentComplete / 100;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color:        AppColors.background,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 8, offset: const Offset(0, 2))],
        ),
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: SizedBox(
                width: 50, height: 70,
                child: (book?.coverUrl?.isNotEmpty ?? false)
                    ? CachedNetworkImage(imageUrl: book!.coverUrl!, fit: BoxFit.cover)
                    : Container(
                        color: AppColors.primary.withOpacity(0.1),
                        child: const Icon(Icons.book, color: AppColors.primary, size: 26)),
              ),
            ),
            const SizedBox(width: 14),

            // Info
            Expanded(child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(book?.title ?? 'Unknown',
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                    maxLines: 2, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 2),
                Text(book?.authorDisplay ?? '',
                    style: const TextStyle(color: AppColors.grey500, fontSize: 12),
                    maxLines: 1, overflow: TextOverflow.ellipsis),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value:           pct.clamp(0.0, 1.0),
                  backgroundColor: AppColors.grey300,
                  valueColor:      const AlwaysStoppedAnimation(AppColors.primary),
                  minHeight:       4,
                  borderRadius:    BorderRadius.circular(2),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('${progress.percentInt}% read',
                        style: const TextStyle(fontSize: 11, color: AppColors.grey500)),
                    if (!progress.isCompleted && progress.percentComplete > 0)
                      GestureDetector(
                        onTap: onTap,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color:        AppColors.primary,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('Continue',
                              style: TextStyle(color: AppColors.white, fontSize: 11, fontWeight: FontWeight.w600)),
                        ),
                      ),
                    if (progress.isCompleted)
                      const Icon(Icons.check_circle, color: AppColors.success, size: 16),
                  ],
                ),
              ],
            )),
          ],
        ),
      ),
    );
  }
}
