import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../data/repositories/progress_repository.dart';
import '../../data/models/progress_model.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';

class MyLibraryScreen extends StatefulWidget {
  const MyLibraryScreen({super.key});

  @override
  State<MyLibraryScreen> createState() => _MyLibraryScreenState();
}

class _MyLibraryScreenState extends State<MyLibraryScreen> {
  final _repo = ProgressRepository(ApiService());
  List<ProgressModel> _progresses = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await _repo.getAllProgress();
      setState(() { _progresses = data; _isLoading = false; });
    } catch (_) {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('My Library')),
      body: _isLoading
          ? const LoadingWidget()
          : _progresses.isEmpty
              ? Center(
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    const Icon(Icons.book_outlined, size: 64, color: AppColors.grey300),
                    const SizedBox(height: 8),
                    const Text('No books yet. Start reading!', style: TextStyle(color: AppColors.grey500)),
                  ]),
                )
              : ListView.separated(
                  padding:          const EdgeInsets.all(16),
                  itemCount:        _progresses.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (_, i) {
                    final p    = _progresses[i];
                    final book = p.book;
                    return GestureDetector(
                      onTap: () => book != null ? context.push('/reader/${book.id}') : null,
                      child: Card(
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            children: [
                              // Cover
                              ClipRRect(
                                borderRadius: BorderRadius.circular(6),
                                child:        Container(width: 44, height: 60, color: AppColors.primary.withOpacity(0.1),
                                  child: const Icon(Icons.book, color: AppColors.primary, size: 24)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(book?.title ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600)),
                                  const SizedBox(height: 2),
                                  Text(book?.authorDisplay ?? '', style: const TextStyle(color: AppColors.grey500, fontSize: 12)),
                                  const SizedBox(height: 6),
                                  LinearProgressIndicator(
                                    value:            p.percentage / 100,
                                    backgroundColor:  AppColors.grey300,
                                    valueColor:       const AlwaysStoppedAnimation(AppColors.primary),
                                    minHeight:        4,
                                    borderRadius:     BorderRadius.circular(2),
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${p.percentage.toStringAsFixed(0)}% read',
                                    style: const TextStyle(fontSize: 11, color: AppColors.grey500)),
                                ],
                              )),
                              const Icon(Icons.chevron_right, color: AppColors.grey500),
                            ],
                          ),
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}
