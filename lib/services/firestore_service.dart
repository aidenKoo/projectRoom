import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/user.dart';
import '../models/match.dart';
import '../models/notification.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Users Collection
  CollectionReference get _usersCollection => _firestore.collection('users');

  Future<void> createUser(User user) async {
    try {
      await _usersCollection.doc(user.uid).set(user.toMap());
    } catch (e) {
      print('Error creating user: $e');
      rethrow;
    }
  }

  Future<User?> getUser(String uid) async {
    try {
      DocumentSnapshot doc = await _usersCollection.doc(uid).get();
      if (doc.exists) {
        return User.fromFirestore(doc);
      }
      return null;
    } catch (e) {
      print('Error getting user: $e');
      return null;
    }
  }

  Future<void> updateUser(User user) async {
    try {
      await _usersCollection.doc(user.uid).update(user.toMap());
    } catch (e) {
      print('Error updating user: $e');
      rethrow;
    }
  }

  Stream<List<User>> getAllUsers({String? excludeUid}) {
    Query query = _usersCollection;
    if (excludeUid != null) {
      query = query.where(FieldPath.documentId, isNotEqualTo: excludeUid);
    }

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) => User.fromFirestore(doc)).toList();
    });
  }

  // Matches Collection
  CollectionReference get _matchesCollection =>
      _firestore.collection('matches');

  Future<void> createMatch(Match match) async {
    try {
      await _matchesCollection.add(match.toMap());
    } catch (e) {
      print('Error creating match: $e');
      rethrow;
    }
  }

  Stream<List<Match>> getMatchesForUser(String uid) {
    return _matchesCollection
        .where('toUid', isEqualTo: uid)
        .orderBy('score', descending: true)
        .limit(10)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) => Match.fromFirestore(doc)).toList();
    });
  }

  // Notifications Collection
  CollectionReference get _notificationsCollection =>
      _firestore.collection('notifications');

  Future<void> createNotification(AppNotification notification) async {
    try {
      await _notificationsCollection.add(notification.toMap());
    } catch (e) {
      print('Error creating notification: $e');
      rethrow;
    }
  }

  Stream<List<AppNotification>> getNotificationsForUser(String uid) {
    return _notificationsCollection
        .where('toUid', isEqualTo: uid)
        .orderBy('timestamp', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => AppNotification.fromFirestore(doc))
          .toList();
    });
  }

  Future<void> markNotificationAsRead(String notificationId) async {
    try {
      await _notificationsCollection
          .doc(notificationId)
          .update({'isRead': true});
    } catch (e) {
      print('Error marking notification as read: $e');
      rethrow;
    }
  }

  // Batch operations
  WriteBatch batch() => _firestore.batch();

  Future<void> commitBatch(WriteBatch batch) async {
    await batch.commit();
  }
}
