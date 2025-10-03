import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/widgets/labeled_slider.dart';
import '../../providers/draft_provider.dart';

/// Private profile form based on §3.3 requirements
/// All fields are optional - "자신 있는 부분만" 작성
class PrivateProfileForm extends ConsumerStatefulWidget {
  const PrivateProfileForm({super.key});

  @override
  ConsumerState<PrivateProfileForm> createState() => _PrivateProfileFormState();
}

class _PrivateProfileFormState extends ConsumerState<PrivateProfileForm> {
  // Wealth level
  String? _wealthLevel;

  // Confidence ratings (1-5 scale, default 3)
  double _lookConfidence = 3.0;
  double _bodyConfidence = 3.0;

  // Personality & values survey
  final Map<String, String> _personalityAnswers = {};
  final Map<String, String> _valuesAnswers = {};

  final List<String> _wealthOptions = [
    '중간',
    '꽤 많음',
    '많음',
  ];

  // Personality questions (최대 5문항)
  final List<SurveyQuestion> _personalityQuestions = [
    SurveyQuestion(
      id: 'intro_extro',
      question: '사람들과 어울리는 것을 좋아하시나요?',
      options: ['매우 내향적', '내향적', '중간', '외향적', '매우 외향적'],
    ),
    SurveyQuestion(
      id: 'schedule',
      question: '일상생활의 스타일은?',
      options: ['즉흥적', '약간 즉흥적', '중간', '계획적', '매우 계획적'],
    ),
    SurveyQuestion(
      id: 'conflict',
      question: '갈등 상황에서 어떻게 대처하나요?',
      options: ['회피', '수동적', '중립', '적극적 대화', '즉시 해결'],
    ),
    SurveyQuestion(
      id: 'expression',
      question: '감정 표현 스타일은?',
      options: ['매우 조심스러움', '조심스러움', '보통', '솔직함', '매우 솔직함'],
    ),
    SurveyQuestion(
      id: 'decision',
      question: '결정을 내릴 때 주로?',
      options: ['감정 우선', '감정 중시', '균형', '논리 중시', '논리 우선'],
    ),
  ];

  // Values questions (최대 5문항)
  final List<SurveyQuestion> _valuesQuestions = [
    SurveyQuestion(
      id: 'family',
      question: '가족의 중요도는?',
      options: ['낮음', '약간 낮음', '보통', '중요', '매우 중요'],
    ),
    SurveyQuestion(
      id: 'career',
      question: '커리어/성취의 중요도는?',
      options: ['낮음', '약간 낮음', '보통', '중요', '매우 중요'],
    ),
    SurveyQuestion(
      id: 'religion',
      question: '종교/신앙의 중요도는?',
      options: ['없음', '약간', '보통', '중요', '매우 중요'],
    ),
    SurveyQuestion(
      id: 'lifestyle',
      question: '라이프스타일 선호는?',
      options: ['집순이/집돌이', '약간 활동적', '균형', '활동적', '매우 활동적'],
    ),
    SurveyQuestion(
      id: 'future',
      question: '미래 계획에 대한 태도는?',
      options: ['현재 중시', '단기 계획', '중기 계획', '장기 계획', '구체적 계획'],
    ),
  ];

  @override
  void initState() {
    super.initState();
    _loadDraft();
  }

  void _loadDraft() {
    final draft = ref.read(draftProvider);
    if (draft.isEmpty) return;

    _wealthLevel = draft['wealth_level'];
    _lookConfidence = (draft['look_confidence'] ?? 3).toDouble();
    _bodyConfidence = (draft['body_confidence'] ?? 3).toDouble();

    final personality = draft['personality_answers'] as Map<String, dynamic>?;
    if (personality != null) {
      _personalityAnswers.addAll(personality.cast<String, String>());
    }

    final values = draft['values_answers'] as Map<String, dynamic>?;
    if (values != null) {
      _valuesAnswers.addAll(values.cast<String, String>());
    }
  }

  void _saveToDraft() {
    ref.read(draftProvider.notifier).updateAllFields({
      'wealth_level': _wealthLevel,
      'look_confidence': _lookConfidence.round(),
      'body_confidence': _bodyConfidence.round(),
      'personality_answers': _personalityAnswers,
      'values_answers': _valuesAnswers,
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return ListView(
      padding: const EdgeInsets.all(24.0),
      children: [
        // Privacy notice
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: theme.dividerColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.lock_outline, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text(
                    '비공개 영역',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                '비공개 영역은 선택 사항입니다. 자신 있는 부분만 작성하세요.\n'
                '이 정보는 매칭 품질 향상에만 사용되며 앱 내 공개되지 않습니다.',
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),

        _buildSectionTitle(context, '재산 수준 (선택)'),
        const SizedBox(height: 16),
        Column(
          children: _wealthOptions.map((option) {
            return RadioListTile<String>(
              title: Text(option),
              value: option,
              groupValue: _wealthLevel,
              onChanged: (value) {
                setState(() => _wealthLevel = value);
                _saveToDraft();
              },
              contentPadding: EdgeInsets.zero,
            );
          }).toList(),
        ),
        const SizedBox(height: 32),

        _buildSectionTitle(context, '자신감 평가 (선택)'),
        const SizedBox(height: 16),
        LabeledSlider(
          label: '외모 자신감',
          value: _lookConfidence,
          onChanged: (value) {
            setState(() => _lookConfidence = value);
            _saveToDraft();
          },
        ),
        const SizedBox(height: 24),
        LabeledSlider(
          label: '몸매 자신감',
          value: _bodyConfidence,
          onChanged: (value) {
            setState(() => _bodyConfidence = value);
            _saveToDraft();
          },
        ),
        const SizedBox(height: 32),

        _buildSectionTitle(context, '성격 설문 (선택)'),
        const SizedBox(height: 16),
        ..._personalityQuestions.map((q) => _buildSurveyQuestion(
          context,
          q,
          _personalityAnswers,
        )),
        const SizedBox(height: 32),

        _buildSectionTitle(context, '가치관 설문 (선택)'),
        const SizedBox(height: 16),
        ..._valuesQuestions.map((q) => _buildSurveyQuestion(
          context,
          q,
          _valuesAnswers,
        )),
        const SizedBox(height: 32),
      ],
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

  Widget _buildSurveyQuestion(
    BuildContext context,
    SurveyQuestion question,
    Map<String, String> answers,
  ) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question.question,
            style: theme.textTheme.bodyLarge?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: question.options.map((option) {
              final isSelected = answers[question.id] == option;
              return ChoiceChip(
                label: Text(option),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      answers[question.id] = option;
                    } else {
                      answers.remove(question.id);
                    }
                  });
                  _saveToDraft();
                },
                selectedColor: theme.colorScheme.primary.withOpacity(0.2),
                backgroundColor: theme.colorScheme.surface,
                side: BorderSide(
                  color: isSelected
                      ? theme.colorScheme.primary
                      : theme.dividerColor,
                  width: 1,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  bool validate() {
    // All fields are optional, so always return true
    return true;
  }
}

class SurveyQuestion {
  final String id;
  final String question;
  final List<String> options;

  SurveyQuestion({
    required this.id,
    required this.question,
    required this.options,
  });
}
