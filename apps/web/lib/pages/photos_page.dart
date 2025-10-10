import 'dart:convert';
import 'dart:typed_data';
import 'dart:ui' as ui;

import 'package:crypto/crypto.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

import '../services/api_service.dart';
import '../services/storage_service.dart';

class ModeratedPhoto {
  ModeratedPhoto({
    required this.id,
    required this.publicUrl,
    required this.objectPath,
    required this.isPrimary,
    required this.status,
    required this.nsfw,
    this.nsfwScore,
    this.labels = const [],
    this.reviewNotes,
  });

  factory ModeratedPhoto.fromJson(Map<String, dynamic> json) {
    final meta = json['meta'] as Map<String, dynamic>? ?? {};
    return ModeratedPhoto(
      id: json['id'] as int,
      publicUrl: json['publicUrl'] as String,
      objectPath: json['objectPath'] as String,
      isPrimary: json['isPrimary'] as bool? ?? false,
      status: meta['status'] as String? ?? 'pending',
      nsfw: meta['nsfw'] as bool? ?? false,
      nsfwScore: (meta['nsfwScore'] as num?)?.toDouble(),
      labels: (meta['labels'] as List<dynamic>?)
              ?.map((item) => item.toString())
              .toList() ??
          const [],
      reviewNotes: meta['reviewNotes'] as String?,
    );
  }

  final int id;
  final String publicUrl;
  final String objectPath;
  final bool isPrimary;
  final String status;
  final bool nsfw;
  final double? nsfwScore;
  final List<String> labels;
  final String? reviewNotes;

  bool get isApproved => status == 'approved';
  bool get isPending => status == 'pending';
  bool get isRejected => status == 'rejected';
  bool get isAutoFlagged => status == 'auto_flagged';
}

class PhotosPage extends StatefulWidget {
  const PhotosPage({super.key});

  @override
  State<PhotosPage> createState() => _PhotosPageState();
}

class _PhotosPageState extends State<PhotosPage> {
  final ImagePicker _picker = ImagePicker();
  final Set<int> _photoActions = <int>{};
  List<ModeratedPhoto> _photos = [];

