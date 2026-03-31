import '../models/progress_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class ProgressRepository {
  final ApiService _api;
  ProgressRepository(this._api);

  Future<ProgressModel?> getProgress(String bookId) async {
    final data = await _api.get(ApiConstants.progress(bookId));
    if (data['progress'] == null) return null;
    return ProgressModel.fromJson(data['progress'] as Map<String, dynamic>);
  }

  Future<ProgressModel> saveProgress(String bookId, {
    required int    currentPage,
    required int    totalPages,
    String?         currentCfi,
    double?         percentage,
  }) async {
    final data = await _api.put(
      ApiConstants.progress(bookId),
      body: {
        'currentPage': currentPage,
        'totalPages':  totalPages,
        if (currentCfi != null) 'currentCfi': currentCfi,
        if (percentage != null) 'percentage': percentage,
      },
    );
    return ProgressModel.fromJson(data['progress'] as Map<String, dynamic>);
  }

  Future<List<ProgressModel>> getAllProgress() async {
    final data = await _api.get(ApiConstants.allProgress);
    return (data['progresses'] as List<dynamic>)
        .map((p) => ProgressModel.fromJson(p as Map<String, dynamic>))
        .toList();
  }
}
