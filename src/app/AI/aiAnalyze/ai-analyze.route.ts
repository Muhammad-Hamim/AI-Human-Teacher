import { Router } from "express";
import { analyze } from "./ai-analyze.controller";

const router = Router();

router.get("/generate/:poemId", analyze);

export const aiAnalyzeRoutes = router;
