import 'package:flutter/material.dart';
import 'package:projectroom_web/features/onboarding/presentation/widgets/public_profile_form.dart';

class ResearchScreen extends StatefulWidget {
  const ResearchScreen({super.key});

  @override
  State<ResearchScreen> createState() => _ResearchScreenState();
}

class _ResearchScreenState extends State<ResearchScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tell us about yourself'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Public'),
            Tab(text: 'Private'),
            Tab(text: 'Preferences'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Top banner explaining public/private sections
          Container(
            padding: const EdgeInsets.all(12),
            color: theme.colorScheme.surface,
            child: const Text(
              'Public information is visible to others. Private information is only used for matching.',
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: const [
const PublicProfileForm(), // Actual Form
                const Center(child: Text('Private Profile Form')), // Placeholder
                Center(child: Text('Preferences Form')), // Placeholder
              ],
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomBar(theme),
    );
  }

  Widget _buildBottomBar(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: theme.dividerColor, width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // TODO: Add progress indicator
          TextButton(onPressed: () {}, child: const Text('Save for later')),
          ElevatedButton(onPressed: () {}, child: const Text('Save & Continue')),
        ],
      ),
    );
  }
}