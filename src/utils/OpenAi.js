const OpenAI = require('openai');

export const sendMsgToAI = async (messages, stream = false) => {
  const BASE_URL = process.env.BASE_URL;

  const openai = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY, dangerouslyAllowBrowser: true });

  const response = await openai.chat.completions.create({
    model: 'Meta-Llama-3-8B-Instruct',
    messages: messages,
    stream: stream,
  });

  if (stream) {
    return response;
  } else {
    try {
      console.log(response?.choices[0]?.message.content);
      return response?.choices[0]?.message.content;
    } catch (error) {
      console.log(error);
    }
  }
};