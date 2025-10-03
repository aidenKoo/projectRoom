
import 'package:flutter/material.dart';
import 'package:projectroom_web/core/widgets/custom_text_field.dart';

class PublicProfileForm extends StatefulWidget {
  const PublicProfileForm({super.key});

  @override
  State<PublicProfileForm> createState() => _PublicProfileFormState();
}

class _PublicProfileFormState extends State<PublicProfileForm> {
  final _formKey = GlobalKey<FormState>();

  Widget _buildMbtiSelector() {
    return const Text('MBTI Selector Placeholder');
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          _buildSectionTitle(context, 'Basic Information'),
          const CustomTextField(hintText: 'Name (1-20 characters)'),
          const SizedBox(height: 16),
          const CustomTextField(hintText: 'Age (19-60)'),
          const SizedBox(height: 16),
          const CustomTextField(hintText: 'Height in cm (130-220)'),
          const SizedBox(height: 32),

          _buildSectionTitle(context, 'Photos'),
          // Placeholder for Image Picker
          OutlinedButton.icon(
            icon: const Icon(Icons.add_a_photo_outlined),
            onPressed: () { /* TODO: Implement image picker */ },
            label: const Text('Upload 1 to 5 photos'),
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, 'Career & Education'),
          const CustomTextField(hintText: 'Job (e.g., Software Engineer)'),
          const SizedBox(height: 16),
          // Placeholder for Dropdown
          DropdownButtonFormField<String>(
            decoration: const InputDecoration(
              labelText: 'Education',
              border: OutlineInputBorder(),
            ),
            items: ['고졸', '전문', '대졸', '석사', '박사']
                .map((label) => DropdownMenuItem(
                      child: Text(label),
                      value: label,
                    ))
                .toList(),
            onChanged: (value) {
              // TODO: Handle state change
            },
          ),
          const SizedBox(height: 32),

          _buildSectionTitle(context, 'Lifestyle & Personality'),
          // Placeholder for Multi-select
          _buildMbtiSelector(),
          const SizedBox(height: 16),
          // Placeholder for Checkboxes
          const Text('Hobbies: Checkbox group placeholder'),
          const SizedBox(height: 16),
          const CustomTextField(hintText: 'Region (e.g., Seoul, Gangnam)'),
          const SizedBox(height: 32),

          _buildSectionTitle(context, 'Bio (Optional)'),
          const CustomTextField(hintText: 'Tell us something cool about yourself (max 300 characters)'),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(BuildContext context, String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Text(
        title,
        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
