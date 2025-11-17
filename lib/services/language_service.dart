import 'package:shared_preferences/shared_preferences.dart';

class LanguageService {
  static const String _languageKey = 'app_language';
  static const String ENGLISH = 'en';
  static const String BANGLA = 'bn';

  // Get current language
  static Future<String> getCurrentLanguage() async {
    final sp = await SharedPreferences.getInstance();
    return sp.getString(_languageKey) ?? BANGLA;
  }

  // Set language
  static Future<void> setLanguage(String languageCode) async {
    final sp = await SharedPreferences.getInstance();
    await sp.setString(_languageKey, languageCode);
  }

  // Check if Bangla
  static Future<bool> isBangla() async {
    final lang = await getCurrentLanguage();
    return lang == BANGLA;
  }

  // Check if English
  static Future<bool> isEnglish() async {
    final lang = await getCurrentLanguage();
    return lang == ENGLISH;
  }
}
