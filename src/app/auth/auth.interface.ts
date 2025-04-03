import { JwtPayload } from "jsonwebtoken";

export type TLoginUser = {
  email: string;
  password: string;
};

export type TLoginUserResponse = {
  accessToken: string;
  refreshToken?: string;
  user: {
    name: string;
    email: string;
    role: string;
    photo?: string;
  };
};

export type TRefreshTokenResponse = {
  accessToken: string;
};

export type TVerifiedJwtPayload = JwtPayload & {
  email: string;
  role: string;
};
