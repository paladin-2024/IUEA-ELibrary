const { GoogleGenerativeAI } = require('@google/generative-ai');

const GENERAL_BOOK_ID = '__general__';

// Lazily initialise so a missing key gives a clear error at call time, not at boot.
let _genAI = null;
let _model  = null;

function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error(
      'AI Assistant is not configured yet. The administrator needs to add GEMINI_API_KEY to the server.'
    );
  }
  if (!_model) {
    _genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model  = _genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }
  return _model;
}

function buildSystemPrompt(book, chapter, language) {
  if (book.id === GENERAL_BOOK_ID) {
    return `You are IUEA Library AI Assistant at the International University of East Africa, Kampala, Uganda.
You help staff and students navigate the digital library: find books, understand features, answer academic questions, and support research.
Respond ONLY in ${language || 'English'}.
Be concise, helpful, and professional. Do not fabricate information. Keep responses under 300 words.`;
  }

  // `chapter` contains the text extracted from the current epub page (up to ~3000 chars).
  // Truncate to avoid hitting token limits.
  const pageExcerpt = chapter && chapter.trim().length > 0
    ? chapter.trim().slice(0, 3000)
    : null;

  return `You are IUEA Library AI Assistant for students at the International University of East Africa, Kampala, Uganda.
Book: "${book.title}" by ${book.author}
Faculty: ${(book.faculty ?? []).join(', ') || 'General'}
${pageExcerpt ? `Current page content:\n"""\n${pageExcerpt}\n"""\n` : ''}Answer questions about this book using the page content above as your primary source.
If the page content does not contain the answer, use your knowledge of the book but say so clearly.
Respond ONLY in ${language || 'English'}.
Be concise, academic, and helpful. Do not fabricate information. Keep responses under 300 words.`;
}

// Map our message roles to Gemini roles ('assistant' → 'model')
function formatHistory(messages) {
  return messages.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

function toInstruction(text) {
  return { parts: [{ text }] };
}

async function getChatResponse(messages, book, chapter, language) {
  const model   = getModel();
  const history = formatHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;

  const chat   = model.startChat({ history, systemInstruction: toInstruction(buildSystemPrompt(book, chapter, language)) });
  const result = await chat.sendMessage(lastMsg);
  return result.response.text();
}

async function getChatStream(messages, book, chapter, language) {
  const model   = getModel();
  const history = formatHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;

  const chat   = model.startChat({ history, systemInstruction: toInstruction(buildSystemPrompt(book, chapter, language)) });
  const result = await chat.sendMessageStream(lastMsg);
  return result.stream;
}

module.exports = { getChatResponse, getChatStream };
