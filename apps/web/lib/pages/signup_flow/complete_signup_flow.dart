import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../core/widgets/primary_button.dart';
import '../../services/api_service.dart';

/// Complete signup flow: Email/Password → Referrer → Monthly Code → Research
/// Based on §2.1 requirements
class CompleteSignupFlow extends ConsumerStatefulWidget {
  const CompleteSignupFlow({super.key});

  @override
  ConsumerState<CompleteSignupFlow> createState() => _CompleteSignupFlowState();
}

class _CompleteSignupFlowState extends ConsumerState<CompleteSignupFlow> {
  final _pageController = PageController();
  final _formKey = GlobalKey<FormState>();

  // Step 1: Email/Password
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // Step 2: Referrer (optional)
  final _referrerController = TextEditingController();

  // Step 3: Monthly code (required)
  final _codeController = TextEditingController();

  int _currentStep = 0;
  bool _isLoading = false;

  @override
  void dispose() {
    _pageController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _referrerController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _nextStep() async {
    if (_currentStep == 0) {
      if (!_formKey.currentState!.validate()) return;
      if (_passwordController.text != _confirmPasswordController.text) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('비밀번호가 일치하지 않습니다')),
        );
        return;
      }
    }

    if (_currentStep == 2) {
      // Validate monthly code
      await _validateAndSignup();
      return;
    }

    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _validateAndSignup() async {
    setState(() => _isLoading = true);

    try {
      // Step 1: Validate monthly code
      final codeValidation = await apiService.validateMonthlyCode(_codeController.text);
      if (!codeValidation['valid']) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('유효하지 않은 가입 코드입니다: ${codeValidation['error']}')),
          );
        }
        return;
      }

      // Step 2: Create Firebase Auth account
      final credential = await FirebaseAuth.instance.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      // Step 3: Submit referrer if provided
      if (_referrerController.text.trim().isNotEmpty) {
        await apiService.submitReferral(_referrerController.text.trim());
      }

      // Step 4: Navigate to research screen
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('가입이 완료되었습니다! 프로필을 작성해주세요.')),
        );
        context.go('/research');
      }
    } on FirebaseAuthException catch (e) {
      String message = '가입에 실패했습니다';
      if (e.code == 'email-already-in-use') {
        message = '이미 사용 중인 이메일입니다';
      } else if (e.code == 'weak-password') {
        message = '비밀번호가 너무 약합니다 (최소 6자)';
      } else if (e.code == 'invalid-email') {
        message = '유효하지 않은 이메일 형식입니다';
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('오류가 발생했습니다: $e')),
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
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _isLoading ? null : _previousStep,
              )
            : null,
        title: Text('회원가입 - ${_currentStep + 1}/3 단계'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 500),
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (step) {
              setState(() => _currentStep = step);
            },
            children: [
              _buildStep1(theme),
              _buildStep2(theme),
              _buildStep3(theme),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStep1(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              '계정 만들기',
              style: theme.textTheme.displaySmall,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            Text(
              '이메일과 비밀번호로 가입하세요',
              style: theme.textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 40),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: '이메일',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.email_outlined),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return '이메일을 입력해주세요';
                }
                if (!value.contains('@')) {
                  return '유효한 이메일을 입력해주세요';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: '비밀번호',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.lock_outlined),
                helperText: '최소 6자 이상',
              ),
              obscureText: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '비밀번호를 입력해주세요';
                }
                if (value.length < 6) {
                  return '비밀번호는 최소 6자 이상이어야 합니다';
                }
                return null;
              },
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: _confirmPasswordController,
              decoration: const InputDecoration(
                labelText: '비밀번호 확인',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.lock_outlined),
              ),
              obscureText: true,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '비밀번호 확인을 입력해주세요';
                }
                return null;
              },
            ),
            const SizedBox(height: 40),
            PrimaryButton(
              onPressed: _nextStep,
              text: '다음',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStep2(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '추천인 (선택)',
            style: theme.textTheme.displaySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            '추천인이 있다면 이름을 입력해주세요',
            style: theme.textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          TextFormField(
            controller: _referrerController,
            decoration: const InputDecoration(
              labelText: '추천인 이름',
              hintText: '예: 홍길동',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.person_outlined),
              helperText: '선택사항입니다',
            ),
          ),
          const SizedBox(height: 40),
          PrimaryButton(
            onPressed: _nextStep,
            text: '다음',
          ),
        ],
      ),
    );
  }

  Widget _buildStep3(ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            '가입 코드',
            style: theme.textTheme.displaySmall,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            '관리자로부터 받은 월별 가입 코드를 입력해주세요',
            style: theme.textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),
          TextFormField(
            controller: _codeController,
            decoration: const InputDecoration(
              labelText: '가입 코드',
              hintText: '2025-10-AB12CD',
              border: OutlineInputBorder(),
              prefixIcon: Icon(Icons.vpn_key_outlined),
            ),
            textCapitalization: TextCapitalization.characters,
          ),
          const SizedBox(height: 40),
          PrimaryButton(
            onPressed: _isLoading ? null : _nextStep,
            text: '가입 완료',
            isLoading: _isLoading,
          ),
        ],
      ),
    );
  }
}
