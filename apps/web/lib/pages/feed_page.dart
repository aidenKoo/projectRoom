import 'package:flutter/material.dart';
import 'package:flutter_card_swiper/flutter_card_swiper.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shimmer/shimmer.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../routes/app_router.dart';

final feedProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  // Let it refetch every time for now to ensure we get fresh data.
  // In a real app, you'd use a more sophisticated caching strategy.
  return apiService.getFeed();
});

class FeedPage extends ConsumerStatefulWidget {
  const FeedPage({super.key});

  @override
  ConsumerState<FeedPage> createState() => _FeedPageState();
}

class _FeedPageState extends ConsumerState<FeedPage> {
  final CardSwiperController _controller = CardSwiperController();
  List<dynamic> _candidates = [];

  Future<void> _swipe(int index, CardSwiperDirection direction) async {
    if (index >= _candidates.length) return;

    final action = switch (direction) {
      CardSwiperDirection.left => 'pass',
      CardSwiperDirection.right => 'like',
      CardSwiperDirection.top => 'superlike',
      CardSwiperDirection.bottom => 'pass',
    };

    final targetId = _candidates[index]['user']['id'];

    try {
      final result = await apiService.createSwipe(targetId: targetId, action: action);
      if (mounted && result['matched'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('🎉 매칭 성공!'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      // Error handling is important, but for now, we fail silently.
    }
  }

  void _onBottomNavTapped(int index) {
    final router = ref.read(routerProvider);
    switch (index) {
      case 0: router.go('/feed'); break;
      case 1: router.go('/matches'); break;
      case 2: router.go('/me'); break;
    }
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(feedProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('ProjectRoom'), centerTitle: false),
      body: feedAsync.when(
        data: (candidates) {
          _candidates = candidates;
          if (_candidates.isEmpty) {
            return const Center(child: Text('더 이상 추천할 프로필이 없습니다.'));
          }
          return _buildCardSwiper();
        },
        loading: () => _buildLoadingShimmer(),
        error: (err, st) => Center(child: Text('오류가 발생했습니다: $err')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        onTap: _onBottomNavTapped,
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.explore), label: '피드'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), label: '매칭'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), label: '내 정보'),
        ],
        type: BottomNavigationBarType.fixed,
      ),
    );
  }

  Widget _buildCardSwiper() {
    return Column(
      children: [
        Expanded(
          child: CardSwiper(
            controller: _controller,
            cardsCount: _candidates.length,
            onSwipe: _swipe,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            cardBuilder: (context, index, h, v) {
              final candidate = _candidates[index];
              return _FeedCard(candidate: candidate, onDoubleTap: () => _controller.swipe(CardSwiperDirection.right));
            },
          ),
        ),
        _buildActionButtons(),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          IconButton(icon: const Icon(Icons.undo), onPressed: () => _controller.undo(), iconSize: 28),
          IconButton(icon: const Icon(Icons.close), color: Colors.red, onPressed: () => _controller.swipe(CardSwiperDirection.left), iconSize: 40),
          IconButton(icon: const Icon(Icons.star), color: Colors.amber, onPressed: () => _controller.swipe(CardSwiperDirection.top), iconSize: 36),
          IconButton(icon: const Icon(Icons.favorite), color: Colors.pink, onPressed: () => _controller.swipe(CardSwiperDirection.right), iconSize: 40),
        ],
      ),
    );
  }

  Widget _buildLoadingShimmer() {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [Expanded(child: Card(child: Container())), const SizedBox(height: 20), Row(mainAxisAlignment: MainAxisAlignment.spaceEvenly, children: List.generate(4, (_) => const CircleAvatar(radius: 25)))]
        ),
      ),
    );
  }
}

class _FeedCard extends StatefulWidget {
  final dynamic candidate;
  final VoidCallback onDoubleTap;

  const _FeedCard({required this.candidate, required this.onDoubleTap});

  @override
  State<_FeedCard> createState() => _FeedCardState();
}

class _FeedCardState extends State<_FeedCard> {
  int _photoIndex = 0;

  @override
  Widget build(BuildContext context) {
    final user = widget.candidate['user'] ?? {};
    final profile = widget.candidate['profile'] ?? {};
    final photos = (profile['photos'] as List?)?.where((p) => p != null).cast<String>().toList() ?? [];
    final sharedBits = (widget.candidate['shared_bits'] as List?)?.cast<String>() ?? [];

    return GestureDetector(
      onDoubleTap: widget.onDoubleTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20.0),
        child: Stack(
          children: [
            // Photo PageView
            if (photos.isNotEmpty)
              PageView.builder(
                onPageChanged: (index) => setState(() => _photoIndex = index),
                itemCount: photos.length,
                itemBuilder: (context, index) {
                  return CachedNetworkImage(
                    imageUrl: photos[index],
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(color: Colors.grey[200]),
                    errorWidget: (context, url, error) => const Icon(Icons.error),
                  );
                },
              )
            else
              Container(color: Colors.grey.shade300, child: const Center(child: Icon(Icons.person, size: 100, color: Colors.white))),

            // Gradient Overlay
            _buildGradientOverlay(),

            // Content
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Page Indicator
                  if (photos.length > 1) _buildPageIndicator(photos.length),
                  const Spacer(),
                  // User Info
                  Text(
                    '${user['display_name'] ?? ''}, ${DateTime.now().year - (user['birth_year'] ?? 2000)}',
                    style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold, shadows: [Shadow(blurRadius: 2, color: Colors.black54)]),
                  ),
                  const SizedBox(height: 8),
                  // Shared Bits
                  if (sharedBits.isNotEmpty)
                    Wrap(
                      spacing: 8,
                      children: sharedBits.map((bit) => Chip(label: Text(bit), backgroundColor: Colors.white.withOpacity(0.8))).toList(),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildGradientOverlay() {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.transparent, Colors.black54],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          stops: [0.5, 1.0],
        ),
      ),
    );
  }

  Widget _buildPageIndicator(int photoCount) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(photoCount, (index) {
        return Container(
          width: 8.0, height: 8.0,
          margin: const EdgeInsets.symmetric(horizontal: 4.0),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: _photoIndex == index ? Colors.white : Colors.white.withOpacity(0.5),
          ),
        );
      }),
    );
  }
}
