import { Router } from "express";
import { AIController } from "./ai.controller";

const router = Router();

// Generate a response from the AI
router.post("/generate", AIController.generateResponse);

// Generate a streaming response from the AI
router.post("/generate-stream", AIController.generateStreamingResponse);

// Process a message and get AI response
router.post(
  "/process-message",
  AIController.processMessage
);

export const AIRouter = router;
