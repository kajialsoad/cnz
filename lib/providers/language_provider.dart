import 'package:flutter/material.dart';
import '../services/language_service.dart';
import '../services/translation_service.dart';

class LanguageProvider extends ChangeNotifier {
  String _languageCode = 'en';

  LanguageProvider() {
    _loadLanguage();
  }

  String get languageCode => _languageCode;

  Future<void> _loadLanguage() async {
    _languageCode = await LanguageService.getCurrentLanguage();
    notifyListeners();
  }

  Future<void> setLanguage(String languageCode) async {
    _languageCode = languageCode;
    await LanguageService.setLanguage(languageCode);
    TranslationService.clearCache(); // Clear cache when language changes
    notifyListeners();
  }

  // Translate text using Google Translate API
  Future<String> translate(String text) async {
    if (_languageCode == 'en') {
      return text; // Return original if English
    }
    return await TranslationService.translate(text, _languageCode);
  }

  bool get isBangla => _languageCode == 'bn';
  bool get isEnglish => _languageCode == 'en';
}
