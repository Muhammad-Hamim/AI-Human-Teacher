import { Request, Response } from "express";
import { PoemService } from "./poem.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Create a new poem
const createPoem = catchAsync(async (req: Request, res: Response) => {
  const poemData = req.body;
  const result = await PoemService.createPoem(poemData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Poem created successfully",
    data: result,
  });
});

// Get all poems
const getAllPoems = catchAsync(async (req: Request, res: Response) => {
  const result = await PoemService.getAllPoems();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Poems retrieved successfully",
    data: result,
  });
});

// Get a single poem
const getPoemById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await PoemService.getPoemById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Poem not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Poem retrieved successfully",
    data: result,
  });
});

// Update a poem
const updatePoem = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const poemData = req.body;
  const result = await PoemService.updatePoem(id, poemData);

  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "Poem not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
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
      statusCode: 404,
      success: false,
      message: "Poem not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Poem deleted successfully",
    data: result,
  });
});

export const PoemController = {
  createPoem,
  getAllPoems,
  getPoemById,
  updatePoem,
  deletePoem,
};
