import '../models/user_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/storage_util.dart';

class AuthRepository {
  final ApiService _api;
  AuthRepository(this._api);

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res  = await _api.post(
      ApiConstants.authLogin,
      data: {'email': email, 'password': password},
    );
    final data = res.data as Map<String, dynamic>;
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<Map<String, dynamic>> register({
    required String name,
    required String email,
    required String password,
    String language = 'en',
  }) async {
    final res  = await _api.post(
      ApiConstants.authRegister,
      data: {'name': name, 'email': email, 'password': password, 'language': language},
    );
    final data = res.data as Map<String, dynamic>;
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<Map<String, dynamic>> googleAuth(String idToken) async {
    final res  = await _api.post(
      ApiConstants.authGoogle,
      data: {'idToken': idToken},
    );
    final data = res.data as Map<String, dynamic>;
    await StorageUtil.saveToken(data['token'] as String);
    return data;
  }

  Future<UserModel> getMe() async {
    final res = await _api.get(ApiConstants.authMe);
    return UserModel.fromJson(res.data as Map<String, dynamic>);
  }

  Future<void> updateFcmToken(String token) async {
    await _api.post(ApiConstants.authFcmToken, data: {'token': token, 'platform': 'mobile'});
  }

  Future<void> logout() async {
    await StorageUtil.clearToken();
  }
}
