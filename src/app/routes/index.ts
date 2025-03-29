import { Router } from "express";
import { AuthRouter } from "../auth/auth.route";
import { UserRouter } from "../Models/user/user.route";
import { PoemRouter } from "../Models/poem/poem.route";
import { ChatRouter } from "../Models/chat/chat.route";
import { MessageRouter } from "../Models/message/message.route";
import { ChatRoutes, PoemNarrationRoutes } from "../AI";
import VoiceRoutes from "../AI/voice/voice.route";
import TTSTestRoutes from "../AI/edgetts/tts-test.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/auth",
    route: AuthRouter,
  },
  {
    path: "/users",
    route: UserRouter,
  },
  {
    path: "/poems",
    route: PoemRouter,
  },
  {
    path: "/chats",
    route: ChatRouter,
  },
  {
    path: "/messages",
    route: MessageRouter,
  },
  {
    path: "/ai/chat",
    route: ChatRoutes,
  },
  {
    path: "/ai/voice",
    route: VoiceRoutes,
  },
  {
    path: "/ai/tts",
    route: TTSTestRoutes,
  },
  {
    path: "/ai/poem-narration",
    route: PoemNarrationRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
