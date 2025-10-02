import 'package:dio/dio.dart';
import 'package:firebase_auth/firebase_auth.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:3001';
  final Dio _dio;

  ApiService()
      : _dio = Dio(BaseOptions(
          baseUrl: baseUrl,
          connectTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 3),
        )) {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Attach Firebase ID Token to all requests
        final user = FirebaseAuth.instance.currentUser;
        if (user != null) {
          final token = await user.getIdToken();
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
    ));
  }

  // Users
  Future<Map<String, dynamic>> syncUser(Map<String, dynamic> data) async {
    final response = await _dio.post('/v1/users/sync', data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> getMe() async {
    final response = await _dio.get('/v1/users/me');
    return response.data;
  }

  // Feed
  Future<List<dynamic>> getFeed({int limit = 20}) async {
    final response = await _dio.get('/v1/feed', queryParameters: {'limit': limit});
    return response.data as List<dynamic>;
  }

  // Swipes
  Future<Map<String, dynamic>> createSwipe({
    required int targetId,
    required String action,
  }) async {
    final response = await _dio.post('/v1/swipes', data: {
      'targetId': targetId,
      'action': action,
    return response.data;
  }

  // Profiles
  Future<Map<String, dynamic>> upsertProfile(Map<String, dynamic> data) async {
    final response = await _dio.post('/v1/profiles', data: data);
    return response.data;
  }

  // Preferences
  Future<Map<String, dynamic>> upsertPreferences(Map<String, dynamic> data) async {
    final response = await _dio.post('/v1/preferences', data: data);
    return response.data;
  }

  // Profiles-Private
  Future<Map<String, dynamic>> upsertPrivateProfile(Map<String, dynamic> data) async {
    final response = await _dio.post('/v1/profiles/private', data: data);
    return response.data;
  }

  // Matches
  Future<List<dynamic>> getMatches() async {
    final response = await _dio.get('/v1/matches');
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> getMatch(String matchId) async {
    final response = await _dio.get('/v1/matches/$matchId');
    return response.data;
  }

  // Messages
  Future<List<dynamic>> getMessages(String matchId, {int limit = 50}) async {
    final response = await _dio.get(
      '/v1/messages/$matchId',
      queryParameters: {'limit': limit},
    );
    return response.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> sendMessage({
    required String matchId,
    required String body,
    String type = 'text',
  }) async {
    final response = await _dio.post('/v1/messages/$matchId', data: {
      'body': body,
      'type': type,
    });
    return response.data;
  }

  // Codes
  Future<Map<String, dynamic>> validateCode(String code) async {
    return response.data;
  }

  Future<void> postInitialAnswers(String matchId, Map<String, String> answers) async {
    await _dio.post('/v1/matches/$matchId/initial-answers', data: answers);
  }

  // Referrals
  Future<void> addReferral(String name) async {
    await _dio.post('/v1/referrals', data: {'name': name});
  }
}

final apiService = ApiService();
