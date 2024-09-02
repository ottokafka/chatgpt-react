import React, { useContext, useState, useEffect } from "react";
import { ContextApp } from "../utils/Context";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { FiMessageSquare, FiEdit2, FiCheck, FiX } from "react-icons/fi";
import { LuPanelLeftOpen } from "react-icons/lu";
import { HiOutlineMenuAlt2 } from "react-icons/hi";
import { RiSendPlane2Fill } from "react-icons/ri";

function ChatPage() {
  const {
    setShowSlide,
    showSlide,
    setMobile,
    Mobile,
    chatValue,
    setChatValue,
    handleSend,
    handleKeyPress,
    displayMessages,
    msgEnd,
    editingMessageId,
    startEditingMessage,
    cancelEditingMessage,
    saveEditedMessage,
  } = useContext(ContextApp);

  const [copiedStates, setCopiedStates] = useState({});
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    const timers = {};

    Object.keys(copiedStates).forEach(key => {
      if (copiedStates[key]) {
        timers[key] = setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 2000);
      }
    });

    return () => {
      Object.values(timers).forEach(timer => clearTimeout(timer));
    };
  }, [copiedStates]);

  useEffect(() => {
    if (editingMessageId) {
      const messageToEdit = displayMessages.find(msg => msg.id === editingMessageId);
      if (messageToEdit) {
        setEditedContent(messageToEdit.text);
      }
    } else {
      setEditedContent('');
    }
  }, [editingMessageId, displayMessages]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedStates(prev => ({ ...prev, [index]: true }));
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleEdit = (messageId) => {
    startEditingMessage(messageId);
  };

  const handleSaveEdit = () => {
    saveEditedMessage(editedContent);
  };

  return (
    <div
      className={
        showSlide
          ? "h-screen w-screen bg-gray-700 flex items-start justify-between flex-col p-2"
          : "h-screen w-full lg:w-[calc(100%-300px)] bg-gray-700 flex items-start justify-between flex-col p-2"
      }
    >
      <span
        className="rounded px-3 py-[9px] hidden lg:flex items-center justify-center cursor-pointer text-white m-1 hover:bg-gray-600 duration-200"
        title="Open sidebar"
        onClick={() => setShowSlide(!showSlide)}
      >
        {showSlide && <LuPanelLeftOpen />}
      </span>
      <span
        className="rounded px-3 py-[9px] lg:hidden flex items-center justify-center cursor-pointer text-white mt-0 mb-3 border border-gray-600"
        title="Open sidebar"
        onClick={() => setMobile(!Mobile)}
      >
        <HiOutlineMenuAlt2 fontSize={20} />
      </span>

      {/* Chat section */}
      <div className="w-full h-[85%] flex items-center justify-center overflow-hidden overflow-y-auto px-2 py-1 scroll">
        <div className="w-full lg:w-4/5 flex flex-col h-full items-start justify-start">
          {displayMessages.map((msg) => (
            <div
              key={msg.id}
              className={`w-full my-2 ${msg.isBot ? "bg-gray-800/80 rounded-md" : ""}`}
            >
              <span
                className={
                  msg.isBot
                    ? "flex items-start justify-center gap-2 lg:gap-5 p-3"
                    : "flex items-start justify-center gap-2 lg:gap-5 p-3"
                }
              >
                <img
                  src={msg.isBot ? "/assistant.png" : "/user.png"}
                  alt="user"
                  className="w-10 h-10 rounded object-cover"
                />
                <div className="text-white text-[15px] w-full overflow-x-auto">
                  {editingMessageId === msg.id ? (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full bg-gray-700 text-white rounded p-2"
                      rows="4"
                    />
                  ) : (
                    <ReactMarkdown
                      rehypePlugins={[rehypeHighlight]}
                      components={{
                        code({ node, inline, className, children, ...props }) {
                          const match = /language-(\w+)/.exec(className || '')
                          return !inline && match ? (
                            <pre className="rounded-md p-4 bg-gray-900">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          ) : (
                            <code className={className} {...props}>
                              {children}
                            </code>
                          )
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  )}
                </div>
              </span>
              <div className="flex justify-start px-3 pb-2 gap-2">
                <button
                  onClick={() => handleCopy(msg.text, msg.id)}
                  className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                  title={copiedStates[msg.id] ? "Copied!" : "Copy message"}
                >
                  <FiMessageSquare className="w-4 h-4" />
                  <span className="text-xs">{copiedStates[msg.id] ? "Copied" : "Copy"}</span>
                </button>
                {!msg.isBot && editingMessageId !== msg.id && (
                  <button
                    onClick={() => handleEdit(msg.id)}
                    className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center gap-1"
                    title="Edit message"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    <span className="text-xs">Edit</span>
                  </button>
                )}
                {editingMessageId === msg.id && (
                  <>
                    <button
                      onClick={handleSaveEdit}
                      className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-1"
                      title="Save edit"
                    >
                      <FiCheck className="w-4 h-4" />
                      <span className="text-xs">Save</span>
                    </button>
                    <button
                      onClick={cancelEditingMessage}
                      className="text-red-400 hover:text-red-300 transition-colors duration-200 flex items-center gap-1"
                      title="Cancel edit"
                    >
                      <FiX className="w-4 h-4" />
                      <span className="text-xs">Cancel</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
          <div ref={msgEnd} />
        </div>
      </div>

      {/* Chat input section */}
      <div className="w-full m-auto flex items-center justify-center flex-col gap-2 my-2">
        <span className="flex gap-2 items-center justify-center bg-gray-600 rounded-lg shadow-md w-[90%] lg:w-2/5 xl:w-1/2">
          <input
            type="text"
            placeholder="Send a message"
            className="h-full text-white bg-transparent px-3 py-4 w-full border-none outline-none text-base"
            value={chatValue}
            onChange={(e) => setChatValue(e.target.value)}
            onKeyUp={handleKeyPress}
          />
          <RiSendPlane2Fill
            title="send message"
            className={
              chatValue.length <= 0
                ? "text-gray-400 cursor-auto mx-3 text-xl"
                : "text-white cursor-pointer mx-3 text-3xl bg-green-500 p-1 rounded shadow-md"
            }
            onClick={handleSend}
          />
        </span>
        <p className="lg:text-xs text-gray-400 text-center text-[10px]">
          Alice Ai - Llama 3.1 8b
        </p>
      </div>
    </div>
  );
}

export default ChatPage;