import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:projectroom_web/core/widgets/primary_button.dart';
import 'package:projectroom_web/core/widgets/custom_text_field.dart';

class SignupScreen extends StatefulWidget {
  const SignupScreen({super.key});

  @override
  State<SignupScreen> createState() => _SignupScreenState();
}

class _SignupScreenState extends State<SignupScreen> {
  final _pageController = PageController();
  final _formKeyStep1 = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _referrerController = TextEditingController();
  final _codeController = TextEditingController();

  int _currentStep = 0;

  @override
  void dispose() {
    _pageController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _referrerController.dispose();
    _codeController.dispose();
    super.dispose();
  }

  void _nextStep() {
    // TODO: Add validation before going to next step
    if (_currentStep < 2) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.ease,
      );
    }
  }

  void _previousStep() {
    if (_currentStep > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.ease,
      );
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
                onPressed: _previousStep,
              )
            : null,
        title: Text('Sign Up - Step ${_currentStep + 1} of 3'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: PageView(
            controller: _pageController,
            physics: const NeverScrollableScrollPhysics(),
            onPageChanged: (step) {
              setState(() {
                _currentStep = step;
              });
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
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Create your account', style: theme.textTheme.displaySmall),
          const SizedBox(height: 40),
          CustomTextField(controller: _emailController, hintText: 'Email'),
          const SizedBox(height: 20),
          CustomTextField(controller: _passwordController, hintText: 'Password', obscureText: true),
          const SizedBox(height: 40),
          PrimaryButton(onPressed: _nextStep, text: 'Continue'),
        ],
      ),
    );
  }

  Widget _buildStep2(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Referrer (Optional)', style: theme.textTheme.displaySmall),
          const SizedBox(height: 40),
          CustomTextField(controller: _referrerController, hintText: 'Referrer Name'),
          const SizedBox(height: 40),
          PrimaryButton(onPressed: _nextStep, text: 'Continue'),
        ],
      ),
    );
  }

  Widget _buildStep3(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Monthly Code', style: theme.textTheme.displaySmall),
          const SizedBox(height: 40),
          CustomTextField(controller: _codeController, hintText: 'Enter your code'),
          const SizedBox(height: 40),
          PrimaryButton(
            onPressed: () {
              // TODO: Finalize signup logic
              context.go('/research');
            },
            text: 'Finish Signup',
          ),
        ],
      ),
    );
  }
}