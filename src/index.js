import React, { useContext } from "react";
import ReactDOM from "react-dom/client";
import Sidebar from "./components/Sidebar";
import ChatPage from "./components/ChatPage";
import AppContext, { ContextApp } from "./utils/Context";
import "./index.css";

function App() {
  const { Mobile, setMobile } = useContext(ContextApp);

  return (
    <div className="overflow-hidden">
      <div className="flex w-screen relative">
        <Sidebar />
        <ChatPage />
        {Mobile && (
          <div
            className="absolute inset-0 bg-black/40 z-40"
            onClick={() => setMobile(false)}
          />
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AppContext>
      <App />
    </AppContext>
  </React.StrictMode>
);