import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Step 1: 월별 가입코드 입력
class SignupCodePage extends ConsumerStatefulWidget {
  const SignupCodePage({super.key});

  @override
  ConsumerState<SignupCodePage> createState() => _SignupCodePageState();
}

class _SignupCodePageState extends ConsumerState<SignupCodePage> {
  final _codeController = TextEditingController();
  final _referrerController = TextEditingController();
  bool _isValidating = false;
  String? _errorMessage;

  Future<void> _validateCode() async {
    if (_codeController.text.isEmpty) {
      setState(() => _errorMessage = '가입코드를 입력해주세요');
      return;
    }

    setState(() {
      _isValidating = true;
      _errorMessage = null;
    });

    try {
      final apiService = ref.read(apiServiceProvider);
      final response = await apiService.post('/codes/validate', {
        'code': _codeController.text.trim(),
      });

      if (response['valid'] == true) {
        // 코드 유효 → 다음 단계로
        if (mounted) {
          context.go('/signup/research');
        }
      } else {
        setState(() => _errorMessage = response['message'] ?? '유효하지 않은 코드입니다');
      }
    } catch (e) {
      setState(() => _errorMessage = '코드 검증에 실패했습니다');
    } finally {
      setState(() => _isValidating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('가입하기'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              const Text(
                '초대 코드를 입력해주세요',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                '매월 발급되는 초대 코드가 필요합니다',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 48),

              // 가입코드 입력
              TextField(
                controller: _codeController,
                decoration: InputDecoration(
                  labelText: '가입코드 *',
                  hintText: '예: 2025-10-ABC123',
                  errorText: _errorMessage,
                  border: const OutlineInputBorder(),
                  prefixIcon: const Icon(Icons.confirmation_number),
                ),
                textCapitalization: TextCapitalization.characters,
                onChanged: (_) => setState(() => _errorMessage = null),
              ),

              const SizedBox(height: 24),

              // 추천인 입력 (선택)
              TextField(
                controller: _referrerController,
                decoration: const InputDecoration(
                  labelText: '추천인 이름 (선택)',
                  hintText: '추천해준 분의 이름',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person_add),
                ),
              ),

              const Spacer(),

              // 다음 버튼
              ElevatedButton(
                onPressed: _isValidating ? null : _validateCode,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  backgroundColor: Colors.pink,
                  foregroundColor: Colors.white,
                ),
                child: _isValidating
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Text(
                        '다음',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),

              const SizedBox(height: 16),

              TextButton(
                onPressed: () => context.go('/signin'),
                child: const Text('이미 계정이 있으신가요?'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _codeController.dispose();
    _referrerController.dispose();
    super.dispose();
  }
}
