import { Router } from "express";
import { AuthRouter } from "../auth/auth.route";
import { UserRouter } from "../Models/user/user.route";
import { PoemRouter } from "../Models/poem/poem.route";
import { ChatRouter } from "../Models/chat/chat.route";
import { MessageRouter } from "../Models/message/message.route";
import { VocabularyRouter } from "../Models/vocabulary/vocabulary.route";
import {
  ChatRoutes,
  PoemNarrationRoutes,
  PoemInsightsRoutes,
  QuizRoutes,
} from "../AI";
import VoiceRoutes from "../AI/voice/voice.route";
import TTSTestRoutes from "../AI/edgetts/tts-test.route";
import { aiAnalyzeRoutes } from "../AI/aiAnalyze";

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
    path: "/vocabulary",
    route: VocabularyRouter,
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
  {
    path: "/ai/poem-insights",
    route: PoemInsightsRoutes,
  },
  {
    path: "/ai/poem-analysis",
    route: aiAnalyzeRoutes,
  },
  {
    path: "/ai/quiz",
    route: QuizRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
