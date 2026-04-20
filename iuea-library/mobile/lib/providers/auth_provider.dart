import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../data/models/user_model.dart';
import '../data/services/api_service.dart';
import '../core/constants/api_constants.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  String?    _token;
  bool       _isLoading = false;
  String?    _error;

  UserModel? get user      => _user;
  String?    get token     => _token;
  bool       get isLoggedIn => _token != null;
  bool       get isLoading  => _isLoading;
  String?    get error      => _error;
  bool       get isAdmin    => _user?.isAdmin ?? false;

  final _api     = ApiService();
  final _storage = const FlutterSecureStorage();

  // ── login ──────────────────────────────────────────────────────────────────
  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      final res = await _api.post(
        ApiConstants.authLogin,
        data: {'email': email, 'password': password},
      );
      _token = res.data['token'] as String;
      _user  = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      await _storage.write(key: 'jwt_token', value: _token);
      _setLoading(false);
      return true;
    } catch (e) {
      _error = _parseError(e);
      _setLoading(false);
      return false;
    }
  }

  // ── register ───────────────────────────────────────────────────────────────
  Future<bool> register(Map<String, dynamic> userData) async {
    _setLoading(true);
    try {
      final res = await _api.post(ApiConstants.authRegister, data: userData);
      _token = res.data['token'] as String;
      _user  = UserModel.fromJson(res.data['user'] as Map<String, dynamic>);
      await _storage.write(key: 'jwt_token', value: _token);
      _setLoading(false);
      return true;
    } catch (e) {
      _error = _parseError(e);
      _setLoading(false);
      return false;
    }
  }

  // ── loadUser ───────────────────────────────────────────────────────────────
  /// Called on app startup to restore session from secure storage.
  Future<void> loadUser() async {
    final storedToken = await _storage.read(key: 'jwt_token');
    if (storedToken == null) return;

    _token = storedToken;
    notifyListeners();

    try {
      final res = await _api.get(ApiConstants.authMe);
      _user = UserModel.fromJson(res.data as Map<String, dynamic>);
      notifyListeners();
    } catch (_) {
      // Token invalid or expired — clear it
      await logout();
    }
  }

  // ── logout ─────────────────────────────────────────────────────────────────
  Future<void> logout() async {
    await _storage.deleteAll();
    _user  = null;
    _token = null;
    _error = null;
    notifyListeners();
  }

  // ── updateProfile ──────────────────────────────────────────────────────────
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    try {
      final res = await _api.put(ApiConstants.authMe, data: data);
      _user = UserModel.fromJson(res.data as Map<String, dynamic>);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  // ── updateFcmToken ─────────────────────────────────────────────────────────
  Future<void> updateFcmToken(String fcmToken) async {
    try {
      await _api.post(
        ApiConstants.authFcmToken,
        data: {'token': fcmToken, 'platform': 'mobile'},
      );
    } catch (_) {
      // Non-critical — swallow silently
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────
  void _setLoading(bool value) {
    _isLoading = value;
    if (value) _error = null;
    notifyListeners();
  }

  String _parseError(dynamic e) {
    try {
      // Dio error with response body
      final data = (e as dynamic).response?.data;
      if (data is Map) return data['message'] as String? ?? 'An error occurred.';
      return (e as dynamic).message as String? ?? 'An error occurred.';
    } catch (_) {
      return e.toString();
    }
  }
}
