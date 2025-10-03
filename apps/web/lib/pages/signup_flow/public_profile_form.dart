import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/widgets/multi_select_chip.dart';
import '../../core/widgets/photo_upload_grid.dart';
import '../../providers/draft_provider.dart';

/// Public profile form based on §3.2 requirements
/// Required fields: name, age, height, photos (≥1), job, education, MBTI, hobbies, region
class PublicProfileForm extends ConsumerStatefulWidget {
  const PublicProfileForm({super.key});

  @override
  ConsumerState<PublicProfileForm> createState() => _PublicProfileFormState();
}

class _PublicProfileFormState extends ConsumerState<PublicProfileForm> {
  final _formKey = GlobalKey<FormState>();

  // Controllers
  final _nameController = TextEditingController();
  final _ageController = TextEditingController();
  final _heightController = TextEditingController();
  final _jobController = TextEditingController();
  final _bioController = TextEditingController();

  // Selection state
  String? _education;
  List<String> _selectedMbti = [];
  List<String> _selectedHobbies = [];
  List<PhotoItem> _photos = [];
  String? _regionCode;
  bool _isLivingAlone = false;

  // Options
  final List<String> _educationOptions = ['고졸', '전문대졸', '대졸', '석사', '박사'];

  final List<String> _mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP',
    '모름',
  ];

  final List<String> _hobbiesOptions = [
    '운동', '독서', '영화감상', '음악감상', '요리',
    '여행', '사진', '게임', '등산', '캠핑',
    '카페투어', '맛집탐방', '미술', '악기연주', '댄스',
    '봉사활동', '반려동물', '패션', '코딩', '기타',
  ];

  final List<String> _regionOptions = [
    'SEOUL_GANGNAM', 'SEOUL_GANGBUK', 'SEOUL_GANGDONG', 'SEOUL_GANGSEO',
    'GYEONGGI_NORTH', 'GYEONGGI_SOUTH', 'INCHEON', 'BUSAN', 'DAEGU',
    'DAEJEON', 'GWANGJU', 'ULSAN', 'SEJONG', 'ETC',
  ];

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void _loadDraft() {
    final draft = ref.read(draftProvider);
    if (draft.isEmpty) return;

    _nameController.text = draft['name'] ?? '';
    _ageController.text = draft['age']?.toString() ?? '';
    _heightController.text = draft['height_cm']?.toString() ?? '';
    _jobController.text = draft['job'] ?? '';
    _bioController.text = draft['bio_highlight'] ?? '';
    _education = draft['education'];
    _selectedMbti = List<String>.from(draft['mbti'] ?? []);
    _selectedHobbies = List<String>.from(draft['hobbies'] ?? []);
    _regionCode = draft['region_code'];
    _isLivingAlone = draft['is_living_alone'] ?? false;
    // TODO: Load photos from draft if needed
  }

  void _saveToDraft() {
    ref.read(draftProvider.notifier).updateAllFields({
      'name': _nameController.text,
      'age': int.tryParse(_ageController.text),
      'height_cm': int.tryParse(_heightController.text),
      'job': _jobController.text,
      'bio_highlight': _bioController.text,
      'education': _education,
      'mbti': _selectedMbti,
      'hobbies': _selectedHobbies,
      'region_code': _regionCode,
      'is_living_alone': _isLivingAlone,
      'photos': _photos.map((p) => p.fileName).toList(),
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _jobController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          _buildSectionTitle(context, '기본 정보'),
          const SizedBox(height: 16),

          TextFormField(
            controller: _nameController,
            decoration: const InputDecoration(
              labelText: '이름',
              hintText: '실명 권장 (1~20자)',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return '이름을 입력해주세요';
              }
              if (value.length > 20) {
                return '이름은 20자 이내로 입력해주세요';
              }
              return null;
            },
            onChanged: (_) => _saveToDraft(),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _ageController,
            decoration: const InputDecoration(
              labelText: '나이',
              hintText: '19~60',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '나이를 입력해주세요';
              }
              final age = int.tryParse(value);
              if (age == null || age < 19 || age > 60) {
                return '19~60 사이의 나이를 입력해주세요';
              }
              return null;
            },
            onChanged: (_) => _saveToDraft(),
          ),
          const SizedBox(height: 16),

          TextFormField(
            controller: _heightController,
            decoration: const InputDecoration(
              labelText: '키 (cm)',
              hintText: '130~220',
              border: OutlineInputBorder(),
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            validator: (value) {
              if (value == null || value.isEmpty) {
                return '키를 입력해주세요';
              }
              final height = int.tryParse(value);
              if (height == null || height < 130 || height > 220) {
                return '130~220cm 사이의 키를 입력해주세요';
              }
              return null;
            },
            onChanged: (_) => _saveToDraft(),
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, '사진'),
          const SizedBox(height: 16),
          PhotoUploadGrid(
            photos: _photos,
            onPhotosChanged: (photos) {
              setState(() => _photos = photos);
              _saveToDraft();
            },
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, '직업 & 학력'),
          const SizedBox(height: 16),

          TextFormField(
            controller: _jobController,
            decoration: const InputDecoration(
              labelText: '직업',
              hintText: '예: 소프트웨어 엔지니어',
              border: OutlineInputBorder(),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return '직업을 입력해주세요';
              }
              if (value.length > 30) {
                return '직업은 30자 이내로 입력해주세요';
              }
              return null;
            },
            onChanged: (_) => _saveToDraft(),
          ),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _education,
            decoration: const InputDecoration(
              labelText: '학력',
              border: OutlineInputBorder(),
            ),
            items: _educationOptions.map((label) {
              return DropdownMenuItem(
                value: label,
                child: Text(label),
              );
            }).toList(),
            onChanged: (value) {
              setState(() => _education = value);
              _saveToDraft();
            },
            validator: (value) => value == null ? '학력을 선택해주세요' : null,
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, '성격 & 취미'),
          const SizedBox(height: 8),
          Text(
            'MBTI (1~2개 선택, 확신이 없으면 "모름" 선택)',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          MultiSelectChip(
            options: _mbtiOptions,
            selectedValues: _selectedMbti,
            maxSelections: 2,
            onChanged: (values) {
              setState(() => _selectedMbti = values);
              _saveToDraft();
            },
          ),
          const SizedBox(height: 24),

          Text(
            '취미 (1~5개 선택)',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 12),
          MultiSelectChip(
            options: _hobbiesOptions,
            selectedValues: _selectedHobbies,
            maxSelections: 5,
            onChanged: (values) {
              setState(() => _selectedHobbies = values);
              _saveToDraft();
            },
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, '지역'),
          const SizedBox(height: 16),

          DropdownButtonFormField<String>(
            value: _regionCode,
            decoration: const InputDecoration(
              labelText: '거주 지역',
              border: OutlineInputBorder(),
            ),
            items: _regionOptions.map((code) {
              return DropdownMenuItem(
                value: code,
                child: Text(_getRegionLabel(code)),
              );
            }).toList(),
            onChanged: (value) {
              setState(() => _regionCode = value);
              _saveToDraft();
            },
            validator: (value) => value == null ? '지역을 선택해주세요' : null,
          ),
          const SizedBox(height: 16),

          CheckboxListTile(
            title: const Text('자취 여부'),
            value: _isLivingAlone,
            onChanged: (value) {
              setState(() => _isLivingAlone = value ?? false);
              _saveToDraft();
            },
            contentPadding: EdgeInsets.zero,
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, '자기소개 (선택)'),
          const SizedBox(height: 16),

          TextFormField(
            controller: _bioController,
            decoration: const InputDecoration(
              labelText: '기타 장점 어필',
              hintText: '나를 표현할 수 있는 한 마디 (최대 300자)',
              border: OutlineInputBorder(),
            ),
            maxLines: 4,
            maxLength: 300,
            onChanged: (_) => _saveToDraft(),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Text(
      title,
      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.bold,
      ),
    );
  }

  String _getRegionLabel(String code) {
    const map = {
      'SEOUL_GANGNAM': '서울 강남',
      'SEOUL_GANGBUK': '서울 강북',
      'SEOUL_GANGDONG': '서울 강동',
      'SEOUL_GANGSEO': '서울 강서',
      'GYEONGGI_NORTH': '경기 북부',
      'GYEONGGI_SOUTH': '경기 남부',
      'INCHEON': '인천',
      'BUSAN': '부산',
      'DAEGU': '대구',
      'DAEJEON': '대전',
      'GWANGJU': '광주',
      'ULSAN': '울산',
      'SEJONG': '세종',
      'ETC': '기타',
    };
    return map[code] ?? code;
  }

  bool validate() {
    if (!_formKey.currentState!.validate()) {
      return false;
    }

    if (_photos.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 1장의 사진을 업로드해주세요')),
      );
      return false;
    }

    if (_selectedMbti.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('MBTI를 선택해주세요 (모르면 "모름" 선택)')),
      );
      return false;
    }

    if (_selectedHobbies.isEmpty || _selectedHobbies.length > 5) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('취미를 1~5개 선택해주세요')),
      );
      return false;
    }

    return true;
  }
}
