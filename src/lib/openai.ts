// Stub - OpenAI ishlatilmaydi, Groq ishlatiladi
export const openaiClient = {
  chat: { completions: { create: async () => ({ choices: [{ message: { content: '' } }] }) } }
};
