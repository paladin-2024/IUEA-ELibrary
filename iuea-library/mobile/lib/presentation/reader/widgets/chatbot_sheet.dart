import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/chat_provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../data/models/chat_message_model.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/constants/app_text_styles.dart';

const _kSuggestions = [
  'Summarize chapter',
  'Explain concept',
  'Quiz me',
  'Define key terms',
];

class ChatbotSheet extends StatefulWidget {
  final String bookId;
  const ChatbotSheet({super.key, required this.bookId});

  @override
  State<ChatbotSheet> createState() => _ChatbotSheetState();
}

class _ChatbotSheetState extends State<ChatbotSheet> {
  final _textController  = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode        = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadHistory(widget.bookId);
    });
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _send(String text, ChatProvider chat, ReaderProvider reader) {
    final msg = text.trim();
    if (msg.isEmpty || chat.isLoading || chat.isStreaming) return;
    _textController.clear();
    chat.streamMessage(
      widget.bookId,
      msg,
      reader.readingLanguage,
      chapter: reader.currentChapter.toString(),
    );
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize:     0.4,
      maxChildSize:     0.95,
      expand:           false,
      builder: (ctx, sheetScroll) {
        return Container(
          decoration: const BoxDecoration(
            color:        AppColors.background,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Consumer2<ChatProvider, ReaderProvider>(
            builder: (_, chat, reader, __) {
              final messages = chat.getMessages(widget.bookId);
              final isEmpty  = messages.isEmpty && !chat.isLoading && !chat.isStreaming;

              return Column(
                children: [
                  // ── Drag handle ─────────────────────────────────────────
                  const SizedBox(height: AppSpacing.sm),
                  Center(
                    child: Container(
                      width:  40, height: 4,
                      decoration: BoxDecoration(
                        color:        AppColors.grey300,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.sm),

                  // ── Header ──────────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.pagePadding),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40, height: 40,
                          decoration: BoxDecoration(
                            color:        AppColors.primary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.smart_toy_rounded,
                            color: AppColors.primary, size: 20),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('IUEA AI Assistant',
                                style: AppTextStyles.h3.copyWith(
                                  fontSize: 15)),
                              Text(
                                'DIGITAL CURATOR ACTIVE',
                                style: TextStyle(
                                  fontFamily:    'Inter',
                                  fontSize:      9,
                                  letterSpacing: 1.0,
                                  color:         AppColors.primary,
                                  fontWeight:    FontWeight.w500)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline_rounded,
                            color: AppColors.grey500, size: 18),
                          tooltip:   'Clear chat',
                          onPressed: () => chat.clearHistory(widget.bookId),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close_rounded,
                            color: AppColors.grey500, size: 18),
                          tooltip:   'Close',
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ],
                    ),
                  ),

                  const Divider(height: 1),

                  // ── Suggestion chips (empty state) ───────────────────────
                  if (isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(AppSpacing.md),
                      child: Wrap(
                        spacing:   AppSpacing.sm,
                        runSpacing: AppSpacing.xs,
                        alignment: WrapAlignment.center,
                        children: _kSuggestions.map((s) => ActionChip(
                          label: Text(s,
                            style: AppTextStyles.label.copyWith(
                              color: AppColors.primary, fontSize: 11)),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(
                              AppSpacing.chipRadius),
                            side: const BorderSide(
                              color: AppColors.primary, width: 1),
                          ),
                          backgroundColor: Colors.transparent,
                          onPressed: () => _send(s, chat, reader),
                        )).toList(),
                      ),
                    ),

                  // ── Messages ─────────────────────────────────────────────
                  Expanded(
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.pagePadding,
                        vertical:   AppSpacing.sm,
                      ),
                      itemCount: messages.length
                          + (chat.isLoading ? 1 : 0)
                          + (chat.isStreaming ? 1 : 0),
                      itemBuilder: (_, i) {
                        // Loading dots
                        if (i == messages.length && chat.isLoading) {
                          return const _LoadingBubble();
                        }
                        // Streaming bubble
                        if (i == messages.length && chat.isStreaming) {
                          return _StreamingBubble(
                            text: chat.streamingMessage);
                        }
                        if (i >= messages.length) return const SizedBox.shrink();

                        final msg = messages[i];
                        return _MessageBubble(message: msg);
                      },
                    ),
                  ),

                  const Divider(height: 1),

                  // ── AI disclaimer ────────────────────────────────────────
                  Padding(
                    padding: const EdgeInsets.only(top: 4, bottom: 2),
                    child: Text(
                      'AI MAY CONTAIN ERRORS · POWERED BY GOOGLE',
                      style: TextStyle(
                        fontFamily:    'Inter',
                        fontSize:      8,
                        letterSpacing: 1.0,
                        color:         AppColors.textHint.withValues(alpha: 0.7)),
                    ),
                  ),

                  // ── Input row ────────────────────────────────────────────
                  SafeArea(
                    top: false,
                    child: Padding(
                      padding: EdgeInsets.only(
                        left:   AppSpacing.pagePadding,
                        right:  AppSpacing.sm,
                        top:    AppSpacing.xs,
                        bottom: AppSpacing.sm
                            + MediaQuery.of(context).viewInsets.bottom,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Expanded(
                            child: TextField(
                              controller:  _textController,
                              focusNode:   _focusNode,
                              minLines:    1,
                              maxLines:    4,
                              textInputAction: TextInputAction.send,
                              onSubmitted: (v) => _send(v, chat, reader),
                              style: AppTextStyles.body.copyWith(
                                fontSize: 14, height: 1.4),
                              decoration: InputDecoration(
                                hintText: 'Type your academic query…',
                                hintStyle: AppTextStyles.label.copyWith(
                                  color: AppColors.textHint),
                                isDense:      true,
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.inputRadius),
                                  borderSide: const BorderSide(
                                    color: AppColors.border),
                                ),
                                focusedBorder: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(
                                    AppSpacing.inputRadius),
                                  borderSide: const BorderSide(
                                    color: AppColors.primary),
                                ),
                                contentPadding:
                                  const EdgeInsets.symmetric(
                                    horizontal: AppSpacing.sm + 4,
                                    vertical:   AppSpacing.sm,
                                  ),
                              ),
                            ),
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          _SendButton(
                            isLoading: chat.isLoading || chat.isStreaming,
                            onTap:     () => _send(
                              _textController.text, chat, reader),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        );
      },
    );
  }
}

