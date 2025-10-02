import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// A simple model for our survey questions
class SurveyQuestion {
  final String id;
  final String category; // 'personality' or 'values'
  final String text;
  final List<String>? options;

  SurveyQuestion({required this.id, required this.category, required this.text, this.options});
}

class ValuesPage extends StatefulWidget {
  const ValuesPage({super.key});

  @override
  State<ValuesPage> createState() => _ValuesPageState();
}

class _ValuesPageState extends State<ValuesPage> {
  final _formKey = GlobalKey<FormState>();
  final Map<String, dynamic> _answers = {};
  bool _isLoading = false;

  // Define the survey questions
  final List<SurveyQuestion> _questions = [
    SurveyQuestion(
      id: 'weekend_activity',
      category: 'personality',
      text: '주말에 주로 무엇을 하며 시간을 보내시나요?',
      options: ['집에서 휴식', '친구들과 약속', '야외 활동', '자기계발'],
    ),
    SurveyQuestion(
      id: 'conflict_resolution',
      category: 'personality',
      text: '갈등이 생겼을 때 어떻게 해결하는 편인가요?',
    ),
    SurveyQuestion(
      id: 'life_value',
      category: 'values',
      text: '인생에서 가장 중요하게 생각하는 가치는 무엇인가요?',
    ),
    SurveyQuestion(
      id: 'financial_priority',
      category: 'values',
      text: '경제적인 부분에서 가장 중요하게 생각하는 것은 무엇인가요?',
      options: ['안정적인 수입', '높은 성장 가능성', '빚이 없는 상태'],
    ),
  ];

  Future<void> _submitSurvey() async {
    if (!_formKey.currentState!.validate()) return;
    _formKey.currentState!.save();

    setState(() => _isLoading = true);

    try {
      final Map<String, dynamic> personalityAnswers = {};
      final Map<String, dynamic> valuesAnswers = {};

      _answers.forEach((questionId, answer) {
        final question = _questions.firstWhere((q) => q.id == questionId);
        if (question.category == 'personality') {
          personalityAnswers[questionId] = answer;
        } else if (question.category == 'values') {
          valuesAnswers[questionId] = answer;
        }
      });

      final privateProfileData = {
        'personality_answers': personalityAnswers,
        'values_answers': valuesAnswers,
      };

      await apiService.upsertPrivateProfile(privateProfileData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('설문이 성공적으로 저장되었습니다.')),
        );
        context.go('/preferences-setup');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('설문 저장에 실패했습니다: $e')),
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
      appBar: AppBar(title: const Text('가치관 및 성격 설문')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(24.0),
              children: [
                const Text(
                  '마지막 단계입니다. (선택 사항)',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Text(
                  '이 정보는 더 좋은 사람을 추천해드리기 위해서만 사용돼요.',
                  style: TextStyle(fontSize: 16, color: Colors.grey.shade700),
                ),
                const SizedBox(height: 32),
                ..._buildQuestionWidgets(),
                const SizedBox(height: 32),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  onPressed: _isLoading ? null : _submitSurvey,
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

  List<Widget> _buildQuestionWidgets() {
    List<Widget> widgets = [];
    String? currentCategory;

    for (var question in _questions) {
      if (question.category != currentCategory) {
        currentCategory = question.category;
        widgets.add(Padding(
          padding: const EdgeInsets.only(top: 24.0, bottom: 8.0),
          child: Text(
            currentCategory == 'personality' ? '성격' : '가치관',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ));
      }

      widgets.add(Padding(
        padding: const EdgeInsets.only(bottom: 24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(question.text, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 12),
            if (question.options != null)
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(border: OutlineInputBorder()),
                hint: const Text('선택...'),
                items: question.options!.map((option) {
                  return DropdownMenuItem(value: option, child: Text(option));
                }).toList(),
                onChanged: (value) {
                  _answers[question.id] = value;
                },
                onSaved: (value) {
                  _answers[question.id] = value;
                },
              )
            else
              TextFormField(
                decoration: const InputDecoration(border: OutlineInputBorder(), hintText: '자유롭게 작성해주세요...'),
                maxLines: 2,
                onSaved: (value) {
                  _answers[question.id] = value?.trim() ?? '';
                },
              ),
          ],
        ),
      ));
    }
    return widgets;
  }
}