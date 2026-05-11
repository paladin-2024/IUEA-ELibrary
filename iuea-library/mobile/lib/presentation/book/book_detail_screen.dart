import 'dart:ui';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:dio/dio.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';
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
import '../widgets/app_error_state.dart';
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
  List<BookModel>    _similar          = [];
  bool               _expanded         = false;
  bool               _downloaded       = false;
  bool               _downloading      = false;
  double             _dlProgress       = 0.0;
  bool               _borrowing        = false;
  bool               _hasActiveLoan    = false;
  List<ReviewModel>  _reviews          = [];
  ReviewModel?       _myReview;
  int                _reviewRating     = 0;
  bool               _isFavorite       = false;
  final _reviewTextCtrl = TextEditingController();
  bool               _submittingReview = false;

  final _dlService     = DownloadService();
  final _borrowingRepo = BorrowingRepository(ApiService());
  final _reviewsRepo   = ReviewsRepository(ApiService());

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
      try {
        final loans = await _borrowingRepo.getMyLoans();
        final active = loans.any((l) =>
            l.bookId == widget.bookId &&
            ['pending', 'approved', 'active'].contains(l.status));
        if (mounted) setState(() => _hasActiveLoan = active);
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
        setState(() => _hasActiveLoan = true);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Request sent! Library will notify you when approved.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        final msg = e is DioException
            ? ((e.response?.data is Map
                    ? e.response!.data['message'] as String?
                    : null) ??
                e.message ??
                'Failed to send borrow request.')
            : e.toString().replaceAll('Exception: ', '');
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(msg)),
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
      await _reviewsRepo.submitReview(
          widget.bookId, _reviewRating, _reviewTextCtrl.text);
      await _loadReviews();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Review saved!'),
              backgroundColor: AppColors.success));
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
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
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

    if (bp.isLoading) {
      return const _BookDetailSkeleton();
    }

    if (book == null) {
      return Scaffold(
        backgroundColor: AppColors.surface,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: const Icon(AppIcons.arrowBack,
                color: AppColors.textPrimary, size: 18),
            onPressed: () => context.pop(),
          ),
        ),
        body: AppErrorState(
          message: bp.error,
          onRetry: () => context.read<BookProvider>().getBook(widget.bookId),
        ),
      );
    }

    final hasFile    = book.hasFile || book.archiveId != null;
    final availability = book.availability;
    final isAvailable  = (availability?['available'] as int? ?? 0) > 0;
    final words      = (book.description ?? '').split(' ');
    final isLong     = words.length > 60;
    final descText   = isLong && !_expanded
        ? '${words.take(60).join(' ')}…'
        : (book.description ?? 'No description available.');

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: CustomScrollView(
        slivers: [
          // ── Blurred Hero SliverAppBar ──────────────────────────────────────
          SliverAppBar(
            expandedHeight: 500,
            pinned:          true,
            backgroundColor: AppColors.primaryDark,
            elevation:       0,
            leading: Padding(
              padding: const EdgeInsets.all(8),
              child: GestureDetector(
                onTap: () => context.pop(),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                    child: Container(
                      width: 36, height: 36,
                      color: Colors.white.withValues(alpha: 0.2),
                      child: const Icon(AppIcons.arrowBack,
                          color: Colors.white, size: 16),
                    ),
                  ),
                ),
              ),
            ),
            actions: [
              Padding(
                padding: const EdgeInsets.only(right: 4),
                child: GestureDetector(
                  onTap: () => setState(() => _isFavorite = !_isFavorite),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        width: 36, height: 36,
                        color: Colors.white.withValues(alpha: 0.2),
                        child: Icon(
                          _isFavorite ? AppIcons.heart : AppIcons.heartOutline,
                          color: _isFavorite ? Colors.redAccent : Colors.white,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12),
                child: GestureDetector(
                  onTap: () {},
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(20),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        width: 36, height: 36,
                        color: Colors.white.withValues(alpha: 0.2),
                        child: const Icon(AppIcons.share,
                            color: Colors.white, size: 18),
                      ),
                    ),
                  ),
                ),
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: _HeroBackground(
                book:        book,
                isAvailable: isAvailable,
              ),
            ),
          ),

          // ── Action Buttons ─────────────────────────────────────────────────
          SliverToBoxAdapter(
            child: Container(
              color:   AppColors.surface,
              padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
              child: Column(
                children: [
                  // Read Now — full width primary
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton.icon(
                      onPressed: hasFile
                          ? () => context.push('/reader/${book.id}')
                          : null,
                      icon:  const Icon(AppIcons.bookpen, size: 20),
                      label: const Text('Read Now',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w700)),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: AppColors.white,
                        elevation: 2,
                        shadowColor: AppColors.primary.withValues(alpha: 0.4),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Listen + Download — 2-column grid
                  Row(children: [
                    Expanded(
                      child: SizedBox(
                        height: 46,
                        child: OutlinedButton.icon(
                          onPressed: hasFile
                              ? () => context.push('/audio/${book.id}')
                              : null,
                          icon:  const Icon(AppIcons.headphones, size: 18),
                          label: const Text('Listen'),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(
                                color: AppColors.primary, width: 1.5),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: SizedBox(
                        height: 46,
                        child: _downloading
                            ? _DownloadProgressButton(progress: _dlProgress)
                            : OutlinedButton.icon(
                                onPressed: hasFile
                                    ? () async {
                                        final sm = ScaffoldMessenger.of(context);
                                        if (_downloaded) {
                                          await _dlService.deleteDownload(book.id);
                                          if (mounted) setState(() => _downloaded = false);
                                        } else {
                                          setState(() {
                                            _downloading = true;
                                            _dlProgress  = 0;
                                          });
                                          try {
                                            await _dlService.downloadBook(
                                              book,
                                              onProgress: (p) {
                                                if (mounted) setState(() => _dlProgress = p);
                                              },
                                            );
                                            if (mounted) {
                                              setState(() {
                                                _downloaded  = true;
                                                _downloading = false;
                                              });
                                            }
                                            sm.showSnackBar(
                                              const SnackBar(
                                                  content: Text('Saved for offline reading')));
                                          } catch (e) {
                                            if (mounted) setState(() => _downloading = false);
                                            sm.showSnackBar(
                                                SnackBar(content: Text('Download failed: $e')));
                                          }
                                        }
                                      }
                                    : null,
                                icon: Icon(
                                  _downloaded
                                      ? AppIcons.downloadDone
                                      : AppIcons.download,
                                  size: 18,
                                ),
                                label:
                                    Text(_downloaded ? 'Remove' : 'Download'),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: _downloaded
                                      ? AppColors.success
                                      : AppColors.primary,
                                  side: BorderSide(
                                    color: _downloaded
                                        ? AppColors.success
                                        : AppColors.primary,
                                    width: 1.5,
                                  ),
                                  shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(14)),
                                ),
                              ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 10),

                  // Borrow + Cite — 2-column
                  Row(children: [
                    Expanded(
                      child: SizedBox(
                        height: 46,
                        child: ElevatedButton.icon(
                          onPressed: (_borrowing || _hasActiveLoan) ? null : () => _borrow(book),
                          icon: _borrowing
                              ? const SizedBox(
                                  width: 16, height: 16,
                                  child: CircularProgressIndicator(
                                      strokeWidth: 2, color: Colors.white))
                              : Icon(_hasActiveLoan ? AppIcons.check : AppIcons.library,
                                  size: 18),
                          label: Text(
                              _borrowing ? 'Requesting…' : _hasActiveLoan ? 'Requested' : 'Borrow Physical'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryDark,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    SizedBox(
                      height: 46,
                      child: OutlinedButton.icon(
                        onPressed: () => _showCitationSheet(book),
                        icon: const Icon(AppIcons.info, size: 16),
                        label: const Text('Cite'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.tertiary,
                          side: const BorderSide(
                              color: AppColors.tertiaryFixed, width: 1.5),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                  ]),
                  const SizedBox(height: 4),
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
                indicatorWeight:      2.5,
                indicatorSize:        TabBarIndicatorSize.label,
                isScrollable:         true,
                tabAlignment:         TabAlignment.start,
                labelStyle: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   13,
                    fontWeight: FontWeight.w700),
                unselectedLabelStyle: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   13,
                    fontWeight: FontWeight.w500),
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
                      // Meta cards row
                      Row(children: [
                        if (book.pageCount != null)
                          Expanded(child: _MetaCard(
                            icon: AppIcons.bookpen,
                            label: 'Pages',
                            value: '${book.pageCount}',
                          )),
                        if (book.pageCount != null) const SizedBox(width: 10),
                        if (book.publishedYear != null)
                          Expanded(child: _MetaCard(
                            icon: AppIcons.calendar,
                            label: 'Year',
                            value: '${book.publishedYear}',
                          )),
                        if (book.publishedYear != null) const SizedBox(width: 10),
                        Expanded(child: _MetaCard(
                          icon: AppIcons.library,
                          label: 'Source',
                          value: 'IUEA',
                        )),
                      ]),
                      const SizedBox(height: 20),

                      // Description
                      Text('Description',
                        style: AppTextStyles.h3.copyWith(
                            color: AppColors.primary, fontSize: 15)),
                      const SizedBox(height: 8),
                      Text(descText,
                        style: AppTextStyles.body.copyWith(
                            height: 1.75, fontSize: 14,
                            color: AppColors.textPrimary)),
                      if (isLong)
                        TextButton(
                          onPressed: () =>
                              setState(() => _expanded = !_expanded),
                          child: Text(
                            _expanded ? 'Show less' : 'Read more',
                            style: AppTextStyles.label
                                .copyWith(color: AppColors.primary)),
                        ),

                      // Faculty tags
                      if (book.faculty.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        Text('FACULTIES',
                          style: AppTextStyles.label.copyWith(
                              letterSpacing: 1.1, fontSize: 10,
                              color: AppColors.textHint)),
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6, runSpacing: 6,
                          children: book.faculty
                              .map((f) => Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 12, vertical: 5),
                                    decoration: BoxDecoration(
                                      color:        AppColors.tertiaryFixed,
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(
                                          color: AppColors.tertiaryFixedDim)),
                                    child: Text(f,
                                      style: AppTextStyles.label.copyWith(
                                          color: AppColors.tertiary,
                                          fontWeight: FontWeight.w600)),
                                  ))
                              .toList(),
                        ),
                      ],
                    ],
                  ),
                ),

                // Reviews
                _ReviewsTab(
                  reviews:         _reviews,
                  myReview:        _myReview,
                  rating:          _reviewRating,
                  textCtrl:        _reviewTextCtrl,
                  submitting:      _submittingReview,
                  onRatingChanged: (r) => setState(() => _reviewRating = r),
                  onSubmit:        _submitReview,
                  onVote: (reviewId) async {
                    try {
                      await _reviewsRepo.voteHelpful(
                          widget.bookId, reviewId);
                      await _loadReviews();
                    } catch (_) {}
                  },
                ),

                // Podcasts placeholder
                const Center(
                  child: Text('No related podcasts yet.',
                      style: TextStyle(color: AppColors.textHint))),

                // Similar
                _similar.isEmpty
                    ? const Center(
                        child: Text('No similar books found.',
                            style: TextStyle(color: AppColors.textHint)))
                    : GridView.builder(
                        padding: const EdgeInsets.all(AppSpacing.md),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount:   3,
                                crossAxisSpacing: 10,
                                mainAxisSpacing:  10,
                                childAspectRatio: 0.6),
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
}

// ── Blurred hero background ───────────────────────────────────────────────────
class _HeroBackground extends StatelessWidget {
  final BookModel book;
  final bool      isAvailable;
  const _HeroBackground({required this.book, required this.isAvailable});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Blurred background fill
        book.hasCover
            ? ImageFiltered(
                imageFilter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
                child: CachedNetworkImage(
                  imageUrl:    book.coverUrl ?? '',
                  fit:         BoxFit.cover,
                  errorWidget: (_, __, ___) => Container(
                      color: AppColors.primaryDark),
                ),
              )
            : Container(color: AppColors.primaryDark),

        // Dark gradient overlay — bottom fades to surface
        Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end:   Alignment.bottomCenter,
              stops: [0.0, 0.45, 0.85, 1.0],
              colors: [
                Color(0xCC000000),
                Color(0x88000000),
                Color(0x33000000),
                Colors.transparent,
              ],
            ),
          ),
        ),

        // Content: floating cover card + title + meta
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 72, 20, 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Floating cover card
              Stack(
                alignment: Alignment.bottomCenter,
                children: [
                  // Drop shadow glow
                  Container(
                    width:  136, height: 8,
                    margin: const EdgeInsets.only(top: 200),
                    decoration: BoxDecoration(
                      color:        Colors.black.withValues(alpha: 0.35),
                      borderRadius: BorderRadius.circular(50),
                      boxShadow: [
                        BoxShadow(
                          color:      Colors.black.withValues(alpha: 0.35),
                          blurRadius: 20,
                          spreadRadius: 4,
                        )
                      ],
                    ),
                  ),
                  // Book cover
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Container(
                      width: 148,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color:      Colors.black.withValues(alpha: 0.5),
                            blurRadius: 30,
                            offset:     const Offset(0, 12),
                          ),
                        ],
                      ),
                      child: AspectRatio(
                        aspectRatio: 2 / 3,
                        child: book.hasCover
                            ? CachedNetworkImage(
                                imageUrl:    book.coverUrl!,
                                fit:         BoxFit.cover,
                                errorWidget: (_, __, ___) =>
                                    _coverPlaceholder(),
                              )
                            : _coverPlaceholder(),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              // Title
              Text(
                book.title,
                textAlign: TextAlign.center,
                maxLines:  2,
                overflow:  TextOverflow.ellipsis,
                style: const TextStyle(
                  fontFamily: 'Newsreader',
                  color:      Colors.white,
                  fontSize:   22,
                  fontWeight: FontWeight.w700,
                  height:     1.2,
                  shadows: [Shadow(blurRadius: 8, color: Color(0x88000000))],
                ),
              ),
              const SizedBox(height: 6),

              // Author
              Text(
                book.author,
                style: TextStyle(
                  color:    Colors.white.withValues(alpha: 0.85),
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  shadows: const [Shadow(blurRadius: 6, color: Color(0x66000000))],
                ),
              ),
              const SizedBox(height: 14),

              // Rating row + availability badge
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Stars
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: List.generate(5, (i) => Icon(
                      i < book.rating.floor()
                          ? AppIcons.star
                          : AppIcons.starOutline,
                      size:  15,
                      color: AppColors.tertiaryContainer,
                    )),
                  ),
                  const SizedBox(width: 6),
                  Text(
                    '${book.rating.toStringAsFixed(1)} (${book.ratingCount})',
                    style: TextStyle(
                      color:    Colors.white.withValues(alpha: 0.9),
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(width: 10),
                  // Availability badge
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: (isAvailable
                              ? AppColors.success
                              : AppColors.warning)
                          .withValues(alpha: 0.9),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(
                        isAvailable
                            ? AppIcons.checkCircle
                            : AppIcons.clock,
                        size:  11,
                        color: Colors.white,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        isAvailable ? 'Available' : 'Checked Out',
                        style: const TextStyle(
                            color:      Colors.white,
                            fontSize:   11,
                            fontWeight: FontWeight.w700),
                      ),
                    ]),
                  ),
                ],
              ),

              // Language chips
              if (book.languages.isNotEmpty) ...[
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6, runSpacing: 4,
                  alignment: WrapAlignment.center,
                  children: book.languages.take(4).map((lang) => Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color:        Colors.white.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.4)),
                    ),
                    child: Text(lang,
                      style: const TextStyle(
                          color:      Colors.white,
                          fontSize:   11,
                          fontWeight: FontWeight.w500)),
                  )).toList(),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _coverPlaceholder() => Container(
    color: AppColors.primaryDark,
    child: const Center(
        child: Icon(AppIcons.book, size: 48, color: Colors.white54)),
  );
}

