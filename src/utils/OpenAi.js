const OpenAI = require('openai');
const BASE_URL = process.env.REACT_APP_BASE_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

export const sendMsgToAI = async (updatedConversation, stream = false) => {
  const token = localStorage.getItem('token');
  const openai = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY, dangerouslyAllowBrowser: true, defaultHeaders: { token: token } });

  const response = await openai.chat.completions.create({
    model: 'Meta-Llama-3-8B-Instruct',
    messages: updatedConversation.messages,
    stream: stream,
    conversation_id: updatedConversation.uuid,
    frontend: true
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



export const generateImage = async (prompt, stream = false) => {
  const token = localStorage.getItem('token');
  const openai = new OpenAI({ baseURL: BASE_URL, apiKey: API_KEY, dangerouslyAllowBrowser: true, defaultHeaders: { token: token } });

  const image = await openai.images.generate({
    model: "dall-e-3",
    prompt: "A cute baby sea otter",
    size: "512x512"
  });

  if (stream) {
    return image.data;
  } else {
    try {
      return image.data
    } catch (error) {
      console.log(error);
    }
  }
};