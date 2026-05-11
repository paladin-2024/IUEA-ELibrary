import 'package:flutter/material.dart';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/podcast_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/app_text_styles.dart';
import '../widgets/app_error_state.dart';
import '../widgets/loading_widget.dart';

class PodcastsHomeScreen extends StatefulWidget {
  const PodcastsHomeScreen({super.key});

  @override
  State<PodcastsHomeScreen> createState() => _PodcastsHomeScreenState();
}

class _PodcastsHomeScreenState extends State<PodcastsHomeScreen>
    with WidgetsBindingObserver {
  String  _category    = 'All';
  bool    _searching   = false;
  String  _searchQuery = '';
  final   _searchCtrl  = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final p = context.read<PodcastProvider>();
      p.loadPodcasts();
      p.loadSubscriptions();
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      context.read<PodcastProvider>().loadPodcasts();
    }
  }

  void _toggleSearch() {
    setState(() {
      _searching = !_searching;
      if (!_searching) {
        _searchQuery = '';
        _searchCtrl.clear();
      }
    });
  }

  void _applyCategory(String cat) {
    setState(() => _category = cat);
    context.read<PodcastProvider>().loadPodcasts(
      category: cat == 'All' ? null : cat);
  }

  @override
  Widget build(BuildContext context) {
    final provider  = context.watch<PodcastProvider>();
    final user      = context.watch<AuthProvider>().user;

    // When searching, filter the full list; otherwise use normal layout data
    final allPodcasts = provider.podcasts;
    final filtered    = _searchQuery.isEmpty
        ? allPodcasts
        : allPodcasts.where((p) {
            final q = _searchQuery.toLowerCase();
            return p.title.toLowerCase().contains(q) ||
                   p.author.toLowerCase().contains(q);
          }).toList();

    final featured       = !_searching && allPodcasts.isNotEmpty ? allPodcasts.first : null;
    final popular        = !_searching && allPodcasts.length > 1
        ? allPodcasts.sublist(1) : <dynamic>[];
    final recentlyPlayed = provider.subscriptions;

    return Scaffold(
      backgroundColor: AppColors.surface,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // ── App bar ─────────────────────────────────────────────────────
            SliverToBoxAdapter(
              child: Column(children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 16, 0),
                  child: Row(children: [
                    Text('Podcasts',
                      style: AppTextStyles.h2.copyWith(
                        fontSize: 20, color: AppColors.textPrimary)),
                    const Spacer(),
                    IconButton(
                      icon: Icon(
                        _searching ? AppIcons.close : AppIcons.search,
                        color: _searching ? AppColors.primary : AppColors.textPrimary,
                        size: 22),
                      onPressed: _toggleSearch,
                      tooltip: _searching ? 'Close search' : 'Search podcasts',
                    ),
                    IconButton(
                      icon: const Icon(AppIcons.notification,
                        color: AppColors.textPrimary, size: 22),
                      onPressed: () => context.push('/notifications'),
                    ),
                    CircleAvatar(
                      radius:          16,
                      backgroundColor: AppColors.primaryContainer,
                      backgroundImage: user?.avatar != null
                          ? NetworkImage(user!.avatar!) : null,
                      child: user?.avatar == null
                          ? Text(user?.initials ?? '?',
                              style: const TextStyle(
                                color: AppColors.white, fontSize: 11,
                                fontWeight: FontWeight.w700))
                          : null,
                    ),
                    const SizedBox(width: 4),
                  ]),
                ),
                // ── Inline search bar (slides in/out) ──────────────────────
                AnimatedSize(
                  duration: const Duration(milliseconds: 200),
                  curve:    Curves.easeInOut,
                  child: _searching
                    ? Padding(
                        padding: const EdgeInsets.fromLTRB(16, 10, 16, 0),
                        child: TextField(
                          controller:  _searchCtrl,
                          autofocus:   true,
                          onChanged:   (v) => setState(() => _searchQuery = v),
                          style: AppTextStyles.body.copyWith(
                            fontSize: 14, color: AppColors.textPrimary),
                          decoration: InputDecoration(
                            hintText:  'Search podcasts & shows…',
                            hintStyle: AppTextStyles.label.copyWith(
                              color: AppColors.textHint),
                            prefixIcon: const Icon(AppIcons.search,
                              color: AppColors.textHint, size: 20),
                            suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(AppIcons.close,
                                    size: 18, color: AppColors.textHint),
                                  onPressed: () => setState(() {
                                    _searchQuery = '';
                                    _searchCtrl.clear();
                                  }),
                                )
                              : null,
                            filled:      true,
                            fillColor:   AppColors.white,
                            isDense:     true,
                            contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: AppColors.border)),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(12),
                              borderSide: const BorderSide(
                                color: AppColors.primary, width: 1.5)),
                          ),
                        ),
                      )
                    : const SizedBox.shrink(),
                ),
              ]),
            ),

            if (provider.isLoading)
              const SliverFillRemaining(child: LoadingWidget())
            else if (provider.error != null && provider.podcasts.isEmpty)
              SliverFillRemaining(
                child: AppErrorState(
                  icon: AppIcons.mic,
                  message: provider.error,
                  onRetry: () {
                    context.read<PodcastProvider>().loadPodcasts();
                    context.read<PodcastProvider>().loadSubscriptions();
                  },
                ),
              )

            // ── Search results ───────────────────────────────────────────
            else if (_searching) ...[
              if (filtered.isEmpty)
                SliverFillRemaining(
                  child: Center(child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(AppIcons.searchOff,
                        size: 52, color: AppColors.grey300),
                      const SizedBox(height: 8),
                      Text('No results for "$_searchQuery"',
                        style: AppTextStyles.bodySmall.copyWith(
                          color: AppColors.grey500)),
                    ],
                  )),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) {
                        final p = filtered[i];
                        return GestureDetector(
                          onTap: () => context.push('/podcasts/${p.id}'),
                          child: Container(
                            margin: const EdgeInsets.only(bottom: 10),
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color:        AppColors.white,
                              borderRadius: BorderRadius.circular(12),
                              boxShadow: [BoxShadow(
                                color: Colors.black.withValues(alpha: 0.04),
                                blurRadius: 8, offset: const Offset(0, 2))],
                            ),
                            child: Row(children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: p.coverUrl.isNotEmpty
                                  ? CachedNetworkImage(imageUrl: p.coverUrl,
                                      width: 56, height: 56, fit: BoxFit.cover)
                                  : Container(
                                      width: 56, height: 56,
                                      color: AppColors.primary.withValues(alpha: 0.08),
                                      child: const Icon(AppIcons.mic,
                                        color: AppColors.primary, size: 24)),
                              ),
                              const SizedBox(width: 12),
                              Expanded(child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(p.title,
                                    style: AppTextStyles.body.copyWith(
                                      fontSize: 13, fontWeight: FontWeight.w600),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                  const SizedBox(height: 2),
                                  Text(p.author,
                                    style: AppTextStyles.label.copyWith(
                                      color: AppColors.textHint, fontSize: 11),
                                    maxLines: 1, overflow: TextOverflow.ellipsis),
                                  if (p.category != null) ...[
                                    const SizedBox(height: 4),
                                    Text(p.category!,
                                      style: AppTextStyles.label.copyWith(
                                        fontSize: 10, color: AppColors.primary,
                                        fontWeight: FontWeight.w600)),
                                  ],
                                ],
                              )),
                              const Icon(AppIcons.chevronRight,
                                color: AppColors.grey300, size: 18),
                            ]),
                          ),
                        );
                      },
                      childCount: filtered.length,
                    ),
                  ),
                ),
            ]

            else ...[

              // ── Featured banner ────────────────────────────────────────────
              if (featured != null)
                SliverToBoxAdapter(
                  child: GestureDetector(
                    onTap: () => context.push('/podcasts/${featured.id}'),
                    child: Container(
                      margin: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                      height: 196,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(20),
                        gradient: const LinearGradient(
                          colors: [AppColors.primaryDark, AppColors.primary],
                          begin: Alignment.topLeft,
                          end:   Alignment.bottomRight),
                        boxShadow: [
                          BoxShadow(
                            color:      AppColors.primary.withValues(alpha: 0.35),
                            blurRadius: 20,
                            offset:     const Offset(0, 8),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: Stack(
                        children: [
                          // Background cover image
                          if (featured.coverUrl.isNotEmpty)
                            Positioned.fill(
                              child: CachedNetworkImage(
                                imageUrl:       featured.coverUrl,
                                fit:            BoxFit.cover,
                                color:          AppColors.primaryDark.withValues(alpha: 0.65),
                                colorBlendMode: BlendMode.darken),
                            ),
                          // Bottom gradient
                          Positioned(
                            bottom: 0, left: 0, right: 0,
                            child: Container(
                              height: 120,
                              decoration: const BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.bottomCenter,
                                  end:   Alignment.topCenter,
                                  colors: [Color(0xE6000000), Colors.transparent],
                                ),
                              ),
                            ),
                          ),
                          // Decorative circle
                          Positioned(
                            top: -20, right: -20,
                            child: Container(
                              width: 100, height: 100,
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withValues(alpha: 0.06),
                                  width: 12,
                                ),
                              ),
                            ),
                          ),
                          // Content
                          Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              mainAxisAlignment:  MainAxisAlignment.end,
                              children: [
                                // Featured + category badges
                                Row(children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                        horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color:        Colors.white.withValues(alpha: 0.2),
                                      borderRadius: BorderRadius.circular(6),
                                      border: Border.all(
                                          color: Colors.white.withValues(alpha: 0.3)),
                                    ),
                                    child: const Text('FEATURED',
                                      style: TextStyle(
                                        fontFamily:    'Inter',
                                        fontSize:      8,
                                        fontWeight:    FontWeight.w800,
                                        color:         Colors.white,
                                        letterSpacing: 1.2,
                                      )),
                                  ),
                                  if (featured.category != null) ...[
                                    const SizedBox(width: 6),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color:        AppColors.accent.withValues(alpha: 0.9),
                                        borderRadius: BorderRadius.circular(6)),
                                      child: Text(featured.category!,
                                        style: const TextStyle(
                                          fontFamily: 'Inter',
                                          fontSize:   8,
                                          fontWeight: FontWeight.w700,
                                          color:      AppColors.primaryDark,
                                          letterSpacing: 0.5,
                                        )),
                                    ),
                                  ],
                                ]),
                                const SizedBox(height: 8),
                                Text(featured.title,
                                  style: const TextStyle(
                                    fontFamily: 'Newsreader',
                                    color:      Colors.white,
                                    fontSize:   20,
                                    fontWeight: FontWeight.w700,
                                    height:     1.2,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 4),
                                Text(
                                  '${featured.author} · ${featured.episodes.length} episodes',
                                  style: TextStyle(
                                    fontFamily: 'Inter',
                                    color:      Colors.white.withValues(alpha: 0.7),
                                    fontSize:   12)),
                              ],
                            ),
                          ),
                          // Play button
                          Positioned(
                            right: 18, bottom: 18,
                            child: Container(
                              width: 46, height: 46,
                              decoration: const BoxDecoration(
                                  color: AppColors.accent, shape: BoxShape.circle),
                              child: const Icon(AppIcons.play,
                                  color: AppColors.primaryDark, size: 26),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

              // ── Category chips ─────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 16, 0, 0),
                  child: SizedBox(
                    height: 34,
                    child: ListView.separated(
                      scrollDirection:  Axis.horizontal,
                      itemCount:        provider.categories.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (_, i) {
                        final c      = provider.categories[i];
                        final active = c == _category;
                        return GestureDetector(
                          onTap: () => _applyCategory(c),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 150),
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 7),
                            decoration: BoxDecoration(
                              color:        active
                                  ? AppColors.primary : AppColors.white,
                              border: Border.all(
                                color: active
                                    ? AppColors.primary : AppColors.border),
                              borderRadius: BorderRadius.circular(20)),
                            child: Text(c,
                              style: AppTextStyles.label.copyWith(
                                fontWeight: FontWeight.w500,
                                color: active
                                    ? AppColors.white : AppColors.textSecondary)),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),

              // ── Your shows ─────────────────────────────────────────────────
              if (provider.subscriptions.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                    child: Row(children: [
                      Text('Your shows',
                        style: AppTextStyles.h3.copyWith(fontSize: 15)),
                      const Spacer(),
                      GestureDetector(
                        onTap: () {},
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Text('SEE ALL',
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8, fontSize: 10)),
                          const Icon(AppIcons.chevronRight,
                            size: 14, color: AppColors.primary),
                        ]),
                      ),
                    ]),
                  ),
                ),
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 95,
                    child: ListView.separated(
                      padding:          const EdgeInsets.symmetric(horizontal: 20),
                      scrollDirection:  Axis.horizontal,
                      itemCount:        provider.subscriptions.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 14),
                      itemBuilder: (_, i) {
                        final p = provider.subscriptions[i];
                        return GestureDetector(
                          onTap: () => context.push('/podcasts/${p.id}'),
                          child: SizedBox(
                            width: 66,
                            child: Column(children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(14),
                                child: p.coverUrl.isNotEmpty
                                  ? CachedNetworkImage(imageUrl: p.coverUrl,
                                      width: 62, height: 62, fit: BoxFit.cover)
                                  : Container(
                                      width: 62, height: 62,
                                      color: AppColors.primary.withValues(alpha: 0.08),
                                      child: const Icon(AppIcons.mic,
                                        color: AppColors.primary, size: 28)),
                              ),
                              const SizedBox(height: 5),
                              Text(p.title,
                                style: AppTextStyles.label.copyWith(
                                  fontSize: 10, color: AppColors.textSecondary),
                                maxLines: 2, overflow: TextOverflow.ellipsis,
                                textAlign: TextAlign.center),
                            ]),
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ],

              // ── Popular at IUEA ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                  child: Row(children: [
                    Text('Popular at IUEA',
                      style: AppTextStyles.h3.copyWith(fontSize: 15)),
                    const Spacer(),
                    GestureDetector(
                      onTap: () => context.go('/search'),
                      child: Row(mainAxisSize: MainAxisSize.min, children: [
                        Text('SEE ALL', style: AppTextStyles.label.copyWith(
                          color: AppColors.primary, fontWeight: FontWeight.w600,
                          letterSpacing: 0.8, fontSize: 10)),
                        const Icon(AppIcons.chevronRight,
                          size: 14, color: AppColors.primary),
                      ]),
                    ),
                  ]),
                ),
              ),

              provider.podcasts.isEmpty
                ? SliverFillRemaining(
                    child: Center(child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(AppIcons.mic,
                          size: 56, color: AppColors.grey300),
                        const SizedBox(height: 8),
                        Text('No podcasts yet.',
                          style: AppTextStyles.bodySmall.copyWith(
                            color: AppColors.grey500)),
                      ],
                    )),
                  )
                : SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    sliver: SliverGrid(
                      delegate: SliverChildBuilderDelegate(
                        (_, i) => GestureDetector(
                          onTap: () =>
                            context.push('/podcasts/${popular[i].id}'),
                          child: _PodcastCard(podcast: popular[i]),
                        ),
                        childCount: popular.length,
                      ),
                      gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount:   2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing:  12,
                          childAspectRatio: 0.74,
                        ),
                    ),
                  ),

              // ── Recently played ────────────────────────────────────────────
              if (recentlyPlayed.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(20, 20, 16, 10),
                    child: Text('Recently played',
                      style: AppTextStyles.h3.copyWith(fontSize: 15)),
                  ),
                ),
                SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (_, i) {
                      final p = recentlyPlayed[i];
                      return GestureDetector(
                        onTap: () => context.push('/podcasts/${p.id}'),
                        child: Container(
                          margin: const EdgeInsets.fromLTRB(20, 0, 20, 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color:        AppColors.white,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: [BoxShadow(
                              color: Colors.black.withValues(alpha: 0.04),
                              blurRadius: 8, offset: const Offset(0, 2))],
                          ),
                          child: Row(children: [
                            ClipRRect(
                              borderRadius: BorderRadius.circular(10),
                              child: p.coverUrl.isNotEmpty
                                ? CachedNetworkImage(imageUrl: p.coverUrl,
                                    width: 52, height: 52, fit: BoxFit.cover)
                                : Container(
                                    width: 52, height: 52,
                                    color: AppColors.primary.withValues(alpha: 0.08),
                                    child: const Icon(AppIcons.mic,
                                      color: AppColors.primary, size: 24)),
                            ),
                            const SizedBox(width: 12),
                            Expanded(child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(p.title,
                                  style: AppTextStyles.body.copyWith(
                                    fontSize: 13, fontWeight: FontWeight.w600),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 2),
                                Text(p.author,
                                  style: AppTextStyles.label.copyWith(
                                    color: AppColors.textHint, fontSize: 11),
                                  maxLines: 1, overflow: TextOverflow.ellipsis),
                              ],
                            )),
                            IconButton(
                              icon: Container(
                                width: 34, height: 34,
                                decoration: BoxDecoration(
                                  color:  AppColors.primary.withValues(alpha: 0.08),
                                  shape:  BoxShape.circle),
                                child: const Icon(AppIcons.play,
                                  color: AppColors.primary, size: 18),
                              ),
                              onPressed: () =>
                                context.push('/podcasts/${p.id}'),
                            ),
                          ]),
                        ),
                      );
                    },
                    childCount: recentlyPlayed.length,
                  ),
                ),
              ],

              // ── Footer ────────────────────────────────────────────────────
              const SliverToBoxAdapter(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 20),
                  child: _Footer(),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Podcast card ──────────────────────────────────────────────────────────────
