import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../pages/welcome_page.dart';
import '../pages/signin_page.dart';
import '../pages/code_entry_page.dart';
import '../pages/referral_page.dart';
import '../pages/profile_setup_page.dart';
import '../pages/values_page.dart';
import '../pages/photos_page.dart';
import '../pages/feed_page.dart';
import '../pages/matches_page.dart';
import '../pages/chat_page.dart';
import '../pages/me_page.dart';
import '../pages/private_profile_setup_page.dart';
import '../pages/preferences_setup_page.dart';
import '../providers/auth_provider.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/welcome',
    redirect: (context, state) {
      final isLoggedIn = authState.value != null;
      final isLoggingIn = state.matchedLocation == '/signin';
      final isWelcome = state.matchedLocation == '/welcome';

      // If the user is not logged in, and not on a public page, redirect to welcome.
      if (!isLoggedIn && !isLoggingIn && !isWelcome) {
        return '/welcome';
      }

      // If the user is logged in and tries to access welcome/signin, redirect them to the start of the flow.
      if (isLoggedIn && (isWelcome || isLoggingIn)) {
        // TODO: In the future, check if profile is complete and redirect to /feed if so.
        return '/code-entry';
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/welcome',
        builder: (context, state) => const WelcomePage(),
      ),
      GoRoute(
        path: '/signin',
        builder: (context, state) => const SignInPage(),
      ),
      GoRoute(
        path: '/code-entry',
        builder: (context, state) => const CodeEntryPage(),
      ),
       GoRoute(
        path: '/referral',
        builder: (context, state) => const ReferralPage(),
      ),
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
      GoRoute(
        path: '/values',
        builder: (context, state) => const ValuesPage(),
      ),
      GoRoute(
        path: '/photos',
        builder: (context, state) => const PhotosPage(),
      ),
      GoRoute(
        path: '/feed',
        builder: (context, state) => const FeedPage(),
      ),
      GoRoute(
        path: '/matches',
        builder: (context, state) => const MatchesPage(),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) {
          final matchId = state.pathParameters['id']!;
          return ChatPage(matchId: matchId);
        },
      ),
      GoRoute(
        path: '/me',
        builder: (context, state) => const MePage(),
      ),
    ],
  );
});