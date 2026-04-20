import '../services/api_service.dart';
import '../models/streak_model.dart';
import '../../core/constants/api_constants.dart';

class StreakRepository {
  final ApiService _api;
  StreakRepository(this._api);

  Future<StreakModel> getStreak() async {
    final res  = await _api.get(ApiConstants.streaks);
    return StreakModel.fromJson(res.data as Map<String, dynamic>);
  }
}
