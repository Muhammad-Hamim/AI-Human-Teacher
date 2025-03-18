import { Request, Response } from "express";
import { UserService } from "./user.service";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";

// Create a new user
const createUser = catchAsync(async (req: Request, res: Response) => {
  const userData = req.body;
  const result = await UserService.createUser(userData);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "User created successfully",
    data: result,
  });
});

// Get all users
const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const result = await UserService.getAllUsers();

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

// Get a single user
const getUserById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.getUserById(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});

// Update a user
const updateUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userData = req.body;
  const result = await UserService.updateUser(id, userData);

  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User updated successfully",
    data: result,
  });
});

// Delete a user
const deleteUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await UserService.deleteUser(id);

  if (!result) {
    return sendResponse(res, {
      statusCode: 404,
      success: false,
      message: "User not found",
      data: null,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully",
    data: result,
  });
});

export const UserController = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
