import { useState, useRef, useEffect } from 'react';
import { AiOutlineRobot }              from 'react-icons/ai';
import { FiTrash2, FiX, FiSend }      from 'react-icons/fi';
import useChatStore                    from '../../store/chatStore';
import useReaderStore                  from '../../store/readerStore';

const SUGGESTIONS = [
  'Summarize this chapter',
  'Explain the main concept',
  'Quiz me (3 questions)',
  'Define key terms',
];

// Minimal markdown: bold + unordered lists
function SimpleMarkdown({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const result = [];
  let listBuf  = [];

  const flushList = (key) => {
    if (listBuf.length === 0) return;
    result.push(
      <ul key={`ul-${key}`} className="list-disc ml-4 my-1 space-y-0.5">
        {listBuf.map((item, i) => (
          <li key={i}>{renderInline(item)}</li>
        ))}
      </ul>
    );
    listBuf = [];
  };

  lines.forEach((line, i) => {
    if (/^[-*]\s/.test(line)) {
      listBuf.push(line.slice(2));
    } else {
      flushList(i);
      if (line.trim() === '') {
        result.push(<div key={i} className="h-1" />);
      } else {
        result.push(<p key={i} className="leading-snug">{renderInline(line)}</p>);
      }
    }
  });
  flushList('end');

  return <>{result}</>;
}

function renderInline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**')
      ? <strong key={i}>{p.slice(2, -2)}</strong>
      : p
  );
}

// 3-dot loading animation
function LoadingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </div>
  );
}

export default function ChatbotOverlay({ bookId, onClose }) {
  const { currentBook, currentChapter, readingLanguage } = useReaderStore();
  const {
    getMessages, isLoading, isStreaming, streamingMessage,
    streamMessage, loadHistory, clearHistory,
  } = useChatStore();

  const [input, setInput]     = useState('');
  const messagesEndRef         = useRef(null);
  const textareaRef            = useRef(null);
  const messages               = getMessages(bookId);

  useEffect(() => { loadHistory(bookId); }, [bookId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, streamingMessage, isLoading]);

  const send = (text) => {
    const msg = (text ?? input).trim();
    if (!msg || isLoading || isStreaming) return;
    setInput('');
    streamMessage(bookId, msg, readingLanguage, String(currentChapter ?? ''));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Auto-resize textarea
  const handleInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    /*
     * Mobile:  fixed slide-up panel, h-[72vh], rounded top corners
     * Desktop: fixed right drawer, full-height, w-96
     */
    <div className="fixed bottom-0 right-0 left-0 sm:left-auto h-[72vh] sm:h-full sm:w-96 bg-white rounded-t-2xl sm:rounded-none shadow-2xl flex flex-col z-50 border border-gray-200 sm:border-l">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 flex-shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <AiOutlineRobot size={20} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 leading-tight">IUEA AI Assistant</p>
          <p className="text-xs text-gray-400 truncate">{currentBook?.title ?? 'Library AI'}</p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => clearHistory(bookId)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Clear chat"
          >
            <FiTrash2 size={16} className="text-gray-400" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <FiX size={18} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* ── Powered-by caption ──────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-gray-400 py-1 flex-shrink-0">
        Powered by Gemini 1.5 Flash — free
      </p>

      {/* ── Messages area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">

        {/* Suggestion chips — shown only when no messages */}
        {messages.length === 0 && !isLoading && !isStreaming && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-gray-400 text-center">Ask anything about this book</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="px-3 py-1.5 text-xs rounded-full border border-primary text-primary hover:bg-primary/5 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <AiOutlineRobot size={14} className="text-primary" />
              </div>
            )}
            <div
              className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'
              }`}
            >
              {msg.role === 'assistant'
                ? <SimpleMarkdown text={msg.content} />
                : msg.content
              }
            </div>
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AiOutlineRobot size={14} className="text-primary" />
            </div>
            <div className="max-w-[80%] px-3 py-2 rounded-2xl rounded-bl-sm bg-gray-100 text-sm text-gray-800">
              <SimpleMarkdown text={streamingMessage} />
              <span className="inline-block w-0.5 h-3.5 bg-primary ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Loading dots */}
        {isLoading && (
          <div className="flex justify-start gap-2">
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <AiOutlineRobot size={14} className="text-primary" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm">
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Disclaimer ─────────────────────────────────────────────────────── */}
      <p className="text-center text-[10px] text-gray-400 px-4 pb-1 flex-shrink-0">
        AI may make mistakes. Verify with your textbooks.
      </p>

      {/* ── Input bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-end gap-2 px-3 pb-4 pt-2 border-t border-gray-100 flex-shrink-0">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="Ask about this book…"
          className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:border-primary transition-colors leading-snug"
          style={{ minHeight: '40px', maxHeight: '120px' }}
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || isLoading || isStreaming}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <FiSend size={16} className="text-white" />
        </button>
      </div>
    </div>
  );
}
