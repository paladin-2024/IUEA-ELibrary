import 'package:flutter/foundation.dart';
import '../data/models/podcast_model.dart';
import '../data/repositories/podcast_repository.dart';
import '../data/services/api_service.dart';

class PodcastProvider extends ChangeNotifier {
  List<PodcastModel> _podcasts   = [];
  PodcastModel?      _current;
  bool               _isLoading  = false;
  String?            _error;

  List<PodcastModel> get podcasts  => _podcasts;
  PodcastModel?      get current   => _current;
  bool               get isLoading => _isLoading;
  String?            get error     => _error;

  final PodcastRepository _repo = PodcastRepository(ApiService());

  Future<void> loadPodcasts({String? category, String? language}) async {
    _setLoading(true);
    try {
      _podcasts = await _repo.listPodcasts(category: category, language: language);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<void> getPodcast(String id) async {
    _setLoading(true);
    try {
      _current = await _repo.getPodcast(id);
    } catch (e) {
      _error = e.toString();
    } finally {
      _setLoading(false);
    }
  }

  Future<bool> toggleSubscribe(String id) async {
    try {
      final result = await _repo.toggleSubscribe(id);
      return result['subscribed'] as bool? ?? false;
    } catch (_) {
      return false;
    }
  }

  void _setLoading(bool value) {
    _isLoading = value;
    _error     = null;
    notifyListeners();
  }
}
