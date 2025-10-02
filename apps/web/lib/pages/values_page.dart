import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class ValuesPage extends StatefulWidget {
  const ValuesPage({super.key});

  @override
  State<ValuesPage> createState() => _ValuesPageState();
}

class _ValuesPageState extends State<ValuesPage> {
  final Map<String, int> _values = {
    '종교': 3,
    '정치': 3,
    '자녀': 3,
    '반려동물': 3,
    '음주': 3,
    '흡연': 3,
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('가치관 설정'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '중요한 가치관을 선택해주세요',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              '1 = 전혀 중요하지 않음, 5 = 매우 중요함',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            Expanded(
              child: ListView(
                children: _values.entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 24.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          entry.key,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        Slider(
                          value: entry.value.toDouble(),
                          min: 1,
                          max: 5,
                          divisions: 4,
                          label: entry.value.toString(),
                          onChanged: (value) {
                            setState(() {
                              _values[entry.key] = value.toInt();
                            });
                          },
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // TODO: Save values to API
                context.go('/photos');
              },
              child: const Text('다음'),
            ),
          ],
        ),
      ),
    );
  }
}
