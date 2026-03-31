const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `You are a helpful library assistant for IUEA (International University of East Africa).
You help students and researchers understand books, answer questions about content,
provide summaries, and assist with academic queries. Be concise, accurate, and friendly.
Always base your answers on the book context provided.`;

const chatWithBook = async ({ bookTitle, bookDescription, history, userMessage, language = 'en' }) => {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const contextPrompt = `Book: "${bookTitle}"\nDescription: ${bookDescription}\n\nUser language: ${language}\nRespond in the same language as the user's message.`;

  const chat = model.startChat({
    history: [
      { role: 'user',  parts: [{ text: SYSTEM_PROMPT + '\n\n' + contextPrompt }] },
      { role: 'model', parts: [{ text: 'Understood. I will help users understand this book.' }] },
      ...history.map((m) => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      })),
    ],
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
};

const summarizeText = async (text, language = 'en') => {
  const model  = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const prompt = `Summarize the following text in ${language}. Be concise (max 3 paragraphs):\n\n${text}`;
  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { chatWithBook, summarizeText };
