import 'package:translator/translator.dart';

class TranslationService {
  static final GoogleTranslator _translator = GoogleTranslator();
  static final Map<String, String> _cache = {};

  // Translate text using Google Translate API
  static Future<String> translate(String text, String targetLanguage) async {
    if (text.isEmpty) return text;
    
    // Check cache first
    final cacheKey = '${text}_$targetLanguage';
    if (_cache.containsKey(cacheKey)) {
      return _cache[cacheKey]!;
    }

    try {
      final translation = await _translator.translate(
        text,
        to: targetLanguage == 'bn' ? 'bn' : 'en',
      );
      
      final translatedText = translation.text;
      _cache[cacheKey] = translatedText;
      return translatedText;
    } catch (e) {
      print('Translation error: $e');
      return text; // Return original text if translation fails
    }
  }

  // Translate multiple texts at once
  static Future<List<String>> translateBatch(
    List<String> texts,
    String targetLanguage,
  ) async {
    final results = <String>[];
    for (final text in texts) {
      final translated = await translate(text, targetLanguage);
      results.add(translated);
    }
    return results;
  }

  // Clear translation cache
  static void clearCache() {
    _cache.clear();
  }
}
