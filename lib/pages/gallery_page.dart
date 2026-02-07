import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:provider/provider.dart';

import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../widgets/offline_banner.dart';
import '../providers/gallery_provider.dart';
import '../services/connectivity_service.dart';
import '../models/gallery_image_model.dart';
import 'gallery_detail_page.dart';

class GalleryPage extends StatefulWidget {
  const GalleryPage({super.key});

  @override
  State<GalleryPage> createState() => _GalleryPageState();
}

class _GalleryPageState extends State<GalleryPage> {
  final ConnectivityService _connectivityService = ConnectivityService();
  final ValueNotifier<bool> _isOfflineNotifier = ValueNotifier(false);
  static const primaryGreen = Color(0xFF4CAF50);

  @override
  void initState() {
    super.initState();
    _initConnectivityMonitoring();
    // Load images using provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<GalleryProvider>(context, listen: false).loadImages();
    });
  }

  Future<void> _initConnectivityMonitoring() async {
    try {
      await _connectivityService.init();
      
      _connectivityService.connectivityStream.listen((isOnline) {
        if (mounted) {
          _isOfflineNotifier.value = !isOnline;
          
          if (isOnline) {
            Provider.of<GalleryProvider>(context, listen: false).loadImages();
          }
        }
      });
      
      _isOfflineNotifier.value = !_connectivityService.isOnline;
    } catch (e) {
      print('Error initializing connectivity monitoring: $e');
    }
  }

  @override
  void dispose() {
    _isOfflineNotifier.dispose();
    _connectivityService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        backgroundColor: primaryGreen,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            if (Navigator.canPop(context)) {
              Navigator.pop(context);
            } else {
              Navigator.pushReplacementNamed(context, '/home');
            }
          },
        ),
        title: TranslatedText(
          'Photo Gallery',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ValueListenableBuilder<bool>(
        valueListenable: _isOfflineNotifier,
        builder: (context, isOffline, _) {
          return Column(
            children: [
              if (isOffline)
                Consumer<GalleryProvider>(
                  builder: (context, provider, _) {
                    return OfflineBanner(lastSyncTime: provider.lastSyncTime);
                  },
                ),
              Expanded(
                child: Consumer<GalleryProvider>(
                  builder: (context, provider, _) {
                    return RefreshIndicator(
                      onRefresh: () => provider.loadImages(forceRefresh: true),
                      color: primaryGreen,
                      child: provider.isLoading && provider.images.isEmpty
                          ? _buildLoadingState()
                          : provider.error != null && provider.images.isEmpty
                              ? _buildErrorState(provider.error, provider)
                              : provider.images.isEmpty
                                  ? _buildEmptyState()
                                  : _buildGalleryGrid(provider.images),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 3,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/emergency');
              break;
            case 2:
              Navigator.pushReplacementNamed(context, '/waste-management');
              break;
            case 3:
              // Already on Gallery page
              break;
            case 4:
              Navigator.pushNamed(context, '/camera');
              break;
          }
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: primaryGreen),
          const SizedBox(height: 16),
          Text(
            'Loading gallery...',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String? error, GalleryProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            error ?? 'Unknown error',
            style: TextStyle(color: Colors.grey[800]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: () => provider.loadImages(forceRefresh: true),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryGreen,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.green[50],
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.photo_library_outlined,
              size: 64,
              color: primaryGreen,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'No Images Yet',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Gallery images will appear here',
            style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildGalleryGrid(List<GalleryImage> images) {
    return SingleChildScrollView(
      physics: const AlwaysScrollableScrollPhysics(),
      padding: const EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: 100,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TranslatedText(
            'Clean Dhaka Activities',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D3748),
            ),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
              childAspectRatio: 1,
            ),
            itemCount: images.length,
            itemBuilder: (context, index) {
              return _buildImageCard(images[index], index);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildImageCard(GalleryImage image, int index) {
    return GestureDetector(
      onTap: () => _showFullScreenImage(image),
      child: Hero(
        tag: 'gallery_image_${image.id}',
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.2),
                offset: const Offset(0, 6),
                blurRadius: 15,
              ),
              BoxShadow(
                color: primaryGreen.withOpacity(0.1),
                offset: const Offset(0, 3),
                blurRadius: 10,
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                CachedNetworkImage(
                  imageUrl: image.imageUrl,
                  width: double.infinity,
                  height: double.infinity,
                  fit: BoxFit.cover,
                  placeholder: (context, url) => Container(
                    color: Colors.grey[200],
                    child: const Center(
                      child: CircularProgressIndicator(color: primaryGreen),
                    ),
                  ),
                  errorWidget: (context, url, error) => Container(
                    color: Colors.grey[200],
                    child: Icon(
                      Icons.broken_image,
                      size: 32,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.bottomCenter,
                        end: Alignment.topCenter,
                        colors: [
                          Colors.black.withOpacity(0.8),
                          Colors.transparent,
                        ],
                      ),
                    ),
                    child: Material(
                      color: Colors.transparent,
                      child: Text(
                        image.title,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    ).animate(delay: (index * 50).ms) // Reduced delay for smoother feel
        .fadeIn(duration: 600.ms)
        .scale(
          begin: const Offset(0.9, 0.9),
          duration: 400.ms,
          curve: Curves.easeOut,
        );
  }

  void _showFullScreenImage(GalleryImage image) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => GalleryDetailPage(image: image),
      ),
    );
  }
}
