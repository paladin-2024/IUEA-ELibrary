import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/book_model.dart';

const _kPrefsKey = 'iuea_downloads_v1';

class DownloadedBook {
  final String id;
  final String title;
  final String author;
  final String? coverUrl;
  final String localPath;
  final String fileFormat;
  final int    fileSizeBytes;
  final DateTime downloadedAt;

  const DownloadedBook({
    required this.id,
    required this.title,
    required this.author,
    this.coverUrl,
    required this.localPath,
    required this.fileFormat,
    required this.fileSizeBytes,
    required this.downloadedAt,
  });

  Map<String, dynamic> toJson() => {
    'id':            id,
    'title':         title,
    'author':        author,
    'coverUrl':      coverUrl,
    'localPath':     localPath,
    'fileFormat':    fileFormat,
    'fileSizeBytes': fileSizeBytes,
    'downloadedAt':  downloadedAt.toIso8601String(),
  };

  factory DownloadedBook.fromJson(Map<String, dynamic> j) => DownloadedBook(
    id:            j['id']            as String,
    title:         j['title']         as String,
    author:        j['author']        as String,
    coverUrl:      j['coverUrl']      as String?,
    localPath:     j['localPath']     as String,
    fileFormat:    j['fileFormat']    as String,
    fileSizeBytes: j['fileSizeBytes'] as int,
    downloadedAt:  DateTime.parse(j['downloadedAt'] as String),
  );

  String get sizeLabel {
    if (fileSizeBytes < 1024 * 1024) {
      return '${(fileSizeBytes / 1024).toStringAsFixed(1)} KB';
    }
    return '${(fileSizeBytes / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}

class DownloadService {
  static final DownloadService _instance = DownloadService._();
  DownloadService._();
  factory DownloadService() => _instance;

  final _dio = Dio();
  final Map<String, double> _progress = {};

  double getProgress(String bookId) => _progress[bookId] ?? 0.0;

  Future<List<DownloadedBook>> getDownloads() async {
    final prefs = await SharedPreferences.getInstance();
    final raw   = prefs.getString(_kPrefsKey);
    if (raw == null) return [];
    final list  = (jsonDecode(raw) as List).cast<Map<String, dynamic>>();
    // filter out entries whose local files no longer exist
    final valid = <DownloadedBook>[];
    for (final item in list) {
      try {
        final d = DownloadedBook.fromJson(item);
        if (await File(d.localPath).exists()) valid.add(d);
      } catch (_) {}
    }
    return valid;
  }

  Future<bool> isDownloaded(String bookId) async {
    final list = await getDownloads();
    return list.any((d) => d.id == bookId);
  }

  Future<String?> getLocalPath(String bookId) async {
    final list = await getDownloads();
    try {
      return list.firstWhere((d) => d.id == bookId).localPath;
    } catch (_) {
      return null;
    }
  }

  Future<DownloadedBook> downloadBook(
    BookModel book, {
    void Function(double)? onProgress,
  }) async {
    final url = book.fileUrl;
    if (url == null || url.isEmpty) {
      throw Exception('No downloadable file for "${book.title}".');
    }

    final dir      = await getApplicationDocumentsDirectory();
    final ext      = book.fileFormat == 'pdf' ? 'pdf' : 'epub';
    final fileName = '${book.id}.$ext';
    final filePath = '${dir.path}/$fileName';

    _progress[book.id] = 0.0;
    onProgress?.call(0.0);

    final token = await const FlutterSecureStorage().read(key: 'jwt_token');
    await _dio.download(
      url,
      filePath,
      options: Options(
        headers: token != null ? {'Authorization': 'Bearer $token'} : null,
      ),
      onReceiveProgress: (received, total) {
        if (total > 0) {
          final pct = received / total;
          _progress[book.id] = pct;
          onProgress?.call(pct);
        }
      },
    );

    _progress.remove(book.id);

    final fileSize = await File(filePath).length();
    final entry    = DownloadedBook(
      id:            book.id,
      title:         book.title,
      author:        book.author,
      coverUrl:      book.coverUrl,
      localPath:     filePath,
      fileFormat:    ext,
      fileSizeBytes: fileSize,
      downloadedAt:  DateTime.now(),
    );

    await _saveEntry(entry);
    return entry;
  }

  Future<void> deleteDownload(String bookId) async {
    final list = await getDownloads();
    final entry = list.where((d) => d.id == bookId).toList();
    for (final e in entry) {
      try { await File(e.localPath).delete(); } catch (_) {}
    }
    final updated = list.where((d) => d.id != bookId).toList();
    await _writeAll(updated);
  }

  Future<void> _saveEntry(DownloadedBook entry) async {
    final list = await getDownloads();
    final updated = [
      ...list.where((d) => d.id != entry.id),
      entry,
    ];
    await _writeAll(updated);
  }

  Future<void> _writeAll(List<DownloadedBook> list) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_kPrefsKey, jsonEncode(list.map((d) => d.toJson()).toList()));
  }
}
