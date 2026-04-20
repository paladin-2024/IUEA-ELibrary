import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../providers/book_provider.dart';
import '../../data/models/book_model.dart';
import '../../data/models/review_model.dart';
import '../../data/services/download_service.dart';
import '../../data/repositories/borrowing_repository.dart';
import '../../data/repositories/reviews_repository.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_spacing.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/book_card.dart';

class BookDetailScreen extends StatefulWidget {
  final String bookId;
  const BookDetailScreen({super.key, required this.bookId});

  @override
  State<BookDetailScreen> createState() => _BookDetailScreenState();
}

class _BookDetailScreenState extends State<BookDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  List<BookModel>    _similar      = [];
  bool               _expanded     = false;
  bool               _downloaded   = false;
  bool               _downloading  = false;
  double             _dlProgress   = 0.0;
  bool               _borrowing    = false;
  List<ReviewModel>  _reviews      = [];
  ReviewModel?       _myReview;
  int                _reviewRating = 0;
  final _reviewTextCtrl = TextEditingController();
  bool               _submittingReview = false;

  final _dlService      = DownloadService();
  final _borrowingRepo  = BorrowingRepository(ApiService());
  final _reviewsRepo    = ReviewsRepository(ApiService());

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 4, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final bp = context.read<BookProvider>();
      await bp.getBook(widget.bookId);
      final dl = await _dlService.isDownloaded(widget.bookId);
      if (mounted) setState(() => _downloaded = dl);
      try {
        final sims = await bp.getSimilarBooks(widget.bookId);
        if (mounted) setState(() => _similar = sims);
      } catch (_) {}
      _loadReviews();
    });
  }

  Future<void> _loadReviews() async {
    try {
      final reviews  = await _reviewsRepo.getBookReviews(widget.bookId);
      final myReview = await _reviewsRepo.getMyReview(widget.bookId);
      if (mounted) {
        setState(() { _reviews = reviews; _myReview = myReview; });
        if (myReview != null) {
          _reviewRating = myReview.rating;
          _reviewTextCtrl.text = myReview.text ?? '';
        }
      }
    } catch (_) {}
  }

  Future<void> _borrow(BookModel book) async {
    setState(() => _borrowing = true);
    try {
      await _borrowingRepo.requestBorrow(book.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Request sent! Library will notify you when approved.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString().replaceAll('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => _borrowing = false);
    }
  }

  Future<void> _submitReview() async {
    if (_reviewRating == 0) return;
    setState(() => _submittingReview = true);
    try {
      await _reviewsRepo.submitReview(widget.bookId, _reviewRating, _reviewTextCtrl.text);
      await _loadReviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Review saved!'), backgroundColor: AppColors.success));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not save review.')));
      }
    } finally {
      if (mounted) setState(() => _submittingReview = false);
    }
  }

  void _showCitationSheet(BookModel book) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => _CitationSheet(book: book),
    );
  }

  @override
  void dispose() {
    _tabs.dispose();
    _reviewTextCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bp   = context.watch<BookProvider>();
    final book = bp.current;

    if (bp.isLoading || book == null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation:       0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded,
              color: AppColors.textPrimary, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final hasFile     = book.hasFile || book.archiveId != null;
    final availability = book.availability;
    final isAvailable  = (availability?['available'] as int? ?? 0) > 0;
    final words       = (book.description ?? '').split(' ');
    final isLong      = words.length > 60;
    final descText    = isLong && !_expanded
        ? '${words.take(60).join(' ')}…'
        : (book.description ?? 'No description available.');

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Cover SliverAppBar ─────────────────────────────────────────────
          SliverAppBar(
            expandedHeight:  320,
            pinned:          true,
            backgroundColor: AppColors.primaryDark,
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded,
                color: AppColors.white, size: 18),
              onPressed: () => context.pop(),
            ),
            actions: const [],
            flexibleSpace: FlexibleSpaceBar(
              background: book.hasCover
                ? CachedNetworkImage(
                    imageUrl:    book.coverUrl!,
                    fit:         BoxFit.cover,
                    errorWidget: (_, __, ___) => _coverPlaceholder())
                : _coverPlaceholder(),
            ),
          ),

          // ── Body ───────────────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color:   AppColors.white,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title
                  Text(book.title,
                    style: AppTextStyles.h2.copyWith(
                      fontSize: 20, color: AppColors.textPrimary)),
                  const SizedBox(height: 6),

                  // Author
                  GestureDetector(
                    onTap: () {},
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.person_outline_rounded,
                        size: 14, color: AppColors.primary),
                      const SizedBox(width: 4),
                      Text(book.author,
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.primary, fontSize: 14)),
                    ]),
                  ),
                  const SizedBox(height: 10),

                  // Rating + availability
                  Row(children: [
                    // Stars
                    Row(mainAxisSize: MainAxisSize.min,
                      children: List.generate(5, (i) => Icon(
                        i < (book.rating).floor()
                          ? Icons.star_rounded
                          : Icons.star_outline_rounded,
                        size: 16,
                        color: AppColors.accent))),
                    const SizedBox(width: 6),
                    Text(
                      '${book.rating.toStringAsFixed(1)} (${book.ratingCount} reviews)',
                      style: AppTextStyles.label.copyWith(
                        color: AppColors.textSecondary)),
                    const Spacer(),
                    if (availability != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color:        (isAvailable ? AppColors.success : AppColors.warning)
                              .withOpacity(0.1),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: (isAvailable ? AppColors.success : AppColors.warning)
                                .withOpacity(0.3))),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Icon(
                            isAvailable
                              ? Icons.check_circle_outline_rounded
                              : Icons.warning_amber_outlined,
                            size: 12,
                            color: isAvailable ? AppColors.success : AppColors.warning),
                          const SizedBox(width: 4),
                          Text(
                            isAvailable ? 'Available' : 'Checked out',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 11,
                              color: isAvailable ? AppColors.success : AppColors.warning)),
                        ]),
                      ),
                  ]),
                  const SizedBox(height: 12),

                  // Language chips
                  if (book.languages.isNotEmpty)
                    Wrap(
                      spacing: 6, runSpacing: 4,
                      children: [
                        Text(
                          'Available in ${book.languages.length} language${book.languages.length != 1 ? 's' : ''}',
                          style: AppTextStyles.label.copyWith(
                            color: AppColors.textSecondary, fontSize: 11)),
                        ...book.languages.take(3).map((lang) =>
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color:        AppColors.primary,
                              borderRadius: BorderRadius.circular(20)),
                            child: Text(lang,
                              style: TextStyle(fontFamily: 'Inter', 
                                color: AppColors.white, fontSize: 10,
                                fontWeight: FontWeight.w500)))),
                      ],
                    ),
                  const SizedBox(height: 20),

                  // CTA buttons
                  Row(children: [
                    Expanded(
                      flex: 3,
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: hasFile
                            ? () => context.push('/reader/${book.id}')
                            : null,
                          icon:  const Icon(Icons.menu_book_rounded, size: 18),
                          label: const Text('Read Now'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryContainer,
                            foregroundColor: AppColors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          onPressed: hasFile
                            ? () => context.push('/audio/${book.id}')
                            : null,
                          icon:  const Icon(Icons.headphones_rounded, size: 18),
                          label: const Text('Listen'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10))),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 10),

                  // Download / offline button
                  if (hasFile)
                    _downloading
                      ? Column(children: [
                          LinearProgressIndicator(
                            value:           _dlProgress,
                            backgroundColor: AppColors.grey300,
                            valueColor: const AlwaysStoppedAnimation(AppColors.primary),
                            minHeight:    4,
                            borderRadius: BorderRadius.circular(2)),
                          const SizedBox(height: 4),
                          Text(
                            '${(_dlProgress * 100).toInt()}% downloading…',
                            style: AppTextStyles.label.copyWith(
                              fontSize: 11, color: AppColors.textHint)),
                        ])
                      : SizedBox(
                          width: double.infinity,
                          height: 44,
                          child: OutlinedButton.icon(
                            onPressed: _downloaded
                              ? () async {
                                  await _dlService.deleteDownload(book.id);
                                  if (mounted) setState(() => _downloaded = false);
                                }
                              : () async {
                                  setState(() { _downloading = true; _dlProgress = 0; });
                                  try {
                                    await _dlService.downloadBook(
                                      book,
                                      onProgress: (p) {
                                        if (mounted) setState(() => _dlProgress = p);
                                      },
                                    );
                                    if (mounted) setState(() { _downloaded = true; _downloading = false; });
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      const SnackBar(content: Text('Saved for offline reading')));
                                  } catch (e) {
                                    if (mounted) setState(() => _downloading = false);
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Download failed: $e')));
                                  }
                                },
                            icon: Icon(
                              _downloaded
                                ? Icons.download_done_rounded
                                : Icons.download_outlined,
                              size: 18),
                            label: Text(_downloaded ? 'Remove Offline Copy' : 'Download for Offline'),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: _downloaded
                                ? AppColors.success : AppColors.primary,
                              side: BorderSide(
                                color: _downloaded ? AppColors.success : AppColors.border),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10))),
                          ),
                        ),
                  // Borrow physical copy button
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: _borrowing ? null : () => _borrow(book),
                      icon: _borrowing
                        ? const SizedBox(width: 16, height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.local_library_rounded, size: 18),
                      label: Text(_borrowing ? 'Requesting…' : 'Borrow Physical Copy'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryDark,
                        foregroundColor: Colors.white,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Cite this book
                  SizedBox(
                    width: double.infinity,
                    height: 40,
                    child: OutlinedButton.icon(
                      onPressed: () => _showCitationSheet(book),
                      icon: const Icon(Icons.format_quote_rounded, size: 16),
                      label: const Text('Cite this Book'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.primary,
                        side: const BorderSide(color: AppColors.border),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
              ),
            ),
          ),

          // ── Tab bar ────────────────────────────────────────────────────────
          SliverPersistentHeader(
            pinned: true,
            delegate: _TabBarDelegate(
              TabBar(
                controller:           _tabs,
                labelColor:           AppColors.primary,
                unselectedLabelColor: AppColors.textSecondary,
                indicatorColor:       AppColors.primary,
                indicatorWeight:      2,
                isScrollable:         true,
                labelStyle: TextStyle(fontFamily: 'Inter', fontSize: 13, fontWeight: FontWeight.w600),
                tabs: const [
                  Tab(text: 'About'),
                  Tab(text: 'Reviews'),
                  Tab(text: 'Podcasts'),
                  Tab(text: 'Similar'),
                ],
              ),
            ),
          ),

          // ── Tab content ────────────────────────────────────────────────────
          SliverFillRemaining(
            child: TabBarView(
              controller: _tabs,
              children: [
                // About
                SingleChildScrollView(
                  padding: const EdgeInsets.all(AppSpacing.pagePadding),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(descText, style: AppTextStyles.body.copyWith(
                        height: 1.7, fontSize: 14,
                        color: AppColors.textPrimary)),
                      if (isLong)
                        TextButton(
                          onPressed: () =>
                            setState(() => _expanded = !_expanded),
                          child: Text(
                            _expanded ? 'Show less' : 'Read more',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.primary)),
                        ),
                      if (book.faculty.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Text('FACULTIES',
                          style: AppTextStyles.label.copyWith(
                            letterSpacing: 1.1, fontSize: 10,
                            color: AppColors.textHint)),
                        const SizedBox(height: 6),
                        Wrap(spacing: 6, runSpacing: 4,
                          children: book.faculty.map((f) => Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              border: Border.all(color: AppColors.accent),
                              borderRadius: BorderRadius.circular(20)),
                            child: Text(f,
                              style: AppTextStyles.label.copyWith(
                                color: AppColors.accent)))).toList()),
                      ],
                      const SizedBox(height: 16),
                      // Meta
                      if (book.pageCount != null)
                        _MetaRow(label: 'Pages', value: '${book.pageCount}'),
                      if (book.publishedYear != null)
                        _MetaRow(label: 'Published', value: '${book.publishedYear}'),
                      _MetaRow(label: 'Source', value: 'IUEA Koha Catalogue'),
                    ],
                  ),
                ),

                // Reviews
                _ReviewsTab(
                  reviews:          _reviews,
                  myReview:         _myReview,
                  rating:           _reviewRating,
                  textCtrl:         _reviewTextCtrl,
                  submitting:       _submittingReview,
                  onRatingChanged:  (r) => setState(() => _reviewRating = r),
                  onSubmit:         _submitReview,
                  onVote:           (reviewId) async {
                    try {
                      await _reviewsRepo.voteHelpful(widget.bookId, reviewId);
                      await _loadReviews();
                    } catch (_) {}
                  },
                ),

                // Podcasts tab - placeholder
                const Center(
                  child: Text('No related podcasts yet.',
                    style: TextStyle(color: AppColors.textHint))),

                // Similar
                _similar.isEmpty
                  ? const Center(child: Text('No similar books found.',
                      style: TextStyle(color: AppColors.textHint)))
                  : GridView.builder(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount:   2,
                          crossAxisSpacing: 10,
                          mainAxisSpacing:  10,
                          childAspectRatio: 0.65),
                      itemCount:   _similar.length,
                      itemBuilder: (_, i) => BookCard(book: _similar[i]),
                    ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _coverPlaceholder() => Container(
    color: AppColors.primaryDark,
    child: const Center(child: Icon(Icons.book_outlined,
      size: 64, color: AppColors.white)));
}