class _PodcastCard extends StatelessWidget {
  final dynamic podcast;
  const _PodcastCard({required this.podcast});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color:        AppColors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color:     Colors.black.withValues(alpha: 0.07),
            blurRadius: 12,
            offset:    const Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Cover with play overlay
        Expanded(
          child: Stack(
            fit: StackFit.expand,
            children: [
              podcast.coverUrl.isNotEmpty
                  ? CachedNetworkImage(
                      imageUrl: podcast.coverUrl,
                      fit: BoxFit.cover, width: double.infinity)
                  : Container(
                      color: AppColors.primary.withValues(alpha: 0.07),
                      child: const Center(child: Icon(AppIcons.mic,
                          color: AppColors.primary, size: 40))),
              // Bottom gradient
              Positioned(
                bottom: 0, left: 0, right: 0,
                child: Container(
                  height: 60,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end:   Alignment.topCenter,
                      colors: [Color(0xCC000000), Colors.transparent],
                    ),
                  ),
                ),
              ),
              // Play button
              Positioned(
                bottom: 8, right: 8,
                child: Container(
                  width: 32, height: 32,
                  decoration: const BoxDecoration(
                    color: AppColors.accent,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(AppIcons.play,
                      color: AppColors.primaryDark, size: 18),
                ),
              ),
              // Episode count badge
              Positioned(
                top: 8, left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                  decoration: BoxDecoration(
                    color:        Colors.black.withValues(alpha: 0.55),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${podcast.episodes?.length ?? 0} eps',
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      color:      Colors.white,
                      fontSize:   9,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        // Info
        Padding(
          padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(podcast.title,
              style: AppTextStyles.body.copyWith(
                  fontWeight: FontWeight.w700, fontSize: 12),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 2),
            Text(podcast.author,
              style: AppTextStyles.label.copyWith(
                  color: AppColors.textHint, fontSize: 10),
              maxLines: 1, overflow: TextOverflow.ellipsis),
            if (podcast.category != null) ...[
              const SizedBox(height: 5),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color:        AppColors.primary.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(6)),
                child: Text(podcast.category!,
                  style: AppTextStyles.label.copyWith(
                    fontSize: 9, color: AppColors.primary,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 0.3)),
              ),
            ],
          ]),
        ),
      ]),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer();
  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Text('POWERED BY GOOGLE',
        style: TextStyle(fontFamily: 'Inter', fontSize: 9,
          letterSpacing: 1.4, color: AppColors.textHint.withValues(alpha: 0.6))),
      const SizedBox(height: 4),
      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
        _t('Privacy'), _d(), _t('Terms'), _d(), _t('Books API'),
      ]),
    ]);
  }
  Widget _t(String s) => Text(s, style: TextStyle(
    fontSize: 10, color: AppColors.textHint.withValues(alpha: 0.6),
    decoration: TextDecoration.underline,
    decorationColor: AppColors.textHint.withValues(alpha: 0.3)));
  Widget _d() => Padding(padding: const EdgeInsets.symmetric(horizontal: 5),
    child: Text('·', style: TextStyle(fontSize: 10,
      color: AppColors.textHint.withValues(alpha: 0.5))));
}
