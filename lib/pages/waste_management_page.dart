import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../components/custom_bottom_nav.dart';
import '../widgets/translated_text.dart';
import '../services/auth_service.dart';
import '../services/waste_management_service.dart';
import '../models/waste_post_model.dart';

class WasteManagementPage extends StatefulWidget {
  const WasteManagementPage({super.key});

  @override
  _WasteManagementPageState createState() => _WasteManagementPageState();
}

class _WasteManagementPageState extends State<WasteManagementPage> {
  final WasteManagementService _service = WasteManagementService();

  List<WastePost> _posts = [];
  bool _isLoading = true;
  String? _error;
  String _selectedCategory = 'CURRENT_WASTE'; // CURRENT_WASTE or FUTURE_WASTE
  String? _token;

  // Color palette
  static const Color primaryGreen = Color(0xFF4CAF50);
  static const Color lightGreen = Color(0xFFE8F5E8);
  static const Color darkGreen = Color(0xFF2E7D32);

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    try {
      final token = await AuthService.getAccessToken();

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
      setState(() {
        _error = 'Failed to load: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchPosts() async {
    if (_token == null) return;

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final posts = await _service.getPostsByCategory(
        _token!,
        _selectedCategory,
      );

      setState(() {
        _posts = posts;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load posts: $e';
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleReaction(int postId, String reactionType) async {
    if (_token == null) return;

    // Find the post and its current state
    final postIndex = _posts.indexWhere((p) => p.id == postId);
    if (postIndex == -1) return;

    final oldPost = _posts[postIndex];
    final String? oldReaction = oldPost.userReaction;

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

      _posts[postIndex] = oldPost.copyWith(
        likeCount: newLikeCount,
        loveCount: newLoveCount,
        userReaction: newReaction,
      );
    });

    try {
      final response = await _service.toggleReaction(
        _token!,
        postId,
        reactionType,
      );

      // If the server returns the updated post, use it to ensure sync
      if (response.containsKey('post')) {
        setState(() {
          _posts[postIndex] = WastePost.fromJson(response['post']);
        });
      }
    } catch (e) {
      // Revert on error
      setState(() {
        _posts[postIndex] = oldPost;
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
      backgroundColor: const Color(0xFFF2F4F5),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: RefreshIndicator(
                onRefresh: _fetchPosts,
                child: SingleChildScrollView(
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
                      _buildCategorySelector(),
                      const SizedBox(height: 24),

                      if (_isLoading)
                        _buildLoadingState()
                      else if (_error != null)
                        _buildErrorState()
                      else if (_posts.isEmpty)
                        _buildEmptyState()
                      else
                        _buildPostsList(),

                      const SizedBox(height: 16),
                      _buildWasteSeparationTips(),
                      const SizedBox(height: 20),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(color: Color(0xFF2E8B57)),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => Navigator.pop(context),
            child: Container(
              padding: const EdgeInsets.all(8),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: 12),
          const TranslatedText(
            'Waste Management',
            style: TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategorySelector() {
    return Container(
      width: double.infinity,
      height: 69,
      decoration: BoxDecoration(
        color: const Color(0xFFF5F0F0),
        borderRadius: BorderRadius.circular(8),
        boxShadow: const [BoxShadow(color: Color(0x40000000), blurRadius: 4)],
      ),
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 8),
      child: Row(
        children: [
          // Current Waste Button
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedCategory = 'CURRENT_WASTE';
                });
                _fetchPosts();
              },
              child: Container(
                height: 53,
                decoration: BoxDecoration(
                  color: _selectedCategory == 'CURRENT_WASTE'
                      ? const Color(0xFF3FA564)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  'বর্তমান বর্জ্য ব্যবস্থাপনা',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _selectedCategory == 'CURRENT_WASTE'
                        ? const Color(0xFFF2F4F5)
                        : const Color(0xFF8E8C8C),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Future Waste Button
          Expanded(
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedCategory = 'FUTURE_WASTE';
                });
                _fetchPosts();
              },
              child: Container(
                height: 53,
                decoration: BoxDecoration(
                  color: _selectedCategory == 'FUTURE_WASTE'
                      ? const Color(0xFF3FA564)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  'ভবিষ্যৎ বর্জ্য ব্যবস্থাপনা',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: _selectedCategory == 'FUTURE_WASTE'
                        ? const Color(0xFFF2F4F5)
                        : const Color(0xFF8E8C8C),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingState() {
    return Center(
      child: Column(
        children: const [
          SizedBox(height: 100),
          CircularProgressIndicator(color: primaryGreen),
          SizedBox(height: 16),
          Text('Loading posts...'),
        ],
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        children: [
          const SizedBox(height: 100),
          const Icon(Icons.error_outline, size: 64, color: Colors.red),
          const SizedBox(height: 16),
          Text(_error ?? 'Unknown error'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _fetchPosts,
            style: ElevatedButton.styleFrom(backgroundColor: primaryGreen),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        children: const [
          SizedBox(height: 100),
          Icon(Icons.inbox_outlined, size: 64, color: Colors.grey),
          SizedBox(height: 16),
          Text(
            'কোনো পোস্ট নেই',
            style: TextStyle(fontSize: 18, color: Colors.grey),
          ),
          SizedBox(height: 8),
          Text(
            'এই বিভাগে এখনো কোনো পোস্ট প্রকাশ করা হয়নি',
            style: TextStyle(fontSize: 14, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildPostsList() {
    return Column(
      children: _posts.map((post) => _buildPostCard(post)).toList(),
    );
  }

  Widget _buildPostCard(WastePost post) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            offset: const Offset(0, 2),
            blurRadius: 8,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          if (post.imageUrl != null && post.imageUrl!.isNotEmpty)
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
              child: CachedNetworkImage(
                imageUrl: post.imageUrl!,
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                  height: 200,
                  color: Colors.grey[200],
                  child: const Center(
                    child: CircularProgressIndicator(color: primaryGreen),
                  ),
                ),
                errorWidget: (context, url, error) => Container(
                  height: 200,
                  color: Colors.grey[200],
                  child: const Icon(Icons.image_not_supported, size: 50),
                ),
              ),
            ),

          // Content
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title
                Text(
                  post.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF2D3748),
                  ),
                ),
                const SizedBox(height: 8),

                // Content
                Text(
                  post.content,
                  style: const TextStyle(
                    fontSize: 14,
                    color: Color(0xFF718096),
                    height: 1.5,
                  ),
                ),
                const SizedBox(height: 16),

                // Like/Love Row
                Row(
                  children: [
                    // Like Button
                    _ReactionButton(
                      icon: Icons.thumb_up,
                      count: post.likeCount,
                      isSelected: post.userReaction == 'LIKE',
                      color: primaryGreen,
                      onTap: () => _toggleReaction(post.id, 'LIKE'),
                    ),
                    const SizedBox(width: 12),

                    // Love Button
                    _ReactionButton(
                      icon: Icons.favorite,
                      count: post.loveCount,
                      isSelected: post.userReaction == 'LOVE',
                      color: Colors.pink,
                      onTap: () => _toggleReaction(post.id, 'LOVE'),
                    ),

                    const Spacer(),

                    // Published Date
                    if (post.publishedAt != null)
                      Text(
                        _formatDate(post.publishedAt!),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF718096),
                        ),
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
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
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFFFD85B).withOpacity(0.2),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text('♻️', style: TextStyle(fontSize: 20)),
              ),
              const SizedBox(width: 12),
              const TranslatedText(
                'Waste Separation Tips',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1E2939),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTipItem('• জৈব এবং অজৈব বর্জ্য আলাদা করুন'),
          _buildTipItem('• পুনর্ব্যবহারযোগ্য জিনিস পরিষ্কার এবং শুকনো রাখুন'),
          _buildTipItem('• সংগ্রহের সময়ের আগে বর্জ্যের ব্যাগ বাইরে রাখুন'),
        ],
      ),
    );
  }

  Widget _buildTipItem(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        text,
        style: const TextStyle(
          fontSize: 14,
          color: Color(0xFF2D3748),
          height: 1.4,
        ),
      ),
    );
  }
}

class _ReactionButton extends StatefulWidget {
  final IconData icon;
  final int count;
  final bool isSelected;
  final Color color;
  final VoidCallback onTap;

  const _ReactionButton({
    required this.icon,
    required this.count,
    required this.isSelected,
    required this.color,
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
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: BoxDecoration(
            color: widget.isSelected
                ? widget.color.withOpacity(0.1)
                : Colors.grey[100],
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: widget.isSelected ? widget.color : Colors.grey[300]!,
            ),
          ),
          child: Row(
            children: [
              Icon(
                widget.icon,
                size: 18,
                color: widget.isSelected ? widget.color : Colors.grey[600],
              ),
              const SizedBox(width: 6),
              Text(
                '${widget.count}',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: widget.isSelected ? widget.color : Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