class _MetaRow extends StatelessWidget {
  final String label;
  final String value;
  const _MetaRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(children: [
        SizedBox(
          width: 90,
          child: Text(label, style: AppTextStyles.label.copyWith(
            color: AppColors.textHint))),
        Text(value, style: AppTextStyles.body.copyWith(
          fontSize: 13, color: AppColors.textSecondary)),
      ]),
    );
  }
}

// ── Reviews Tab ────────────────────────────────────────────────────────────────
class _ReviewsTab extends StatelessWidget {
  final List<ReviewModel>  reviews;
  final ReviewModel?       myReview;
  final int                rating;
  final TextEditingController textCtrl;
  final bool               submitting;
  final void Function(int) onRatingChanged;
  final VoidCallback       onSubmit;
  final void Function(String) onVote;

  const _ReviewsTab({
    required this.reviews,
    required this.myReview,
    required this.rating,
    required this.textCtrl,
    required this.submitting,
    required this.onRatingChanged,
    required this.onSubmit,
    required this.onVote,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Write / edit review
          Text(myReview == null ? 'Write a Review' : 'Your Review',
            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) => GestureDetector(
              onTap: () => onRatingChanged(i + 1),
              child: Icon(
                i < rating ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 28, color: AppColors.accent),
            )),
          ),
          const SizedBox(height: 8),
          TextField(
            controller:  textCtrl,
            maxLines:    3,
            decoration: InputDecoration(
              hintText:    'Share your thoughts (optional)…',
              hintStyle:   AppTextStyles.label.copyWith(color: AppColors.textHint),
              filled:      true,
              fillColor:   AppColors.grey100,
              border:      OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide:   BorderSide.none),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: submitting || rating == 0 ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: submitting
                ? const SizedBox(width: 16, height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text(myReview == null ? 'Submit Review' : 'Update Review'),
            ),
          ),

