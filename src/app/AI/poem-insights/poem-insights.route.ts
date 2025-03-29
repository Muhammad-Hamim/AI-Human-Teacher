import { Router } from "express";
import { PoemInsightsController } from "./poem-insights.controller";

const router = Router();

// Route to generate real-time cultural insights for a poem
router.post("/generate", PoemInsightsController.generatePoemInsights);

export const PoemInsightsRoutes = router;
