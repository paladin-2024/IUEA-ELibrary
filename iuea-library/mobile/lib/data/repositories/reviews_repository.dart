import '../services/api_service.dart';
import '../models/review_model.dart';
import '../../core/constants/api_constants.dart';

class ReviewsRepository {
  final ApiService _api;
  ReviewsRepository(this._api);

  Future<List<ReviewModel>> getBookReviews(String bookId) async {
    final res  = await _api.get(ApiConstants.reviews(bookId));
    final data = res.data as Map<String, dynamic>;
    final list = data['reviews'] as List<dynamic>? ?? [];
    return list.map((e) => ReviewModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<ReviewModel?> getMyReview(String bookId) async {
    try {
      final res  = await _api.get(ApiConstants.myReview(bookId));
      final data = res.data as Map<String, dynamic>;
      final r    = data['review'];
      if (r == null) return null;
      return ReviewModel.fromJson(r as Map<String, dynamic>);
    } catch (_) { return null; }
  }

  Future<ReviewModel> submitReview(String bookId, int rating, String text) async {
    final res  = await _api.post(ApiConstants.reviews(bookId), data: {'rating': rating, 'text': text});
    final data = res.data as Map<String, dynamic>;
    return ReviewModel.fromJson(data['review'] as Map<String, dynamic>);
  }

  Future<void> voteHelpful(String bookId, String reviewId) async {
    await _api.post(ApiConstants.reviewHelpful(bookId), data: {'reviewId': reviewId});
  }
}
