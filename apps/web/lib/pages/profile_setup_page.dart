import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers/draft_provider.dart';
import '../services/api_service.dart';

class ProfileSetupPage extends ConsumerStatefulWidget {
  const ProfileSetupPage({super.key});

  @override
  ConsumerState<ProfileSetupPage> createState() => _ProfileSetupPageState();
}

class _ProfileSetupPageState extends ConsumerState<ProfileSetupPage> {
  final _formKey = GlobalKey<FormState>();
  final _displayNameController = TextEditingController();
  final _birthYearController = TextEditingController();
  final _heightController = TextEditingController();
  final _occupationController = TextEditingController();
  final _educationController = TextEditingController();
  String? _mbtiValue;
  final _hobbiesController = TextEditingController();
  final _introController = TextEditingController();

  bool _isLoading = false;

  final List<String> _mbtiOptions = [
    'INTJ', 'INTP', 'ENTJ', 'ENTP',
    'INFJ', 'INFP', 'ENFJ', 'ENFP',
    'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
    'ISTP', 'ISFP', 'ESTP', 'ESFP'
  ];

  @override
  void initState() {
    super.initState();
    // Load initial data from draft
    final draft = ref.read(draftProvider);
    _displayNameController.text = draft['display_name'] ?? '';
    _birthYearController.text = draft['birth_year']?.toString() ?? '';
    _heightController.text = draft['height']?.toString() ?? '';
    _occupationController.text = draft['occupation'] ?? '';
    _educationController.text = draft['education'] ?? '';
    _mbtiValue = draft['mbti'];
    _hobbiesController.text = (draft['hobbies'] as List<dynamic>?)?.join(', ') ?? '';
    _introController.text = draft['intro_text'] ?? '';

    // Add listeners to auto-save
    _displayNameController.addListener(() => _updateDraft('display_name', _displayNameController.text));
    _birthYearController.addListener(() => _updateDraft('birth_year', int.tryParse(_birthYearController.text)));
    _heightController.addListener(() => _updateDraft('height', int.tryParse(_heightController.text)));
    _occupationController.addListener(() => _updateDraft('occupation', _occupationController.text));
    _educationController.addListener(() => _updateDraft('education', _educationController.text));
    _hobbiesController.addListener(() => _updateDraft('hobbies', _hobbiesController.text.split(',').map((e) => e.trim()).toList()));
    _introController.addListener(() => _updateDraft('intro_text', _introController.text));
  }

  void _updateDraft(String key, dynamic value) {
    ref.read(draftProvider.notifier).updateField(key, value);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _birthYearController.dispose();
    _heightController.dispose();
    _occupationController.dispose();
    _educationController.dispose();
    _hobbiesController.dispose();
    _introController.dispose();
    super.dispose();
  }

  Future<void> _submitProfile() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      try {
        // Data is already in the draft provider, so we can just read from there
        final profileData = ref.read(draftProvider);
        
        await apiService.upsertProfile(profileData);

        // Clear only the fields for this page from the draft, 
        // allowing other draft data to persist for the next steps.
        // Or clear the whole draft if this is the final step.
        // For now, we assume we move to the next step, so we don't clear.

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('프로필이 성공적으로 저장되었습니다!')),
          );
          context.go('/private-profile-setup');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('프로필 저장에 실패했습니다: $e')),
          );
        }
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('프로필 설정 (공개)')),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                TextFormField(
                  controller: _displayNameController,
                  decoration: const InputDecoration(labelText: '닉네임'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return '닉네임을 입력해주세요.';
                    }
                    if (value.length > 20) {
                      return '닉네임은 20자 이내로 입력해주세요.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _birthYearController,
                  decoration: const InputDecoration(labelText: '출생 연도 (YYYY)'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return '출생 연도를 입력해주세요.';
                    }
                    final year = int.tryParse(value);
                    if (year == null || year < 1950 || year > DateTime.now().year - 18) {
                      return '유효한 출생 연도를 입력해주세요.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _heightController,
                  decoration: const InputDecoration(labelText: '키 (cm)'),
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return '키를 입력해주세요.';
                    }
                    final height = int.tryParse(value);
                    if (height == null || height < 100 || height > 250) {
                      return '유효한 키를 입력해주세요.';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _occupationController,
                  decoration: const InputDecoration(labelText: '직업'),
                  validator: (value) => (value == null || value.trim().isEmpty) ? '직업을 입력해주세요.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _educationController,
                  decoration: const InputDecoration(labelText: '학력'),
                  validator: (value) => (value == null || value.trim().isEmpty) ? '학력을 입력해주세요.' : null,
                ),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: _mbtiValue,
                  decoration: const InputDecoration(labelText: 'MBTI'),
                  items: _mbtiOptions.map((String value) {
                    return DropdownMenuItem<String>(
                      value: value,
                      child: Text(value),
                    );
                  }).toList(),
                  onChanged: (newValue) {
                    setState(() {
                      _mbtiValue = newValue;
                    });
                    _updateDraft('mbti', newValue);
                  },
                  validator: (value) => value == null ? 'MBTI를 선택해주세요.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _hobbiesController,
                  decoration: const InputDecoration(labelText: '취미 (쉼표로 구분)', hintText: '예: 독서, 영화감상, 코딩'),
                  validator: (value) => (value == null || value.trim().isEmpty) ? '취미를 하나 이상 입력해주세요.' : null,
                ),
                const SizedBox(height: 16),
                TextFormField(
                  controller: _introController,
                  decoration: const InputDecoration(labelText: '자기소개 (선택사항)', border: OutlineInputBorder()),
                  maxLines: 4,
                  maxLength: 200,
                ),
                const SizedBox(height: 32),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  onPressed: _isLoading ? null : _submitProfile,
                  child: _isLoading
                      ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white))
                      : const Text('저장하고 계속하기'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}