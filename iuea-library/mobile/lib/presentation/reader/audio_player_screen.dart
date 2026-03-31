import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../providers/book_provider.dart';
import '../../data/services/api_service.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../widgets/loading_widget.dart';

class AudioPlayerScreen extends StatefulWidget {
  final String bookId;
  const AudioPlayerScreen({super.key, required this.bookId});

  @override
  State<AudioPlayerScreen> createState() => _AudioPlayerScreenState();
}

class _AudioPlayerScreenState extends State<AudioPlayerScreen> {
  final AudioPlayer _player = AudioPlayer();
  bool  _isLoading  = false;
  bool  _isPlaying  = false;
  String? _errorMsg;

  @override
  void initState() {
    super.initState();
    _player.playerStateStream.listen((state) {
      if (mounted) setState(() => _isPlaying = state.playing);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final book = await context.read<BookProvider>().getBook(widget.bookId);
      if (book != null) _generateAudio(book.description);
    });
  }

  Future<void> _generateAudio(String text) async {
    setState(() { _isLoading = true; _errorMsg = null; });
    try {
      final api  = ApiService();
      final data = await api.post(
        ApiConstants.generateAudio,
        body: {'text': text.substring(0, text.length.clamp(0, 3000)), 'language': 'en'},
      );
      final url = data['audioUrl'] as String;
      await _player.setUrl(url);
      await _player.play();
    } catch (e) {
      setState(() => _errorMsg = 'Failed to load audio. Try again.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _player.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final book = context.watch<BookProvider>().current;

    return Scaffold(
      backgroundColor: AppColors.primaryDark,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: AppColors.white,
        elevation:       0,
        title: const Text('Audio Player'),
      ),
      body: book == null ? const LoadingWidget() : Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Cover
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: book.coverUrl.isNotEmpty
                  ? CachedNetworkImage(imageUrl: book.coverUrl, width: 220, height: 300, fit: BoxFit.cover)
                  : Container(width: 220, height: 300, color: AppColors.primary,
                      child: const Icon(Icons.book, color: AppColors.accent, size: 80)),
            ),
            const SizedBox(height: 32),

            Text(book.title, style: const TextStyle(color: AppColors.white, fontSize: 20, fontWeight: FontWeight.w700),
              textAlign: TextAlign.center, maxLines: 2, overflow: TextOverflow.ellipsis),
            const SizedBox(height: 8),
            Text(book.authorDisplay, style: const TextStyle(color: AppColors.primaryLight, fontSize: 14)),

            const SizedBox(height: 48),

            if (_errorMsg != null)
              Text(_errorMsg!, style: const TextStyle(color: AppColors.error))
            else if (_isLoading)
              Column(children: const [
                LoadingWidget(),
                SizedBox(height: 12),
                Text('Generating audio…', style: TextStyle(color: AppColors.primaryLight, fontSize: 13)),
              ])
            else
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    icon:    const Icon(Icons.replay_10, color: AppColors.white, size: 32),
                    onPressed: () => _player.seek(
                      Duration(seconds: (_player.position.inSeconds - 10).clamp(0, double.infinity).toInt()),
                    ),
                  ),
                  const SizedBox(width: 16),
                  GestureDetector(
                    onTap: () => _isPlaying ? _player.pause() : _player.play(),
                    child: Container(
                      width: 68, height: 68,
                      decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                      child: Icon(_isPlaying ? Icons.pause : Icons.play_arrow,
                        color: AppColors.primaryDark, size: 36),
                    ),
                  ),
                  const SizedBox(width: 16),
                  IconButton(
                    icon:    const Icon(Icons.forward_10, color: AppColors.white, size: 32),
                    onPressed: () => _player.seek(
                      Duration(seconds: _player.position.inSeconds + 10),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
