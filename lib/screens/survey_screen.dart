import 'package:flutter/material.dart';
import '../models/user.dart';
import '../services/auth_service.dart';
import '../services/firestore_service.dart';
import '../widgets/enhanced_photo_uploader.dart';
import '../widgets/trait_slider.dart';
import 'match_list_screen.dart';

class SurveyScreen extends StatefulWidget {
  const SurveyScreen({super.key});

  @override
  State<SurveyScreen> createState() => _SurveyScreenState();
}

class _SurveyScreenState extends State<SurveyScreen> {
  final AuthService _authService = AuthService();
  final FirestoreService _firestoreService = FirestoreService();
  final PageController _pageController = PageController();

  int _currentPage = 0;
  final int _totalPages = 4;

  // Form data
  int _age = 25;
  String _job = '';
  String _relationshipGoals = '';
  final List<String> _lifestyle = [];
  List<String> _photoUrls = [];

  // Big Five traits (1-5 scale)
  double _agreeableness = 3.0;
  double _conscientiousness = 3.0;
  double _extraversion = 3.0;
  double _openness = 3.0;
  double _emotionalStability = 3.0;

  bool _isLoading = false;

  final List<String> _lifestyleOptions = [
    'Reading',
    'Sports',
    'Music',
    'Travel',
    'Cooking',
    'Art',
    'Technology',
    'Nature',
    'Photography',
    'Dancing',
    'Gaming',
    'Fitness'
  ];

  final List<String> _relationshipGoalsOptions = [
    'Long-term relationship',
    'Casual dating',
    'Marriage',
    'Friendship first',
    'Something casual',
  ];

  void _nextPage() {
    if (_currentPage < _totalPages - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> _submitSurvey() async {
    final currentUser = _authService.currentUser;
    if (currentUser == null) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final user = User(
        uid: currentUser.uid,
        age: _age,
        job: _job,
        traits: BigFiveTraits(
          agreeableness: _agreeableness,
          conscientiousness: _conscientiousness,
          extraversion: _extraversion,
          openness: _openness,
          emotionalStability: _emotionalStability,
        ),
        lifestyle: _lifestyle,
        relationshipGoals: _relationshipGoals,
        photoUrls: _photoUrls,
        createdAt: DateTime.now(),
      );

      await _firestoreService.createUser(user);

      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const MatchListScreen()),
        );
      }
    } catch (e) {
      _showError('Failed to save profile: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Profile Setup (${_currentPage + 1}/$_totalPages)'),
        backgroundColor: Colors.pink,
        foregroundColor: Colors.white,
        automaticallyImplyLeading: false,
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (_currentPage + 1) / _totalPages,
            backgroundColor: Colors.grey[300],
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.pink),
          ),

          // Page content
          Expanded(
            child: PageView(
              controller: _pageController,
              onPageChanged: (page) {
                setState(() {
                  _currentPage = page;
                });
              },
              children: [
                _buildBasicInfoPage(),
                _buildLifestylePage(),
                _buildPersonalityPage(),
                _buildPhotosPage(),
              ],
            ),
          ),

          // Navigation buttons
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (_currentPage > 0)
                  TextButton(
                    onPressed: _previousPage,
                    child: const Text('Previous'),
                  )
                else
                  const SizedBox(),
                if (_currentPage < _totalPages - 1)
                  ElevatedButton(
                    onPressed: _nextPage,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink,
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Next'),
                  )
                else
                  ElevatedButton(
                    onPressed: _isLoading ? null : _submitSurvey,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.pink,
                      foregroundColor: Colors.white,
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('Complete'),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBasicInfoPage() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Basic Information',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 32),

          // Age
          Text('Age: $_age', style: const TextStyle(fontSize: 16)),
          Slider(
            value: _age.toDouble(),
            min: 18,
            max: 65,
            divisions: 47,
            activeColor: Colors.pink,
            onChanged: (value) {
              setState(() {
                _age = value.round();
              });
            },
          ),
          const SizedBox(height: 24),

          // Job
          TextField(
            decoration: const InputDecoration(
              labelText: 'Job/Occupation',
              border: OutlineInputBorder(),
            ),
            onChanged: (value) {
              _job = value;
            },
          ),
          const SizedBox(height: 24),

          // Relationship Goals
          Text(
            'Relationship Goals',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          ...(_relationshipGoalsOptions.map((goal) => RadioListTile<String>(
                title: Text(goal),
                value: goal,
                groupValue: _relationshipGoals,
                activeColor: Colors.pink,
                onChanged: (value) {
                  setState(() {
                    _relationshipGoals = value ?? '';
                  });
                },
              ))),
        ],
      ),
    );
  }

  Widget _buildLifestylePage() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Interests & Lifestyle',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          Text(
            'Select your interests (choose multiple)',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 3,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: _lifestyleOptions.length,
              itemBuilder: (context, index) {
                final option = _lifestyleOptions[index];
                final isSelected = _lifestyle.contains(option);

                return FilterChip(
                  label: Text(option),
                  selected: isSelected,
                  selectedColor: Colors.pink.withOpacity(0.3),
                  onSelected: (selected) {
                    setState(() {
                      if (selected) {
                        _lifestyle.add(option);
                      } else {
                        _lifestyle.remove(option);
                      }
                    });
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalityPage() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Personality Traits',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          Text(
            'Rate yourself on these personality dimensions',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView(
              children: [
                TraitSlider(
                  label: 'Agreeableness',
                  description: 'How cooperative and trusting you are',
                  value: _agreeableness,
                  onChanged: (value) {
                    setState(() {
                      _agreeableness = value;
                    });
                  },
                ),
                const SizedBox(height: 24),
                TraitSlider(
                  label: 'Conscientiousness',
                  description: 'How organized and disciplined you are',
                  value: _conscientiousness,
                  onChanged: (value) {
                    setState(() {
                      _conscientiousness = value;
                    });
                  },
                ),
                const SizedBox(height: 24),
                TraitSlider(
                  label: 'Extraversion',
                  description: 'How outgoing and energetic you are',
                  value: _extraversion,
                  onChanged: (value) {
                    setState(() {
                      _extraversion = value;
                    });
                  },
                ),
                const SizedBox(height: 24),
                TraitSlider(
                  label: 'Openness',
                  description: 'How open to new experiences you are',
                  value: _openness,
                  onChanged: (value) {
                    setState(() {
                      _openness = value;
                    });
                  },
                ),
                const SizedBox(height: 24),
                TraitSlider(
                  label: 'Emotional Stability',
                  description: 'How calm and secure you are',
                  value: _emotionalStability,
                  onChanged: (value) {
                    setState(() {
                      _emotionalStability = value;
                    });
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPhotosPage() {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Add Photos',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 16),
          Text(
            'Add at least 1 photo (up to 5 photos)',
            style: TextStyle(color: Colors.grey[600]),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: EnhancedPhotoUploader(
              photoUrls: _photoUrls,
              onPhotosChanged: (urls) {
                setState(() {
                  _photoUrls = urls;
                });
              },
            ),
          ),
        ],
      ),
    );
  }
}
