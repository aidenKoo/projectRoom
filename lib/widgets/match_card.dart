import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/match.dart';
import '../screens/profile_detail_screen.dart';

class MatchCard extends StatelessWidget {
  final User user;
  final int compatibilityScore;
  final VoidCallback? onTap;

  const MatchCard({
    super.key,
    required this.user,
    required this.compatibilityScore,
    this.onTap,
  });

  Color get _scoreColor {
    if (compatibilityScore >= 80) return Colors.green;
    if (compatibilityScore >= 60) return Colors.orange;
    return Colors.red;
  }

  String get _scoreLabel {
    if (compatibilityScore >= 90) return 'Perfect Match';
    if (compatibilityScore >= 80) return 'Great Match';
    if (compatibilityScore >= 70) return 'Good Match';
    if (compatibilityScore >= 60) return 'Okay Match';
    return 'Low Match';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      margin: const EdgeInsets.symmetric(vertical: 8),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with compatibility score
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _scoreColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                      border:
                          Border.all(color: _scoreColor.withValues(alpha: 0.3)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.favorite,
                          size: 16,
                          color: _scoreColor,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '$compatibilityScore%',
                          style: TextStyle(
                            color: _scoreColor,
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Text(
                    _scoreLabel,
                    style: TextStyle(
                      color: _scoreColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // User info and photos
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Profile photo
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: user.photoUrls.isNotEmpty
                          ? Image.network(
                              user.photoUrls.first,
                              fit: BoxFit.cover,
                              loadingBuilder:
                                  (context, child, loadingProgress) {
                                if (loadingProgress == null) return child;
                                return Container(
                                  color: Colors.grey[200],
                                  child: const Center(
                                    child: CircularProgressIndicator(
                                      color: Colors.pink,
                                      strokeWidth: 2,
                                    ),
                                  ),
                                );
                              },
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: Colors.grey[200],
                                  child: Icon(
                                    Icons.person,
                                    size: 32,
                                    color: Colors.grey[400],
                                  ),
                                );
                              },
                            )
                          : Container(
                              color: Colors.grey[200],
                              child: Icon(
                                Icons.person,
                                size: 32,
                                color: Colors.grey[400],
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(width: 16),

                  // User details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Age and job
                        Row(
                          children: [
                            Text(
                              '${user.age} years old',
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                            if (user.job.isNotEmpty) ...[
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  user.job,
                                  style: TextStyle(
                                    color: Colors.grey[600],
                                    fontSize: 14,
                                  ),
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Relationship goals
                        if (user.relationshipGoals.isNotEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.blue[200]!),
                            ),
                            child: Text(
                              user.relationshipGoals,
                              style: TextStyle(
                                color: Colors.blue[700],
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        const SizedBox(height: 12),

                        // Top personality traits
                        _buildTopTraits(),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Lifestyle interests
              if (user.lifestyle.isNotEmpty) _buildLifestyleChips(),

              // Action buttons
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        _navigateToProfileDetail(context);
                      },
                      icon: const Icon(Icons.info_outline, size: 18),
                      label: const Text('View Details'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.pink,
                        side: const BorderSide(color: Colors.pink),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        // Send message or like
                        _handleLike(context);
                      },
                      icon: const Icon(Icons.favorite, size: 18),
                      label: const Text('Like'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.pink,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTopTraits() {
    // Get top 2 personality traits
    final traits = [
      ('Agreeable', user.traits.agreeableness),
      ('Conscientious', user.traits.conscientiousness),
      ('Extraverted', user.traits.extraversion),
      ('Open', user.traits.openness),
      ('Stable', user.traits.emotionalStability),
    ];

    traits.sort((a, b) => b.$2.compareTo(a.$2));
    final topTraits = traits.take(2).toList();

    return Wrap(
      spacing: 6,
      runSpacing: 4,
      children: topTraits.map((trait) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.purple[50],
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.purple[200]!),
          ),
          child: Text(
            trait.$1,
            style: TextStyle(
              color: Colors.purple[700],
              fontSize: 11,
              fontWeight: FontWeight.w500,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildLifestyleChips() {
    final displayLifestyle = user.lifestyle.take(3).toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Interests',
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 6),
        Wrap(
          spacing: 6,
          runSpacing: 4,
          children: [
            ...displayLifestyle.map((interest) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green[200]!),
                ),
                child: Text(
                  interest,
                  style: TextStyle(
                    color: Colors.green[700],
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              );
            }),
            if (user.lifestyle.length > 3)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Text(
                  '+${user.lifestyle.length - 3} more',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
          ],
        ),
      ],
    );
  }

  void _navigateToProfileDetail(BuildContext context) {
    final match = Match(
      fromUid: user.uid,
      toUid: '',
      score: compatibilityScore.toDouble(),
      timestamp: DateTime.now(),
    );

    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => ProfileDetailScreen(
          user: user,
          match: match,
          isCurrentUser: false,
        ),
      ),
    );
  }

  void _handleLike(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Liked ${user.job}\'s profile!'),
        backgroundColor: Colors.pink,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}
