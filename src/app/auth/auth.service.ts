import jwt, { Secret, SignOptions } from "jsonwebtoken";
import bcrypt from "bcrypt";
import config from "../config";
import { User } from "../Models/user/user.model";
import {
  TLoginUser,
  TLoginUserResponse,
  TRefreshTokenResponse,
  TVerifiedJwtPayload,
} from "./auth.interface";
import { generateToken } from "./auth.utils";

// Login user
const loginUser = async (payload: TLoginUser): Promise<TLoginUserResponse> => {
  // Check if user exists
  const user = await User.findOne({
    email: payload.email,
    isDeleted: { $ne: true },
  }).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  // Check if password matches
  const isPasswordMatch = await bcrypt.compare(payload.password, user.password);

  if (!isPasswordMatch) {
    throw new Error("Invalid credentials");
  }

  // Create access token
  const jwtPayload: TVerifiedJwtPayload = {
    email: user?.email,
    role: user?.role,
  };
  const accessToken = generateToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET as string,
    config.JWT_ACCESS_EXPIRES_IN as string
  );

  // Create refresh token
  const refreshToken = generateToken(
    jwtPayload,
    config.JWT_ACCESS_SECRET as string,
    config.JWT_ACCESS_EXPIRES_IN as string
  );

  // Update user's last login
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

  return {
    accessToken,
    refreshToken,
    user: {
      name: user.name,
      email: user.email,
      role: user.role,
      photo: user.photo,
    },
  };
};

// Refresh token
const refreshToken = async (token: string): Promise<TRefreshTokenResponse> => {
  // Verify refresh token
  let decodedData;
  try {
    decodedData = jwt.verify(
      token,
      config.JWT_REFRESH_SECRET as Secret
    ) as TVerifiedJwtPayload;
  } catch (error) {
    throw new Error("Invalid refresh token");
  }

  // Check if user exists
  const user = await User.findOne({
    _id: decodedData._id,
    isDeleted: { $ne: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Create new access token
  const accessToken = jwt.sign(
    {
      _id: user._id,
      email: user.email,
      role: user.role,
    },
    config.JWT_ACCESS_SECRET as Secret,
    {
      expiresIn: config.JWT_ACCESS_EXPIRES_IN,
    } as SignOptions
  );

  return {
    accessToken,
  };
};

// Change password
const changePassword = async (
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  // Check if user exists
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new Error("User not found");
  }

  // Check if old password matches
  const isPasswordMatch = await bcrypt.compare(oldPassword, user.password);

  if (!isPasswordMatch) {
    throw new Error("Old password is incorrect");
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(
    newPassword,
    Number(config.bcrypt_salt_rounds)
  );

  // Update password
  await User.findByIdAndUpdate(userId, {
    password: hashedPassword,
    passwordChangedAt: new Date(),
  });
};

export const AuthService = {
  loginUser,
  refreshToken,
  changePassword,
};
