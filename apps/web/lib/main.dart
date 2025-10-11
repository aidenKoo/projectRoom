
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:projectroom_web/core/theme/app_theme.dart';
import 'package:projectroom_web/routes/app_router.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  try {
    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    print('✅ Firebase initialized successfully');

    // Connect to Firebase Emulator in development mode
    if (kIsWeb) {
      const useEmulator = true; // Set to false for production
      if (useEmulator) {
        print('🔧 Connecting to Firebase Emulator...');
        await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
        await FirebaseStorage.instance.useStorageEmulator('localhost', 9199);
        print('✅ Connected to Firebase Emulator');
      }
    }
  } catch (e) {
    print('⚠️ Firebase initialization failed: $e');
    print('📝 Running in offline mode. Some features may not work.');
  }

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'Project Room',
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.dark, // Default to dark theme as per design
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
    );
  }
}
