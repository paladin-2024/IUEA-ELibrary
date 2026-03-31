import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../presentation/auth/login_screen.dart';
import '../../presentation/auth/register_screen.dart';
import '../../presentation/auth/language_setup_screen.dart';
import '../../presentation/home/home_screen.dart';
import '../../presentation/book/book_detail_screen.dart';
import '../../presentation/reader/reader_screen.dart';
import '../../presentation/reader/audio_player_screen.dart';
import '../../presentation/library/my_library_screen.dart';
import '../../presentation/search/search_screen.dart';
import '../../presentation/podcasts/podcasts_home_screen.dart';
import '../../presentation/podcasts/podcast_detail_screen.dart';
import '../../presentation/profile/profile_screen.dart';

class AppRouter {
  static GoRouter createRouter(AuthProvider authProvider) {
    return GoRouter(
      initialLocation: '/',
      refreshListenable: authProvider,
      redirect: (context, state) {
        final isLoggedIn    = authProvider.isLoggedIn;
        final isAuthRoute   = state.matchedLocation.startsWith('/login') ||
                              state.matchedLocation.startsWith('/register') ||
                              state.matchedLocation.startsWith('/language-setup');
        if (!isLoggedIn && !isAuthRoute) return '/login';
        if (isLoggedIn  &&  isAuthRoute) return '/';
        return null;
      },
      routes: [
        // Auth
        GoRoute(path: '/login',          builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register',       builder: (_, __) => const RegisterScreen()),
        GoRoute(path: '/language-setup', builder: (_, __) => const LanguageSetupScreen()),

        // Main shell with bottom nav
        ShellRoute(
          builder: (context, state, child) => MainShell(child: child),
          routes: [
            GoRoute(path: '/',         builder: (_, __) => const HomeScreen()),
            GoRoute(path: '/search',   builder: (_, __) => const SearchScreen()),
            GoRoute(path: '/library',  builder: (_, __) => const MyLibraryScreen()),
            GoRoute(path: '/podcasts', builder: (_, __) => const PodcastsHomeScreen()),
            GoRoute(path: '/profile',  builder: (_, __) => const ProfileScreen()),
          ],
        ),

        // Full screen routes (no bottom nav)
        GoRoute(
          path: '/books/:id',
          builder: (_, state) => BookDetailScreen(bookId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/reader/:id',
          builder: (_, state) => ReaderScreen(bookId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/audio/:id',
          builder: (_, state) => AudioPlayerScreen(bookId: state.pathParameters['id']!),
        ),
        GoRoute(
          path: '/podcasts/:id',
          builder: (_, state) => PodcastDetailScreen(podcastId: state.pathParameters['id']!),
        ),
      ],
    );
  }
}

class MainShell extends StatefulWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _selectedIndex = 0;

  static const _routes = ['/', '/search', '/library', '/podcasts', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedIndex,
        onTap: (index) {
          setState(() => _selectedIndex = index);
          context.go(_routes[index]);
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home_outlined),     activeIcon: Icon(Icons.home),     label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.search_outlined),   activeIcon: Icon(Icons.search),   label: 'Search'),
          BottomNavigationBarItem(icon: Icon(Icons.book_outlined),     activeIcon: Icon(Icons.book),     label: 'Library'),
          BottomNavigationBarItem(icon: Icon(Icons.mic_none_outlined), activeIcon: Icon(Icons.mic),      label: 'Podcasts'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outlined),   activeIcon: Icon(Icons.person),   label: 'Profile'),
        ],
      ),
    );
  }
}
