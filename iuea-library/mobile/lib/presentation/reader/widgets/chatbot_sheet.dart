import 'package:flutter/material.dart';
import 'package:iuea_library/core/constants/app_icons.dart';
import 'package:provider/provider.dart';
import '../../../providers/chat_provider.dart';
import '../../../providers/reader_provider.dart';
import '../../../data/models/chat_message_model.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_text_styles.dart';

// Brand colours used only in this sheet
const _kMaroon900 = Color(0xFF3D0810);
const _kMaroon700 = Color(0xFF8A1228);
const _kGold      = Color(0xFFB8964A);
const _kCream     = Color(0xFFFDF4F2);
const _kBlush200  = Color(0xFFF8D7D3);

const _kSuggestions = [
  'Summarize chapter',
  'Explain a concept',
  'Quiz me',
  'Define key terms',
  'Give main argument',
];

class ChatbotSheet extends StatefulWidget {
  final String bookId;
  const ChatbotSheet({super.key, required this.bookId});

  @override
  State<ChatbotSheet> createState() => _ChatbotSheetState();
}

class _ChatbotSheetState extends State<ChatbotSheet> {
  final _textController   = TextEditingController();
  final _scrollController = ScrollController();
  final _focusNode        = FocusNode();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final chat = context.read<ChatProvider>();
      chat.loadHistory(widget.bookId);
      chat.addListener(_onChatUpdate);
    });
  }

  void _onChatUpdate() {
    final chat = context.read<ChatProvider>();
    if (chat.isStreaming) _scrollToBottom();
  }

  @override
  void dispose() {
    context.read<ChatProvider>().removeListener(_onChatUpdate);
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
      widget.bookId, msg, reader.readingLanguage,
      chapter: reader.currentChapterText,
    );
    _scrollToBottom();
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.72,
      minChildSize:     0.45,
      maxChildSize:     0.95,
      expand:           false,
      builder: (ctx, _) {
        return ClipRRect(
          borderRadius:
              const BorderRadius.vertical(top: Radius.circular(24)),
          child: Container(
            color: _kCream,
            child: Consumer2<ChatProvider, ReaderProvider>(
              builder: (_, chat, reader, __) {
                final messages = chat.getMessages(widget.bookId);
                final isEmpty =
                    messages.isEmpty && !chat.isLoading && !chat.isStreaming;

                return Column(
                  children: [
                    // ── Gradient header ──────────────────────────────────────
                    _ChatHeader(
                      onClear: () => chat.clearHistory(widget.bookId),
                      onClose: () => Navigator.of(context).pop(),
                    ),

                    // ── Suggestion chips (empty state) ───────────────────────
                    if (isEmpty)
                      _SuggestionChips(
                        onSelect: (s) => _send(s, chat, reader),
                      ),

                    // ── Messages list ────────────────────────────────────────
                    Expanded(
                      child: ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 12),
                        itemCount: messages.length
                            + (chat.isLoading ? 1 : 0)
                            + (chat.isStreaming ? 1 : 0),
                        itemBuilder: (_, i) {
                          if (i == messages.length && chat.isLoading) {
                            return const _LoadingBubble();
                          }
                          if (i == messages.length && chat.isStreaming) {
                            return _StreamingBubble(
                                text: chat.streamingMessage);
                          }
                          if (i >= messages.length) {
                            return const SizedBox.shrink();
                          }
                          return _MessageBubble(message: messages[i]);
                        },
                      ),
                    ),

                    // ── Disclaimer ───────────────────────────────────────────
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4),
                      child: Text(
                        'AI responses may contain errors · Powered by Google',
                        style: TextStyle(
                          fontFamily:    'Inter',
                          fontSize:      9,
                          letterSpacing: 0.6,
                          color: AppColors.ink500.withValues(alpha: 0.6),
                        ),
                      ),
                    ),

                    // ── Input row ────────────────────────────────────────────
                    _InputRow(
                      controller: _textController,
                      focusNode:  _focusNode,
                      isLocked:   chat.isLoading || chat.isStreaming,
                      onSend:     () =>
                          _send(_textController.text, chat, reader),
                      onSubmit:   (v) => _send(v, chat, reader),
                    ),
                  ],
                );
              },
            ),
          ),
        );
      },
    );
  }
}

