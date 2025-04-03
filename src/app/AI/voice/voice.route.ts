import express from "express";
import VoiceController from "./voice.controller";

const router = express.Router();

/**
 * @route GET /api/v1/ai/voice/status
 * @desc Get voice service status
 * @access Public
 */
router.get("/status", VoiceController.getVoiceStatus);

/**
 * @route POST /api/v1/ai/voice/process-transcript
 * @desc Process a voice transcript and generate AI response
 * @access Public
 */
router.post("/process-transcript", VoiceController.processVoiceTranscript);

/**
 * @route GET /api/v1/ai/voice/available-voices
 * @desc Get available voices for speech synthesis
 * @access Public
 */
router.get("/available-voices", VoiceController.getAvailableVoices);

export const VoiceRoutes = router;
export default VoiceRoutes;
