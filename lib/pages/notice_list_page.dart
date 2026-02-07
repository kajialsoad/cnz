import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../models/notice_model.dart';
import '../providers/notice_provider.dart';
import '../providers/language_provider.dart';
import '../widgets/translated_text.dart';
import 'notice_detail_page.dart';

class NoticeListPage extends StatefulWidget {
  final int? categoryId;
  final String? categoryName;
  
  const NoticeListPage({
    super.key,
    this.categoryId,
    this.categoryName,
  });

  @override
  State<NoticeListPage> createState() => _NoticeListPageState();
}

class _NoticeListPageState extends State<NoticeListPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final noticeProvider = Provider.of<NoticeProvider>(
        context,
        listen: false,
      );
      
      // Set category filter if provided
      if (widget.categoryId != null) {
        noticeProvider.setCategoryFilter(widget.categoryId);
      } else {
        noticeProvider.loadNotices();
      }
      
      noticeProvider.loadCategories();
    });
  }

  @override
  Widget build(BuildContext context) {
    final noticeProvider = Provider.of<NoticeProvider>(context);
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: widget.categoryName != null
            ? Text(widget.categoryName!)
            : TranslatedText('Notice Board', bn: 'নোটিশ বোর্ড'),
        backgroundColor: const Color(0xFF0f766e),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => _showFilterDialog(context),
          ),
        ],
      ),
      body: noticeProvider.isLoading
          ? const Center(child: CircularProgressIndicator())
          : noticeProvider.error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text(noticeProvider.error!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => noticeProvider.loadNotices(refresh: true),
                    child: TranslatedText(
                      'Retry',
                      bn: 'পুনরায় চেষ্টা করুন',
                    ),
                  ),
                ],
              ),
            )
          : noticeProvider.filteredNotices.isEmpty
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: Colors.grey,
                  ),
                  const SizedBox(height: 16),
                  TranslatedText(
                    'No notices available',
                    bn: 'কোন নোটিশ উপলব্ধ নেই',
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: () => noticeProvider.loadNotices(refresh: true),
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: noticeProvider.filteredNotices.length,
                itemBuilder: (context, index) {
                  final notice = noticeProvider.filteredNotices[index];
                  return _buildNoticeCard(context, notice, currentLanguage);
                },
              ),
            ),
    );
  }

  Widget _buildNoticeCard(
    BuildContext context,
    Notice notice,
    String currentLanguage,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => NoticeDetailPage(
                noticeId: notice.id,
                initialNotice: notice,
              ),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Section
            if (notice.imageUrl != null && notice.imageUrl!.isNotEmpty)
              Hero(
                tag: 'notice-image-${notice.id}',
                child: ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(12),
                  ),
                  child: CachedNetworkImage(
                    imageUrl: notice.imageUrl!,
                    width: double.infinity,
                    height: 180,
                    fit: BoxFit.cover,
                    placeholder: (context, url) => Container(
                      height: 180,
                      color: Colors.grey[200],
                      child: const Center(child: CircularProgressIndicator()),
                    ),
                    errorWidget: (context, url, error) => Container(
                      height: 180,
                      color: Colors.grey[200],
                      child: const Center(
                        child: Icon(Icons.image_not_supported, size: 48),
                      ),
                    ),
                  ),
                ),
              ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category and Priority Badges
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      if (notice.category != null)
                        Chip(
                          label: Text(
                            currentLanguage == 'bn' &&
                                    notice.category!.nameBn != null
                                ? notice.category!.nameBn!
                                : notice.category!.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                            ),
                          ),
                          backgroundColor: _parseColor(notice.category!.color),
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                      if (notice.isUrgent)
                        const Chip(
                          label: Text(
                            'URGENT',
                            style: TextStyle(color: Colors.white, fontSize: 10),
                          ),
                          backgroundColor: Colors.red,
                          padding: EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 2,
                          ),
                          materialTapTargetSize:
                              MaterialTapTargetSize.shrinkWrap,
                        ),
                    ],
                  ),

                  const SizedBox(height: 12),

                  // Title
                  Text(
                    notice.getLocalizedTitle(currentLanguage),
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 8),

                  // Description
                  Text(
                    notice.getLocalizedDescription(currentLanguage),
                    style: TextStyle(fontSize: 14, color: Colors.grey[700]),
                    maxLines: 3,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const SizedBox(height: 12),

                  // Date and Stats
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.calendar_today,
                            size: 14,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            _formatDate(notice.publishDate),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      Row(
                        children: [
                          const Icon(
                            Icons.visibility,
                            size: 14,
                            color: Colors.grey,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            notice.viewCount.toString(),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
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

  void _showFilterDialog(BuildContext context) {
    final noticeProvider = Provider.of<NoticeProvider>(context, listen: false);
    final languageProvider = Provider.of<LanguageProvider>(
      context,
      listen: false,
    );
    final currentLanguage = languageProvider.languageCode;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: TranslatedText('Filter Notices', bn: 'নোটিশ ফিল্টার করুন'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Category Filter
            DropdownButtonFormField<int?>(
              value: noticeProvider.selectedCategoryId,
              decoration: InputDecoration(
                labelText: currentLanguage == 'bn' ? 'বিভাগ' : 'Category',
                border: const OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem<int?>(
                  value: null,
                  child: Text(
                    currentLanguage == 'bn' ? 'সব বিভাগ' : 'All Categories',
                  ),
                ),
                ...noticeProvider.categories.map((category) {
                  return DropdownMenuItem<int?>(
                    value: category.id,
                    child: Text(
                      currentLanguage == 'bn' && category.nameBn != null
                          ? category.nameBn!
                          : category.name,
                    ),
                  );
                }),
              ],
              onChanged: (value) {
                noticeProvider.setCategoryFilter(value);
              },
            ),

            const SizedBox(height: 16),

            // Type Filter
            DropdownButtonFormField<String?>(
              value: noticeProvider.selectedType,
              decoration: InputDecoration(
                labelText: currentLanguage == 'bn' ? 'ধরন' : 'Type',
                border: const OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem<String?>(
                  value: null,
                  child: Text(currentLanguage == 'bn' ? 'সব ধরন' : 'All Types'),
                ),
                const DropdownMenuItem<String?>(
                  value: 'GENERAL',
                  child: Text('GENERAL'),
                ),
                const DropdownMenuItem<String?>(
                  value: 'URGENT',
                  child: Text('URGENT'),
                ),
                const DropdownMenuItem<String?>(
                  value: 'EVENT',
                  child: Text('EVENT'),
                ),
                const DropdownMenuItem<String?>(
                  value: 'SCHEDULED',
                  child: Text('SCHEDULED'),
                ),
              ],
              onChanged: (value) {
                noticeProvider.setTypeFilter(value);
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              noticeProvider.clearFilters();
              Navigator.pop(context);
            },
            child: TranslatedText('Clear Filters', bn: 'ফিল্টার সাফ করুন'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: TranslatedText('Apply', bn: 'প্রয়োগ করুন'),
          ),
        ],
      ),
    );
  }

  Color _parseColor(String colorString) {
    try {
      return Color(int.parse(colorString.replaceFirst('#', '0xFF')));
    } catch (e) {
      return Colors.grey;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
