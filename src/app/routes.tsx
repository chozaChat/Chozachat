import { createHashRouter } from "react-router";
import Root from "./components/Root";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatMain from "./pages/ChatMain";
import AdminPanel from "./pages/AdminPanel";
import InviteUser from "./pages/InviteUser";
import InviteGroup from "./pages/InviteGroup";
import InviteChannel from "./pages/InviteChannel";
import NotFound from "./pages/NotFound";

export const router = createHashRouter([
  {
    path: "/",
    element: <Root />,
    children: [
      { index: true, element: <Login /> },
      { path: "signup", element: <Signup /> },
      { path: "chat", element: <ChatMain /> },
      { path: "admin", element: <AdminPanel /> },
      { path: "u/:username", element: <InviteUser /> },
      { path: "g/:groupname", element: <InviteGroup /> },
      { path: "c/:channelname", element: <InviteChannel /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);