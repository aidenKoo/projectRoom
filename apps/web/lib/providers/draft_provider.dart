
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

const _draftKey = 'profile_draft';

// The StateNotifier that holds the draft data
class DraftNotifier extends StateNotifier<Map<String, dynamic>> {
  DraftNotifier() : super({}) {
    _loadDraft();
  }

  Future<void> _loadDraft() async {
    final prefs = await SharedPreferences.getInstance();
    final draftString = prefs.getString(_draftKey);
    if (draftString != null) {
      state = Map<String, dynamic>.from(jsonDecode(draftString));
    }
  }

  Future<void> updateField(String key, dynamic value) async {
    state = { ...state, key: value };
    await _saveDraft();
  }

  Future<void> updateAllFields(Map<String, dynamic> fields) async {
    state = { ...state, ...fields };
    await _saveDraft();
  }

  Future<void> _saveDraft() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_draftKey, jsonEncode(state));
  }

  Future<void> clearDraft() async {
    state = {};
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_draftKey);
  }

  Future<void> clearAll() async {
    await clearDraft();
  }
}

// The global provider to access the DraftNotifier
final draftProvider = StateNotifierProvider<DraftNotifier, Map<String, dynamic>>((ref) {
  return DraftNotifier();
});
