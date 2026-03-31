import 'package:flutter/material.dart';
import '../../../data/models/book_model.dart';
import '../../../core/constants/app_colors.dart';

class ReaderToolbar extends StatelessWidget implements PreferredSizeWidget {
  final BookModel    book;
  final VoidCallback onBack;
  final VoidCallback onChat;
  final VoidCallback onSettings;

  const ReaderToolbar({
    super.key,
    required this.book,
    required this.onBack,
    required this.onChat,
    required this.onSettings,
  });

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
      backgroundColor: AppColors.primary.withOpacity(0.95),
      leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: onBack),
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(book.title,    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
          Text(book.authorDisplay, style: const TextStyle(fontSize: 11, color: AppColors.primaryLight), overflow: TextOverflow.ellipsis),
        ],
      ),
      actions: [
        IconButton(icon: const Icon(Icons.chat_bubble_outline), onPressed: onChat,     tooltip: 'AI Assistant'),
        IconButton(icon: const Icon(Icons.settings_outlined),    onPressed: onSettings, tooltip: 'Settings'),
      ],
    );
  }
}
