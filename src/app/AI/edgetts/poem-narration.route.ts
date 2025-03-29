import { Router } from "express";
import { PoemNarrationController } from "./poem-narration.controller";

const router = Router();

// Route to generate poem storytelling narration
router.post("/generate", PoemNarrationController.generatePoemNarration);

export const PoemNarrationRoutes = router;