  bool _isLoading = true;
  bool _isUploading = false;
  bool _isCompleting = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadPhotos();
  }

  Future<void> _loadPhotos() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await apiService.getMyPhotos();
      final photos =
          response.map((item) => ModeratedPhoto.fromJson(item)).toList();
      setState(() {
        _photos = photos;
      });
    } catch (e) {
      setState(() {
        _error = '사진을 불러오지 못했습니다: $e';
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickAndUploadImage() async {
    if (_isUploading) return;

    final pickedFile = await _picker.pickImage(source: ImageSource.gallery);
    if (pickedFile == null) return;

    setState(() {
      _isUploading = true;
    });

    try {
      final bytes = await pickedFile.readAsBytes();
      final image = await ui.decodeImageFromList(bytes);

      final uploadResult = await storageService.uploadProfilePhoto(pickedFile);
      final hash = md5.convert(bytes).toString();

      await apiService.createPhoto({
        'objectPath': uploadResult.objectPath,
        'publicUrl': uploadResult.downloadUrl,
        'mimeType': pickedFile.mimeType,
        'width': image.width,
        'height': image.height,
        'bytes': uploadResult.bytes,
        'hash': hash,
        'isPrimary': _photos.isEmpty,
      });

      await _loadPhotos();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('사진이 업로드되었습니다. 승인 대기 중입니다.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('사진 업로드에 실패했습니다: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploading = false;
        });
      }
    }
  }

  Future<void> _setPrimaryPhoto(ModeratedPhoto photo) async {
    if (_photoActions.contains(photo.id)) return;

    setState(() {
      _photoActions.add(photo.id);
    });

    try {
      await apiService.setPrimaryPhoto(photo.id);
      await _loadPhotos();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('대표 사진 설정에 실패했습니다: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _photoActions.remove(photo.id);
        });
      }
    }
  }

  Future<void> _deletePhoto(ModeratedPhoto photo) async {
    if (_photoActions.contains(photo.id)) return;

    setState(() {
      _photoActions.add(photo.id);
    });

    try {
      await apiService.deletePhoto(photo.id);
      await _loadPhotos();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('사진 삭제에 실패했습니다: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _photoActions.remove(photo.id);
        });
      }
    }
  }

  Future<void> _handleCompletion() async {
    final activePhotos =
        _photos.where((photo) => !photo.isRejected).toList(growable: false);

    if (activePhotos.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('최소 2장의 승인된 사진이 필요합니다.')),
      );
      return;
    }

    setState(() {
      _isCompleting = true;
    });

    try {
      await apiService.upsertProfile({
        'photos': activePhotos.map((photo) => photo.publicUrl).toList(),
      });
      if (mounted) {
        context.go('/feed');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('프로필 업데이트에 실패했습니다: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isCompleting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isBusy = _isUploading || _isCompleting || _isLoading;
    final canAddMore = _photos.length < 6;
    final activePhotos =
        _photos.where((photo) => !photo.isRejected).toList(growable: false);

    return Scaffold(
      appBar: AppBar(
        title: const Text('프로필 사진 관리'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _isLoading ? null : _loadPhotos,
            tooltip: '새로고침',
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Firebase Storage와 실시간 동기화됩니다.',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 4),
            Text(
              '최소 2장 이상 업로드하고, 심사 상태를 확인하세요.',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            if (_error != null) ...[
              const SizedBox(height: 12),
              MaterialBanner(
                content: Text(_error!),
                actions: [
                  TextButton(
                    onPressed: _loadPhotos,
                    child: const Text('다시 시도'),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : GridView.builder(
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 3,
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 16,
                      ),
                      itemCount: _photos.length + (canAddMore ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index < _photos.length) {
                          final photo = _photos[index];
                          final isProcessing = _photoActions.contains(photo.id);
                          return _PhotoCard(
                            photo: photo,
                            isProcessing: isProcessing,
                            onDelete: () => _deletePhoto(photo),
                            onSetPrimary: photo.isPrimary || isBusy
                                ? null
                                : () => _setPrimaryPhoto(photo),
                          );
                        }
                        return _AddPhotoCard(
                          onTap: isBusy ? null : _pickAndUploadImage,
                          isUploading: _isUploading,
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              icon: _isCompleting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Icon(Icons.check_circle_outline),
              label: Text(
                _isCompleting ? '업데이트 중...' : '사진 설정 완료',
              ),
              onPressed:
                  (_isCompleting || activePhotos.length < 2) ? null : _handleCompletion,
              style: ElevatedButton.styleFrom(
                minimumSize: const Size.fromHeight(48),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _PhotoCard extends StatelessWidget {
  const _PhotoCard({
    required this.photo,
    required this.isProcessing,
    required this.onDelete,
    required this.onSetPrimary,
  });

  final ModeratedPhoto photo;
  final bool isProcessing;
  final VoidCallback onDelete;
  final VoidCallback? onSetPrimary;

  Color _statusColor() {
    switch (photo.status) {
      case 'approved':
        return Colors.green;
      case 'auto_flagged':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.blueGrey;
    }
  }

  String _statusLabel() {
    switch (photo.status) {
      case 'approved':
        return '승인됨';
      case 'auto_flagged':
        return '자동 검수 필요';
      case 'rejected':
        return '거절됨';
      default:
        return '검토 중';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            image: DecorationImage(
              image: NetworkImage(photo.publicUrl),
              fit: BoxFit.cover,
            ),
            border: Border.all(
              color: photo.isPrimary ? Theme.of(context).colorScheme.primary : Colors.transparent,
              width: 3,
            ),
          ),
        ),
        Positioned(
          top: 8,
          left: 8,
          child: Chip(
            backgroundColor: _statusColor().withOpacity(0.85),
            label: Text(
              _statusLabel(),
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ),
        if (photo.isPrimary)
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.black87,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Text(
                '대표 사진',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        Positioned(
          top: 8,
          right: 8,
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (onSetPrimary != null)
                Tooltip(
                  message: '대표 사진으로 지정',
                  child: IconButton(
                    icon: const Icon(Icons.star_border, color: Colors.white),
                    style: IconButton.styleFrom(
                      backgroundColor: Colors.black54,
                      padding: const EdgeInsets.all(6),
                    ),
                    onPressed: isProcessing ? null : onSetPrimary,
                  ),
                ),
              Tooltip(
                message: '사진 삭제',
                child: IconButton(
                  icon: const Icon(Icons.delete_outline, color: Colors.white),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.black54,
                    padding: const EdgeInsets.all(6),
                  ),
                  onPressed: isProcessing ? null : onDelete,
                ),
              ),
            ],
          ),
        ),
        if (isProcessing)
          Container(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              color: Colors.black45,
            ),
            child: const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          ),
      ],
    );
  }
}

class _AddPhotoCard extends StatelessWidget {
  const _AddPhotoCard({
    required this.onTap,
    required this.isUploading,
  });

  final VoidCallback? onTap;
  final bool isUploading;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: isUploading ? null : onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          border: Border.all(
            color: Theme.of(context).dividerColor,
            width: 2,
            style: BorderStyle.solid,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: isUploading
              ? const CircularProgressIndicator()
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Icon(Icons.add_photo_alternate_outlined, size: 36),
                    SizedBox(height: 6),
                    Text('사진 추가'),
                  ],
                ),
        ),
      ),
    );
  }
}
