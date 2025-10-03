import 'package:flutter/material.dart';

/// Multi-select chip widget for selecting multiple options
/// Used for MBTI, hobbies, etc.
class MultiSelectChip extends StatelessWidget {
  const MultiSelectChip({
    super.key,
    required this.options,
    required this.selectedValues,
    required this.onChanged,
    this.maxSelections,
  });

  final List<String> options;
  final List<String> selectedValues;
  final ValueChanged<List<String>> onChanged;
  final int? maxSelections;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Wrap(
      spacing: 8.0,
      runSpacing: 8.0,
      children: options.map((option) {
        final isSelected = selectedValues.contains(option);
        final isDisabled = maxSelections != null &&
            !isSelected &&
            selectedValues.length >= maxSelections!;

        return FilterChip(
          label: Text(option),
          selected: isSelected,
          onSelected: isDisabled ? null : (selected) {
            final newValues = List<String>.from(selectedValues);
            if (selected) {
              newValues.add(option);
            } else {
              newValues.remove(option);
            }
            onChanged(newValues);
          },
          selectedColor: theme.colorScheme.primary.withOpacity(0.2),
          checkmarkColor: theme.colorScheme.primary,
          backgroundColor: theme.colorScheme.surface,
          side: BorderSide(
            color: isSelected
                ? theme.colorScheme.primary
                : theme.dividerColor,
            width: 1,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
          ),
        );
      }).toList(),
    );
  }
}
