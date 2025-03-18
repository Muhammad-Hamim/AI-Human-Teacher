import config from "../config";
import { User } from "../Models/user/user.model";
import { TVerifiedJwtPayload } from "../auth/auth.interface";
import catchAsync from "../utils/catchAsync";
import httpStatus from "http-status";
import AppError from "../errors/AppError";
import { verifyToken } from "../auth/auth.utils";

const auth = (...requiredRoles: string[]) => {
  return catchAsync(async (req, res, next) => {
    try {
      // Get authorization token
      const token = req.headers.authorization;

      if (!token) {
        throw new AppError(httpStatus.UNAUTHORIZED, "Unauthorized User");
      }

      // Verify token
      const verifiedUser = verifyToken(
        token,
        config.JWT_ACCESS_SECRET as string
      ) as TVerifiedJwtPayload;

      // Check if user exists
      const user = await User.findOne({
        email: verifiedUser.email,
        isDeleted: { $ne: true },
      });

      if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
      }

      // Check if user has required role
      if (requiredRoles.length && !requiredRoles.includes(verifiedUser.role)) {
        throw new AppError(
          httpStatus.NOT_FOUND,
          "You are not authorized to access this resource"
        );
      }
      // compare password changed time and JWT issued time
      if (
        user.passwordChangedAt &&
        User.isJWTIssuedBeforePasswordChanged(
          user.passwordChangedAt,
          verifiedUser.iat as number
        )
      ) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "you are not authorized!! log in again"
        );
      }

      // Set user in request
      req.user = verifiedUser;
      next();
    } catch (error) {
      next(error);
    }
  });
};

export default auth;
