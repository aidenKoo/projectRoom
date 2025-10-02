import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class WelcomePage extends StatelessWidget {
  const WelcomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              '💕 ProjectRoom',
              style: TextStyle(fontSize: 48, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            const Text(
              '안전하고 효율적인 매칭',
              style: TextStyle(fontSize: 20),
            ),
            const SizedBox(height: 48),
            ElevatedButton(
              onPressed: () => context.go('/signin'),
              child: const Text('시작하기'),
            ),
          ],
        ),
      ),
    );
  }
}
