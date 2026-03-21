import { createHashRouter } from "react-router";
import Root from "./components/Root";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatMain from "./pages/ChatMain";
import AdminPanel from "./pages/AdminPanel";

export const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "chat", element: <ChatMain /> },
      { path: "admin", element: <AdminPanel /> },
    ],
  },
]);