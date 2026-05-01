import { createHashRouter } from "react-router";
import Root from "./components/Root";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ChatMain from "./pages/ChatMain";
import AdminPanel from "./pages/AdminPanel";
import InviteUser from "./pages/InviteUser";
import InviteGroup from "./pages/InviteGroup";
import InviteChannel from "./pages/InviteChannel";
import CustomLanguageEditor from "./pages/CustomLanguageEditor";
import SetLanguage from "./pages/SetLanguage";
import ViewStickerPack from "./pages/ViewStickerPack";
import StickerPack from "./pages/StickerPack";
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
      { path: "lang", element: <CustomLanguageEditor /> },
      { path: "lang/:languagename", element: <CustomLanguageEditor /> },
      { path: "setlang/:name", element: <SetLanguage /> },
      { path: "u/:username", element: <InviteUser /> },
      { path: "g/:groupname", element: <InviteGroup /> },
      { path: "c/:channelname", element: <InviteChannel /> },
      { path: "stickers/:packName/manage", element: <StickerPack /> },
      { path: "stickers/:packName", element: <ViewStickerPack /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);