// ── Download progress inline button ──────────────────────────────────────────
class _DownloadProgressButton extends StatelessWidget {
  final double progress;
  const _DownloadProgressButton({required this.progress});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        border:       Border.all(color: AppColors.primary.withValues(alpha: 0.4)),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Row(children: [
        SizedBox(
          width: 14, height: 14,
          child: CircularProgressIndicator(
            value:       progress,
            strokeWidth: 2,
            color:       AppColors.primary,
          ),
        ),
        const SizedBox(width: 8),
        Text('${(progress * 100).toInt()}%',
          style: AppTextStyles.label.copyWith(
              color: AppColors.primary, fontSize: 12)),
      ]),
    );
  }
}

// ── Meta info card (pages / year / source) ────────────────────────────────────
class _MetaCard extends StatelessWidget {
  final IconData icon;
  final String   label;
  final String   value;
  const _MetaCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(14),
        border:       Border.all(color: AppColors.outlineVariant),
      ),
      child: Column(
        children: [
          Icon(icon, size: 22, color: AppColors.primary),
          const SizedBox(height: 6),
          Text(label,
            style: AppTextStyles.label.copyWith(
                color: AppColors.textHint, fontSize: 10)),
          const SizedBox(height: 2),
          Text(value,
            style: AppTextStyles.body.copyWith(
                fontWeight: FontWeight.w700,
                fontSize:   13,
                color:      AppColors.textPrimary),
          ),
        ],
      ),
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
          Text(myReview == null ? 'Write a Review' : 'Your Review',
            style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          Row(
            children: List.generate(5, (i) => GestureDetector(
              onTap: () => onRatingChanged(i + 1),
              child: Padding(
                padding: const EdgeInsets.only(right: 4),
                child: Icon(
                  i < rating ? AppIcons.star : AppIcons.starOutline,
                  size: 30, color: AppColors.accent),
              ),
            )),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: textCtrl,
            maxLines:   3,
            decoration: InputDecoration(
              hintText:       'Share your thoughts (optional)…',
              hintStyle:      AppTextStyles.label.copyWith(
                  color: AppColors.textHint),
              filled:         true,
              fillColor:      AppColors.surfaceContainerLow,
              border:         OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide:   BorderSide.none),
              contentPadding: const EdgeInsets.all(12),
            ),
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: submitting || rating == 0 ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
              child: submitting
                  ? const SizedBox(
                      width: 16, height: 16,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white))
                  : Text(myReview == null ? 'Submit Review' : 'Update Review'),
            ),
          ),
          if (reviews.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              '${reviews.length} Review${reviews.length != 1 ? "s" : ""}',
              style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            ...reviews.map((r) => _ReviewCard(review: r, onVote: onVote)),
          ] else ...[
            const SizedBox(height: 28),
            Center(
              child: Text('No reviews yet. Be the first!',
                style: AppTextStyles.label.copyWith(
                    color: AppColors.textHint))),
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
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color:     Colors.black.withValues(alpha: 0.04),
            blurRadius: 8,
            offset:    const Offset(0, 2),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            CircleAvatar(
              radius:          18,
              backgroundColor: AppColors.primary.withValues(alpha: 0.12),
              backgroundImage: review.userAvatar != null
                  ? NetworkImage(review.userAvatar!)
                  : null,
              child: review.userAvatar == null
                  ? Text(
                      (review.userName?.isNotEmpty ?? false)
                          ? review.userName![0].toUpperCase()
                          : '?',
                      style: AppTextStyles.label.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700))
                  : null,
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(children: [
                      Text(review.userName ?? 'Anonymous',
                        style: AppTextStyles.label
                            .copyWith(fontWeight: FontWeight.w700)),
                      if (review.isVerified) ...[
                        const SizedBox(width: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4)),
                          child: Text('Verified',
                            style: AppTextStyles.label.copyWith(
                                color: AppColors.primary,
                                fontSize: 9,
                                fontWeight: FontWeight.w700)),
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
                i < review.rating
                    ? AppIcons.star
                    : AppIcons.starOutline,
                size: 13, color: AppColors.accent)),
            ),
          ]),
          if (review.text != null && review.text!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(review.text!,
              style: AppTextStyles.body.copyWith(
                  fontSize: 13, color: AppColors.textPrimary, height: 1.5)),
          ],
          const SizedBox(height: 10),
          GestureDetector(
            onTap: () => onVote(review.id),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              const Icon(AppIcons.thumbUp,
                  size: 14, color: AppColors.textSecondary),
              const SizedBox(width: 4),
              Text('${review.helpfulCount} helpful',
                style: AppTextStyles.label.copyWith(
                    color: AppColors.textSecondary)),
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
        return '$author. $title. $year.';
      case 'Chicago':
        return '$author. $title. $year.';
      case 'Harvard':
        return '$author ($year) $title.';
      case 'BibTeX':
        final key =
            author.split(' ').last.toLowerCase() + year.toString();
        return '@book{$key,\n  author={$author},\n  title={$title},\n  year={$year}\n}';
      default:
        return '$author ($year). $title.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final text = _citation(widget.book);
    return Padding(
      padding: EdgeInsets.only(
        left:   16, right: 16, top: 20,
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
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _formats.map((f) {
                final active = _format == f;
                return GestureDetector(
                  onTap: () => setState(() => _format = f),
                  child: Container(
                    margin:  const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                        horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.primary
                          : AppColors.surfaceContainerLow,
                      borderRadius: BorderRadius.circular(999)),
                    child: Text(f,
                      style: AppTextStyles.label.copyWith(
                        color: active
                            ? AppColors.white
                            : AppColors.textSecondary,
                        fontWeight: FontWeight.w600)),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            width:   double.infinity,
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color:        AppColors.surfaceContainerLow,
              borderRadius: BorderRadius.circular(12),
              border:       Border.all(color: AppColors.outlineVariant),
            ),
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
              icon:  const Icon(AppIcons.copy, size: 16),
              label: const Text('Copy Citation'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12))),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Book detail skeleton ──────────────────────────────────────────────────────
class _BookDetailSkeleton extends StatelessWidget {
  const _BookDetailSkeleton();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.surface,
      body: Shimmer.fromColors(
        baseColor:      AppColors.grey300,
        highlightColor: const Color(0xFFF5F5F5),
        child: SingleChildScrollView(
          physics: const NeverScrollableScrollPhysics(),
          child: Column(children: [
            // Hero area
            Container(
              height: 500,
              color: Colors.white,
            ),
            const SizedBox(height: 20),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Column(children: [
                // Primary button
                Container(height: 52, decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14))),
                const SizedBox(height: 10),
                // Secondary buttons row
                Row(children: [
                  Expanded(child: Container(height: 46, decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14)))),
                  const SizedBox(width: 10),
                  Expanded(child: Container(height: 46, decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14)))),
                ]),
                const SizedBox(height: 10),
                Row(children: [
                  Expanded(child: Container(height: 46, decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14)))),
                  const SizedBox(width: 10),
                  Container(width: 90, height: 46, decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14))),
                ]),
                const SizedBox(height: 24),
                // Tab bar placeholder
                Container(height: 44, decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8))),
                const SizedBox(height: 20),
                // Text lines
                Container(height: 14, width: double.infinity,
                  decoration: BoxDecoration(color: Colors.white,
                    borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 8),
                Container(height: 14, width: double.infinity,
                  decoration: BoxDecoration(color: Colors.white,
                    borderRadius: BorderRadius.circular(6))),
                const SizedBox(height: 8),
                Container(height: 14, width: MediaQuery.sizeOf(context).width * 0.6,
                  decoration: BoxDecoration(color: Colors.white,
                    borderRadius: BorderRadius.circular(6))),
              ]),
            ),
          ]),
        ),
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
  Widget build(
      BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: AppColors.surface,
      child: tabBar,
    );
  }

  @override
  bool shouldRebuild(_TabBarDelegate old) => false;
}
