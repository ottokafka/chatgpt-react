import React, { useContext } from "react";
import { FiMessageSquare, FiEdit } from "react-icons/fi";
import { SlOptions } from "react-icons/sl";
import { MdClose } from "react-icons/md";
import { ContextApp } from "../utils/Context";

function Sidebar() {
  const {
    setShowSlide,
    showSlide,
    Mobile,
    setMobile,
    conversationHistory,
    currentConversation,
    startNewConversation,
    loadConversation
  } = useContext(ContextApp);

  const isMobileView = Mobile;

  const handleClose = () => {
    if (isMobileView) {
      setMobile(false);
    } else {
      setShowSlide(true); // Set to true to hide the sidebar on desktop
    }
  };

  const isVisible = (isMobileView && Mobile) || (!isMobileView && !showSlide);

  return (
    <div
      className={`
        h-screen bg-gray-900 w-[300px] border-r border-gray-500 
        ${isMobileView ? 'fixed left-0 top-0 z-50' : 'relative'} 
        ${isVisible ? 'flex' : 'hidden'}
        items-center justify-between p-2 text-white flex-col transition-all duration-300
      `}
    >
      <div className="flex items-start justify-between w-full">
        <span
          className="border border-gray-600 rounded w-[80%] py-2 text-xs flex gap-1 items-center justify-center cursor-pointer"
          onClick={startNewConversation}
        >
          <FiEdit fontSize={18} />
          Start New Chat
        </span>
        <span
          className="border border-gray-600 rounded px-3 py-[9px] flex items-center justify-center cursor-pointer"
          title="Close sidebar"
          onClick={handleClose}
        >
          <MdClose />
        </span>
      </div>
      {/* Conversation history */}
      <div className="h-[80%] w-full p-2 flex items-start justify-start flex-col overflow-hidden overflow-y-auto text-sm scroll my-2">
        {conversationHistory.map((conversation) => (
          <span
            key={conversation.uuid}
            className={`rounded w-full py-3 px-2 text-xs my-2 flex gap-1 items-center justify-between cursor-pointer hover:bg-gray-800 transition-all duration-300 overflow-hidden truncate whitespace-nowrap ${currentConversation && currentConversation.uuid === conversation.uuid ? 'bg-gray-700' : ''
              }`}
            onClick={() => loadConversation(conversation.uuid)}
          >
            <span className="flex gap-2 items-center justify-center text-base">
              <FiMessageSquare />
              <span className="text-sm">{conversation.name}</span>
            </span>
          </span>
        ))}
      </div>
      {/* bottom section  */}
      <div className="w-full border-t border-gray-600 flex flex-col gap-2 items-center justify-center p-2">
        <span className="rounded w-full py-2 px-2 text-xs flex gap-1 items-center justify-between cursor-pointer hover:bg-gray-800 transition-all duration-300">
          <span className="flex gap-2 items-center justify-center text-sm font-bold">
            <img
              src="/user.png"
              alt="user"
              className="w-8 h-8 object-cover rounded-sm"
            />
            User
          </span>
          <span className="rounded-md px-1.5 py-0.5 text-xs font-medium uppercase text-gray-500">
            <SlOptions />
          </span>
        </span>
      </div>
    </div>
  );
}

export default Sidebar;