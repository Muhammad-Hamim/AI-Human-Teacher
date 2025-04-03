import { Request, Response } from "express";
import { VocabularyService } from "./vocabulary.service";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";

// Get all vocabulary
const getAllVocabulary = catchAsync(async (req: Request, res: Response) => {
  const result = await VocabularyService.getAllVocabulary();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vocabulary retrieved successfully",
    data: result,
  });
});

// Get vocabulary by word
const getVocabularyByWord = catchAsync(async (req: Request, res: Response) => {
  const { word } = req.params;
  const result = await VocabularyService.getVocabularyByWord(word);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Vocabulary not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Vocabulary retrieved successfully",
    data: result,
  });
});

// Get vocabulary for a poem
const getPoemVocabulary = catchAsync(async (req: Request, res: Response) => {
  const { poemId } = req.params;

  // Check if we should process/generate new vocabulary
  const shouldProcess = req.query.process === "true";

  let result;
  if (shouldProcess) {
    // Process vocabulary (extract, check existing, generate new)
    result = await VocabularyService.processVocabularyForPoem(poemId);
  } else {
    // Just retrieve existing vocabulary for this poem
    result = await VocabularyService.getVocabularyByPoemId(poemId);
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poem vocabulary retrieved successfully",
    data: {
      poemId,
      vocabulary: result,
    },
  });
});

export const VocabularyController = {
  getAllVocabulary,
  getVocabularyByWord,
  getPoemVocabulary,
};
