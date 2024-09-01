import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Outlet } from "react-router-dom";
import ChatSidebar from "./components/ChatSidebar";
import ChatPage from "./components/ChatPage";
import ImageGenerator from "./components/ImagePage";
import AppContext from "./utils/Context";
import { ImageProvider } from "./utils/ImageContext";
import "./index.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <div className="flex w-screen relative">
        <ChatSidebar />
        <Outlet />
      </div>
    ),
    children: [
      {
        index: true,
        element: <ChatPage />,
      },
    ],
  },
  {
    path: "/image-generator",
    element: <ImageGenerator />,
  },
]);

function App() {
  return (
    <AppContext>
      <ImageProvider>
        <RouterProvider router={router} />
      </ImageProvider>
    </AppContext>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);