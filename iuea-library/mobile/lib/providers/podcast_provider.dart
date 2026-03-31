import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import '../data/models/podcast_model.dart';
import '../data/repositories/podcast_repository.dart';
import '../data/services/api_service.dart';

class PodcastProvider extends ChangeNotifier {
  final PodcastRepository _repo = PodcastRepository(ApiService());
  final AudioPlayer       _player = AudioPlayer();

  List<PodcastModel>  _podcasts       = [];
  List<PodcastModel>  _subscriptions  = [];
  PodcastModel?       _current;
  EpisodeModel?       _currentEpisode;
  bool                _isLoading      = false;
  bool                _isPlaying      = false;
  double              _speed          = 1.0;
  Duration            _position       = Duration.zero;
  Duration            _duration       = Duration.zero;
  String?             _error;

  List<PodcastModel>  get podcasts       => _podcasts;
  List<PodcastModel>  get subscriptions  => _subscriptions;
  PodcastModel?       get current        => _current;
  EpisodeModel?       get currentEpisode => _currentEpisode;
  bool                get isLoading      => _isLoading;
  bool                get isPlaying      => _isPlaying;
  double              get speed          => _speed;
  Duration            get position       => _position;
  Duration            get duration       => _duration;
  String?             get error          => _error;
  AudioPlayer         get player         => _player;

  PodcastProvider() {
    _player.positionStream.listen((p) {
      _position = p;
      notifyListeners();
    });
    _player.durationStream.listen((d) {
      _duration = d ?? Duration.zero;
      notifyListeners();
    });
    _player.playerStateStream.listen((s) {
      _isPlaying = s.playing;
      notifyListeners();
    });
  }

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

  Future<void> loadSubscriptions() async {
    try {
      _subscriptions = await _repo.getSubscriptions();
      notifyListeners();
    } catch (_) {}
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

  Future<bool> subscribe(String id) async {
    try {
      await _repo.subscribe(id);
      await loadSubscriptions();
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> unsubscribe(String id) async {
    try {
      await _repo.unsubscribe(id);
      _subscriptions.removeWhere((p) => p.id == id);
      notifyListeners();
      return true;
    } catch (_) {
      return false;
    }
  }

  bool isSubscribed(String podcastId) =>
      _subscriptions.any((p) => p.id == podcastId);

  Future<void> playEpisode(EpisodeModel episode) async {
    _currentEpisode = episode;
    _position       = Duration.zero;
    _duration       = Duration.zero;
    notifyListeners();
    try {
      await _player.setUrl(episode.audioUrl);
      await _player.setSpeed(_speed);
      await _player.play();
    } catch (_) {}
  }

  Future<void> togglePlay() async {
    if (_isPlaying) {
      await _player.pause();
    } else {
      await _player.play();
    }
  }

  Future<void> seekDelta(int seconds) async {
    final target = _position + Duration(seconds: seconds);
    final clamped = target.isNegative ? Duration.zero
        : target > _duration ? _duration : target;
    await _player.seek(clamped);
  }

  Future<void> seek(Duration position) async {
    await _player.seek(position);
  }

  Future<void> setSpeed(double s) async {
    _speed = s;
    await _player.setSpeed(s);
    notifyListeners();
  }

  Future<void> stopAndClear() async {
    await _player.stop();
    _currentEpisode = null;
    _position       = Duration.zero;
    _duration       = Duration.zero;
    notifyListeners();
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  void _setLoading(bool value) {
    _isLoading = value;
    _error     = null;
    notifyListeners();
  }
}
