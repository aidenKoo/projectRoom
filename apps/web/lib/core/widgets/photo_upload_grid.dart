import 'dart:typed_data';
import 'package:firebase_storage/firebase_storage.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:uuid/uuid.dart';

/// Photo upload grid widget with support for 1-5 photos
/// Based on §3.2 requirements: 1-5 photos, 1 required
class PhotoUploadGrid extends StatefulWidget {
  const PhotoUploadGrid({
    super.key,
    required this.userId,
    required this.photos,
    required this.onPhotosChanged,
    this.maxPhotos = 5,
    this.minPhotos = 1,
  });

  final String userId;
  final List<PhotoItem> photos;
  final ValueChanged<List<PhotoItem>> onPhotosChanged;
  final int maxPhotos;
  final int minPhotos;

  @override
  State<PhotoUploadGrid> createState() => _PhotoUploadGridState();
}

class _PhotoUploadGridState extends State<PhotoUploadGrid> {
  final _storage = FirebaseStorage.instance;

  Future<void> _pickImage(BuildContext context) async {
    if (widget.photos.length >= widget.maxPhotos) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('최대 ${widget.maxPhotos}장까지 업로드 가능합니다.')),
      );
      return;
    }

    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();

      if (bytes.lengthInBytes > 10 * 1024 * 1024) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('사진 크기는 10MB 이하여야 합니다.')),
          );
        }
        return;
      }

      final fileId = const Uuid().v4();
      final fileExtension = pickedFile.name.split('.').last;
      final fileName = '$fileId.$fileExtension';

      final newPhoto = PhotoItem(
        id: fileId,
        bytes: bytes,
        fileName: fileName,
      );

      // Start upload immediately
      _uploadImage(newPhoto);

      widget.onPhotosChanged([...widget.photos, newPhoto]);
    }
  }

  void _uploadImage(PhotoItem photo) {
    try {
      if (photo.bytes == null) {
        setState(() {
          photo.error = 'No image data available';
        });
        return;
      }
      final ref = _storage.ref('user_photos/${widget.userId}/${photo.fileName}');
      final uploadTask = ref.putData(
        photo.bytes!,
        SettableMetadata(contentType: 'image/jpeg'),
      );

      setState(() {
        photo.uploadTask = uploadTask;
      });

      uploadTask.then((snapshot) async {
        final downloadUrl = await snapshot.ref.getDownloadURL();
        setState(() {
          photo.uploadedUrl = downloadUrl;
        });
        _updateParentWidget();
      }).catchError((error) {
        setState(() {
          photo.error = error.toString();
        });
        _updateParentWidget();
      });
    } catch (e) {
      setState(() {
        photo.error = e.toString();
      });
      _updateParentWidget();
    }
  }

  void _removePhoto(int index) {
    final photo = widget.photos[index];
    photo.uploadTask?.cancel();

    final newPhotos = List<PhotoItem>.from(widget.photos);
    newPhotos.removeAt(index);
    widget.onPhotosChanged(newPhotos);
  }

  void _retryUpload(PhotoItem photo) {
    setState(() {
      photo.error = null;
    });
    _uploadImage(photo);
  }

  void _updateParentWidget() {
    widget.onPhotosChanged([...widget.photos]);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '사진 (${widget.minPhotos}~${widget.maxPhotos}장)',
          style: theme.textTheme.bodyLarge?.copyWith(
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          '첫 번째 사진이 대표 사진으로 사용됩니다. 얼굴이 잘 보이는 밝은 사진을 권장합니다.',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.textTheme.bodyMedium?.color,
          ),
        ),
        const SizedBox(height: 16),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1,
          ),
          itemCount: widget.photos.length + (widget.photos.length < widget.maxPhotos ? 1 : 0),
          itemBuilder: (context, index) {
            if (index < widget.photos.length) {
              final photo = widget.photos[index];
              return _PhotoCard(
                photo: photo,
                isPrimary: index == 0,
                onRemove: () => _removePhoto(index),
                onRetry: () => _retryUpload(photo),
              );
            } else {
              return _AddPhotoCard(
                onTap: () => _pickImage(context),
              );
            }
          },
        ),
      ],
    );
  }
}

class PhotoItem {
  final String id;
  final Uint8List? bytes;
  final String? fileName;
  String? uploadedUrl;
  String? thumbnailUrl;
  UploadTask? uploadTask;
  String? error;

  PhotoItem({
    required this.id,
    this.bytes,
    this.fileName,
    this.uploadedUrl,
    this.thumbnailUrl,
    this.uploadTask,
    this.error,
  });
}

class _PhotoCard extends StatelessWidget {
  const _PhotoCard({
    required this.photo,
    required this.isPrimary,
    required this.onRemove,
    required this.onRetry,
  });

  final PhotoItem photo;
  final bool isPrimary;
  final VoidCallback onRemove;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: photo.bytes != null
                ? DecorationImage(
                    image: MemoryImage(photo.bytes!),
                    fit: BoxFit.cover,
                  )
                : (photo.thumbnailUrl != null
                    ? DecorationImage(
                        image: NetworkImage(photo.thumbnailUrl!),
                        fit: BoxFit.cover,
                      )
                    : null),
            border: isPrimary
                ? Border.all(
                    color: theme.colorScheme.primary,
                    width: 3,
                  )
                : null,
          ),
        ),
        if (photo.uploadTask != null && photo.uploadedUrl == null && photo.error == null)
          StreamBuilder<TaskSnapshot>(
            stream: photo.uploadTask!.snapshotEvents,
            builder: (context, snapshot) {
              final progress = snapshot.hasData
                  ? snapshot.data!.bytesTransferred / snapshot.data!.totalBytes
                  : 0.0;

              return Container(
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: progress,
                      backgroundColor: Colors.grey,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        theme.colorScheme.primary,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${(progress * 100).toStringAsFixed(0)}%',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          ),
        if (photo.error != null)
          Container(
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.7),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 32),
                const SizedBox(height: 4),
                const Text(
                  '업로드 실패',
                  style: TextStyle(color: Colors.white, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.white),
                  onPressed: onRetry,
                ),
              ],
            ),
          ),
        if (isPrimary)
          Positioned(
            bottom: 4,
            left: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '대표',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        Positioned(
          top: 4,
          right: 4,
          child: IconButton(
            icon: const Icon(Icons.close, size: 20),
            onPressed: onRemove,
            style: IconButton.styleFrom(
              backgroundColor: Colors.black54,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.all(4),
              minimumSize: const Size(28, 28),
            ),
          ),
        ),
      ],
    );
  }
}

class _AddPhotoCard extends StatelessWidget {
  const _AddPhotoCard({
    required this.onTap,
  });

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: theme.dividerColor,
            width: 2,
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.add_photo_alternate_outlined,
              size: 32,
              color: theme.textTheme.bodyMedium?.color,
            ),
            const SizedBox(height: 4),
            Text(
              '사진 추가',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }
}
