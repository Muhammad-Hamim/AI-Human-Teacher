import { Request, Response } from "express";
import { ImagerySymbolismService } from "./imagery-symbolism.service";
import sendResponse from "../../utils/sendResponse";

// Get imagery and symbolism for a poem
const getImagerySymbolism = async (req: Request, res: Response) => {
  try {
    const { poemId } = req.params;

    const result = await ImagerySymbolismService.getImagerySymbolism(poemId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Imagery and symbolism retrieved successfully",
      data: {
        poem: {
          id: result.poem._id,
          title: result.poem.title,
          author: result.poem.author,
          dynasty: result.poem.dynasty,
        },
        imageryAndSymbolism: result.imageryAndSymbolism,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || "Failed to retrieve imagery and symbolism",
      data: { error: error },
    });
  }
};

// Generate imagery and symbolism for a poem
const generateImagerySymbolism = async (req: Request, res: Response) => {
  try {
    const { poemId } = req.params;

    const result =
      await ImagerySymbolismService.generateImagerySymbolism(poemId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Imagery and symbolism generated successfully",
      data: {
        poem: {
          id: result.poem._id,
          title: result.poem.title,
          author: result.poem.author,
          dynasty: result.poem.dynasty,
        },
        imageryAndSymbolism: result.imageryAndSymbolism,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || "Failed to generate imagery and symbolism",
      data: { error: error },
    });
  }
};

export const ImagerySymbolismController = {
  getImagerySymbolism,
  generateImagerySymbolism,
};