// ── Gradient header ───────────────────────────────────────────────────────────
class _ChatHeader extends StatelessWidget {
  final VoidCallback onClear;
  final VoidCallback onClose;
  const _ChatHeader({required this.onClear, required this.onClose});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end:   Alignment.bottomRight,
          colors: [_kMaroon900, _kMaroon700],
        ),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.fromLTRB(16, 12, 8, 16),
      child: Column(
        children: [
          // Drag handle
          Center(
            child: Container(
              width:  36, height: 4,
              decoration: BoxDecoration(
                color:        Colors.white.withValues(alpha: 0.35),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Header row
          Row(
            children: [
              // Glowing AI avatar
              Container(
                width: 46, height: 46,
                decoration: BoxDecoration(
                  shape:      BoxShape.circle,
                  color:      Colors.white.withValues(alpha: 0.12),
                  boxShadow: [
                    BoxShadow(
                      color:      _kGold.withValues(alpha: 0.45),
                      blurRadius: 16,
                      spreadRadius: 2,
                    ),
                  ],
                ),
                child: const Icon(
                  AppIcons.aiSparkle,
                  color: _kGold,
                  size:  22,
                ),
              ),
              const SizedBox(width: 12),

              // Title block
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'IUEA AI Assistant',
                      style: TextStyle(
                        fontFamily: 'Newsreader',
                        color:      _kCream,
                        fontSize:   16,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(children: [
                      Container(
                        width: 7, height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFF4ADE80),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        'Digital Curator · Active',
                        style: TextStyle(
                          fontFamily:    'Inter',
                          fontSize:      10,
                          letterSpacing: 0.6,
                          color: _kBlush200.withValues(alpha: 0.8),
                        ),
                      ),
                    ]),
                  ],
                ),
              ),

              // Action buttons
              IconButton(
                icon: Icon(AppIcons.delete,
                    color: _kBlush200.withValues(alpha: 0.7), size: 20),
                tooltip:   'Clear chat',
                onPressed: onClear,
              ),
              IconButton(
                icon: Icon(AppIcons.close,
                    color: _kBlush200.withValues(alpha: 0.7), size: 20),
                tooltip:   'Close',
                onPressed: onClose,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
class _SuggestionChips extends StatelessWidget {
  final void Function(String) onSelect;
  const _SuggestionChips({required this.onSelect});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _kCream,
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'What would you like to explore?',
            style: AppTextStyles.label.copyWith(
              color:      AppColors.textSecondary,
              fontSize:   12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing:    8,
            runSpacing: 8,
            children:   _kSuggestions.map((s) => GestureDetector(
              onTap: () => onSelect(s),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color:        Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  border:       Border.all(
                      color: _kMaroon700.withValues(alpha: 0.3)),
                  boxShadow: [
                    BoxShadow(
                      color:     Colors.black.withValues(alpha: 0.04),
                      blurRadius: 6,
                      offset:    const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(AppIcons.aiSparkle,
                      size: 12, color: _kMaroon700),
                  const SizedBox(width: 5),
                  Text(s,
                    style: const TextStyle(
                      fontFamily: 'Inter',
                      fontSize:   12,
                      fontWeight: FontWeight.w500,
                      color:      _kMaroon700,
                    )),
                ]),
              ),
            )).toList(),
          ),
          const SizedBox(height: 16),
          Divider(height: 1, color: AppColors.line.withValues(alpha: 0.6)),
        ],
      ),
    );
  }
}

// ── Message bubble ────────────────────────────────────────────────────────────
class _MessageBubble extends StatelessWidget {
  final ChatMessageModel message;
  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment:
            isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // AI avatar
          if (!isUser) ...[
            Container(
              width: 30, height: 30,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end:   Alignment.bottomRight,
                  colors: [_kMaroon900, _kMaroon700],
                ),
                shape:     BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color:      _kMaroon700.withValues(alpha: 0.3),
                    blurRadius: 8,
                    offset:     const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(AppIcons.aiSparkle,
                  color: _kGold, size: 15),
            ),
            const SizedBox(width: 8),
          ],

          // Bubble
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isUser ? _kMaroon700 : Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft:     const Radius.circular(18),
                  topRight:    const Radius.circular(18),
                  bottomLeft:  Radius.circular(isUser ? 18 : 4),
                  bottomRight: Radius.circular(isUser ? 4 : 18),
                ),
                boxShadow: [
                  BoxShadow(
                    color:     Colors.black.withValues(alpha: isUser ? 0.12 : 0.06),
                    blurRadius: 8,
                    offset:    const Offset(0, 2),
                  ),
                ],
              ),
              child: isUser
                  ? Text(
                      message.content,
                      style: const TextStyle(
                        fontFamily: 'Inter',
                        color:      Colors.white,
                        fontSize:   14,
                        height:     1.45,
                      ),
                    )
                  : _SimpleMarkdown(text: message.content),
            ),
          ),

          // User spacer
          if (isUser) const SizedBox(width: 4),
        ],
      ),
    );
  }
}

