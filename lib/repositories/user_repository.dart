import '../services/api_client.dart';
import '../models/user_model.dart';

class UserRepository {
  final ApiClient api;
  UserRepository(this.api);

  Future<UserModel> getProfile() async {
    try {
      final data = await api.get('/api/users/me');
      
      if (data['user'] != null) {
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        throw Exception('Failed to load user profile');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to load user: ${e.toString()}');
    }
  }

  Future<UserModel> updateProfile({
    String? firstName,
    String? lastName,
    String? phone,
    String? avatar,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (firstName != null) body['firstName'] = firstName;
      if (lastName != null) body['lastName'] = lastName;
      if (phone != null) body['phone'] = phone;
      if (avatar != null) body['avatar'] = avatar;

      final data = await api.post('/api/users/me', body);
      
      if (data['user'] != null) {
        return UserModel.fromJson(data['user'] as Map<String, dynamic>);
      } else {
        throw Exception('Failed to update profile');
      }
    } on ApiException catch (e) {
      throw Exception(e.message);
    } catch (e) {
      throw Exception('Failed to update profile: ${e.toString()}');
    }
  }
}
