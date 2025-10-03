import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../services/api_service.dart';
import '../providers/draft_provider.dart';

// Provider to fetch both public and private profiles concurrently
final myProfileProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final publicProfileFuture = apiService.getMyPublicProfile();
  final privateProfileFuture = apiService.getMyPrivateProfile();

  final results = await Future.wait([publicProfileFuture, privateProfileFuture]);

  return {
    'public': results[0],
    'private': results[1],
  };
});

class MePage extends ConsumerWidget {
  const MePage({super.key});

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
    final profileAsync = ref.watch(myProfileProvider);
    final user = FirebaseAuth.instance.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text('내 정보'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await FirebaseAuth.instance.signOut();
              if (context.mounted) {
                context.go('/welcome');
              }
            },
          ),
        ],
      ),
      body: profileAsync.when(
        data: (profile) {
          final publicProfile = profile['public'] ?? {};
          final privateProfile = profile['private'] ?? {};
          final photos = (publicProfile['photos'] as List<dynamic>?) ?? [];

          return ListView(
            children: [
              if (photos.isNotEmpty)
                _buildPhotoGallery(context, photos),
              _buildProfileSection(
                context,
                title: '내 프로필',
                data: {
                  '이메일': user?.email,
                  '닉네임': publicProfile['name'],
                  '나이': publicProfile['age'],
                  '키': '${publicProfile['height_cm']} cm',
                  '지역': publicProfile['region_code'],
                  '직업': publicProfile['job'],
                  '학력': publicProfile['education'],
                  'MBTI': (publicProfile['mbti'] as List<dynamic>?)?.join(', '),
                },
              ),
              _buildProfileSection(
                context,
                title: '비공개 프로필',
                data: {
                  '재산 수준': privateProfile['wealth_level'],
                  '외모 자신감': privateProfile['look_confidence']?.toString(),
                  '몸매 자신감': privateProfile['body_confidence']?.toString(),
                },
              ),
              const Divider(),
              ListTile(
                leading: const Icon(Icons.edit),
                title: const Text('프로필 수정하기'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  // Populate draft with current data before navigating to edit
                  final draftNotifier = ref.read(draftProvider.notifier);
                  publicProfile.forEach((key, value) => draftNotifier.updateField(key, value));
                  privateProfile.forEach((key, value) => draftNotifier.updateField(key, value));
                  context.go('/profile-setup');
                },
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => Center(child: Text('프로필 정보를 불러오는데 실패했습니다: $err')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 2,
        onTap: (index) => _onBottomNavTapped(index, context),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.explore_outlined), activeIcon: Icon(Icons.explore), label: '피드'),
          BottomNavigationBarItem(icon: Icon(Icons.chat_bubble_outline), activeIcon: Icon(Icons.chat_bubble), label: '매칭'),
          BottomNavigationBarItem(icon: Icon(Icons.person_outline), activeIcon: Icon(Icons.person), label: '내 정보'),
        ],
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
      ),
    );
  }

  Widget _buildPhotoGallery(BuildContext context, List<dynamic> photos) {
    return Container(
      height: MediaQuery.of(context).size.width * 0.7,
      color: Colors.grey[200],
      child: PageView.builder(
        itemCount: photos.length,
        itemBuilder: (context, index) {
          return CachedNetworkImage(
            imageUrl: photos[index],
            fit: BoxFit.cover,
            placeholder: (context, url) => const Center(child: CircularProgressIndicator()),
            errorWidget: (context, url, error) => const Icon(Icons.error, color: Colors.red),
          );
        },
      ),
    );
  }

  Widget _buildProfileSection(BuildContext context, {required String title, required Map<String, dynamic> data}) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Card(
            elevation: 0,
            shape: RoundedRectangleBorder(
              side: BorderSide(color: Colors.grey.shade300, width: 1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: data.entries.where((entry) => entry.value != null).map((entry) {
                return ListTile(
                  dense: true,
                  title: Text(entry.key, style: const TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Text(entry.value.toString()),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }
}