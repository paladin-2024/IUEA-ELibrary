import '../models/podcast_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class PodcastRepository {
  final ApiService _api;
  PodcastRepository(this._api);

  Future<Map<String, dynamic>> listPodcasts({String? category, String? language, int page = 1}) async {
    final res = await _api.get(ApiConstants.podcasts, params: {
      'page':  page,
      'limit': 30,
      if (category != null) 'category': category,
      if (language != null) 'language': language,
    });
    final podcasts = (res.data['podcasts'] as List<dynamic>)
        .map((p) => PodcastModel.fromJson(p as Map<String, dynamic>))
        .toList();
    final categories = (res.data['categories'] as List<dynamic>?)
        ?.cast<String>() ?? const ['All'];
    return {'podcasts': podcasts, 'categories': categories};
  }

  Future<PodcastModel> getPodcast(String id) async {
    final res = await _api.get(ApiConstants.podcastDetail(id));
    return PodcastModel.fromJson(res.data['podcast'] as Map<String, dynamic>);
  }

  Future<List<PodcastModel>> getSubscriptions() async {
    final res = await _api.get(ApiConstants.podcastSubscriptions);
    return (res.data['podcasts'] as List<dynamic>)
        .map((p) => PodcastModel.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<void> subscribe(String id) async {
    await _api.post(ApiConstants.podcastSubscribe(id));
  }

  Future<void> unsubscribe(String id) async {
    await _api.delete(ApiConstants.podcastSubscribe(id));
  }

  Future<void> trackPlay(String id) async {
    await _api.post(ApiConstants.podcastPlay(id));
  }
}
