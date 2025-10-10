import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';

class StorageUploadResult {
  StorageUploadResult({
    required this.downloadUrl,
    required this.objectPath,
    required this.bytes,
  });

  final String downloadUrl;
  final String objectPath;
  final int bytes;
}

class StorageService {
  final FirebaseStorage _storage = FirebaseStorage.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  Future<StorageUploadResult> uploadProfilePhoto(XFile file) async {
    final user = _auth.currentUser;
    if (user == null) {
      throw Exception('User not logged in');
    }

    final fileBytes = await file.readAsBytes();
    final fileExtension = file.name.split('.').last;
    final fileName = '${const Uuid().v4()}.$fileExtension';
    final objectPath = 'profile_photos/${user.uid}/$fileName';

    final ref = _storage.ref().child(objectPath);
    final uploadTask = ref.putData(
      fileBytes,
      SettableMetadata(contentType: file.mimeType ?? 'image/jpeg'),
    );

    final snapshot = await uploadTask.whenComplete(() => null);
    final downloadUrl = await snapshot.ref.getDownloadURL();

    return StorageUploadResult(
      downloadUrl: downloadUrl,
      objectPath: objectPath,
      bytes: fileBytes.length,
    );
  }
}

final storageService = StorageService();
