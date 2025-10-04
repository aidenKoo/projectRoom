import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

final publicProfileProvider = FutureProvider.family<Map<String, dynamic>, String>((ref, uid) async {
  return apiService.getPublicProfile(uid);
});
