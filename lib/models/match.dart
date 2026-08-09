import 'package:cloud_firestore/cloud_firestore.dart';

class Match {
  final String? matchId;
  final String fromUid;
  final String toUid;
  final double score;
  final DateTime timestamp;

  Match({
    this.matchId,
    required this.fromUid,
    required this.toUid,
    required this.score,
    required this.timestamp,
  });

  Map<String, dynamic> toMap() {
    return {
      'fromUid': fromUid,
      'toUid': toUid,
      'score': score,
      'timestamp': Timestamp.fromDate(timestamp),
    };
  }

  factory Match.fromMap(Map<String, dynamic> map, [String? id]) {
    return Match(
      matchId: id,
      fromUid: map['fromUid'] ?? '',
      toUid: map['toUid'] ?? '',
      score: (map['score'] ?? 0.0).toDouble(),
      timestamp: (map['timestamp'] as Timestamp).toDate(),
    );
  }

  factory Match.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return Match.fromMap(data, doc.id);
  }
}
