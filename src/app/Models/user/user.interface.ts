import { Model } from "mongoose";

export type TUserPreference = {
  theme?: string;
  language?: string;
};

export type TUser = {
  _id?: string;
  name: string;
  email: string;
  password: string;
  photo?: string;
  role: string;
  preference?: TUserPreference;
  passwordChangedAt?: Date;
  lastLogin?: Date;
  isDeleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
//static method

export interface UserModel extends Model<TUser> {
  // isUserExists(email: string): Promise<TUser | null>;
  // isUserStatusActive(email: string): Promise<boolean>;
  // isUserDeleted(email: string): Promise<boolean>;
  // isPasswordMatched(
  //   plainTextPass: string,
  //   hashedPass: string
  // ): Promise<boolean>;
  // isUserExistsByEmail(email: string): Promise<TUser | null>;
  isJWTIssuedBeforePasswordChanged(
    passwordChangedTimeStamp: Date,
    jwtIssuedTimeStamp: number
  ): boolean;
}
