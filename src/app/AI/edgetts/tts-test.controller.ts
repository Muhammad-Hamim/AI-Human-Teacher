import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import SpeechService from "../services/speech.service";
import fs from "fs-extra";
import path from "path";

/**
 * Controller to test TTS functionality
 */
const testTTS = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { text, voiceId = "en-US-JennyNeural" } = req.body;

    if (!text) {
      return res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: "Text is required",
      });
    }

    try {
      console.log(
        "Received TTS test request with text:",
        text.substring(0, 100) + (text.length > 100 ? "..." : "")
      );

      // Generate a unique file name for this test
      const timestamp = Date.now();
      const outputFileName = `test-tts-${timestamp}.wav`;

      // Generate TTS - now returns both URL and audio data
      const { audioUrl, audioData } = await SpeechService.speak({
        text,
        voiceId,
        outputFileName,
      });

      // Return response with audio data
      res.status(httpStatus.OK).json({
        success: true,
        message: "TTS generated successfully",
        data: {
          text,
          audioUrl,
          audioData,
          voiceId,
          contentType: "audio/wav",
        },
      });
    } catch (error) {
      console.error("Error in testTTS:", error);
      next(error);
    }
  }
);

/**
 * Controller to get available voices
 */
const getVoices = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const voices = await SpeechService.getVoices();

      res.status(httpStatus.OK).json({
        success: true,
        message: "Voices retrieved successfully",
        data: voices,
      });
    } catch (error) {
      next(error);
    }
  }
);

export const TTSTestController = {
  testTTS,
  getVoices,
};