// ── Streaming bubble ──────────────────────────────────────────────────────────
class _StreamingBubble extends StatelessWidget {
  final String text;
  const _StreamingBubble({required this.text});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_kMaroon900, _kMaroon700],
                begin:  Alignment.topLeft,
                end:    Alignment.bottomRight,
              ),
              shape:     BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color:      _kMaroon700.withValues(alpha: 0.3),
                  blurRadius: 8,
                  offset:     const Offset(0, 2),
                ),
              ],
            ),
            child: const Icon(AppIcons.aiSparkle,
                color: _kGold, size: 15),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: const BorderRadius.only(
                  topLeft:     Radius.circular(18),
                  topRight:    Radius.circular(18),
                  bottomLeft:  Radius.circular(4),
                  bottomRight: Radius.circular(18),
                ),
                boxShadow: [
                  BoxShadow(
                    color:     Colors.black.withValues(alpha: 0.06),
                    blurRadius: 8,
                    offset:    const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize:     MainAxisSize.min,
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
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            width: 30, height: 30,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [_kMaroon900, _kMaroon700],
                begin:  Alignment.topLeft,
                end:    Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
            ),
            child: const Icon(AppIcons.aiSparkle,
                color: _kGold, size: 15),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft:     Radius.circular(18),
                topRight:    Radius.circular(18),
                bottomLeft:  Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
              boxShadow: [
                BoxShadow(
                  color:     Colors.black.withValues(alpha: 0.06),
                  blurRadius: 8,
                  offset:    const Offset(0, 2),
                ),
              ],
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
      builder: (_, __) {
        final t   = ((animation.value - delay).clamp(0.0, 1.0));
        final off = (t < 0.5 ? t * 2 : (1 - t) * 2).toDouble();
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 3),
          child: Transform.translate(
            offset: Offset(0, -5 * off),
            child: Container(
              width: 7, height: 7,
              decoration: const BoxDecoration(
                color: _kMaroon700,
                shape: BoxShape.circle,
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
          width:  2.5, height: 15,
          margin: const EdgeInsets.only(left: 3, bottom: 1),
          decoration: BoxDecoration(
            color:        _kMaroon700,
            borderRadius: BorderRadius.circular(1),
          ),
        ),
      ),
    );
  }
}

// ── Input row ─────────────────────────────────────────────────────────────────
class _InputRow extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode             focusNode;
  final bool                  isLocked;
  final VoidCallback          onSend;
  final void Function(String) onSubmit;

  const _InputRow({
    required this.controller,
    required this.focusNode,
    required this.isLocked,
    required this.onSend,
    required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: EdgeInsets.only(
          left:   12,
          right:  12,
          top:    10,
          bottom: 10 + MediaQuery.of(context).viewInsets.bottom,
        ),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color:     Colors.black.withValues(alpha: 0.06),
              blurRadius: 12,
              offset:    const Offset(0, -2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color:        _kCream,
                  borderRadius: BorderRadius.circular(22),
                  border:       Border.all(
                      color: AppColors.line.withValues(alpha: 0.8)),
                ),
                child: TextField(
                  controller:      controller,
                  focusNode:       focusNode,
                  minLines:        1,
                  maxLines:        4,
                  textInputAction: TextInputAction.send,
                  onSubmitted:     onSubmit,
                  style: const TextStyle(
                    fontFamily: 'Inter',
                    fontSize:   14,
                    height:     1.4,
                    color:      AppColors.ink900,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Ask about this book…',
                    hintStyle: TextStyle(
                      fontFamily: 'Inter',
                      fontSize:   14,
                      color:      AppColors.ink300,
                    ),
                    border:         InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            _SendButton(isLocked: isLocked, onTap: onSend),
          ],
        ),
      ),
    );
  }
}

