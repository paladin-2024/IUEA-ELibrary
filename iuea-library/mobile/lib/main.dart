import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app.dart';
import 'providers/auth_provider.dart';
import 'providers/book_provider.dart';
import 'providers/reader_provider.dart';
import 'providers/chat_provider.dart';
import 'providers/podcast_provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'data/services/firebase_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoogleFonts.config.allowRuntimeFetching = false;
  await dotenv.load(fileName: '.env');
  await Firebase.initializeApp();

  // Register background handler before runApp
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  final authProvider = AuthProvider();
  await authProvider.loadUser();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
        ChangeNotifierProvider(create: (_) => BookProvider()),
        ChangeNotifierProvider(create: (_) => ReaderProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => PodcastProvider()),
      ],
      child: const IUEALibraryApp(),
    ),
  );
}
