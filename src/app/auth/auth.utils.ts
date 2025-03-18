import { TVerifiedJwtPayload } from "./auth.interface";
import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";

export const generateToken = (
  jwtPayload: TVerifiedJwtPayload,
  secret: string,
  expiresIn: string
) => {
  const token = jwt.sign(
    jwtPayload,
    secret as Secret,
    { expiresIn } as SignOptions
  );
  return token;
};

export const verifyToken = (token: string, secret: string) => {
  const decoded = jwt.verify(token, secret as Secret) as JwtPayload;
  return decoded;
};
