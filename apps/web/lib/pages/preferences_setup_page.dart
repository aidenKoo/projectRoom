import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class PreferenceItem {
  final String type;
  final String name;

  PreferenceItem({required this.type, required this.name});

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is PreferenceItem && runtimeType == other.runtimeType && type == other.type;

  @override
  int get hashCode => type.hashCode;
}

class PreferencesSetupPage extends StatefulWidget {
  const PreferencesSetupPage({super.key});

  @override
  State<PreferencesSetupPage> createState() => _PreferencesSetupPageState();
}

class _PreferencesSetupPageState extends State<PreferencesSetupPage> {
  bool _isLoading = false;

  // Full list of available preference categories
  final List<PreferenceItem> _availablePreferences = [
    PreferenceItem(type: 'age_range', name: '나이'),
    PreferenceItem(type: 'height_range', name: '키'),
    PreferenceItem(type: 'region', name: '지역'),
    PreferenceItem(type: 'education_level', name: '학력'),
    PreferenceItem(type: 'mbti_compatibility', name: 'MBTI'),
    PreferenceItem(type: 'hobby_overlap', name: '취미'),
    PreferenceItem(type: 'look_style', name: '외모 스타일'),
    PreferenceItem(type: 'personality_keyword', name: '성격 키워드'),
  ];

  // User's selected and ranked preferences
  final List<PreferenceItem> _selectedPreferences = [];

  void _addPreference(PreferenceItem item) {
    if (_selectedPreferences.length < 5 && !_selectedPreferences.contains(item)) {
      setState(() {
        _selectedPreferences.add(item);
      });
    }
  }

  void _removePreference(PreferenceItem item) {
    setState(() {
      _selectedPreferences.remove(item);
    });
  }

  List<double> _getWeightVector(int count) {
    if (count <= 0) return [];
    if (count == 1) return [1.0];
    if (count == 2) return [0.60, 0.40];
    if (count == 3) return [0.45, 0.35, 0.20];
    if (count == 4) return [0.35, 0.30, 0.20, 0.15];
    return [0.30, 0.25, 0.20, 0.15, 0.10]; // Default for 5
  }

  Future<void> _submitPreferences() async {
    if (_selectedPreferences.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 1개 이상의 선호도를 선택해주세요.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final items = _selectedPreferences.asMap().entries.map((entry) {
        return {
          'rank': entry.key + 1,
          'type': entry.value.type,
          // The actual value for the preference would be set elsewhere
          'value': 'any' 
        };
      }).toList();

      final weights = _getWeightVector(_selectedPreferences.length);

      await apiService.upsertPreferences({
        'items': items,
        'weights': weights,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('선호도가 성공적으로 저장되었습니다!')),
        );
        context.go('/photos'); // Final step is photos
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('선호도 저장에 실패했습니다: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('선호도 랭킹 설정')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildDescription(),
            const SizedBox(height: 16),
            _buildAvailableChips(),
            const Divider(height: 32),
            _buildSelectedList(),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              onPressed: _isLoading ? null : _submitPreferences,
              child: _isLoading
                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
                  : const Text('저장하고 사진 올리기'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDescription() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue.shade50,
        borderRadius: BorderRadius.circular(12),
      ),
      child: RichText(
        textAlign: TextAlign.center,
        text: TextSpan(
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.blue.shade800),
          children: const [
            TextSpan(text: '최대 5가지까지 '),
            TextSpan(text: '중요도 순서', style: TextStyle(fontWeight: FontWeight.bold)),
            TextSpan(text: '로 선택하고 정렬하세요. '),
            TextSpan(text: '적게 선택할수록', style: TextStyle(fontWeight: FontWeight.bold, fontStyle: FontStyle.italic)),
            TextSpan(text: ' 각 항목의 가중치가 커집니다.'),
          ],
        ),
      ),
    );
  }

  Widget _buildAvailableChips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('선택 가능한 선호도', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: _availablePreferences.map((item) {
            final isSelected = _selectedPreferences.contains(item);
            return ActionChip(
              label: Text(item.name),
              onPressed: isSelected ? null : () => _addPreference(item),
              backgroundColor: isSelected ? Colors.grey.shade300 : Colors.white,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildSelectedList() {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('나의 Top ${_selectedPreferences.length} (드래그해서 순서 변경)', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Expanded(
            child: _selectedPreferences.isEmpty
                ? const Center(child: Text('아래에서 선호도를 선택해주세요.'))
                : ReorderableListView(
                    onReorder: (oldIndex, newIndex) {
                      setState(() {
                        if (newIndex > oldIndex) newIndex -= 1;
                        final item = _selectedPreferences.removeAt(oldIndex);
                        _selectedPreferences.insert(newIndex, item);
                      });
                    },
                    children: _selectedPreferences.map((item) {
                      return Card(
                        key: ValueKey(item.type),
                        child: ListTile(
                          leading: const Icon(Icons.drag_handle),
                          title: Text(item.name),
                          trailing: IconButton(
                            icon: const Icon(Icons.remove_circle_outline, color: Colors.red),
                            onPressed: () => _removePreference(item),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
          ),
        ],
      ),
    );
  }
}