import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:projectroom_web/core/widgets/primary_button.dart';
import 'package:projectroom_web/core/widgets/custom_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() {
    if (_formKey.currentState!.validate()) {
      // TODO: Implement login logic
      print('Email: ${_emailController.text}');
      print('Password: ${_passwordController.text}');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  'Project Room', // Placeholder for Logo
                  textAlign: TextAlign.center,
                  style: theme.textTheme.displayMedium,
                ),
                const SizedBox(height: 40),
                const CustomTextField(
                  hintText: 'Email',
                ),
                const SizedBox(height: 20),
                const CustomTextField(
                  hintText: 'Password',
                  obscureText: true,
                ),
                const SizedBox(height: 40),
                PrimaryButton(
                  onPressed: _login,
                  text: 'Login',
                ),
                const SizedBox(height: 20),
                TextButton(
                  onPressed: () => context.go('/signup'),
                  child: Text(
                    'Don\'t have an account? Sign Up',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}