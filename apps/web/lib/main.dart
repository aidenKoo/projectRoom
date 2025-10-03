
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projectroom_web/core/theme/app_theme.dart';
import 'package:projectroom_web/routes/app_router.dart';

void main() {
  // TODO: Add Firebase initialization here
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
