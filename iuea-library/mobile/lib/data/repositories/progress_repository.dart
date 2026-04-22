import '../models/progress_model.dart';
import '../services/api_service.dart';
import '../../core/constants/api_constants.dart';

class ProgressRepository {
  final ApiService _api;
  ProgressRepository(this._api);

  Future<ProgressModel?> getProgress(String bookId) async {
    final response = await _api.get(ApiConstants.progress(bookId));
    if (response.data['progress'] == null) return null;
    return ProgressModel.fromJson(response.data['progress'] as Map<String, dynamic>);
  }

  Future<ProgressModel> saveProgress(
    String bookId, {
    required int    currentPage,
    required int    totalPages,
    String?         currentCfi,
    double?         percentComplete,
    String?         currentChapter,
    String?         readingLanguage,
    List<dynamic>?  highlights,
    List<dynamic>?  bookmarks,
    String          device = 'mobile',
  }) async {
    final response = await _api.put(
      ApiConstants.progress(bookId),
      data: {
        'currentPage':  currentPage,
        'totalPages':   totalPages,
        'device':       device,
        if (currentCfi      != null) 'currentCfi':      currentCfi,
        if (percentComplete != null) 'percentComplete':  percentComplete,
        if (currentChapter  != null) 'currentChapter':  currentChapter,
        if (readingLanguage != null) 'readingLanguage': readingLanguage,
        if (highlights      != null) 'highlights':      highlights,
        if (bookmarks       != null) 'bookmarks':       bookmarks,
      },
    );
    return ProgressModel.fromJson(response.data['progress'] as Map<String, dynamic>);
  }

  Future<List<ProgressModel>> getAllProgress() async {
    final response = await _api.get(ApiConstants.allProgress);
    return ((response.data['progresses'] as List<dynamic>?) ?? [])
        .map((p) => ProgressModel.fromJson(p as Map<String, dynamic>))
        .toList();
  }
}
