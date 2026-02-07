import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../components/custom_bottom_nav.dart';
import '../models/calendar_model.dart';
import '../services/connectivity_service.dart';
import '../providers/language_provider.dart';
import '../providers/calendar_provider.dart';
import '../utils/cloudinary_helper.dart';
import '../widgets/offline_banner.dart';

class GovernmentCalendarPage extends StatefulWidget {
  const GovernmentCalendarPage({super.key});

  @override
  State<GovernmentCalendarPage> createState() => _GovernmentCalendarPageState();
}

class _GovernmentCalendarPageState extends State<GovernmentCalendarPage> {
  final ConnectivityService _connectivityService = ConnectivityService();
  bool _isOffline = false;

  @override
  void initState() {
    super.initState();
    _initServices();
    // Load calendar data via provider
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<CalendarProvider>(context, listen: false).loadCalendarData();
    });
  }

  Future<void> _initServices() async {
    await _connectivityService.init();
    
    // Listen to connectivity changes
    _connectivityService.connectivityStream.listen((isOnline) {
      if (mounted) {
        setState(() {
          _isOffline = !isOnline;
        });
        
        // Auto-refresh when coming back online
        if (isOnline) {
          Provider.of<CalendarProvider>(context, listen: false).loadCalendarData();
        }
      }
    });
    
    // Check initial connectivity
    final isOnline = await _connectivityService.checkConnectivity();
    if (mounted) {
      setState(() {
        _isOffline = !isOnline;
      });
    }
  }

  @override
  void dispose() {
    _connectivityService.dispose();
    super.dispose();
  }

  Future<void> _loadCalendarData() async {
    await Provider.of<CalendarProvider>(context, listen: false).loadCalendarData(forceRefresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    final currentLanguage = languageProvider.currentLanguage;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: const Color(0xFF4CAF50),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          currentLanguage == 'bn' ? 'সরকারি ক্যালেন্ডার' : 'Government Calendar',
          style: const TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: Colors.white),
            onPressed: _loadCalendarData,
          ),
        ],
      ),
      body: Consumer<CalendarProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.calendar == null) {
            return _buildLoadingState();
          }
          
          if (provider.error != null && provider.calendar == null) {
            return _buildErrorState(provider.error, provider);
          }

          if (provider.calendar == null) {
            return _buildNoCalendarState(currentLanguage);
          }

          return _buildCalendarContent(currentLanguage, provider);
        },
      ),
      bottomNavigationBar: CustomBottomNav(
        currentIndex: 3, // Borjo tab
        onTap: (index) {
          switch (index) {
            case 0:
              Navigator.pushReplacementNamed(context, '/home');
              break;
            case 1:
              Navigator.pushReplacementNamed(context, '/emergency');
              break;
            case 2:
              // Camera action
              break;
            case 3:
              // Current page (Borjo)
              break;
            case 4:
              Navigator.pushReplacementNamed(context, '/gallery');
              break;
          }
        },
      ),
    );
  }

  Widget _buildLoadingState() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(
            valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF4CAF50)),
          ),
          SizedBox(height: 16),
          Text(
            'Loading calendar...',
            style: TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(String? error, CalendarProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            const Text(
              'Error loading calendar',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error ?? 'Unknown error',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () => provider.loadCalendarData(forceRefresh: true),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4CAF50),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoCalendarState(String currentLanguage) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.calendar_today_outlined,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              currentLanguage == 'bn'
                  ? 'এই মাসের জন্য কোনো ক্যালেন্ডার নেই'
                  : 'No calendar available for this month',
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              currentLanguage == 'bn'
                  ? 'পরে আবার চেক করুন'
                  : 'Please check back later',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendarContent(String currentLanguage, CalendarProvider provider) {
    return Column(
      children: [
        // Offline banner
        if (_isOffline)
          OfflineBanner(lastSyncTime: provider.lastSyncTime),
        
        Expanded(
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 100),
            child: Column(
              children: [
                // Calendar Image
                _buildCalendarImage(currentLanguage, provider.calendar!),

                // Upcoming Events Section
                if (provider.upcomingEvents.isNotEmpty) 
                  _buildUpcomingEventsSection(currentLanguage, provider.upcomingEvents),

                // Legend Section
                _buildLegendSection(currentLanguage),

                const SizedBox(height: 100),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCalendarImage(String currentLanguage, CalendarModel calendar) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x66000000),
            blurRadius: 4,
            offset: Offset(0, 4),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Calendar Title
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF4CAF50),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Text(
              currentLanguage == 'bn'
                  ? (calendar.titleBn ?? calendar.title)
                  : calendar.title,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ),

          // Calendar Image
          AspectRatio(
            aspectRatio: 365 / 479,
            child: Image.network(
              CloudinaryHelper.getOptimizedImageUrl(
                calendar.imageUrl,
                width: 800,
                quality: 90,
              ),
              fit: BoxFit.cover,
              loadingBuilder: (context, child, loadingProgress) {
                if (loadingProgress == null) return child;
                return Container(
                  color: Colors.grey[200],
                  child: Center(
                    child: CircularProgressIndicator(
                      value: loadingProgress.expectedTotalBytes != null
                          ? loadingProgress.cumulativeBytesLoaded /
                              loadingProgress.expectedTotalBytes!
                          : null,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        Color(0xFF4CAF50),
                      ),
                    ),
                  ),
                );
              },
              errorBuilder: (context, error, stack) {
                return Container(
                  color: Colors.grey[200],
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.broken_image, size: 48, color: Colors.grey[400]),
                      const SizedBox(height: 8),
                      Text(
                        currentLanguage == 'bn'
                            ? 'ছবি লোড করা যায়নি'
                            : 'Failed to load image',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUpcomingEventsSection(String currentLanguage, List<CalendarEventModel> events) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            currentLanguage == 'bn' ? 'আসন্ন ইভেন্ট' : 'Upcoming Events',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          ...events.map((event) => _buildEventCard(event, currentLanguage)),
        ],
      ),
    );
  }

  Widget _buildEventCard(CalendarEventModel event, String currentLanguage) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Date Box
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              color: _getEventColor(event.category),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  DateFormat('MMM').format(event.eventDate).toUpperCase(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  event.eventDate.day.toString(),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(width: 16),

          // Event Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  currentLanguage == 'bn'
                      ? (event.titleBn ?? event.title)
                      : event.title,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  event.eventType,
                  style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                ),
                if (event.description != null && event.description!.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      currentLanguage == 'bn'
                          ? (event.descriptionBn ?? event.description!)
                          : event.description!,
                      style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendSection(String currentLanguage) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            currentLanguage == 'bn' ? 'লেজেন্ড' : 'Legend',
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 16),
          _buildLegendItem(
            color: const Color(0xFF4CAF50),
            label: currentLanguage == 'bn' ? 'বর্জ্য সংগ্রহ' : 'Waste Collection',
          ),
          const SizedBox(height: 8),
          _buildLegendItem(
            color: const Color(0xFFF44336),
            label: currentLanguage == 'bn' ? 'সরকারি ছুটি' : 'Public Holiday',
          ),
          const SizedBox(height: 8),
          _buildLegendItem(
            color: const Color(0xFFFFB74D),
            label: currentLanguage == 'bn' ? 'কমিউনিটি ইভেন্ট' : 'Community Event',
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem({required Color color, required String label}) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(color: color, shape: BoxShape.circle),
        ),
        const SizedBox(width: 12),
        Text(
          label,
          style: const TextStyle(fontSize: 14, color: Colors.black87),
        ),
      ],
    );
  }

  Color _getEventColor(EventCategory category) {
    switch (category) {
      case EventCategory.wasteCollection:
        return const Color(0xFF4CAF50);
      case EventCategory.publicHoliday:
        return const Color(0xFFF44336);
      case EventCategory.communityEvent:
        return const Color(0xFFFFB74D);
    }
  }
}
