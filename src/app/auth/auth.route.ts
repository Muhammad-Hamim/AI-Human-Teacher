import { Router } from "express";
import { AuthController } from "./auth.controller";
import validateRequest from "../middlewares/validateRequest";
import { AuthValidation } from "./auth.validation";
import auth from "../middlewares/auth";

const router = Router();

// Login user
router.post(
  "/login",
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser
);

// Refresh token
router.post(
  "/refresh-token",
  validateRequest(AuthValidation.refreshTokenValidationSchema),
  AuthController.refreshToken
);

// Change password
router.post(
  "/change-password",
  auth(),
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword
);

// Logout user
router.post("/logout", AuthController.logoutUser);

export const AuthRouter = router;
