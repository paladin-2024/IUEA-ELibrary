import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:go_router/go_router.dart';
import '../constants/app_colors.dart';

import '../../presentation/splash/splash_screen.dart';
import '../../presentation/auth/login_screen.dart';
import '../../presentation/auth/register_screen.dart';
import '../../presentation/auth/forgot_password_screen.dart';
import '../../presentation/auth/language_setup_screen.dart';
import '../../presentation/onboarding/onboarding_screen.dart';
import '../../presentation/home/home_screen.dart';
import '../../presentation/search/search_screen.dart';
import '../../presentation/book/book_detail_screen.dart';
import '../../presentation/reader/reader_screen.dart';
import '../../presentation/reader/audio_player_screen.dart';
import '../../presentation/library/my_library_screen.dart';
import '../../presentation/library/downloads_screen.dart';
import '../../presentation/podcasts/podcasts_home_screen.dart';
import '../../presentation/podcasts/podcast_detail_screen.dart';
import '../../presentation/profile/profile_screen.dart';
import '../../presentation/profile/preferences_screen.dart';
import '../../presentation/profile/streaks_screen.dart';
import '../../presentation/library/my_loans_screen.dart';
import '../../presentation/notifications/notifications_screen.dart';
import '../../presentation/book/author_screen.dart';
import '../../presentation/library/faculty_screen.dart';
import '../../presentation/reader/widgets/chatbot_sheet.dart';
import '../../presentation/widgets/mini_player.dart';
import 'package:provider/provider.dart';
import '../../providers/chat_provider.dart';
import '../../providers/reader_provider.dart';

// ── Auth routes (no shell) ────────────────────────────────────────────────────
const _authRoutes = {'/login', '/register', '/forgot-password', '/onboarding', '/language-setup', '/splash'};

bool _isAuthRoute(String loc) => _authRoutes.any(loc.startsWith);

// ── Router ────────────────────────────────────────────────────────────────────
class AppRouter {
  static final _storage = const FlutterSecureStorage();

  static Future<String?> _redirect(BuildContext context, GoRouterState state) async {
    final loc = state.matchedLocation;

    // Always let splash through — it handles its own redirect after checking token
    if (loc == '/splash') return null;

    final token = await _storage.read(key: 'jwt_token');
    final loggedIn = token != null;

    if (!loggedIn && !_isAuthRoute(loc)) return '/login';
    if (loggedIn  &&  _isAuthRoute(loc)) return '/home';
    return null;
  }

  static final GoRouter router = GoRouter(
    initialLocation: '/splash',
    redirect:        _redirect,
    routes: [
      // ── Splash ──────────────────────────────────────────────────────────
      GoRoute(
        path:    '/splash',
        builder: (_, __) => const SplashScreen(),
      ),

      // ── Auth (no bottom nav) ─────────────────────────────────────────────
      GoRoute(path: '/login',           builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register',        builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/forgot-password', builder: (_, __) => const ForgotPasswordScreen()),
      GoRoute(path: '/onboarding',      builder: (_, __) => const OnboardingScreen()),
      GoRoute(path: '/language-setup',  builder: (_, __) => const LanguageSetupScreen()),

      // ── Main shell (5-tab bottom nav) ────────────────────────────────────
      ShellRoute(
        builder: (context, state, child) => _MainShell(child: child),
        routes: [
          GoRoute(path: '/home',    builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/search',  builder: (_, __) => const SearchScreen()),
          GoRoute(
            path:    '/library',
            builder: (_, __) => const MyLibraryScreen(),
            routes: [
              GoRoute(
                path:    'downloads',
                builder: (_, __) => const DownloadsScreen(),
              ),
              GoRoute(
                path:    'loans',
                builder: (_, __) => const MyLoansScreen(),
              ),
            ],
          ),
          GoRoute(path: '/podcasts', builder: (_, __) => const PodcastsHomeScreen()),
          GoRoute(
            path:    '/profile',
            builder: (_, __) => const ProfileScreen(),
            routes: [
              GoRoute(
                path:    'preferences',
                builder: (_, __) => const PreferencesScreen(),
              ),
              GoRoute(
                path:    'streaks',
                builder: (_, __) => const StreaksScreen(),
              ),
            ],
          ),
        ],
      ),

      // ── Full-screen routes (no bottom nav) ───────────────────────────────
      GoRoute(
        path:    '/books/:id',
        builder: (_, state) => BookDetailScreen(bookId: state.pathParameters['id']!),
      ),
      GoRoute(
        path:    '/reader/:id',
        builder: (_, state) => ReaderScreen(bookId: state.pathParameters['id']!),
      ),
      GoRoute(
        path:    '/audio/:id',
        builder: (_, state) => AudioPlayerScreen(bookId: state.pathParameters['id']!),
      ),
      GoRoute(
        path:    '/podcasts/:id',
        builder: (_, state) => PodcastDetailScreen(podcastId: state.pathParameters['id']!),
      ),
      GoRoute(
        path:    '/notifications',
        builder: (_, __) => const NotificationsScreen(),
      ),
      GoRoute(
        path:    '/author/:name',
        builder: (_, state) => AuthorScreen(
          authorName: Uri.decodeComponent(state.pathParameters['name']!),
        ),
      ),
      GoRoute(
        path:    '/faculty/:name',
        builder: (_, state) => FacultyScreen(
          facultyName: state.pathParameters['name']!,
        ),
      ),
    ],
  );
}

// ── Main shell with 5-tab bottom nav ─────────────────────────────────────────
class _MainShell extends StatefulWidget {
  final Widget child;
  const _MainShell({required this.child});

  @override
  State<_MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<_MainShell> {
  static const _tabs = ['/home', '/search', '/library', '/podcasts', '/profile'];

  int _indexForLocation(String location) {
    for (int i = 0; i < _tabs.length; i++) {
      if (location.startsWith(_tabs[i])) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final location     = GoRouterState.of(context).matchedLocation;
    final currentIndex = _indexForLocation(location);

    return Scaffold(
      body: Column(
        children: [
          Expanded(child: widget.child),
          const MiniPlayer(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          final chat   = context.read<ChatProvider>();
          final reader = context.read<ReaderProvider>();
          showModalBottomSheet(
            context:            context,
            isScrollControlled: true,
            backgroundColor:    Colors.transparent,
            builder: (_) => MultiProvider(
              providers: [
                ChangeNotifierProvider.value(value: chat),
                ChangeNotifierProvider.value(value: reader),
              ],
              child: const ChatbotSheet(bookId: '__general__'),
            ),
          );
        },
        backgroundColor: AppColors.primary,
        foregroundColor: AppColors.white,
        tooltip: 'Ask AI',
        child: const Icon(Icons.auto_awesome_rounded),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (i) => context.go(_tabs[i]),
        items: const [
          BottomNavigationBarItem(
            icon:       Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label:      'Home',
          ),
          BottomNavigationBarItem(
            icon:       Icon(Icons.search_outlined),
            activeIcon: Icon(Icons.search),
            label:      'Search',
          ),
          BottomNavigationBarItem(
            icon:       Icon(Icons.collections_bookmark_outlined),
            activeIcon: Icon(Icons.collections_bookmark),
            label:      'My Books',
          ),
          BottomNavigationBarItem(
            icon:       Icon(Icons.headphones_outlined),
            activeIcon: Icon(Icons.headphones),
            label:      'Podcasts',
          ),
          BottomNavigationBarItem(
            icon:       Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label:      'Profile',
          ),
        ],
      ),
    );
  }
}
