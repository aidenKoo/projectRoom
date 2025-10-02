import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../services/api_service.dart';

enum WealthLevel { mid, quite_high, high }

// Helper to give user-friendly names to enum values
extension WealthLevelExtension on WealthLevel {
  String get displayName {
    switch (this) {
      case WealthLevel.mid:
        return '평균';
      case WealthLevel.quite_high:
        return '상위';
      case WealthLevel.high:
        return '최상위';
      default:
        return '';
    }
  }
}

class PrivateProfileSetupPage extends StatefulWidget {
  const PrivateProfileSetupPage({super.key});

  @override
  State<PrivateProfileSetupPage> createState() => _PrivateProfileSetupPageState();
}

class _PrivateProfileSetupPageState extends State<PrivateProfileSetupPage> {
  WealthLevel? _selectedWealthLevel;
  double _lookConfidence = 3;
  double _bodyConfidence = 3;

  bool _isLoading = false;

  Future<void> _submitProfile() async {
    setState(() => _isLoading = true);

    try {
      final privateProfileData = {
        if (_selectedWealthLevel != null) 'wealth_level': _selectedWealthLevel!.name,
        'look_confidence': _lookConfidence.round(),
        'body_confidence': _bodyConfidence.round(),
      };

      // Only submit if at least one value is provided.
      if (privateProfileData.isNotEmpty) {
        await apiService.upsertPrivateProfile(privateProfileData);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('비공개 프로필이 저장되었습니다.')),
        );
        // The next step in the flow is the values/personality survey
        context.go('/values');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('비공개 프로필 저장에 실패했습니다: $e')),
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
      appBar: AppBar(title: const Text('프로필 설정 (비공개)')),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.blue.shade50,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: RichText(
                      textAlign: TextAlign.center,
                      text: TextSpan(
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.blue.shade800),
                        children: const [
                          TextSpan(text: '비공개 영역은 '),
                          TextSpan(text: '선택 사항', style: TextStyle(fontWeight: FontWeight.bold)),
                          TextSpan(text: '입니다. '),
                          TextSpan(text: '자신 있는 부분만', style: TextStyle(fontStyle: FontStyle.italic, fontWeight: FontWeight.bold)),
                          TextSpan(text: ' 작성하세요. 이 정보는 매칭 품질 향상에만 사용되며 앱 내에 공개되지 않습니다.'),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Wealth Level
                  const Text('재산 수준', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<WealthLevel>(
                    value: _selectedWealthLevel,
                    decoration: const InputDecoration(border: OutlineInputBorder(), hintText: '선택 안 함'),
                    items: WealthLevel.values.map((level) {
                      return DropdownMenuItem(
                        value: level,
                        child: Text(level.displayName),
                      );
                    }).toList(),
                    onChanged: (value) => setState(() => _selectedWealthLevel = value),
                  ),
                  const SizedBox(height: 32),

                  // Look Confidence
                  Text('외모 자신감: ${_lookConfidence.round()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Slider(
                    value: _lookConfidence,
                    min: 1,
                    max: 5,
                    divisions: 4,
                    label: _lookConfidence.round().toString(),
                    onChanged: (value) => setState(() => _lookConfidence = value),
                  ),
                  const SizedBox(height: 32),

                  // Body Confidence
                  Text('몸매 자신감: ${_bodyConfidence.round()}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Slider(
                    value: _bodyConfidence,
                    min: 1,
                    max: 5,
                    divisions: 4,
                    label: _bodyConfidence.round().toString(),
                    onChanged: (value) => setState(() => _bodyConfidence = value),
                  ),
                  const SizedBox(height: 40),

                  // Action Button
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
      ),
    );
  }
}