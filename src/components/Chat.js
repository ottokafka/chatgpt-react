import React, { useContext, useState, useEffect } from "react";
import { ContextApp } from "../utils/Context";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { FiMessageSquare, FiEdit2, FiCheck, FiX } from "react-icons/fi";

function Chat() {
  const {
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

  const handleSave = () => {
    saveEditedMessage(editedContent);
  };

  return (
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
                    onClick={handleSave}
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
  );
}

export default Chat;