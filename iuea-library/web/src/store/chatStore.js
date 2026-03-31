import { create } from 'zustand';
import api          from '../services/api';

const useChatStore = create((set, get) => ({
  // sessions keyed by bookId: [{ role, content, timestamp }]
  sessions:         {},
  isLoading:        false,
  isStreaming:      false,
  streamingMessage: '',

  getMessages: (bookId) => get().sessions[bookId] ?? [],

  loadHistory: async (bookId) => {
    try {
      const { data } = await api.get(`/chat/${bookId}/history`);
      set((s) => ({
        sessions: { ...s.sessions, [bookId]: data.messages ?? [] },
      }));
    } catch { /* non-fatal */ }
  },

  sendMessage: async (bookId, message, language = 'English', chapter = '') => {
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    set((s) => ({
      isLoading: true,
      sessions:  { ...s.sessions, [bookId]: [...(s.sessions[bookId] ?? []), userMsg] },
    }));
    try {
      const { data } = await api.post(`/chat/${bookId}`, { message, language, chapter });
      const aiMsg    = { role: 'assistant', content: data.reply, timestamp: new Date().toISOString() };
      set((s) => ({
        isLoading: false,
        sessions:  { ...s.sessions, [bookId]: [...(s.sessions[bookId] ?? []), aiMsg] },
      }));
    } catch {
      set({ isLoading: false });
    }
  },

  streamMessage: (bookId, message, language = 'English', chapter = '') => {
    const userMsg = { role: 'user', content: message, timestamp: new Date().toISOString() };
    set((s) => ({
      isStreaming:      true,
      streamingMessage: '',
      sessions:         { ...s.sessions, [bookId]: [...(s.sessions[bookId] ?? []), userMsg] },
    }));

    const token = (() => {
      try {
        const raw = localStorage.getItem('iuea_auth');
        return JSON.parse(raw)?.state?.token ?? '';
      } catch { return ''; }
    })();

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
    const params  = new URLSearchParams({ message, language, chapter }).toString();

    fetch(`${baseUrl}/chat/${bookId}/stream?${params}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'text/event-stream' },
    }).then(async (res) => {
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let   buf    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });

        const lines = buf.split('\n');
        buf = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();

          if (raw === '[DONE]') {
            set((s) => {
              const aiMsg = {
                role:      'assistant',
                content:   s.streamingMessage,
                timestamp: new Date().toISOString(),
              };
              return {
                isStreaming:      false,
                streamingMessage: '',
                sessions: {
                  ...s.sessions,
                  [bookId]: [...(s.sessions[bookId] ?? []), aiMsg],
                },
              };
            });
            return;
          }

          try {
            const { chunk } = JSON.parse(raw);
            if (chunk) set((s) => ({ streamingMessage: s.streamingMessage + chunk }));
          } catch { /* ignore malformed SSE line */ }
        }
      }
    }).catch(() => set({ isStreaming: false, streamingMessage: '' }));
  },

  clearHistory: async (bookId) => {
    try {
      await api.delete(`/chat/${bookId}`);
      set((s) => ({ sessions: { ...s.sessions, [bookId]: [] } }));
    } catch { /* non-fatal */ }
  },
}));

export default useChatStore;
