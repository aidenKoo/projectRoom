import 'dart:math';
import '../models/user.dart';
import '../models/match.dart';
import 'firestore_service.dart';

class MatchService {
  final FirestoreService _firestoreService = FirestoreService();

  double calculateCompatibilityScore(User user1, User user2) {
    // Big Five traits similarity (cosine similarity)
    double traitsScore = _calculateTraitsSimilarity(user1.traits, user2.traits);

    // Lifestyle overlap (Jaccard similarity with bonus for common interests)
    double lifestyleScore =
        _calculateLifestyleOverlap(user1.lifestyle, user2.lifestyle);

    // Age compatibility (closer ages get higher scores)
    double ageScore = _calculateAgeCompatibility(user1.age, user2.age);

    // Relationship goals compatibility
    double goalsScore = _calculateGoalsCompatibility(
        user1.relationshipGoals, user2.relationshipGoals);

    // Enhanced weighted combination with relationship goals
    double totalScore = (traitsScore * 0.5) +
        (lifestyleScore * 0.25) +
        (ageScore * 0.1) +
        (goalsScore * 0.15);

    // Apply bonus for high trait compatibility
    if (traitsScore > 0.8) {
      totalScore = totalScore * 1.1; // 10% bonus for high personality match
    }

    // Scale to 1-100 with improved distribution
    double finalScore = (totalScore * 100).clamp(1.0, 100.0);

    // Add small random factor to prevent ties (±2 points)
    double randomFactor = (DateTime.now().microsecond % 5 - 2) / 100.0;
    return (finalScore + randomFactor).clamp(1.0, 100.0);
  }

  double _calculateTraitsSimilarity(
      BigFiveTraits traits1, BigFiveTraits traits2) {
    List<double> vector1 = [
      traits1.agreeableness,
      traits1.conscientiousness,
      traits1.extraversion,
      traits1.openness,
      traits1.emotionalStability,
    ];

    List<double> vector2 = [
      traits2.agreeableness,
      traits2.conscientiousness,
      traits2.extraversion,
      traits2.openness,
      traits2.emotionalStability,
    ];

    // Cosine similarity
    double dotProduct = 0.0;
    double norm1 = 0.0;
    double norm2 = 0.0;

    for (int i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 == 0.0 || norm2 == 0.0) return 0.0;

    return dotProduct / (sqrt(norm1) * sqrt(norm2));
  }

  double _calculateLifestyleOverlap(
      List<String> lifestyle1, List<String> lifestyle2) {
    if (lifestyle1.isEmpty || lifestyle2.isEmpty) return 0.0;

    Set<String> set1 = lifestyle1.toSet();
    Set<String> set2 = lifestyle2.toSet();

    int overlap = set1.intersection(set2).length;
    int union = set1.union(set2).length;

    // Jaccard similarity
    return union > 0 ? overlap / union : 0.0;
  }

  double _calculateAgeCompatibility(int age1, int age2) {
    int ageDiff = (age1 - age2).abs();
    // Normalize age difference (assuming max meaningful difference is 20 years)
    double normalizedDiff = (20 - ageDiff.clamp(0, 20)) / 20.0;
    return normalizedDiff;
  }

  double _calculateGoalsCompatibility(String goals1, String goals2) {
    if (goals1.isEmpty || goals2.isEmpty) return 0.5; // neutral if missing

    // Exact match gets highest score
    if (goals1.toLowerCase() == goals2.toLowerCase()) {
      return 1.0;
    }

    // Compatible relationship goals mapping
    Map<String, List<String>> compatibleGoals = {
      'long-term relationship': ['marriage', 'serious relationship'],
      'marriage': ['long-term relationship', 'serious relationship'],
      'serious relationship': ['long-term relationship', 'marriage'],
      'casual dating': ['friendship first', 'something casual'],
      'friendship first': ['casual dating', 'something casual'],
      'something casual': ['casual dating', 'friendship first'],
    };

    String goal1Lower = goals1.toLowerCase();
    String goal2Lower = goals2.toLowerCase();

    // Check if goals are compatible
    if (compatibleGoals[goal1Lower]?.contains(goal2Lower) == true ||
        compatibleGoals[goal2Lower]?.contains(goal1Lower) == true) {
      return 0.7; // High compatibility for similar goals
    }

    // Partial compatibility for some combinations
    if ((goal1Lower.contains('casual') && goal2Lower.contains('friendship')) ||
        (goal1Lower.contains('friendship') && goal2Lower.contains('casual'))) {
      return 0.6;
    }

    // Low compatibility for opposite goals
    if ((goal1Lower.contains('marriage') || goal1Lower.contains('long-term')) &&
        (goal2Lower.contains('casual') ||
            goal2Lower.contains('something casual'))) {
      return 0.2;
    }

    // Default moderate compatibility
    return 0.4;
  }

  Future<void> calculateAndStoreMatches(String currentUserId) async {
    try {
      User? currentUser = await _firestoreService.getUser(currentUserId);
      if (currentUser == null) return;

      List<User> allUsers =
          await _firestoreService.getAllUsers(excludeUid: currentUserId).first;

      List<Match> matches = [];

      for (User otherUser in allUsers) {
        double score = calculateCompatibilityScore(currentUser, otherUser);

        Match match = Match(
          fromUid: currentUserId,
          toUid: otherUser.uid,
          score: score,
          timestamp: DateTime.now(),
        );

        matches.add(match);
      }

      // Store matches in Firestore
      for (Match match in matches) {
        await _firestoreService.createMatch(match);
      }
    } catch (e) {
      print('Error calculating matches: $e');
      rethrow;
    }
  }

  Stream<List<Match>> getTopMatches(String userId) {
    return _firestoreService.getMatchesForUser(userId);
  }

  Future<List<User>> getMatchedUsers(List<Match> matches) async {
    List<User> matchedUsers = [];

    for (Match match in matches) {
      User? user = await _firestoreService.getUser(match.fromUid);
      if (user != null) {
        matchedUsers.add(user);
      }
    }

    return matchedUsers;
  }
}
