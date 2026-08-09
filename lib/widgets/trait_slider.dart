import 'package:flutter/material.dart';

class TraitSlider extends StatelessWidget {
  final String label;
  final String description;
  final double value;
  final ValueChanged<double> onChanged;
  final double min;
  final double max;
  final int divisions;

  const TraitSlider({
    super.key,
    required this.label,
    required this.description,
    required this.value,
    required this.onChanged,
    this.min = 1.0,
    this.max = 5.0,
    this.divisions = 4,
  });

  String get _valueLabel {
    switch (value.round()) {
      case 1:
        return 'Very Low';
      case 2:
        return 'Low';
      case 3:
        return 'Moderate';
      case 4:
        return 'High';
      case 5:
        return 'Very High';
      default:
        return 'Moderate';
    }
  }

  Color get _sliderColor {
    switch (value.round()) {
      case 1:
        return Colors.red[300]!;
      case 2:
        return Colors.orange[300]!;
      case 3:
        return Colors.yellow[600]!;
      case 4:
        return Colors.lightGreen[400]!;
      case 5:
        return Colors.green[500]!;
      default:
        return Colors.yellow[600]!;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with label and value
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: _sliderColor.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: _sliderColor),
                ),
                child: Text(
                  _valueLabel,
                  style: TextStyle(
                    color: _sliderColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Description
          Text(
            description,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  color: Colors.grey[600],
                ),
          ),
          const SizedBox(height: 16),

          // Slider
          SliderTheme(
            data: SliderTheme.of(context).copyWith(
              activeTrackColor: _sliderColor,
              inactiveTrackColor: _sliderColor.withOpacity(0.3),
              thumbColor: _sliderColor,
              overlayColor: _sliderColor.withOpacity(0.2),
              valueIndicatorColor: _sliderColor,
              valueIndicatorTextStyle: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w600,
              ),
              trackHeight: 6,
              thumbShape: const RoundSliderThumbShape(
                enabledThumbRadius: 12,
              ),
              overlayShape: const RoundSliderOverlayShape(
                overlayRadius: 20,
              ),
            ),
            child: Slider(
              value: value,
              min: min,
              max: max,
              divisions: divisions,
              label: _valueLabel,
              onChanged: onChanged,
            ),
          ),

          // Scale labels
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildScaleLabel('Very Low', 1),
                _buildScaleLabel('Low', 2),
                _buildScaleLabel('Moderate', 3),
                _buildScaleLabel('High', 4),
                _buildScaleLabel('Very High', 5),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildScaleLabel(String text, int scaleValue) {
    final isSelected = value.round() == scaleValue;

    return Text(
      text,
      style: TextStyle(
        fontSize: 10,
        color: isSelected ? _sliderColor : Colors.grey[500],
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
      ),
    );
  }
}
