import { Request, Response } from "express";
import { PoemService } from "./poem.service";
import catchAsync from "../../utils/catchAsync";
import httpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";

// Create a new poem
const createPoem = catchAsync(async (req: Request, res: Response) => {
  const { ...poemData } = req.body;

  const result = await PoemService.createPoem(poemData);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Poem created successfully",
    data: result,
  });
});

// Get all poems
const getAllPoems = catchAsync(async (req: Request, res: Response) => {
  const result = await PoemService.getAllPoems();

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poems retrieved successfully",
    data: result,
  });
});

// Get a single poem
const getPoemById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const audioIncluded = req.query.audioIncluded === "true";

  if (audioIncluded) {
    // Get poem with audio resources
    const result = await PoemService.getPoemWithAudio(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Poem not found",
        data: null,
      });
    }

    // The poem is already a Mongoose document, and audioResources is a plain object
    // No need for extra conversion
    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Poem with audio retrieved successfully",
      data: {
        ...result.poem.toObject(),
        audioResources: result.audioResources,
      },
    });
  } else {
    // Get poem without audio resources
    const result = await PoemService.getPoemById(id);

    if (!result) {
      return sendResponse(res, {
        statusCode: httpStatus.NOT_FOUND,
        success: false,
        message: "Poem not found",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Poem retrieved successfully",
      data: result,
    });
  }
});

// Update a poem
const updatePoem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { ...poemData } = req.body;

  const result = await PoemService.updatePoem(id, poemData);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Poem not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poem updated successfully",
    data: result,
  });
});

// Delete a poem
const deletePoem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await PoemService.deletePoem(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: httpStatus.NOT_FOUND,
      success: false,
      message: "Poem not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Poem deleted successfully",
    data: result,
  });
});

export const PoemController = {
  getAllPoems,
  getPoemById,
  createPoem,
  updatePoem,
  deletePoem,
};
