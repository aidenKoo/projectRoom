import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Step 2: 가입 리서치 페이지 (공개/비공개 설문 + 선호도)
class ResearchPage extends ConsumerStatefulWidget {
  const ResearchPage({super.key});

  @override
  ConsumerState<ResearchPage> createState() => _ResearchPageState();
}

class _ResearchPageState extends ConsumerState<ResearchPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentTab = 0;

  // 공개 프로필 데이터
  final _nameController = TextEditingController();
  int? _age;
  int? _height;
  String? _job;
  String? _education;
  List<String> _selectedMbti = [];
  List<String> _selectedHobbies = [];
  String? _region;
  bool _isLivingAlone = false;
  final _bioController = TextEditingController();

  // 비공개 데이터
  String? _wealthLevel;
  double _lookConfidence = 3.0;
  double _bodyConfidence = 3.0;

  // 선호도 데이터
  List<PreferenceItem> _preferences = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _tabController.addListener(() {
      setState(() => _currentTab = _tabController.index);
    });
  }

  double get _progress {
    // 간단한 진행률 계산 (예시)
    return (_currentTab + 1) / 3;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 작성'),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: '공개 정보'),
            Tab(text: '비공개 정보'),
            Tab(text: '선호도'),
          ],
        ),
      ),
      body: Column(
        children: [
          // 진행률 표시
          LinearProgressIndicator(
            value: _progress,
            backgroundColor: Colors.grey[200],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.pink),
          ),

          // 안내 배너
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            color: _currentTab == 0 ? Colors.blue[50] : Colors.orange[50],
            child: Row(
              children: [
                Icon(
                  _currentTab == 0 ? Icons.public : Icons.lock,
                  color: _currentTab == 0 ? Colors.blue : Colors.orange,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    _currentTab == 0
                        ? '공개영역은 다른 사용자에게 보여집니다.'
                        : _currentTab == 1
                            ? '비공개영역은 매칭 품질 향상에만 사용되며 앱에 공개되지 않습니다. 자신 있는 부분만 작성하세요.'
                            : '최대 5가지까지 중요도 순으로 선택하세요. 적게 선택할수록 각 항목의 가중치가 커집니다.',
                    style: const TextStyle(fontSize: 14),
                  ),
                ),
              ],
            ),
          ),

          // 탭 컨텐츠
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildPublicTab(),
                _buildPrivateTab(),
                _buildPreferencesTab(),
              ],
            ),
          ),

          // 하단 고정 바
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: const Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                if (_currentTab > 0)
                  TextButton(
                    onPressed: () => _tabController.animateTo(_currentTab - 1),
                    child: const Text('이전'),
                  ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    // TODO: 임시 저장
                  },
                  child: const Text('나중에 작성'),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: _currentTab == 2 ? _submit : _nextTab,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.pink,
                    foregroundColor: Colors.white,
                  ),
                  child: Text(_currentTab == 2 ? '완료' : '다음'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPublicTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: '이름 *',
            hintText: '실명 권장',
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: TextField(
                decoration: const InputDecoration(
                  labelText: '나이 *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                onChanged: (v) => _age = int.tryParse(v),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: TextField(
                decoration: const InputDecoration(
                  labelText: '키 (cm) *',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
                onChanged: (v) => _height = int.tryParse(v),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        TextField(
          decoration: const InputDecoration(
            labelText: '직업',
            border: OutlineInputBorder(),
          ),
          onChanged: (v) => _job = v,
        ),
        const SizedBox(height: 16),

        DropdownButtonFormField<String>(
          value: _education,
          decoration: const InputDecoration(
            labelText: '학력',
            border: OutlineInputBorder(),
          ),
          items: ['고졸', '전문대졸', '대졸', '석사', '박사']
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: (v) => setState(() => _education = v),
        ),
        const SizedBox(height: 16),

        const Text('MBTI (1~2개)', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: ['INTJ', 'ENFP', 'ISTP', 'ESFJ', '모름']
              .map((mbti) => FilterChip(
                    label: Text(mbti),
                    selected: _selectedMbti.contains(mbti),
                    onSelected: (selected) {
                      setState(() {
                        if (selected && _selectedMbti.length < 2) {
                          _selectedMbti.add(mbti);
                        } else {
                          _selectedMbti.remove(mbti);
                        }
                      });
                    },
                  ))
              .toList(),
        ),
        const SizedBox(height: 16),

        const Text('취미 (1~5개)', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: ['테니스', '등산', '카페', '영화', '독서', '요리', '여행', '음악', '운동']
              .map((hobby) => FilterChip(
                    label: Text(hobby),
                    selected: _selectedHobbies.contains(hobby),
                    onSelected: (selected) {
                      setState(() {
                        if (selected && _selectedHobbies.length < 5) {
                          _selectedHobbies.add(hobby);
                        } else {
                          _selectedHobbies.remove(hobby);
                        }
                      });
                    },
                  ))
              .toList(),
        ),
        const SizedBox(height: 16),

        SwitchListTile(
          title: const Text('자취 여부'),
          value: _isLivingAlone,
          onChanged: (v) => setState(() => _isLivingAlone = v),
        ),
        const SizedBox(height: 16),

        TextField(
          controller: _bioController,
          decoration: const InputDecoration(
            labelText: '기타 장점 어필 (선택)',
            hintText: '최대 300자',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
          maxLength: 300,
        ),
      ],
    );
  }

  Widget _buildPrivateTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text(
          '✨ 비공개 정보는 선택사항입니다',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          '자신 있는 부분만 작성하세요. 이 정보는 매칭 품질 향상에만 사용되며 앱 내 공개되지 않습니다.',
          style: TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 32),

        const Text('재산 수준', style: TextStyle(fontSize: 16)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: ['중간', '꽤 많음', '많음']
              .map((level) => ChoiceChip(
                    label: Text(level),
                    selected: _wealthLevel == level,
                    onSelected: (selected) {
                      setState(() => _wealthLevel = selected ? level : null);
                    },
                  ))
              .toList(),
        ),
        const SizedBox(height: 24),

        Text('외모 자신감: ${_lookConfidence.toInt()}'),
        Slider(
          value: _lookConfidence,
          min: 1,
          max: 5,
          divisions: 4,
          label: _lookConfidence.toInt().toString(),
          onChanged: (v) => setState(() => _lookConfidence = v),
        ),
        const SizedBox(height: 16),

        Text('몸매 자신감: ${_bodyConfidence.toInt()}'),
        Slider(
          value: _bodyConfidence,
          min: 1,
          max: 5,
          divisions: 4,
          label: _bodyConfidence.toInt().toString(),
          onChanged: (v) => setState(() => _bodyConfidence = v),
        ),
      ],
    );
  }

  Widget _buildPreferencesTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        const Text(
          '💗 선호하는 조건을 선택하세요',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          '최대 5가지까지 중요도 순으로 선택하세요.\n적게 선택할수록 각 항목의 가중치가 커집니다.',
          style: TextStyle(color: Colors.grey),
        ),
        const SizedBox(height: 32),

        if (_preferences.isEmpty)
          Center(
            child: Column(
              children: [
                const Icon(Icons.add_circle_outline, size: 64, color: Colors.grey),
                const SizedBox(height: 16),
                const Text('선호 조건을 추가해주세요', style: TextStyle(color: Colors.grey)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _addPreference,
                  icon: const Icon(Icons.add),
                  label: const Text('조건 추가'),
                ),
              ],
            ),
          )
        else
          Column(
            children: [
              ...List.generate(_preferences.length, (index) {
                final pref = _preferences[index];
                return Card(
                  child: ListTile(
                    leading: CircleAvatar(child: Text('${index + 1}')),
                    title: Text(pref.type),
                    subtitle: Text(pref.value),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete),
                      onPressed: () {
                        setState(() => _preferences.removeAt(index));
                      },
                    ),
                  ),
                );
              }),
              if (_preferences.length < 5)
                ElevatedButton.icon(
                  onPressed: _addPreference,
                  icon: const Icon(Icons.add),
                  label: const Text('조건 추가'),
                ),
            ],
          ),
      ],
    );
  }

  void _addPreference() {
    // TODO: 선호 조건 추가 다이얼로그
    setState(() {
      _preferences.add(PreferenceItem(
        type: '나이대',
        value: '27-33세',
      ));
    });
  }

  void _nextTab() {
    if (_currentTab < 2) {
      _tabController.animateTo(_currentTab + 1);
    }
  }

  void _submit() {
    // TODO: API 제출
    context.go('/feed');
  }

  @override
  void dispose() {
    _tabController.dispose();
    _nameController.dispose();
    _bioController.dispose();
    super.dispose();
  }
}

class PreferenceItem {
  final String type;
  final String value;

  PreferenceItem({required this.type, required this.value});
}