// ── Send button with gradient ─────────────────────────────────────────────────
class _SendButton extends StatelessWidget {
  final bool         isLocked;
  final VoidCallback onTap;
  const _SendButton({required this.isLocked, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLocked ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: 44, height: 44,
        decoration: BoxDecoration(
          gradient: isLocked
              ? const LinearGradient(
                  colors: [Color(0xFF9E9E9E), Color(0xFFBDBDBD)])
              : const LinearGradient(
                  begin: Alignment.topLeft,
                  end:   Alignment.bottomRight,
                  colors: [_kMaroon900, _kMaroon700],
                ),
          shape: BoxShape.circle,
          boxShadow: isLocked
              ? null
              : [
                  BoxShadow(
                    color:      _kMaroon700.withValues(alpha: 0.4),
                    blurRadius: 10,
                    offset:     const Offset(0, 3),
                  ),
                ],
        ),
        child: isLocked
            ? const Center(
                child: SizedBox(
                  width: 18, height: 18,
                  child: CircularProgressIndicator(
                    color:       Colors.white,
                    strokeWidth: 2,
                  ),
                ),
              )
            : const Icon(AppIcons.send,
                color: Colors.white, size: 18),
      ),
    );
  }
}

// ── Simple markdown renderer ──────────────────────────────────────────────────
class _SimpleMarkdown extends StatelessWidget {
  final String text;
  const _SimpleMarkdown({required this.text});

  @override
  Widget build(BuildContext context) {
    final lines   = text.split('\n');
    final result  = <Widget>[];
    final listBuf = <String>[];

    void flushList() {
      if (listBuf.isEmpty) return;
      result.add(Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: listBuf
            .map((item) => Padding(
                  padding: const EdgeInsets.only(left: 8, bottom: 3),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('• ',
                          style: TextStyle(
                              color: AppColors.textPrimary, fontSize: 13)),
                      Flexible(child: _InlineText(item)),
                    ],
                  ),
                ))
            .toList(),
      ));
      listBuf.clear();
    }

    for (final line in lines) {
      if (RegExp(r'^[-*]\s').hasMatch(line)) {
        listBuf.add(line.substring(2));
      } else {
        flushList();
        final h3 = RegExp(r'^###\s+(.+)').firstMatch(line);
        final h2 = RegExp(r'^##\s+(.+)').firstMatch(line);
        final h1 = RegExp(r'^#\s+(.+)').firstMatch(line);
        if (h3 != null) {
          result.add(Padding(
            padding: const EdgeInsets.only(top: 8, bottom: 2),
            child: Text(h3.group(1)!,
              style: const TextStyle(
                fontFamily: 'Newsreader', fontSize: 14,
                fontWeight: FontWeight.w700, color: _kMaroon700, height: 1.3)),
          ));
        } else if (h2 != null) {
          result.add(Padding(
            padding: const EdgeInsets.only(top: 10, bottom: 2),
            child: Text(h2.group(1)!,
              style: const TextStyle(
                fontFamily: 'Newsreader', fontSize: 15,
                fontWeight: FontWeight.w700, color: _kMaroon900, height: 1.3)),
          ));
        } else if (h1 != null) {
          result.add(Padding(
            padding: const EdgeInsets.only(top: 12, bottom: 4),
            child: Text(h1.group(1)!,
              style: const TextStyle(
                fontFamily: 'Newsreader', fontSize: 16,
                fontWeight: FontWeight.w700, color: _kMaroon900, height: 1.3)),
          ));
        } else if (line.trim().isEmpty) {
          result.add(const SizedBox(height: 4));
        } else {
          result.add(_InlineText(line));
        }
      }
    }
    flushList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize:        MainAxisSize.min,
      children:            result,
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
    int last    = 0;

    for (final match in regex.allMatches(text)) {
      if (match.start > last) {
        spans.add(TextSpan(text: text.substring(last, match.start)));
      }
      spans.add(TextSpan(
        text:  match.group(1),
        style: const TextStyle(fontWeight: FontWeight.w700),
      ));
      last = match.end;
    }
    if (last < text.length) spans.add(TextSpan(text: text.substring(last)));

    return RichText(
      text: TextSpan(
        style: const TextStyle(
          fontFamily: 'Inter',
          fontSize:   14,
          height:     1.5,
          color:      AppColors.textPrimary,
        ),
        children: spans,
      ),
    );
  }
}
