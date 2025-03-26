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
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Get text from request
      const { text, voiceId = "en-US-JennyNeural" } = req.body;

      if (!text) {
        res.status(httpStatus.BAD_REQUEST).json({
          success: false,
          message: "Text is required for TTS testing",
        });
        return;
      }

      const outputFileName = `tts-test-${Date.now()}.wav`;
      const serverBaseUrl = SpeechService.getServerBaseUrl();

      console.log("🎙️ Generating TTS for test...");
      const { audioUrl, audioData } = await SpeechService.speak({
        text,
        voiceId,
        outputFileName,
        baseUrl: serverBaseUrl,
      });

      // Return success with audioUrl
      res.status(httpStatus.OK).json({
        success: true,
        message: "TTS generated successfully",
        data: {
          audioUrl,
          voiceId,
        },
      });
    } catch (error) {
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
