import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'routes/app_router.dart';

// Design System Colors from 작업서1.1.txt
const Color accentColor = Color(0xFF4B8BFF);
const Color backgroundColor = Color(0xFFFFFFFF);
const Color surfaceColor = Color(0xFFF7F7F8);
const Color textPrimaryColor = Color(0xFF16181C);
const Color textSecondaryColor = Color(0xFF6B7280);

// Custom Theme based on the design spec
ThemeData _buildTheme() {
  final baseTheme = ThemeData.light(useMaterial3: true);

  return baseTheme.copyWith(
    primaryColor: accentColor,
    scaffoldBackgroundColor: backgroundColor,
    appBarTheme: const AppBarTheme(
      backgroundColor: backgroundColor,
      foregroundColor: textPrimaryColor,
      elevation: 0,
      centerTitle: true,
    ),
    colorScheme: ColorScheme.fromSeed(
      seedColor: accentColor,
      primary: accentColor,
      background: backgroundColor,
      surface: surfaceColor,
      onSurface: textPrimaryColor,
    ),
    textTheme: baseTheme.textTheme.apply(
      fontFamily: 'Pretendard',
      bodyColor: textPrimaryColor,
      displayColor: textPrimaryColor,
    ),
    inputDecorationTheme: InputDecorationTheme(
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: Colors.grey.shade300),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: const BorderSide(color: accentColor, width: 2),
      ),
      labelStyle: const TextStyle(color: textSecondaryColor),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: accentColor,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Pretendard'),
      ),
    ),
    chipTheme: ChipThemeData(
      backgroundColor: surfaceColor,
      labelStyle: const TextStyle(color: textPrimaryColor),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
        side: BorderSide(color: Colors.grey.shade300),
      ),
    ),
  );
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(const ProviderScope(child: MyApp()));
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'ProjectRoom',
      theme: _buildTheme(),
      routerConfig: router,
    );
  }
}