
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../services/api_service.dart';

final matchesProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  // Automatically refetch every time the user visits the page.
  ref.keepAlive();
  return apiService.getMatches();
});

class MatchesPage extends ConsumerWidget {
  const MatchesPage({super.key});

  void _onBottomNavTapped(int index, BuildContext context) {
    switch (index) {
      case 0:
        context.go('/feed');
        break;
      case 1:
        context.go('/matches');
        break;
      case 2:
        context.go('/me');
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

          return ListView.separated(
            itemCount: matches.length,
            separatorBuilder: (context, index) => const Divider(height: 1, indent: 80),
            itemBuilder: (context, index) {
              final match = matches[index];
              final matchedUser = match['matchedUser'] ?? {};
              final lastMessage = match['lastMessage'];
              final photos = (matchedUser['photos'] as List<dynamic>?) ?? [];

              return ListTile(
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                leading: CircleAvatar(
                  radius: 30,
                  backgroundImage: photos.isNotEmpty
                      ? CachedNetworkImageProvider(photos[0])
                      : null,
                  child: photos.isEmpty
                      ? Text(matchedUser['name']?[0] ?? '?')
                      : null,
                ),
                title: Text(matchedUser['name'] ?? 'Unknown User', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  lastMessage?['body'] ?? '대화를 시작해보세요',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                onTap: () {
                  final conversationId = match['conversationId'].toString();
                  context.go('/chat/$conversationId');
                },
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('매칭 목록을 불러오는데 실패했습니다: $error')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1, // Matches is the second item
        onTap: (index) => _onBottomNavTapped(index, context),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            activeIcon: Icon(Icons.explore),
            label: '피드',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: '매칭',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: '내 정보',
          ),
        ],
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
    );
  }
}
