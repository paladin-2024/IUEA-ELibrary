import '../models/podcast_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class PodcastRepository {
  final ApiService _api;
  PodcastRepository(this._api);

  Future<List<PodcastModel>> listPodcasts({String? category, String? language, int page = 1}) async {
    final data = await _api.get(ApiConstants.podcasts, params: {
      'page':  page,
      'limit': 20,
      if (category != null) 'category': category,
      if (language != null) 'language': language,
    });
    return (data['podcasts'] as List<dynamic>)
        .map((p) => PodcastModel.fromJson(p as Map<String, dynamic>))
        .toList();
  }

  Future<PodcastModel> getPodcast(String id) async {
    final data = await _api.get(ApiConstants.podcastDetail(id));
    return PodcastModel.fromJson(data['podcast'] as Map<String, dynamic>);
  }

  Future<Map<String, dynamic>> toggleSubscribe(String id) async {
    return _api.post(ApiConstants.podcastSubscribe(id));
  }
}
