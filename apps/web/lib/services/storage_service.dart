import 'dart:typed_data';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';

class StorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<String> uploadProfilePhoto(XFile file) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('User not logged in');
    }

    final fileBytes = await file.readAsBytes();
    final fileExtension = file.name.split('.').last;
    final fileName = '${const Uuid().v4()}.$fileExtension';
    final filePath = 'profile_photos/${user.uid}/$fileName';

    final ref = _storage.ref().child(filePath);

    final uploadTask = ref.putData(
      fileBytes,
      SettableMetadata(contentType: file.mimeType ?? 'image/jpeg'),
    );

    final snapshot = await uploadTask.whenComplete(() => null);
    return await snapshot.ref.getDownloadURL();
  }
}

final storageService = StorageService();
