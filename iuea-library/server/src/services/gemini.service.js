const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

function buildSystemPrompt(book, chapter, language) {
  return `You are IUEA Library AI Assistant for students at the International University of East Africa, Kampala, Uganda.
Book: ${book.title} by ${book.author}
Faculty: ${(book.faculty ?? []).join(', ') || 'General'}
Chapter: ${chapter || 'General'}
Respond ONLY in ${language || 'English'}.
Be concise, academic, and helpful.
Do not fabricate information.
Keep responses under 300 words.`;
}

// Map our message roles to Gemini roles ('assistant' → 'model')
function formatHistory(messages) {
  return messages.map((m) => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));
}

async function getChatResponse(messages, book, chapter, language) {
  const history = formatHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;

  const chat = model.startChat({
    history,
    systemInstruction: buildSystemPrompt(book, chapter, language),
  });

  const result = await chat.sendMessage(lastMsg);
  return result.response.text();
}

async function getChatStream(messages, book, chapter, language) {
  const history = formatHistory(messages.slice(0, -1));
  const lastMsg = messages[messages.length - 1].content;

  const chat = model.startChat({
    history,
    systemInstruction: buildSystemPrompt(book, chapter, language),
  });

  const result = await chat.sendMessageStream(lastMsg);
  return result.stream;
}

module.exports = { getChatResponse, getChatStream };