// ── Individual message bubble ─────────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final ChatMessageModel message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        mainAxisAlignment:
          isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 28, height: 28,
              decoration: BoxDecoration(
                color:        AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.smart_toy_outlined,
                color: AppColors.primary, size: 16),
            ),
            const SizedBox(width: AppSpacing.xs),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm + 4,
                vertical:   AppSpacing.sm,
              ),
              decoration: BoxDecoration(
                color: isUser ? AppColors.primary : AppColors.grey100,
                borderRadius: BorderRadius.only(
                  topLeft:     const Radius.circular(16),
                  topRight:    const Radius.circular(16),
                  bottomLeft:  Radius.circular(isUser ? 16 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 16),
                ),
              ),
              child: isUser
                  ? Text(
                      message.content,
                      style: AppTextStyles.body.copyWith(
                        fontSize: 14,
                        color:    AppColors.white,
                        height:   1.4,
                      ),
                    )
                  : _SimpleMarkdown(text: message.content),
            ),
          ),
          if (isUser) const SizedBox(width: AppSpacing.xs + AppSpacing.lg + 4),
        ],
      ),
    );
  }
}

// ── Streaming bubble (live update + blinking cursor) ─────────────────────────
class _StreamingBubble extends StatelessWidget {
  final String text;
  const _StreamingBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color:        AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.smart_toy_outlined,
              color: AppColors.primary, size: 16),
          ),
          const SizedBox(width: AppSpacing.xs),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm + 4,
                vertical:   AppSpacing.sm,
              ),
              decoration: const BoxDecoration(
                color: AppColors.grey100,
                borderRadius: BorderRadius.only(
                  topLeft:     Radius.circular(16),
                  topRight:    Radius.circular(16),
                  bottomLeft:  Radius.circular(4),
                  bottomRight: Radius.circular(16),
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Flexible(child: _SimpleMarkdown(text: text)),
                  const _BlinkingCursor(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── 3-dot loading bubble ──────────────────────────────────────────────────────
class _LoadingBubble extends StatefulWidget {
  const _LoadingBubble();

  @override
  State<_LoadingBubble> createState() => _LoadingBubbleState();
}

class _LoadingBubbleState extends State<_LoadingBubble>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 28, height: 28,
            decoration: BoxDecoration(
              color:        AppColors.primary.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Icon(Icons.smart_toy_outlined,
              color: AppColors.primary, size: 16),
          ),
          const SizedBox(width: AppSpacing.xs),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm + 4, vertical: AppSpacing.sm + 2),
            decoration: const BoxDecoration(
              color: AppColors.grey100,
              borderRadius: BorderRadius.only(
                topLeft:     Radius.circular(16),
                topRight:    Radius.circular(16),
                bottomLeft:  Radius.circular(4),
                bottomRight: Radius.circular(16),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(3, (i) => _Dot(
                animation: _ctrl,
                delay:     i * 0.3,
              )),
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatelessWidget {
  final AnimationController animation;
  final double delay;
  const _Dot({required this.animation, required this.delay});

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder:   (_, __) {
        final t   = ((animation.value - delay).clamp(0.0, 1.0));
        final off = (t < 0.5 ? t * 2 : (1 - t) * 2).toDouble();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 2),
          child: Transform.translate(
            offset: Offset(0, -4 * off),
            child:  Container(
              width:  6, height: 6,
              decoration: const BoxDecoration(
                color:  AppColors.grey500,
                shape:  BoxShape.circle,
              ),
            ),
          ),
        );
      },
    );
  }
}

