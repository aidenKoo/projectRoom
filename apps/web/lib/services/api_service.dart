import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  final Dio _dio;

  ApiService() : _dio = Dio(BaseOptions(baseUrl: 'http://localhost:3001/v1')) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await FirebaseAuth.instance.currentUser?.getIdToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException e, handler) {
        // You can handle errors globally here
        return handler.next(e);
      },
    ));
  }

  // Get list of mutual matches
  Future<List<dynamic>> getMatches() async {
    final response = await _dio.get('/match/mutuals');
    return response.data;
  }

  // Get current user's public profile
  Future<Map<String, dynamic>> getMyPublicProfile() async {
    final response = await _dio.get('/profiles/me');
    return response.data;
  }

  // Get current user's private profile
  Future<Map<String, dynamic>> getMyPrivateProfile() async {
    final response = await _dio.get('/profiles/private/me');
    return response.data;
  }

  // Match
  Future<Map<String, dynamic>> getMatch(String matchId) async {
    final response = await _dio.get('/matches/$matchId');
    return response.data;
  }

  // Messages
  Future<List<dynamic>> getMessages(String matchId) async {
    final response = await _dio.get('/messages/$matchId');
    return response.data;
  }

  Future<Map<String, dynamic>> sendMessage({required String matchId, required String body}) async {
    final response = await _dio.post('/messages/$matchId', data: {'body': body});
    return response.data;
  }
  
  // 3 Questions Widget
  Future<void> postInitialAnswers(String matchId, Map<String, String> answers) async {
    // This is a hypothetical endpoint, adjust if the backend has a different one.
    await _dio.post('/matches/$matchId/initial-answers', data: answers);
  }

  // Generic Profile Upsert
  Future<void> upsertProfile(Map<String, dynamic> data) async {
    await _dio.post('/profiles', data: data);
  }

  // Private Profile Upsert
  Future<void> upsertPrivateProfile(Map<String, dynamic> data) async {
    await _dio.post('/profiles/private', data: data);
  }

  // Preferences Upsert
  Future<void> upsertPreferences(Map<String, dynamic> data) async {
    await _dio.put('/preferences', data: data);
  }

  // Monthly Code Validation (§3.1, §8.3)
  Future<Map<String, dynamic>> validateMonthlyCode(String code) async {
    try {
      final response = await _dio.post('/codes/validate', data: {'code': code});
      return {
        'valid': response.data['valid'] ?? true,
        'month': response.data['month'],
        'remaining': response.data['remaining'],
      };
    } catch (e) {
      return {
        'valid': false,
        'error': e.toString(),
      };
    }
  }

  // Submit Referral (§3.1, §8.3)
  Future<void> submitReferral(String referrerName) async {
    await _dio.post('/referrals', data: {'referrer_name': referrerName});
  }

  // Update Preferences (§8.2)
  Future<void> updatePreferences(Map<String, dynamic> data) async {
    await _dio.put('/preferences', data: data);
  }

  // Get Recommendations (§8.4)
  Future<List<dynamic>> getRecommendations() async {
    final response = await _dio.get('/match/recommendations');
    return response.data;
  }

  // Like/Pass actions (§8.4)
  Future<void> likeUser(String targetUid) async {
    await _dio.post('/match/like', data: {'target_id': targetUid});
  }

  Future<void> skipUser(String targetUid) async {
    await _dio.post('/match/skip', data: {'target_id': targetUid});
  }
}

// Create a global instance
final apiService = ApiService();