import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final feedProvider = FutureProvider<List<dynamic>>((ref) async {
  return apiService.getFeed();
});

class FeedPage extends ConsumerStatefulWidget {
  const FeedPage({super.key});

  @override
  ConsumerState<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends ConsumerState<FeedPage> {
  int _currentIndex = 0;

  Future<void> _swipe(String action, int targetId) async {
    try {
      final result = await apiService.createSwipe(
        targetId: targetId,
        action: action,
      );

      if (result['matched'] == true) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('🎉 매칭 성공!')),
          );
        }
      }

      setState(() => _currentIndex++);
      ref.invalidate(feedProvider);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('오류: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(feedProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('매칭 피드'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {},
          ),
        ],
      ),
      body: feedAsync.when(
        data: (candidates) {
          if (candidates.isEmpty || _currentIndex >= candidates.length) {
            return const Center(
              child: Text('더 이상 추천할 프로필이 없습니다'),
            );
          }

          final candidate = candidates[_currentIndex];
          final profile = candidate['profile'];
          final user = candidate['user'];
          final reasons = (candidate['reasons'] as List).cast<String>();

          return Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 500),
              child: Card(
                margin: const EdgeInsets.all(16),
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Profile Header
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            child: Text(
                              user['display_name']?[0] ?? '?',
                              style: const TextStyle(fontSize: 32),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  user['display_name'] ?? 'Unknown',
                                  style: Theme.of(context).textTheme.headlineSmall,
                                ),
                                Text(
                                  '${DateTime.now().year - user['birth_year']}세',
                                  style: Theme.of(context).textTheme.bodyMedium,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // Profile Info
                      if (profile['intro_text'] != null) ...[
                        Text(
                          profile['intro_text'],
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Reason Badges
                      const Text(
                        '왜 추천했나요?',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: reasons
                            .map((reason) => Chip(
                                  label: Text(reason),
                                  backgroundColor: Colors.blue.shade50,
                                ))
                            .toList(),
                      ),
                      const SizedBox(height: 32),

                      // Action Buttons
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          IconButton(
                            icon: const Icon(Icons.close, size: 40),
                            color: Colors.red,
                            onPressed: () => _swipe('pass', user['id']),
                          ),
                          IconButton(
                            icon: const Icon(Icons.star, size: 40),
                            color: Colors.amber,
                            onPressed: () => _swipe('superlike', user['id']),
                          ),
                          IconButton(
                            icon: const Icon(Icons.favorite, size: 40),
                            color: Colors.pink,
                            onPressed: () => _swipe('like', user['id']),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(child: Text('오류: $error')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 1,
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
      ),
    );
  }
}
