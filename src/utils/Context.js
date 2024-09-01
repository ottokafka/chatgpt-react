import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { sendMsgToAI } from "./OpenAi";
export const ContextApp = createContext();

const AppContext = ({ children }) => {
  const [showSlide, setShowSlide] = useState(false);
  const [Mobile, setMobile] = useState(false);
  const [chatValue, setChatValue] = useState("");
  const [displayMessages, setDisplayMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const msgEnd = useRef(null);
  const [editingMessageId, setEditingMessageId] = useState(null);

  useEffect(() => {
    if (!msgEnd.current) return;
    msgEnd.current.scrollIntoView();
  }, [displayMessages]);

  useEffect(() => {
    // Load conversation history from localStorage on component mount
    const storedHistory = localStorage.getItem('conversationHistory');
    if (storedHistory) {
      setConversationHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    // Save conversation history to localStorage whenever it changes
    if (conversationHistory.length === 0) return;
    localStorage.setItem('conversationHistory', JSON.stringify(conversationHistory));
  }, [conversationHistory]);

  const handleStreamingResponse = useCallback(async (stream, conversation) => {
    let newMessage = { role: "assistant", content: "", id: Date.now() };
    setDisplayMessages(prevMessages => [...prevMessages, { text: "", isBot: true, id: newMessage.id }]);

    try {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        newMessage.content += content;
        setDisplayMessages(prevMessages => [
          ...prevMessages.slice(0, -1),
          { text: newMessage.content, isBot: true, id: newMessage.id }
        ]);
      }

      // Update conversation in history and current conversation
      const updatedMessages = [...conversation.messages, newMessage];
      const updatedConversation = { ...conversation, messages: updatedMessages };

      setConversationHistory(prevHistory =>
        prevHistory.map(conv =>
          conv.uuid === conversation.uuid ? updatedConversation : conv
        )
      );

      setCurrentConversation(updatedConversation);
    } catch (error) {
      console.error("Error in streaming:", error);
      setDisplayMessages(prevMessages => [
        ...prevMessages,
        { text: "An error occurred while processing your request.", isBot: true, id: Date.now() },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (text) => {
    const userMessage = { role: "user", content: text, id: Date.now() };

    let updatedConversation;
    if (!currentConversation) {
      // Create a new conversation
      updatedConversation = {
        uuid: Date.now().toString(),
        name: text.slice(0, 30), // Use first 30 characters of message as name
        description: text,
        messages: [userMessage],
      };
      setCurrentConversation(updatedConversation);
      setConversationHistory(prevHistory => [...prevHistory, updatedConversation]);
    } else {
      // Update existing conversation
      updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, userMessage],
      };
      setCurrentConversation(updatedConversation);
      setConversationHistory(prevHistory =>
        prevHistory.map(conv =>
          conv.uuid === currentConversation.uuid ? updatedConversation : conv
        )
      );
    }

    setDisplayMessages(updatedConversation.messages.map(msg => ({
      text: msg.content,
      isBot: msg.role === 'assistant',
      id: msg.id
    })));

    setIsStreaming(true);

    try {
      const stream = await sendMsgToAI(updatedConversation, true);
      await handleStreamingResponse(stream, updatedConversation);
    } catch (error) {
      console.error("Error in sending message:", error);
      setDisplayMessages(prevMessages => [
        ...prevMessages,
        { text: "An error occurred while processing your request.", isBot: true, id: Date.now() },
      ]);
      setIsStreaming(false);
    }
  }, [currentConversation, handleStreamingResponse]);

  const handleSend = useCallback(() => {
    const text = chatValue;
    setChatValue("");
    handleSendMessage(text);
  }, [chatValue, handleSendMessage]);

  const handleKeyPress = useCallback((e) => {
    if (e.key === "Enter" && !isStreaming) {
      handleSend();
    }
  }, [handleSend, isStreaming]);

  const handleQuery = useCallback((e) => {
    if (isStreaming) return;
    const text = e.target.innerText;
    handleSendMessage(text);
  }, [handleSendMessage, isStreaming]);

  const startNewConversation = useCallback(() => {
    setCurrentConversation(null);
    setDisplayMessages([]);
  }, []);

  const loadConversation = useCallback((conversationId) => {
    const conversation = conversationHistory.find(conv => conv.uuid === conversationId);
    if (conversation) {
      setCurrentConversation(conversation);
      setDisplayMessages(conversation.messages.map(msg => ({
        text: msg.content,
        isBot: msg.role === 'assistant',
        id: msg.id
      })));
    }
  }, [conversationHistory]);

  const startEditingMessage = useCallback((messageId) => {
    setEditingMessageId(messageId);
  }, []);

  const cancelEditingMessage = useCallback(() => {
    setEditingMessageId(null);
  }, []);

  const saveEditedMessage = useCallback(async (editedContent) => {
    if (!editingMessageId || !currentConversation) return;

    // Find the index of the edited message
    const editedIndex = currentConversation.messages.findIndex(msg => msg.id === editingMessageId);
    if (editedIndex === -1) return;

    // Create a new array with messages up to and including the edited message
    const messagesBeforeEdit = currentConversation.messages.slice(0, editedIndex);
    const editedMessage = { ...currentConversation.messages[editedIndex], content: editedContent };
    const updatedMessages = [...messagesBeforeEdit, editedMessage];

    // Update the current conversation
    const updatedConversation = { ...currentConversation, messages: updatedMessages };
    setCurrentConversation(updatedConversation);

    // Update the conversation history
    setConversationHistory(prevHistory =>
      prevHistory.map(conv =>
        conv.uuid === currentConversation.uuid ? updatedConversation : conv
      )
    );

    setDisplayMessages(updatedMessages.map(msg => ({
      text: msg.content,
      isBot: msg.role === 'assistant',
      id: msg.id
    })));

    setEditingMessageId(null);

    // Send the updated conversation to the AI
    try {
      setIsStreaming(true);
      const stream = await sendMsgToAI(updatedMessages, true);
      await handleStreamingResponse(stream, updatedConversation);
    } catch (error) {
      console.error("Error in sending edited message to AI:", error);
      setDisplayMessages(prevMessages => [
        ...prevMessages,
        { text: "An error occurred while processing your edited message.", isBot: true, id: Date.now() },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [editingMessageId, currentConversation, setConversationHistory, handleStreamingResponse]);

  // Ensure editingMessageId is reset when changing conversations
  useEffect(() => {
    setEditingMessageId(null);
  }, [currentConversation]);

  const contextValue = {
    showSlide,
    setShowSlide,
    Mobile,
    setMobile,
    chatValue,
    setChatValue,
    handleSend,
    displayMessages,
    msgEnd,
    handleKeyPress,
    handleQuery,
    isStreaming,
    conversationHistory,
    currentConversation,
    startNewConversation,
    loadConversation,
    editingMessageId,
    startEditingMessage,
    cancelEditingMessage,
    saveEditedMessage
  };

  return (
    <ContextApp.Provider value={contextValue}>
      {children}
    </ContextApp.Provider>
  );
};

export default AppContext;