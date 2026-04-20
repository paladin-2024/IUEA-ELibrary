import '../services/api_service.dart';
import '../models/borrow_request_model.dart';
import '../../core/constants/api_constants.dart';

class BorrowingRepository {
  final ApiService _api;
  BorrowingRepository(this._api);

  Future<BorrowRequestModel> requestBorrow(String bookId) async {
    final res  = await _api.post(ApiConstants.borrowing, data: {'bookId': bookId});
    final data = res.data as Map<String, dynamic>;
    return BorrowRequestModel.fromJson(data['request'] as Map<String, dynamic>);
  }

  Future<List<BorrowRequestModel>> getMyLoans() async {
    final res  = await _api.get(ApiConstants.myLoans);
    final data = res.data as Map<String, dynamic>;
    final list = data['loans'] as List<dynamic>? ?? [];
    return list.map((e) => BorrowRequestModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> cancelRequest(String id) async {
    await _api.delete(ApiConstants.cancelLoan(id));
  }

  Future<void> requestRenewal(String id) async {
    await _api.post(ApiConstants.renewLoan(id));
  }
}
