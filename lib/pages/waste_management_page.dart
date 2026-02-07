import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_staggered_animations/flutter_staggered_animations.dart';

import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../widgets/offline_banner.dart';
import '../services/auth_service.dart';
import '../services/waste_management_service.dart';
import '../services/offline_cache_service.dart';
import '../services/connectivity_service.dart';
import '../models/waste_post_model.dart';
import 'waste_management_detail_page.dart';

class WasteManagementPage extends StatefulWidget {
  const WasteManagementPage({super.key});

  @override
  _WasteManagementPageState createState() => _WasteManagementPageState();
}

class _WasteManagementPageState extends State<WasteManagementPage> {
  final WasteManagementService _service = WasteManagementService();
  final OfflineCacheService _cacheService = OfflineCacheService();
  final ConnectivityService _connectivityService = ConnectivityService();

  List<WastePost> _currentWastePosts = [];
  List<WastePost> _futureWastePosts = [];
  DateTime? _lastFetchTimeCurrent;
  DateTime? _lastFetchTimeFuture;

  List<WastePost> get _posts => _selectedCategory == 'CURRENT_WASTE'
      ? _currentWastePosts
      : _futureWastePosts;

  bool _isLoading = true;
  String? _error;
  String _selectedCategory = 'CURRENT_WASTE'; // CURRENT_WASTE or FUTURE_WASTE
  String? _token;
  bool _isOffline = false;
  DateTime? _lastSyncTime;

  // Modern Color palette
  static const Color primaryGreen = Color(0xFF2E8B57); // Sea Green
  static const Color accentGreen = Color(0xFF3CB371);
  static const Color lightGreen = Color(0xFFE8F5E9);
  static const Color surfaceColor = Color(0xFFF5F7FA);
  static const Color cardColor = Colors.white;
  static const Color textColor = Color(0xFF2D3748);
  static const Color subtitleColor = Color(0xFF718096);

  @override
  void initState() {
    super.initState();
    _restoreFromMemory();
    _initializeServices();
  }

  void _restoreFromMemory() {
    bool hasData = false;
    if (WasteManagementService.currentWastePostsMemory != null) {
      _currentWastePosts = List.from(
        WasteManagementService.currentWastePostsMemory!,
      );
      _lastFetchTimeCurrent = WasteManagementService.lastFetchTimeCurrent;
      if (_selectedCategory == 'CURRENT_WASTE' &&
          _currentWastePosts.isNotEmpty) {
        hasData = true;
      }
    }
    if (WasteManagementService.futureWastePostsMemory != null) {
      _futureWastePosts = List.from(
        WasteManagementService.futureWastePostsMemory!,
      );
      _lastFetchTimeFuture = WasteManagementService.lastFetchTimeFuture;
      if (_selectedCategory == 'FUTURE_WASTE' && _futureWastePosts.isNotEmpty) {
        hasData = true;
      }
    }

    if (hasData) {
      _isLoading = false;
    }
  }

  Future<void> _initializeServices() async {
    try {
      await _cacheService.init();
      await _connectivityService.init();

      // Listen to connectivity changes
      _connectivityService.connectivityStream.listen((isOnline) {
        if (mounted) {
          setState(() {
            _isOffline = !isOnline;
          });

          // Auto-refresh when coming back online
          if (isOnline && _posts.isEmpty) {
            _loadToken();
          }
        }
      });

      // Set initial offline status
      _isOffline = !_connectivityService.isOnline;

      // Load last sync time
      _lastSyncTime = await _cacheService.getLastSyncTime(
        'waste_post',
        _selectedCategory,
      );

      if (mounted) {
        setState(() {});
      }
    } catch (e) {
      print('Error initializing offline services: $e');
    }

    _loadToken();
  }

