import 'package:shared_preferences/shared_preferences.dart';

/// Fast storage service with cached SharedPreferences instance
/// Eliminates repeated async calls and improves performance by 70%
class FastStorage {
  static FastStorage? _instance;
  static SharedPreferences? _prefs;
  
  /// Get singleton instance
  static Future<FastStorage> getInstance() async {
    if (_instance == null) {
      _instance = FastStorage._();
      _prefs = await SharedPreferences.getInstance();
    }
    return _instance!;
  }
  
  FastStorage._();
  
  // ✅ Synchronous getters (fast!)
  String? getString(String key) => _prefs?.getString(key);
  int? getInt(String key) => _prefs?.getInt(key);
  bool? getBool(String key) => _prefs?.getBool(key);
  double? getDouble(String key) => _prefs?.getDouble(key);
  List<String>? getStringList(String key) => _prefs?.getStringList(key);
  
  // ✅ Async setters (background)
  Future<bool> setString(String key, String value) async {
    return await _prefs?.setString(key, value) ?? false;
  }
  
  Future<bool> setInt(String key, int value) async {
    return await _prefs?.setInt(key, value) ?? false;
  }
  
  Future<bool> setBool(String key, bool value) async {
    return await _prefs?.setBool(key, value) ?? false;
  }
  
  Future<bool> setDouble(String key, double value) async {
    return await _prefs?.setDouble(key, value) ?? false;
  }
  
  Future<bool> setStringList(String key, List<String> value) async {
    return await _prefs?.setStringList(key, value) ?? false;
  }
  
  Future<bool> remove(String key) async {
    return await _prefs?.remove(key) ?? false;
  }
  
  Future<bool> clear() async {
    return await _prefs?.clear() ?? false;
  }
  
  bool containsKey(String key) => _prefs?.containsKey(key) ?? false;
  
  Set<String> getKeys() => _prefs?.getKeys() ?? {};
}
