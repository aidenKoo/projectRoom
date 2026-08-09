import 'package:cloud_firestore/cloud_firestore.dart';

class AppNotification {
  final String? notifId;
  final String toUid;
  final String fromUid;
  final String matchId;
  final String type;
  final DateTime timestamp;
  final String content;
  final bool isRead;

  AppNotification({
    this.notifId,
    required this.toUid,
    required this.fromUid,
    required this.matchId,
    required this.type,
    required this.timestamp,
    required this.content,
    this.isRead = false,
  });

  Map<String, dynamic> toMap() {
    return {
      'toUid': toUid,
      'fromUid': fromUid,
      'matchId': matchId,
      'type': type,
      'timestamp': Timestamp.fromDate(timestamp),
      'content': content,
      'isRead': isRead,
    };
  }

  factory AppNotification.fromMap(Map<String, dynamic> map, [String? id]) {
    return AppNotification(
      notifId: id,
      toUid: map['toUid'] ?? '',
      fromUid: map['fromUid'] ?? '',
      matchId: map['matchId'] ?? '',
      type: map['type'] ?? '',
      timestamp: (map['timestamp'] as Timestamp).toDate(),
      content: map['content'] ?? '',
      isRead: map['isRead'] ?? false,
    );
  }

  factory AppNotification.fromFirestore(DocumentSnapshot doc) {
    Map<String, dynamic> data = doc.data() as Map<String, dynamic>;
    return AppNotification.fromMap(data, doc.id);
  }

  AppNotification copyWith({
    String? notifId,
    String? toUid,
    String? fromUid,
    String? matchId,
    String? type,
    DateTime? timestamp,
    String? content,
    bool? isRead,
  }) {
    return AppNotification(
      notifId: notifId ?? this.notifId,
      toUid: toUid ?? this.toUid,
      fromUid: fromUid ?? this.fromUid,
      matchId: matchId ?? this.matchId,
      type: type ?? this.type,
      timestamp: timestamp ?? this.timestamp,
      content: content ?? this.content,
      isRead: isRead ?? this.isRead,
    );
  }
}
