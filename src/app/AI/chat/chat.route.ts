import express from 'express';
import ChatController from './chat.controller';

const router = express.Router();

/**
 * @route POST /api/v1/ai/chat/process-message
 * @desc Process a message and generate AI response
 * @access Private
 */
router.post(
  '/process-message',
  ChatController.processMessage
);

/**
 * @route POST /api/v1/ai/chat/stream-message
 * @desc Stream an AI response for real-time display
 * @access Private
 */
router.post(
  '/stream-message',
  ChatController.streamMessage
);

/**
 * @route GET /api/v1/ai/chat/tts-voices
 * @desc Get all available TTS voices
 * @access Private
 */
router.get(
  '/tts-voices',
  ChatController.getTTSVoices
);

/**
 * @route GET /api/v1/ai/chat/stream-audio/:messageId
 * @desc Stream an audio file for a given message
 * @access Private
 */
router.get(
  '/stream-audio/:messageId',
  ChatController.streamAudioFile
);

export const ChatRoutes = router;
export default router;

