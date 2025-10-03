import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

/// Photo upload grid widget with support for 1-5 photos
/// Based on §3.2 requirements: 1-5 photos, 1 required
class PhotoUploadGrid extends StatelessWidget {
  const PhotoUploadGrid({
    super.key,
    required this.photos,
    required this.onPhotosChanged,
    this.maxPhotos = 5,
    this.minPhotos = 1,
  });

  final List<PhotoItem> photos;
  final ValueChanged<List<PhotoItem>> onPhotosChanged;
  final int maxPhotos;
  final int minPhotos;

  Future<void> _pickImage(BuildContext context) async {
    if (photos.length >= maxPhotos) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('최대 $maxPhotos장까지 업로드 가능합니다.')),
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

      // Check file size (10MB limit per §3.2)
      if (bytes.lengthInBytes > 10 * 1024 * 1024) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('사진 크기는 10MB 이하여야 합니다.')),
          );
        }
        return;
      }

      final newPhoto = PhotoItem(
        bytes: bytes,
        fileName: pickedFile.name,
      );

      onPhotosChanged([...photos, newPhoto]);
    }
  }

  void _removePhoto(int index) {
    final newPhotos = List<PhotoItem>.from(photos);
    newPhotos.removeAt(index);
    onPhotosChanged(newPhotos);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '사진 ($minPhotos~$maxPhotos장)',
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
          itemCount: photos.length + (photos.length < maxPhotos ? 1 : 0),
          itemBuilder: (context, index) {
            if (index < photos.length) {
              return _PhotoCard(
                photo: photos[index],
                isPrimary: index == 0,
                onRemove: () => _removePhoto(index),
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
  final Uint8List bytes;
  final String fileName;
  final String? uploadedUrl;

  PhotoItem({
    required this.bytes,
    required this.fileName,
    this.uploadedUrl,
  });
}

class _PhotoCard extends StatelessWidget {
  const _PhotoCard({
    required this.photo,
    required this.isPrimary,
    required this.onRemove,
  });

  final PhotoItem photo;
  final bool isPrimary;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: DecorationImage(
              image: MemoryImage(photo.bytes),
              fit: BoxFit.cover,
            ),
            border: isPrimary
                ? Border.all(
                    color: theme.colorScheme.primary,
                    width: 3,
                  )
                : null,
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
