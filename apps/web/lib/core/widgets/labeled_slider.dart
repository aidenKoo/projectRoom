import 'package:flutter/material.dart';

/// Labeled slider widget for selecting values on a scale
/// Used for confidence ratings (외모/몸매 자신감)
class LabeledSlider extends StatelessWidget {
  const LabeledSlider({
    super.key,
    required this.label,
    required this.value,
    required this.onChanged,
    this.min = 1,
    this.max = 5,
    this.divisions = 4,
    this.minLabel = '낮음',
    this.maxLabel = '높음',
  });

  final String label;
  final double value;
  final ValueChanged<double> onChanged;
  final double min;
  final double max;
  final int divisions;
  final String minLabel;
  final String maxLabel;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(
              minLabel,
              style: theme.textTheme.bodySmall,
            ),
            Expanded(
              child: Slider(
                value: value,
                min: min,
                max: max,
                divisions: divisions,
                label: value.round().toString(),
                onChanged: onChanged,
              ),
            ),
            Text(
              maxLabel,
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        Center(
          child: Text(
            value.round().toString(),
            style: theme.textTheme.headlineMedium?.copyWith(
              color: theme.colorScheme.primary,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