          if (reviews.isNotEmpty) ...[
            const SizedBox(height: 20),
            Text('${reviews.length} Review${reviews.length != 1 ? "s" : ""}',
              style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 10),
            ...reviews.map((r) => _ReviewCard(review: r, onVote: onVote)),
          ] else ...[
            const SizedBox(height: 24),
            Center(child: Text('No reviews yet. Be the first!',
              style: AppTextStyles.label.copyWith(color: AppColors.textHint))),
          ],
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final ReviewModel        review;
  final void Function(String) onVote;
  const _ReviewCard({required this.review, required this.onVote});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin:  const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0,2))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            CircleAvatar(
              radius: 16,
              backgroundColor: AppColors.primary.withOpacity(0.15),
              backgroundImage: review.userAvatar != null
                ? NetworkImage(review.userAvatar!) : null,
              child: review.userAvatar == null
                ? Text((review.userName?.isNotEmpty ?? false) ? review.userName![0].toUpperCase() : '?',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.primary, fontWeight: FontWeight.w700))
                : null,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Text(review.userName ?? 'Anonymous',
                    style: AppTextStyles.label.copyWith(fontWeight: FontWeight.w700)),
                  if (review.isVerified) ...[
                    const SizedBox(width: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                      decoration: BoxDecoration(
                        color:        AppColors.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(4)),
                      child: Text('Verified',
                        style: AppTextStyles.label.copyWith(
                          color: AppColors.primary, fontSize: 9, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ]),
                if (review.userFaculty != null)
                  Text(review.userFaculty!,
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.textHint, fontSize: 11)),
              ]),
            ),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (i) => Icon(
                i < review.rating ? Icons.star_rounded : Icons.star_outline_rounded,
                size: 12, color: AppColors.accent)),
            ),
          ]),
          if (review.text != null && review.text!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(review.text!,
              style: AppTextStyles.body.copyWith(fontSize: 13, color: AppColors.textPrimary)),
          ],
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => onVote(review.id),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(Icons.thumb_up_outlined, size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text('${review.helpfulCount} helpful',
                style: AppTextStyles.label.copyWith(color: AppColors.textSecondary)),
            ]),
          ),
        ],
      ),
    );
  }
}