// ── Blinking cursor ───────────────────────────────────────────────────────────
class _BlinkingCursor extends StatefulWidget {
  const _BlinkingCursor();

  @override
  State<_BlinkingCursor> createState() => _BlinkingCursorState();
}

class _BlinkingCursorState extends State<_BlinkingCursor>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync:    this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _ctrl,
      builder: (_, __) => Opacity(
        opacity: _ctrl.value,
        child: Container(
          width: 2, height: 14,
          margin: const EdgeInsets.only(left: 2, bottom: 1),
          color: AppColors.primary,
        ),
      ),
    );
  }
}

// ── Send button ───────────────────────────────────────────────────────────────
class _SendButton extends StatelessWidget {
  final bool      isLoading;
  final VoidCallback onTap;
  const _SendButton({required this.isLoading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(
          color:        isLoading
              ? AppColors.primary.withValues(alpha: 0.4)
              : AppColors.primary,
          borderRadius: BorderRadius.circular(AppSpacing.btnRadius),
        ),
        child: isLoading
            ? const Center(
                child: SizedBox(
                  width: 18, height: 18,
                  child: CircularProgressIndicator(
                    color:       AppColors.white,
                    strokeWidth: 2,
                  ),
                ),
              )
            : const Icon(Icons.send, color: AppColors.white, size: 18),
      ),
    );
  }
}

// ── Simple markdown renderer (bold + lists) ───────────────────────────────────
class _SimpleMarkdown extends StatelessWidget {
  final String text;
  const _SimpleMarkdown({required this.text});

  @override
  Widget build(BuildContext context) {
    final lines  = text.split('\n');
    final result = <Widget>[];
    final listBuf = <String>[];

    void flushList() {
      if (listBuf.isEmpty) return;
      result.add(Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: listBuf.map((item) => Padding(
          padding: const EdgeInsets.only(left: 8, bottom: 2),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('• ',
                style: TextStyle(color: AppColors.textPrimary, fontSize: 13)),
              Flexible(child: _InlineText(item)),
            ],
          ),
        )).toList(),
      ));
      listBuf.clear();
    }

    for (final line in lines) {
      if (RegExp(r'^[-*]\s').hasMatch(line)) {
        listBuf.add(line.substring(2));
      } else {
        flushList();
        if (line.trim().isEmpty) {
          result.add(const SizedBox(height: 4));
        } else {
          result.add(_InlineText(line));
        }
      }
    }
    flushList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: result,
    );
  }
}

class _InlineText extends StatelessWidget {
  final String text;
  const _InlineText(this.text);

  @override
  Widget build(BuildContext context) {
    final spans = <TextSpan>[];
    final regex = RegExp(r'\*\*(.+?)\*\*');
    int last = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > last) {
        spans.add(TextSpan(text: text.substring(last, match.start)));
      }
      spans.add(TextSpan(
        text:  match.group(1),
        style: const TextStyle(fontWeight: FontWeight.bold),
      ));
      last = match.end;
    }
    if (last < text.length) spans.add(TextSpan(text: text.substring(last)));

    return RichText(
      text: TextSpan(
        style: AppTextStyles.body.copyWith(
          fontSize: 14,
          height:   1.4,
          color:    AppColors.textPrimary,
        ),
        children: spans,
      ),
    );
  }
}
