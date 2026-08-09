import 'package:flutter/material.dart';
import '../models/match.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/match_service.dart';
import '../widgets/match_card.dart';
import 'notification_screen.dart';

class MatchListScreen extends StatefulWidget {
  const MatchListScreen({super.key});

  @override
  State<MatchListScreen> createState() => _MatchListScreenState();
}

class _MatchListScreenState extends State<MatchListScreen> {
  final AuthService _authService = AuthService();
  final MatchService _matchService = MatchService();

  bool _isCalculatingMatches = false;
  List<User> _matchedUsers = [];

  @override
  void initState() {
    super.initState();
    _loadMatches();
  }

  Future<void> _loadMatches() async {
    final currentUserId = _authService.currentUserId;
    if (currentUserId == null) return;

    setState(() {
      _isCalculatingMatches = true;
    });

    try {
      // First, calculate matches for the current user
      await _matchService.calculateAndStoreMatches(currentUserId);

      // Then load the matches
      _matchService.getTopMatches(currentUserId).listen((matches) async {
        final users = await _matchService.getMatchedUsers(matches);
        if (mounted) {
          setState(() {
            _matchedUsers = users;
            _isCalculatingMatches = false;
          });
        }
      });
    } catch (e) {
      print('Error loading matches: $e');
      if (mounted) {
        setState(() {
          _isCalculatingMatches = false;
        });
        _showError('Failed to load matches');
      }
    }
  }

  Future<void> _refreshMatches() async {
    await _loadMatches();
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _navigateToNotifications() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (context) => const NotificationScreen()),
    );
  }

  Future<void> _signOut() async {
    await _authService.signOut();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/login');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Matches'),
        backgroundColor: Colors.pink,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications),
            onPressed: _navigateToNotifications,
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'refresh') {
                _refreshMatches();
              } else if (value == 'logout') {
                _signOut();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'refresh',
                child: Row(
                  children: [
                    Icon(Icons.refresh),
                    SizedBox(width: 8),
                    Text('Refresh Matches'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Sign Out'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: FloatingActionButton(
        onPressed: _refreshMatches,
        backgroundColor: Colors.pink,
        child: const Icon(Icons.refresh, color: Colors.white),
      ),
    );
  }

  Widget _buildBody() {
    if (_isCalculatingMatches) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(color: Colors.pink),
            SizedBox(height: 16),
            Text(
              'Finding your perfect matches...',
              style: TextStyle(fontSize: 16, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    if (_matchedUsers.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.favorite_border,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No matches found yet',
              style: TextStyle(
                fontSize: 18,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later or update your profile',
              style: TextStyle(color: Colors.grey[500]),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _refreshMatches,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.pink,
                foregroundColor: Colors.white,
              ),
              child: const Text('Refresh Matches'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _refreshMatches,
      color: Colors.pink,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _matchedUsers.length,
        itemBuilder: (context, index) {
          final user = _matchedUsers[index];
          return Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: StreamBuilder<List<Match>>(
              stream: _matchService.getTopMatches(_authService.currentUserId!),
              builder: (context, snapshot) {
                if (!snapshot.hasData) {
                  return MatchCard(user: user, compatibilityScore: 0);
                }

                final matches = snapshot.data!;
                final match = matches.firstWhere(
                  (m) => m.fromUid == user.uid,
                  orElse: () => Match(
                    fromUid: user.uid,
                    toUid: _authService.currentUserId!,
                    score: 0,
                    timestamp: DateTime.now(),
                  ),
                );

                return MatchCard(
                  user: user,
                  compatibilityScore: match.score.round(),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
