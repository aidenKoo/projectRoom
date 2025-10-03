import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/draft_provider.dart';

/// Preferences ranking form based on §3.4 requirements
/// Users select top 1-5 preferences with drag-and-drop ranking
/// Weights are calculated automatically based on the number of selections
class PreferencesForm extends ConsumerStatefulWidget {
  const PreferencesForm({super.key});

  @override
  ConsumerState<PreferencesForm> createState() => _PreferencesFormState();
}

class _PreferencesFormState extends ConsumerState<PreferencesForm> {
  List<PreferenceItem> _rankedItems = [];

  final List<PreferenceCategory> _availableCategories = [
    PreferenceCategory(
      id: 'age_range',
      title: '나이대',
      description: '선호하는 나이 범위',
    ),
    PreferenceCategory(
      id: 'height_range',
      title: '키 범위',
      description: '선호하는 키 범위',
    ),
    PreferenceCategory(
      id: 'region',
      title: '지역',
      description: '선호하는 거주 지역',
    ),
    PreferenceCategory(
      id: 'occupation',
      title: '직업군',
      description: '선호하는 직업 분야',
    ),
    PreferenceCategory(
      id: 'education',
      title: '학력',
      description: '선호하는 학력 수준',
    ),
    PreferenceCategory(
      id: 'mbti',
      title: 'MBTI 상성',
      description: 'MBTI 궁합 중시',
    ),
    PreferenceCategory(
      id: 'hobbies',
      title: '취미 호환',
      description: '공통 취미 중시',
    ),
    PreferenceCategory(
      id: 'lifestyle',
      title: '라이프스타일',
      description: '생활 패턴 유사성',
    ),
    PreferenceCategory(
      id: 'personality',
      title: '성격 키워드',
      description: '성격 궁합 중시',
    ),
    PreferenceCategory(
      id: 'values',
      title: '가치관',
      description: '가치관 일치 중시',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void _loadDraft() {
    final draft = ref.read(draftProvider);
    final items = draft['preference_items'] as List<dynamic>?;

    if (items != null && items.isNotEmpty) {
      _rankedItems = items.map((item) {
        final category = _availableCategories.firstWhere(
          (c) => c.id == item['type'],
          orElse: () => _availableCategories.first,
        );
        return PreferenceItem(
          category: category,
          rank: item['rank'] ?? 0,
        );
      }).toList();
      _rankedItems.sort((a, b) => a.rank.compareTo(b.rank));
    }
  }

  void _saveToDraft() {
    final items = _rankedItems.asMap().entries.map((entry) {
      return {
        'rank': entry.key + 1,
        'type': entry.value.category.id,
        'value': null, // Will be filled with actual preference values later
      };
    }).toList();

    final weights = _calculateWeights(_rankedItems.length);

    ref.read(draftProvider.notifier).updateAllFields({
      'preference_items': items,
      'preference_weights': weights,
    });
  }

  List<double> _calculateWeights(int count) {
    // Based on §3.4 weight vectors
    switch (count) {
      case 1:
        return [1.00];
      case 2:
        return [0.60, 0.40];
      case 3:
        return [0.45, 0.35, 0.20];
      case 4:
        return [0.35, 0.30, 0.20, 0.15];
      case 5:
        return [0.30, 0.25, 0.20, 0.15, 0.10];
      default:
        return [];
    }
  }

  void _addPreference(PreferenceCategory category) {
    if (_rankedItems.length >= 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최대 5개까지 선택 가능합니다')),
      );
      return;
    }

    if (_rankedItems.any((item) => item.category.id == category.id)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('이미 선택된 항목입니다')),
      );
      return;
    }