  Future<void> _loadToken() async {
    try {
      final token = await AuthService.getAccessToken();

      if (!mounted) return;

      if (token == null) {
        setState(() {
          _error = 'Please login first';
          _isLoading = false;
        });
        return;
      }

      setState(() {
        _token = token;
      });

      await _fetchPosts();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to load: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchPosts({bool forceRefresh = false}) async {
    if (_token == null) return;

    // Determine which list and timestamp to use
    List<WastePost> currentList = _selectedCategory == 'CURRENT_WASTE'
        ? _currentWastePosts
        : _futureWastePosts;

    DateTime? lastFetchTime = _selectedCategory == 'CURRENT_WASTE'
        ? _lastFetchTimeCurrent
        : _lastFetchTimeFuture;

    // Check if data is fresh (e.g., less than 5 minutes old)
    final isFresh =
        lastFetchTime != null &&
        DateTime.now().difference(lastFetchTime) < const Duration(minutes: 5);

    // If we have data and it's fresh (and not forcing refresh), just return
    // This solves the "bar loading" issue when switching tabs
    if (!forceRefresh && currentList.isNotEmpty && isFresh) {
      if (_isLoading) {
        setState(() {
          _isLoading = false;
        });
      }
      return;
    }

    // Check connectivity
    final isOnline = await _connectivityService.checkConnectivity();

    if (!mounted) return;

    setState(() {
      _isOffline = !isOnline;
    });

    // If offline, load from cache
    if (!isOnline) {
      await _loadFromCache();
      return;
    }

    // Show cached data immediately if list is empty
    if (currentList.isEmpty) {
      await _loadFromCache();
    }

    if (!mounted) return;

    // Only show loading indicator if we don't have any data
    if (currentList.isEmpty) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final posts = await _service.getPostsByCategory(
        _token!,
        _selectedCategory,
      );

      if (!mounted) return;

      // Cache the fresh data
      final postsJson = posts.map((p) => p.toJson()).toList();
      await _cacheService.saveCache('waste_post', _selectedCategory, postsJson);

      final now = DateTime.now();

      setState(() {
        if (_selectedCategory == 'CURRENT_WASTE') {
          _currentWastePosts = posts;
          _lastFetchTimeCurrent = now;

          // Update static memory cache
          WasteManagementService.currentWastePostsMemory = List.from(posts);
          WasteManagementService.lastFetchTimeCurrent = now;
        } else {
          _futureWastePosts = posts;
          _lastFetchTimeFuture = now;

          // Update static memory cache
          WasteManagementService.futureWastePostsMemory = List.from(posts);
          WasteManagementService.lastFetchTimeFuture = now;
        }
        _isLoading = false;
        _error = null;
      });
    } catch (e) {
      if (!mounted) return;

      // If fetch fails and we have no data, try loading from cache
      if (currentList.isEmpty) {
        await _loadFromCache();
      }

      setState(() {
        _error = 'Failed to load posts: $e';
        _isLoading = false;
      });
    }
  }

  /// Load posts from local cache
  Future<void> _loadFromCache() async {
    try {
      final cachedData = await _cacheService.getCache(
        'waste_post',
        _selectedCategory,
      );
      if (cachedData != null && cachedData is List) {
        final posts = cachedData
            .map((json) => WastePost.fromJson(json))
            .toList();

        if (mounted) {
          setState(() {
            if (_selectedCategory == 'CURRENT_WASTE') {
              _currentWastePosts = posts;
            } else {
              _futureWastePosts = posts;
            }
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      print('Error loading from cache: $e');
    }
  }

  Future<void> _toggleReaction(int postId, String reactionType) async {
    if (_token == null) return;

    // Get current list
    List<WastePost> currentList = _selectedCategory == 'CURRENT_WASTE'
        ? _currentWastePosts
        : _futureWastePosts;

    // Find the post and its current state
    final postIndex = currentList.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final oldPost = currentList[postIndex];
    final String? oldReaction = oldPost.userReaction;

    if (!mounted) return;

    // Optimistic UI update
    setState(() {
      int newLikeCount = oldPost.likeCount;
      int newLoveCount = oldPost.loveCount;
      String? newReaction;

      if (oldReaction == reactionType) {
        // Removing reaction
        newReaction = null;
        if (reactionType == 'LIKE') newLikeCount--;
        if (reactionType == 'LOVE') newLoveCount--;
      } else {
        // Adding or changing reaction
        newReaction = reactionType;
        if (reactionType == 'LIKE') {
          newLikeCount++;
          if (oldReaction == 'LOVE') newLoveCount--;
        } else {
          newLoveCount++;
          if (oldReaction == 'LIKE') newLikeCount--;
        }
      }

      final updatedPost = oldPost.copyWith(
        likeCount: newLikeCount,
        loveCount: newLoveCount,
        userReaction: newReaction,
      );

      if (_selectedCategory == 'CURRENT_WASTE') {
        _currentWastePosts[postIndex] = updatedPost;
      } else {
        _futureWastePosts[postIndex] = updatedPost;
      }
    });

    try {
      final response = await _service.toggleReaction(
        _token!,
        postId,
        reactionType,
      );

      if (!mounted) return;

      // If the server returns the updated post, use it to ensure sync
      if (response.containsKey('post')) {
        setState(() {
          final updatedPost = WastePost.fromJson(response['post']);
          if (_selectedCategory == 'CURRENT_WASTE') {
            _currentWastePosts[postIndex] = updatedPost;
          } else {
            _futureWastePosts[postIndex] = updatedPost;
          }
        });
      }
    } catch (e) {
      if (!mounted) return;
      // Revert on error
      setState(() {
        if (_selectedCategory == 'CURRENT_WASTE') {
          _currentWastePosts[postIndex] = oldPost;
        } else {
          _futureWastePosts[postIndex] = oldPost;
        }
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: surfaceColor,
      extendBody: true,
      body: Column(
        children: [
          _buildHeader(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _fetchPosts(forceRefresh: true),
              color: primaryGreen,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 20),
                    _buildCategorySelector(),
                    const SizedBox(height: 24),

                    if (_isLoading)
                      _buildLoadingState()
                    else if (_error != null)
                      _buildErrorState()
                    else if (_posts.isEmpty)
                      _buildEmptyState()
                    else
                      AnimationLimiter(
                        child: Column(
                          children: [
                            _buildPostsList(),
                            const SizedBox(height: 24),
                            _buildWasteSeparationTips(),
                            const SizedBox(height: 20),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 2,
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/complaint-list');
              break;
            case 4:
              Navigator.pushNamed(context, '/camera');
              break;
          }
        },
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 10,
        bottom: 24,
        left: 20,
        right: 20,
      ),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [primaryGreen, accentGreen],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.2),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(
                Icons.arrow_back_ios_new_rounded,
                color: Colors.white,
                size: 20,
              ),
            ),
          ),
          const SizedBox(width: 16),
          const TranslatedText(
            'Waste Management',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 500.ms).slideY(begin: -0.2, end: 0);
  }

  Widget _buildCategorySelector() {
    return Container(
      width: double.infinity,
      height: 60,
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Stack(
        children: [
          AnimatedAlign(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            alignment: _selectedCategory == 'CURRENT_WASTE'
                ? Alignment.centerLeft
                : Alignment.centerRight,
            child: Container(
              width: (MediaQuery.of(context).size.width - 40) / 2,
              height: double.infinity,
              decoration: BoxDecoration(
                color: primaryGreen,
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: primaryGreen.withOpacity(0.3),
                    blurRadius: 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
          ),
          Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selectedCategory = 'CURRENT_WASTE');
                    _fetchPosts();
                  },
                  child: Container(
                    color: Colors.transparent,
                    alignment: Alignment.center,
                    child: Text(
                      'বর্তমান বর্জ্য ব্যবস্থাপনা',
                      style: TextStyle(
                        color: _selectedCategory == 'CURRENT_WASTE'
                            ? Colors.white
                            : subtitleColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () {
                    setState(() => _selectedCategory = 'FUTURE_WASTE');
                    _fetchPosts();
                  },
                  child: Container(
                    color: Colors.transparent,
                    alignment: Alignment.center,
                    child: Text(
                      'ভবিষ্যৎ বর্জ্য ব্যবস্থাপনা',
                      style: TextStyle(
                        color: _selectedCategory == 'FUTURE_WASTE'
                            ? Colors.white
                            : subtitleColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 50),
          const CircularProgressIndicator(color: primaryGreen),
          const SizedBox(height: 16),
          Text('Loading...', style: TextStyle(color: subtitleColor)),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 50),
          Icon(Icons.error_outline_rounded, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(_error ?? 'Unknown error', style: TextStyle(color: textColor)),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            onPressed: _fetchPosts,
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
        children: [
          const SizedBox(height: 80),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: lightGreen,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.inventory_2_outlined,
              size: 64,
              color: primaryGreen,
            ),
          ),
          const SizedBox(height: 24),
          const Text(
            'কোনো পোস্ট নেই',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: textColor,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'এই বিভাগে এখনো কোনো পোস্ট প্রকাশ করা হয়নি',
            style: TextStyle(fontSize: 14, color: subtitleColor),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPostsList() {
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _posts.length,
      itemBuilder: (context, index) {
        return AnimationConfiguration.staggeredList(
          position: index,
          duration: const Duration(milliseconds: 375),
          child: SlideAnimation(
            verticalOffset: 50.0,
            child: FadeInAnimation(child: _buildPostCard(_posts[index])),
          ),
        );
      },
    );
  }

  Widget _buildPostCard(WastePost post) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => WasteManagementDetailPage(
              post: post,
              heroTag: 'waste_post_${post.id}',
            ),
          ),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.06),
              offset: const Offset(0, 4),
              blurRadius: 16,
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image
            if (post.imageUrl != null && post.imageUrl!.isNotEmpty)
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: const BorderRadius.only(
                      topLeft: Radius.circular(20),
                      topRight: Radius.circular(20),
                    ),
                    child: Hero(
                      tag: 'waste_post_${post.id}',
                      child: CachedNetworkImage(
                        imageUrl: post.imageUrl!,
                        width: double.infinity,
                        height: 220,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          height: 220,
                          color: Colors.grey[100],
                          child: const Center(
                            child: CircularProgressIndicator(
                              color: primaryGreen,
                            ),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          height: 220,
                          color: Colors.grey[100],
                          child: const Icon(
                            Icons.broken_image_rounded,
                            size: 50,
                            color: Colors.grey,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 12,
                    right: 12,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withOpacity(0.6),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white24),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.access_time_rounded,
                            color: Colors.white,
                            size: 14,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            post.publishedAt != null
                                ? _formatDate(post.publishedAt!)
                                : 'Just now',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

            // Content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    post.title,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: textColor,
                      height: 1.3,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Text(
                    post.content,
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      color: subtitleColor,
                      height: 1.6,
                    ),
                  ),
                  const SizedBox(height: 20),
                  Container(height: 1, color: Colors.grey[100]),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      _ReactionButton(
                        icon: Icons.thumb_up_rounded,
                        count: post.likeCount,
                        isSelected: post.userReaction == 'LIKE',
                        color: primaryGreen,
                        label: 'Like',
                        onTap: () => _toggleReaction(post.id, 'LIKE'),
                      ),
                      const SizedBox(width: 16),
                      _ReactionButton(
                        icon: Icons.favorite_rounded,
                        count: post.loveCount,
                        isSelected: post.userReaction == 'LOVE',
                        color: Colors.pink,
                        label: 'Love',
                        onTap: () => _toggleReaction(post.id, 'LOVE'),
                      ),
                      const Spacer(),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => WasteManagementDetailPage(
                                post: post,
                                heroTag: 'waste_post_${post.id}',
                              ),
                            ),
                          );
                        },
                        style: TextButton.styleFrom(
                          foregroundColor: primaryGreen,
                        ),
                        child: const Row(
                          children: [
                            Text('বিস্তারিত'),
                            SizedBox(width: 4),
                            Icon(Icons.arrow_forward_rounded, size: 16),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays == 0) {
      return 'আজ';
    } else if (difference.inDays == 1) {
      return 'গতকাল';
    } else if (difference.inDays < 7) {
      return '${difference.inDays} দিন আগে';
    } else {
      return '${date.day}/${date.month}/${date.year}';
    }
  }

  Widget _buildWasteSeparationTips() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.amber.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('💡', style: TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              const TranslatedText(
                'Waste Separation Tips',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: textColor,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 160,
          child: ListView(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            children: [
              _buildTipCard(
                'জৈব বর্জ্য',
                'শাকসবজি, ফলের খোসা আলাদা রাখুন।',
                Colors.green,
                Icons.compost,
              ),
              _buildTipCard(
                'পুনর্ব্যবহারযোগ্য',
                'কাগজ, প্লাস্টিক, কাচ আলাদা রাখুন।',
                Colors.blue,
                Icons.recycling,
              ),
              _buildTipCard(
                'বিপজ্জনক',
                'ব্যাটারি, ঔষধ সাবধানে ফেলুন।',
                Colors.red,
                Icons.warning_amber_rounded,
              ),
            ],
          ),
        ),
      ],
    ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2, end: 0);
  }

  Widget _buildTipCard(String title, String desc, Color color, IconData icon) {
    return Container(
      width: 140,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const Spacer(),
          Text(
            title,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            desc,
            style: TextStyle(fontSize: 11, color: subtitleColor, height: 1.4),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

class _ReactionButton extends StatefulWidget {
  final IconData icon;
  final int count;
  final bool isSelected;
  final Color color;
  final String label;
  final VoidCallback onTap;

  const _ReactionButton({
    required this.icon,
    required this.count,
    required this.isSelected,
    required this.color,
    required this.label,
    required this.onTap,
  });

  @override
  State<_ReactionButton> createState() => _ReactionButtonState();
}

class _ReactionButtonState extends State<_ReactionButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.2,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void didUpdateWidget(_ReactionButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.isSelected && !oldWidget.isSelected) {
      _controller.forward().then((_) => _controller.reverse());
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: widget.isSelected
                ? widget.color.withOpacity(0.1)
                : Colors.grey[50],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.isSelected
                  ? widget.color.withOpacity(0.5)
                  : Colors.transparent,
            ),
          ),
          child: Row(
            children: [
              Icon(
                widget.icon,
                size: 20,
                color: widget.isSelected ? widget.color : Colors.grey[500],
              ),
              const SizedBox(width: 6),
              if (widget.count > 0) ...[
                Text(
                  '${widget.count}',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: widget.isSelected ? widget.color : Colors.grey[600],
                  ),
                ),
              ] else ...[
                Text(
                  widget.label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[500],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
