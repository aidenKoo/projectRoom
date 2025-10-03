import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'public_profile_form.dart';
import 'private_profile_form.dart';
import 'preferences_form.dart';
import '../../providers/draft_provider.dart';
import '../../services/api_service.dart';

/// Integrated research screen with tabs for public/private/preferences
/// Based on §2.2 requirements with auto-save functionality
class IntegratedResearchScreen extends ConsumerStatefulWidget {
  const IntegratedResearchScreen({super.key});

  @override
  ConsumerState<IntegratedResearchScreen> createState() => _IntegratedResearchScreenState();
}

class _IntegratedResearchScreenState extends ConsumerState<IntegratedResearchScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  bool _isLoading = false;
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      if (_tabController.indexIsChanging) {
        setState(() => _currentTab = _tabController.index);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _saveForLater() async {
    // Draft is already auto-saved via draft_provider
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('임시 저장되었습니다')),
    );
  }

  Future<void> _saveAndContinue() async {
    // If not on last tab, move to next tab
    if (_currentTab < 2) {
      _tabController.animateTo(_currentTab + 1);
      return;
    }

    // On last tab, submit all data
    setState(() => _isLoading = true);

    try {
      final draft = ref.read(draftProvider);

      // Submit public profile
      await apiService.upsertProfile({
        'display_name': draft['name'],
        'birth_year': DateTime.now().year - (draft['age'] ?? 25),
        'height': draft['height_cm'],
        'occupation': draft['job'],
        'education': draft['education'],
        'mbti': draft['mbti'],
        'hobbies': draft['hobbies'],
        'intro_text': draft['bio_highlight'],
        // TODO: Upload photos and add photo URLs
      });

      // Submit private profile if data exists
      if (draft['wealth_level'] != null ||
          draft['look_confidence'] != null ||
          draft['body_confidence'] != null) {
        await apiService.upsertPrivateProfile({
          'wealth_level': draft['wealth_level'],
          'appearance_rating': draft['look_confidence'],
          'body_rating': draft['body_confidence'],
          'personality_data': draft['personality_answers'],
          'values_data': draft['values_answers'],
        });
      }

      // Submit preferences
      if (draft['preference_items'] != null) {
        await apiService.updatePreferences({
          'items': draft['preference_items'],
          'weights': draft['preference_weights'],
        });
      }

      // Clear draft after successful submission
      await ref.read(draftProvider.notifier).clearAll();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('프로필이 성공적으로 저장되었습니다!')),
        );
        context.go('/feed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('저장 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  double _getProgress() {
    final draft = ref.watch(draftProvider);

    int completedFields = 0;
    int totalFields = 15; // Approximate total required fields

    // Public profile fields
    if (draft['name'] != null && draft['name'].toString().isNotEmpty) completedFields++;
    if (draft['age'] != null) completedFields++;
    if (draft['height_cm'] != null) completedFields++;
    if (draft['job'] != null && draft['job'].toString().isNotEmpty) completedFields++;
    if (draft['education'] != null) completedFields++;
    if (draft['mbti'] != null && (draft['mbti'] as List).isNotEmpty) completedFields++;
    if (draft['hobbies'] != null && (draft['hobbies'] as List).isNotEmpty) completedFields++;
    if (draft['region_code'] != null) completedFields++;
    if (draft['photos'] != null && (draft['photos'] as List).isNotEmpty) completedFields++;

    // Private profile fields (optional, but counted for progress)
    if (draft['wealth_level'] != null) completedFields++;
    if (draft['look_confidence'] != null) completedFields++;
    if (draft['body_confidence'] != null) completedFields++;

    // Preferences
    if (draft['preference_items'] != null &&
        (draft['preference_items'] as List).isNotEmpty) {
      completedFields += 3;
    }

    return completedFields / totalFields;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = _getProgress();

    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 작성'),
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(100),
          child: Column(
            children: [
              // Progress indicator
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '진행률',
                          style: theme.textTheme.bodySmall,
                        ),
                        Text(
                          '${(progress * 100).toInt()}%',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: progress,
                      backgroundColor: theme.dividerColor,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
              ),
              // Info banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: theme.colorScheme.surface,
                child: Row(
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 16,
                      color: theme.textTheme.bodyMedium?.color,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _getTabInfo(),
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                  ],
                ),
              ),
              // Tabs
              TabBar(
                controller: _tabController,
                tabs: const [
                  Tab(text: '공개'),
                  Tab(text: '비공개'),
                  Tab(text: '선호도'),
                ],
              ),
            ],
          ),
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          PublicProfileForm(),
          PrivateProfileForm(),
          PreferencesForm(),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(theme),
    );
  }

  String _getTabInfo() {
    switch (_currentTab) {
      case 0:
        return '공개 정보는 다른 사용자에게 보여집니다';
      case 1:
        return '비공개 정보는 매칭에만 사용되며 공개되지 않습니다 (선택사항)';
      case 2:
        return '선호도는 매칭 품질 향상에 사용됩니다';
      default:
        return '';
    }
  }

  Widget _buildBottomBar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: theme.dividerColor, width: 1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            TextButton(
              onPressed: _isLoading ? null : _saveForLater,
              child: const Text('나중에 작성'),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: _isLoading ? null : _saveAndContinue,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: _isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : Text(_currentTab < 2 ? '다음' : '완료'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
