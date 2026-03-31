import 'package:flutter/material.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

class IUEALibraryApp extends StatelessWidget {
  const IUEALibraryApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title:                    'IUEA Library',
      debugShowCheckedModeBanner: false,
      theme:                    AppTheme.lightTheme,
      darkTheme:                AppTheme.darkTheme,
      themeMode:                ThemeMode.system,
      routerConfig:             AppRouter.router,
      supportedLocales: const [
        Locale('en'),
        Locale('sw'),
        Locale('fr'),
        Locale('ar'),
        Locale('lg'),
        Locale('rw'),
        Locale('so'),
        Locale('am'),
      ],
    );
  }
}
