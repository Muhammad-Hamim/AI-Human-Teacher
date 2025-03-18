import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import catchAsync from "../utils/catchAsync";
import sendResponse from "../utils/sendResponse";
import config from "../config";

// Login user
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthService.loginUser(req.body);

  // Set refresh token in cookie
  const { refreshToken, ...others } = result;

  res.cookie("refreshToken", refreshToken, {
    secure: config.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged in successfully",
    data: others,
  });
});

// Refresh token
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;
  const result = await AuthService.refreshToken(refreshToken);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Access token refreshed successfully",
    data: result,
  });
});

// Change password
const changePassword = catchAsync(async (req: Request, res: Response) => {
  const user = req.user;
  const { oldPassword, newPassword } = req.body;

  await AuthService.changePassword(user?._id, oldPassword, newPassword);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Password changed successfully",
    data: null,
  });
});

// Logout user
const logoutUser = catchAsync(async (req: Request, res: Response) => {
  res.clearCookie("refreshToken");

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User logged out successfully",
    data: null,
  });
});

export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  logoutUser,
};
