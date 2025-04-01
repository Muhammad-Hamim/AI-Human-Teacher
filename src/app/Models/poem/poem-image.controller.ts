import { Request, Response } from "express";
import { PoemImageService } from "./poem-image.service";
import sendResponse from "../../utils/sendResponse";

// Generate an image for a poem
const generatePoemImage = async (req: Request, res: Response) => {
  try {
    const { poemId } = req.params;

    const result = await PoemImageService.generatePoemImage(poemId);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Poem image generated successfully",
      data: {
        poem: {
          id: result.poem._id,
          title: result.poem.title,
          author: result.poem.author,
          dynasty: result.poem.dynasty,
        },
        imageBase64: result.imageBase64,
        prompt: result.prompt,
      },
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 400,
      success: false,
      message: error.message || "Failed to generate poem image",
      data: { error: error },
    });
  }
};

export const PoemImageController = {
  generatePoemImage,
};
