import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../data/models/user_model.dart';
import '../data/repositories/auth_repository.dart';
import '../data/services/api_service.dart';
import '../data/services/firebase_service.dart';
import '../core/utils/storage_util.dart';

class AuthProvider extends ChangeNotifier {
  UserModel?   _user;
  bool         _isLoading = false;
  String?      _error;

  UserModel?   get user      => _user;
  bool         get isLoading => _isLoading;
  String?      get error     => _error;
  bool         get isLoggedIn => _user != null;
  bool         get isAdmin   => _user?.role == 'admin';

  final AuthRepository    _repo   = AuthRepository(ApiService());
  final FirebaseService   _fcm    = FirebaseService();

  AuthProvider() {
    _loadCachedUser();
  }

  Future<void> _loadCachedUser() async {
    final token = await StorageUtil.getToken();
    if (token == null) return;
    final json = await StorageUtil.getString('cached_user');
    if (json != null) {
      _user = UserModel.fromJson(jsonDecode(json) as Map<String, dynamic>);
      notifyListeners();
      // Refresh from server
      try {
        _user = await _repo.getMe();
        await _cacheUser(_user!);
        notifyListeners();
      } catch (_) {}
    }
  }

  Future<void> _cacheUser(UserModel user) async {
    await StorageUtil.saveString('cached_user', jsonEncode(user.toJson()));
  }

  Future<bool> login(String email, String password) async {
    _setLoading(true);
    try {
      final data = await _repo.login(email, password);
      _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      await _cacheUser(_user!);
      await _registerFcm();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> register({
    required String name,
    required String email,
    required String password,
    String language = 'en',
  }) async {
    _setLoading(true);
    try {
      final data = await _repo.register(name: name, email: email, password: password, language: language);
      _user = UserModel.fromJson(data['user'] as Map<String, dynamic>);
      await _cacheUser(_user!);
      await _registerFcm();
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    } finally {
      _setLoading(false);
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    await StorageUtil.clearAll();
    _user = null;
    notifyListeners();
  }

  Future<void> _registerFcm() async {
    try {
      await _fcm.requestPermission();
      final token = await _fcm.getToken();
      if (token != null) await _repo.updateFcmToken(token);
    } catch (_) {}
  }

  void _setLoading(bool value) {
    _isLoading = value;
    _error     = null;
    notifyListeners();
  }
}
