import 'package:cloud_firestore/cloud_firestore.dart';

class BigFiveTraits {
  final double agreeableness;
  final double conscientiousness;
  final double extraversion;
  final double openness;
  final double emotionalStability;

  BigFiveTraits({
    required this.agreeableness,
    required this.conscientiousness,
    required this.extraversion,
    required this.openness,
    required this.emotionalStability,
  });

  Map<String, dynamic> toMap() {
    return {
      'agreeableness': agreeableness,
      'conscientiousness': conscientiousness,
      'extraversion': extraversion,
      'openness': openness,
      'emotionalStability': emotionalStability,
    };
  }

  factory BigFiveTraits.fromMap(Map<String, dynamic> map) {
    return BigFiveTraits(
      agreeableness: (map['agreeableness'] ?? 0.0).toDouble(),
      conscientiousness: (map['conscientiousness'] ?? 0.0).toDouble(),
      extraversion: (map['extraversion'] ?? 0.0).toDouble(),
      openness: (map['openness'] ?? 0.0).toDouble(),
      emotionalStability: (map['emotionalStability'] ?? 0.0).toDouble(),
    );
  }
}

class User {
  final String uid;
  final int age;
  final String job;
  final BigFiveTraits traits;
  final List<String> lifestyle;
  final String relationshipGoals;
  final List<String> photoUrls;
  final DateTime? createdAt;

  User({
    required this.uid,
    required this.age,
    required this.job,
    required this.traits,
    required this.lifestyle,
    required this.relationshipGoals,
    required this.photoUrls,
    this.createdAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'uid': uid,
      'age': age,
      'job': job,
      'traits': traits.toMap(),
      'lifestyle': lifestyle,
      'relationshipGoals': relationshipGoals,
      'photoUrls': photoUrls,
      'createdAt': createdAt?.millisecondsSinceEpoch,
    };
  }

  factory User.fromMap(Map<String, dynamic> map) {
    return User(
      uid: map['uid'] ?? '',
      age: map['age'] ?? 0,
      job: map['job'] ?? '',
      traits: BigFiveTraits.fromMap(map['traits'] ?? {}),
      lifestyle: List<String>.from(map['lifestyle'] ?? []),
      relationshipGoals: map['relationshipGoals'] ?? '',
      photoUrls: List<String>.from(map['photoUrls'] ?? []),
      createdAt: map['createdAt'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['createdAt'])
          : null,
    );
  }

  factory User.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return User.fromMap({...data, 'uid': doc.id});
  }
}
