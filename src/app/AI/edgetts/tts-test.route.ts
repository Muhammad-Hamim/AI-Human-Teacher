import express from "express";
import { TTSTestController } from "./tts-test.controller";

const router = express.Router();

// Route to test TTS functionality
router.post("/test-tts", TTSTestController.testTTS);

// Route to get available voices
router.get("/voices", TTSTestController.getVoices);

export default router;
