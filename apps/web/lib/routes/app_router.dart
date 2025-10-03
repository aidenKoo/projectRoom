import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';

// Auth screens
import 'package:projectroom_web/features/auth/presentation/screens/improved_login_screen.dart';
import 'package:projectroom_web/pages/signup_flow/complete_signup_flow.dart';

// Onboarding/Research screens
import 'package:projectroom_web/pages/signup_flow/integrated_research_screen.dart';

// Main app screens
import 'package:projectroom_web/pages/feed_page.dart';
import 'package:projectroom_web/pages/matches_page.dart';
import 'package:projectroom_web/pages/chat_page.dart';
import 'package:projectroom_web/pages/me_page.dart';

// Profile setup screens
import 'package:projectroom_web/pages/profile_setup_page.dart';
import 'package:projectroom_web/pages/private_profile_setup_page.dart';
import 'package:projectroom_web/pages/preferences_setup_page.dart';

final appRouter = GoRouter(
  initialLocation: '/login',
  redirect: (context, state) {
    final user = FirebaseAuth.instance.currentUser;
    final isLoggedIn = user != null;
    final isLoginRoute = state.matchedLocation == '/login' ||
                        state.matchedLocation == '/signup';

    // If not logged in and trying to access protected route
    if (!isLoggedIn && !isLoginRoute) {
      return '/login';
    }

    // If logged in and trying to access login/signup
    if (isLoggedIn && isLoginRoute) {
      return '/feed';
    }

    return null; // No redirect
  },
  routes: [
    GoRoute(
      path: '/',
      redirect: (_, __) => '/feed',
    ),

    // Auth routes
    GoRoute(
      path: '/login',
      builder: (context, state) => const ImprovedLoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const CompleteSignupFlow(),
    ),

    // Onboarding/Research
    GoRoute(
      path: '/research',
      builder: (context, state) => const IntegratedResearchScreen(),
    ),

    // Profile setup (can be accessed from Me page for editing)
    GoRoute(
      path: '/profile-setup',
      builder: (context, state) => const ProfileSetupPage(),
    ),
    GoRoute(
      path: '/private-profile-setup',
      builder: (context, state) => const PrivateProfileSetupPage(),
    ),
    GoRoute(
      path: '/preferences-setup',
      builder: (context, state) => const PreferencesSetupPage(),
    ),

    // Main app routes
    GoRoute(
      path: '/feed',
      builder: (context, state) => const FeedPage(),
    ),
    GoRoute(
      path: '/matches',
      builder: (context, state) => const MatchesPage(),
    ),
    GoRoute(
      path: '/chat/:matchId',
      builder: (context, state) {
        final matchId = state.pathParameters['matchId']!;
        return ChatPage(matchId: matchId);
      },
    ),
    GoRoute(
      path: '/me',
      builder: (context, state) => const MePage(),
    ),
  ],
  errorBuilder: (context, state) => Scaffold(
    body: Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(
            '페이지를 찾을 수 없습니다',
            style: Theme.of(context).textTheme.headlineMedium,
          ),
          const SizedBox(height: 8),
          Text(
            state.uri.toString(),
            style: Theme.of(context).textTheme.bodySmall,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => context.go('/feed'),
            child: const Text('홈으로 돌아가기'),
          ),
        ],
      ),
    ),
  ),
);
