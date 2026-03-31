import '../models/user_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/storage_util.dart';

class AuthRepository {
  final ApiService _api;
  AuthRepository(this._api);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final data = await _api.post(
      ApiConstants.login,
      body: {'email': email, 'password': password},
    );
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String language = 'en',
  }) async {
    final data = await _api.post(
      ApiConstants.register,
      body: {'name': name, 'email': email, 'password': password, 'language': language},
    );
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<Map<String, dynamic>> googleAuth(String idToken) async {
    final data = await _api.post(
      ApiConstants.googleAuth,
      body: {'idToken': idToken},
    );
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<UserModel> getMe() async {
    final data = await _api.get(ApiConstants.me);
    return UserModel.fromJson(data['user'] as Map<String, dynamic>);
  }

  Future<void> updateFcmToken(String token) async {
    await _api.post(ApiConstants.fcmToken, body: {'fcmToken': token});
  }

  Future<void> logout() async {
    await StorageUtil.deleteToken();
  }
}
