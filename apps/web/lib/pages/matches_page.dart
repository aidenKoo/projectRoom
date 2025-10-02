import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';
import '../routes/app_router.dart';

final matchesProvider = FutureProvider<List<dynamic>>((ref) async {
  return apiService.getMatches();
});

class MatchesPage extends ConsumerWidget {
  const MatchesPage({super.key});

  void _onBottomNavTapped(int index, WidgetRef ref) {
    final router = ref.read(routerProvider);
    switch (index) {
      case 0:
        router.go('/feed');
        break;
      case 1:
        router.go('/feed');
        break;
      case 2:
        router.go('/matches');
        break;
      case 3:
        router.go('/me');
        break;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matchesAsync = ref.watch(matchesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('매칭 목록'),
      ),
      body: matchesAsync.when(
        data: (matches) {
          if (matches.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.favorite_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  const Text(
                    '아직 매칭된 상대가 없습니다',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 32),
                  ElevatedButton(
                    onPressed: () => context.go('/feed'),
                    child: const Text('피드로 돌아가기'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: matches.length,
            itemBuilder: (context, index) {
              final match = matches[index];
              // The API response structure needs to be known.
              // Assuming it has a `matchedUser` object with `display_name` and `photos`
              final matchedUser = match['matchedUser'] ?? {};
              final lastMessage = match['lastMessage'];

              return ListTile(
                leading: CircleAvatar(
                  radius: 30,
                  // Use the first photo of the matched user, or a placeholder
                  backgroundImage: (matchedUser['photos'] as List?)?.isNotEmpty
                      ? NetworkImage(matchedUser['photos'][0])
                      : null,
                  child: (matchedUser['photos'] as List?)?.isEmpty ?? true
                      ? Text(matchedUser['display_name']?[0] ?? '?')
                      : null,
                ),
                title: Text(matchedUser['display_name'] ?? 'Unknown User'),
                subtitle: Text(lastMessage?['body'] ?? '대화를 시작해보세요'),
                onTap: () {
                  final matchId = match['id'].toString();
                  context.go('/chat/$matchId');
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('매칭 목록을 불러오는데 실패했습니다: $error')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2, // Matches is the third item
        onTap: (index) => _onBottomNavTapped(index, ref),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: '홈',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite),
            label: '피드',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: '매칭',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: '내 정보',
          ),
        ],
        type: BottomNavigationBarType.fixed,
      ),
    );
  }
}