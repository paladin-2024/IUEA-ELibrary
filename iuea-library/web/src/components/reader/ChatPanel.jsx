import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User }             from 'lucide-react';
import { sendMessage, getChatHistory } from '../../services/chat.service';
import useAuthStore  from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

export default function ChatPanel({ bookId, bookTitle }) {
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [loading,   setLoading]   = useState(true);
  const { user }  = useAuthStore();
  const bottomRef = useRef(null);

  useEffect(() => {
    getChatHistory(bookId)
      .then(({ messages: hist }) => setMessages(hist))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [bookId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const userMsg = { role: 'user', content: input.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);

    try {
      const lang = user?.language || 'en';
      const { reply } = await sendMessage(bookId, userMsg.content, lang);
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, I could not process that. Try again.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b bg-primary text-white">
        <Bot size={16} className="text-accent" />
        <div>
          <p className="text-sm font-semibold">AI Assistant</p>
          <p className="text-[10px] text-primary-light line-clamp-1">{bookTitle}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm">
        {loading ? (
          <LoadingSpinner className="py-8" />
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 py-8 px-2">
            <Bot size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs">Ask me anything about this book!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                msg.role === 'user' ? 'bg-primary text-white' : 'bg-accent/20 text-primary'
              }`}>
                {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
              </div>
              <div className={`rounded-card px-3 py-2 max-w-[85%] text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-tr-none'
                  : 'bg-gray-100 text-gray-800 rounded-tl-none'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
              <Bot size={12} className="text-primary" />
            </div>
            <div className="bg-gray-100 rounded-card px-3 py-2 text-xs text-gray-500 italic">Thinking…</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t p-2 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this book…"
          className="flex-1 text-xs border rounded-input px-3 py-2 outline-none focus:border-primary"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={!input.trim() || sending}
          className="bg-primary text-white p-2 rounded-btn disabled:opacity-40 hover:bg-primary-dark"
        >
          <Send size={14} />
        </button>
      </form>
    </>
  );
}
