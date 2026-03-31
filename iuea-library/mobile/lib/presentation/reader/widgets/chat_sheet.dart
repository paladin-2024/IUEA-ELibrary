import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/chat_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../core/constants/app_colors.dart';

class ChatSheet extends StatefulWidget {
  final String bookId;
  const ChatSheet({super.key, required this.bookId});

  @override
  State<ChatSheet> createState() => _ChatSheetState();
}

class _ChatSheetState extends State<ChatSheet> {
  final _ctrl        = TextEditingController();
  final _scrollCtrl  = ScrollController();

  @override
  void dispose() {
    _ctrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  void _send() {
    final text = _ctrl.text.trim();
    if (text.isEmpty) return;
    final lang = context.read<AuthProvider>().user?.language ?? 'en';
    context.read<ChatProvider>().sendMessage(widget.bookId, text, language: lang);
    _ctrl.clear();
    Future.delayed(const Duration(milliseconds: 300), () {
      if (_scrollCtrl.hasClients) _scrollCtrl.jumpTo(_scrollCtrl.position.maxScrollExtent);
    });
  }

  @override
  Widget build(BuildContext context) {
    final chat = context.watch<ChatProvider>();
    final msgs = chat.getMessages(widget.bookId);

    return DraggableScrollableSheet(
      expand:         false,
      initialChildSize: 0.75,
      maxChildSize:     0.95,
      builder: (_, scrollCtrl) => Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color:        AppColors.primary,
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
            ),
            child: Row(
              children: [
                const Icon(Icons.smart_toy_outlined, color: AppColors.accent, size: 18),
                const SizedBox(width: 8),
                const Text('AI Assistant', style: TextStyle(color: AppColors.white, fontWeight: FontWeight.w600)),
                const Spacer(),
                IconButton(icon: const Icon(Icons.close, color: AppColors.white, size: 18),
                  onPressed: () => Navigator.pop(context)),
              ],
            ),
          ),

          // Messages
          Expanded(
            child: msgs.isEmpty
                ? Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 48, color: AppColors.grey300),
                        const SizedBox(height: 8),
                        const Text('Ask me anything about this book!',
                          style: TextStyle(color: AppColors.grey500)),
                      ],
                    ),
                  )
                : ListView.separated(
                    controller:   _scrollCtrl,
                    padding:      const EdgeInsets.all(12),
                    itemCount:    msgs.length + (chat.isSending ? 1 : 0),
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (_, i) {
                      if (i == msgs.length) {
                        return const Align(
                          alignment: Alignment.centerLeft,
                          child:     Padding(
                            padding: EdgeInsets.only(left: 8),
                            child:   Text('Thinking…', style: TextStyle(color: AppColors.grey500, fontStyle: FontStyle.italic, fontSize: 13)),
                          ),
                        );
                      }
                      final msg     = msgs[i];
                      final isUser  = msg.isUser;
                      return Align(
                        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          padding:     const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration:  BoxDecoration(
                            color:        isUser ? AppColors.primary : AppColors.grey100,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(msg.content,
                            style: TextStyle(color: isUser ? AppColors.white : AppColors.black, fontSize: 13, height: 1.5)),
                        ),
                      );
                    },
                  ),
          ),

          // Input
          Padding(
            padding: EdgeInsets.only(
              left: 12, right: 12, bottom: MediaQuery.of(context).viewInsets.bottom + 12, top: 8,
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller:  _ctrl,
                    decoration:  InputDecoration(
                      hintText:        'Ask about this book…',
                      border:          OutlineInputBorder(borderRadius: BorderRadius.circular(24)),
                      contentPadding:  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      isDense:         true,
                    ),
                    textInputAction: TextInputAction.send,
                    onSubmitted:    (_) => _send(),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton.small(
                  onPressed:       chat.isSending ? null : _send,
                  backgroundColor: AppColors.primary,
                  child:           const Icon(Icons.send, color: AppColors.white, size: 18),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