    setState(() {
      _rankedItems.add(PreferenceItem(
        category: category,
        rank: _rankedItems.length + 1,
      ));
    });
    _saveToDraft();
  }

  void _removePreference(int index) {
    setState(() {
      _rankedItems.removeAt(index);
      // Update ranks
      for (int i = 0; i < _rankedItems.length; i++) {
        _rankedItems[i] = PreferenceItem(
          category: _rankedItems[i].category,
          rank: i + 1,
        );
      }
    });
    _saveToDraft();
  }

  void _reorderPreferences(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) {
        newIndex -= 1;
      }
      final item = _rankedItems.removeAt(oldIndex);
      _rankedItems.insert(newIndex, item);

      // Update ranks
      for (int i = 0; i < _rankedItems.length; i++) {
        _rankedItems[i] = PreferenceItem(
          category: _rankedItems[i].category,
          rank: i + 1,
        );
      }
    });
    _saveToDraft();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final weights = _calculateWeights(_rankedItems.length);

    return ListView(
      padding: const EdgeInsets.all(24.0),
      children: [
        // Instruction banner
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: theme.colorScheme.primary.withOpacity(0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.info_outline, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    '선호도 설정',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '최대 5가지까지 중요도 순으로 선택하세요.\n'
                '적게 선택할수록 각 항목의 가중치가 커집니다.',
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),

        // Ranked preferences
        if (_rankedItems.isEmpty)
          Container(
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: theme.dividerColor, style: BorderStyle.solid),
            ),
            child: Column(
              children: [
                Icon(
                  Icons.touch_app_outlined,
                  size: 48,
                  color: theme.textTheme.bodyMedium?.color,
                ),
                const SizedBox(height: 16),
                Text(
                  '아래에서 중요한 항목을 선택해주세요',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: theme.textTheme.bodyMedium?.color,
                  ),
                ),
              ],
            ),
          )
        else
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '선호도 순위 (드래그하여 순서 변경)',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ReorderableListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _rankedItems.length,
                onReorder: _reorderPreferences,
                itemBuilder: (context, index) {
                  final item = _rankedItems[index];
                  final weight = index < weights.length ? weights[index] : 0.0;

                  return _PreferenceRankCard(
                    key: ValueKey(item.category.id),
                    item: item,
                    weight: weight,
                    onRemove: () => _removePreference(index),
                  );
                },
              ),
            ],
          ),
        const SizedBox(height: 32),

        // Available categories
        Text(
          '선택 가능한 항목',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ..._availableCategories.map((category) {
          final isSelected = _rankedItems.any((item) => item.category.id == category.id);
          final isDisabled = _rankedItems.length >= 5 && !isSelected;

          return _CategoryCard(
            category: category,
            isSelected: isSelected,
            isDisabled: isDisabled,
            onTap: isSelected || isDisabled ? null : () => _addPreference(category),
          );
        }),
        const SizedBox(height: 32),
      ],
    );
  }

  bool validate() {
    if (_rankedItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 1개 이상의 선호도를 선택해주세요')),
      );
      return false;
    }
    return true;
  }
}

class PreferenceCategory {
  final String id;
  final String title;
  final String description;

  PreferenceCategory({
    required this.id,
    required this.title,
    required this.description,
  });
}

class PreferenceItem {
  final PreferenceCategory category;
  final int rank;

  PreferenceItem({
    required this.category,
    required this.rank,
  });
}

class _PreferenceRankCard extends StatelessWidget {
  const _PreferenceRankCard({
    super.key,
    required this.item,
    required this.weight,
    required this.onRemove,
  });

  final PreferenceItem item;
  final double weight;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: theme.colorScheme.primary,
          child: Text(
            '${item.rank}',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        title: Text(
          item.category.title,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(item.category.description),
            const SizedBox(height: 4),
            Text(
              '가중치: ${(weight * 100).toStringAsFixed(0)}%',
              style: TextStyle(
                color: theme.colorScheme.primary,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ],
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.drag_handle, color: theme.textTheme.bodyMedium?.color),
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: onRemove,
              color: theme.colorScheme.error,
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryCard extends StatelessWidget {
  const _CategoryCard({
    required this.category,
    required this.isSelected,
    required this.isDisabled,
    required this.onTap,
  });

  final PreferenceCategory category;
  final bool isSelected;
  final bool isDisabled;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      color: isSelected
          ? theme.colorScheme.primary.withOpacity(0.1)
          : isDisabled
              ? theme.colorScheme.surface.withOpacity(0.5)
              : theme.colorScheme.surface,
      child: ListTile(
        title: Text(
          category.title,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: isDisabled
                ? theme.textTheme.bodyMedium?.color
                : theme.textTheme.bodyLarge?.color,
          ),
        ),
        subtitle: Text(
          category.description,
          style: TextStyle(
            color: isDisabled
                ? theme.textTheme.bodyMedium?.color?.withOpacity(0.5)
                : theme.textTheme.bodyMedium?.color,
          ),
        ),
        trailing: isSelected
            ? Icon(Icons.check_circle, color: theme.colorScheme.primary)
            : isDisabled
                ? null
                : Icon(Icons.add_circle_outline, color: theme.colorScheme.primary),
        onTap: onTap,
        enabled: !isDisabled,
      ),
    );
  }
}