// ── Citation Sheet ─────────────────────────────────────────────────────────────
class _CitationSheet extends StatefulWidget {
  final BookModel book;
  const _CitationSheet({required this.book});

  @override
  State<_CitationSheet> createState() => _CitationSheetState();
}

class _CitationSheetState extends State<_CitationSheet> {
  String _format = 'APA';
  static const _formats = ['APA', 'MLA', 'Chicago', 'Harvard', 'BibTeX'];

  String _citation(BookModel b) {
    final year   = b.publishedYear ?? 'n.d.';
    final author = b.author;
    final title  = b.title;

    switch (_format) {
      case 'MLA':
        return '$author. ${title.contains(':') ? title : title}. $year.';
      case 'Chicago':
        return '$author. $title. $year.';
      case 'Harvard':
        return '$author ($year) $title.';
      case 'BibTeX':
        final key = author.split(' ').last.toLowerCase() + year.toString();
        return '@book{$key,\n  author={$author},\n  title={$title},\n  year={$year}\n}';
      default: // APA
        return '$author ($year). $title.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = _citation(widget.book);
    return Padding(
      padding: EdgeInsets.only(
        left: 16, right: 16, top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: AppColors.grey300,
                borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 16),
          Text('Cite this Book',
            style: AppTextStyles.h2.copyWith(fontSize: 18)),
          const SizedBox(height: 12),

          // Format chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _formats.map((f) {
                final active = _format == f;
                return GestureDetector(
                  onTap: () => setState(() => _format = f),
                  child: Container(
                    margin:  const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color:        active ? AppColors.primary : AppColors.grey100,
                      borderRadius: BorderRadius.circular(999)),
                    child: Text(f,
                      style: AppTextStyles.label.copyWith(
                        color: active ? AppColors.white : AppColors.textSecondary,
                        fontWeight: FontWeight.w600)),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),

          // Citation text
          Container(
            width:   double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color:        AppColors.grey100,
              borderRadius: BorderRadius.circular(10)),
            child: Text(text,
              style: AppTextStyles.body.copyWith(
                fontSize: 13, color: AppColors.textPrimary, height: 1.6)),
          ),
          const SizedBox(height: 12),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {
                Clipboard.setData(ClipboardData(text: text));
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Citation copied!')));
              },
              icon:  const Icon(Icons.copy_rounded, size: 16),
              label: const Text('Copy Citation'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            ),
          ),
        ],
      ),
    );
  }
}

class _TabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  const _TabBarDelegate(this.tabBar);

  @override double get minExtent => tabBar.preferredSize.height;
  @override double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.white,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate old) => false;
}
