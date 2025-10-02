import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../services/storage_service.dart';

class PhotosPage extends StatefulWidget {
  const PhotosPage({super.key});

  @override
  State<PhotosPage> createState() => _PhotosPageState();
}

class _PhotosPageState extends State<PhotosPage> {
  final _photos = List<String?>.filled(6, null);
  final _isUploading = List<bool>.filled(6, false);
  bool _isCompleting = false;

  Future<void> _pickAndUploadImage(int index) async {
    if (_isUploading[index]) return;

    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile == null) return;

    setState(() => _isUploading[index] = true);

    try {
      final photoUrl = await storageService.uploadProfilePhoto(pickedFile);
      setState(() => _photos[index] = photoUrl);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('사진 업로드 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isUploading[index] = false);
      }
    }
  }

  void _deletePhoto(int index) {
    setState(() {
      _photos[index] = null;
    });
  }

  Future<void> _handleCompletion() async {
    final uploadedPhotos = _photos.where((p) => p != null).cast<String>().toList();
    if (uploadedPhotos.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 2장의 사진이 필요합니다.')),
      );
      return;
    }

    setState(() => _isCompleting = true);

    try {
      // Assuming the API takes a list of photos in the user's profile
      await apiService.upsertProfile({'photos': uploadedPhotos});
      if (mounted) {
        context.go('/feed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('프로필 업데이트 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isCompleting = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final photoCount = _photos.where((p) => p != null).length;
    final isAnyTaskRunning = _isUploading.any((u) => u) || _isCompleting;

    return Scaffold(
      appBar: AppBar(
        title: const Text('사진 업로드'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '프로필 사진을 추가해주세요',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            const Text(
              '최소 2장, 최대 6장까지 업로드할 수 있습니다',
              style: TextStyle(fontSize: 14, color: Colors.grey),
            ),
            const SizedBox(height: 32),
            Expanded(
              child: GridView.builder(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                ),
                itemCount: 6,
                itemBuilder: (context, index) {
                  return _PhotoCard(
                    imageUrl: _photos[index],
                    isLoading: _isUploading[index],
                    onTap: () => _pickAndUploadImage(index),
                    onDelete: () => _deletePhoto(index),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              onPressed: (photoCount < 2 || isAnyTaskRunning)
                  ? null
                  : _handleCompletion,
              child: _isCompleting
                  ? const SizedBox(
                      height: 24,
                      width: 24,
                      child: CircularProgressIndicator(strokeWidth: 3, color: Colors.white),
                    )
                  : const Text('완료'),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotoCard extends StatelessWidget {
  final String? imageUrl;
  final bool isLoading;
  final VoidCallback onTap;
  final VoidCallback onDelete;

  const _PhotoCard({
    this.imageUrl,
    required this.isLoading,
    required this.onTap,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.grey[200],
          borderRadius: BorderRadius.circular(12),
          border: imageUrl == null ? Border.all(color: Colors.grey[300]!) : null,
          image: imageUrl != null
              ? DecorationImage(
                  image: NetworkImage(imageUrl!),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: Stack(
          children: [
            if (isLoading)
              const Center(child: CircularProgressIndicator())
            else if (imageUrl == null)
              const Center(child: Icon(Icons.add_photo_alternate, size: 48, color: Colors.grey)),
            if (imageUrl != null)
              Positioned(
                top: 4,
                right: 4,
                child: Material(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                  child: InkWell(
                    onTap: onDelete,
                    borderRadius: BorderRadius.circular(20),
                    child: const Padding(
                      padding: EdgeInsets.all(4.0),
                      child: Icon(Icons.close, color: Colors.white, size: 18),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}