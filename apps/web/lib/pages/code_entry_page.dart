import '../services/api_service.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class CodeEntryPage extends StatefulWidget {
  const CodeEntryPage({super.key});

  @override
  State<CodeEntryPage> createState() => _CodeEntryPageState();
}

class _CodeEntryPageState extends State<CodeEntryPage> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _validateAndProceed() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() => _isLoading = true);

    try {
      // The backend should return a success response if the code is valid
      await apiService.validateCode(_codeController.text.trim());
      
      if (mounted) {
        // Navigate to the next step of the signup process
        context.go('/referral');
      }

    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('유효하지 않은 코드입니다. $e')),
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
      appBar: AppBar(
        title: const Text('가입 코드 입력'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    '관리자로부터 받은 가입 코드를 입력해주세요.',
                    style: TextStyle(fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  TextFormField(
                    controller: _codeController,
                    decoration: const InputDecoration(
                      labelText: '가입 코드',
                      border: OutlineInputBorder(),
                    ),
                    textAlign: TextAlign.center,
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return '코드를 입력해주세요.';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    onPressed: _isLoading ? null : _validateAndProceed,
                    child: _isLoading
                        ? const SizedBox(
                            height: 24,
                            width: 24,
                            child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white),
                          )
                        : const Text('확인'),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
