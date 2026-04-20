import 'package:path_provider/path_provider.dart';
import 'dart:io';

class StorageService {
  /// Get local app documents directory path
  static Future<String> get _localPath async {
    final dir = await getApplicationDocumentsDirectory();
    return dir.path;
  }

  /// Save book file locally for offline reading
  static Future<File> saveBookFile(String bookId, List<int> bytes, String extension) async {
    final path = await _localPath;
    final file = File('$path/books/$bookId.$extension');
    await file.parent.create(recursive: true);
    return file.writeAsBytes(bytes);
  }

  /// Get path to locally saved book
  static Future<String?> getBookFilePath(String bookId, String extension) async {
    final path = await _localPath;
    final file = File('$path/books/$bookId.$extension');
    if (await file.exists()) return file.path;
    return null;
  }

  /// Delete locally saved book
  static Future<void> deleteBookFile(String bookId, String extension) async {
    final path = await _localPath;
    final file = File('$path/books/$bookId.$extension');
    if (await file.exists()) await file.delete();
  }

  /// List all downloaded book IDs
  static Future<List<String>> getDownloadedBooks() async {
    final path = await _localPath;
    final dir  = Directory('$path/books');
    if (!await dir.exists()) return [];
    final files = await dir.list().toList();
    return files
        .whereType<File>()
        .map((f) => f.path.split('/').last.split('.').first)
        .toList();
  }

  /// Cache size in bytes
  static Future<int> getCacheSize() async {
    final path = await _localPath;
    final dir  = Directory('$path/books');
    if (!await dir.exists()) return 0;
    int total = 0;
    await for (final entity in dir.list(recursive: true)) {
      if (entity is File) total += await entity.length();
    }
    return total;
  }
}
