import { createContext, useEffect, useRef, useState, useCallback } from "react";
import { sendMsgToAI } from "./OpenAi";
export const ContextApp = createContext();

const DB_NAME = 'ChatAppDB';
const STORE_NAME = 'conversations';
const DB_VERSION = 1;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject("IndexedDB error: " + event.target.error);

    request.onsuccess = (event) => resolve(event.target.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: "uuid" });
    };
  });
};

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
  const [db, setDb] = useState(null);

  useEffect(() => {
    const initDB = async () => {
      try {
        const database = await openDB();
        setDb(database);
        await loadConversationsFromDB(database);
      } catch (error) {
        console.error("Error initializing IndexedDB:", error);
      }
    };

    initDB();

    return () => {
      if (db) db.close();
    };
    // eslint-disable-next-line
  }, []);

  const loadConversationsFromDB = useCallback(async (database) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = (event) => {
      setConversationHistory(event.target.result);
    };

    request.onerror = (event) => {
      console.error("Error loading conversations from IndexedDB:", event.target.error);
    };
  }, []);

  const saveConversationToDB = useCallback(async (conversation) => {
    if (!db) return;

    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(conversation);

    request.onerror = (event) => {
      console.error("Error saving conversation to IndexedDB:", event.target.error);
    };
  }, [db]);

  useEffect(() => {
    if (!msgEnd.current) return;
    msgEnd.current.scrollIntoView();
  }, [displayMessages]);

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

      const updatedMessages = [...conversation.messages, newMessage];
      const updatedConversation = { ...conversation, messages: updatedMessages };

      setConversationHistory(prevHistory =>
        prevHistory.map(conv =>
          conv.uuid === conversation.uuid ? updatedConversation : conv
        )
      );

      setCurrentConversation(updatedConversation);
      await saveConversationToDB(updatedConversation);
    } catch (error) {
      console.error("Error in streaming:", error);
      setDisplayMessages(prevMessages => [
        ...prevMessages,
        { text: "An error occurred while processing your request.", isBot: true, id: Date.now() },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, [saveConversationToDB]);

  const handleSendMessage = useCallback(async (text) => {
    const userMessage = { role: "user", content: text, id: Date.now() };

    let updatedConversation;
    if (!currentConversation) {
      updatedConversation = {
        uuid: Date.now().toString(),
        name: text.slice(0, 30),
        description: text,
        messages: [userMessage],
      };
      setCurrentConversation(updatedConversation);
      setConversationHistory(prevHistory => [...prevHistory, updatedConversation]);
    } else {
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

    await saveConversationToDB(updatedConversation);

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
  }, [currentConversation, handleStreamingResponse, saveConversationToDB]);

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

    const editedIndex = currentConversation.messages.findIndex(msg => msg.id === editingMessageId);
    if (editedIndex === -1) return;

    const messagesBeforeEdit = currentConversation.messages.slice(0, editedIndex);
    const editedMessage = { ...currentConversation.messages[editedIndex], content: editedContent };
    const updatedMessages = [...messagesBeforeEdit, editedMessage];

    const updatedConversation = { ...currentConversation, messages: updatedMessages };
    setCurrentConversation(updatedConversation);

    setConversationHistory(prevHistory =>
      prevHistory.map(conv =>
        conv.uuid === currentConversation.uuid ? updatedConversation : conv
      )
    );

    await saveConversationToDB(updatedConversation);

    setDisplayMessages(updatedMessages.map(msg => ({
      text: msg.content,
      isBot: msg.role === 'assistant',
      id: msg.id
    })));

    setEditingMessageId(null);

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
  }, [editingMessageId, currentConversation, handleStreamingResponse, saveConversationToDB]);

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