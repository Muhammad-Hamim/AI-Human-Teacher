import { Schema, model } from "mongoose";
import { TUser, TUserPreference, UserModel } from "./user.interface";
import bcrypt from "bcrypt";
import config from "../../config";

const userPreferenceSchema = new Schema<TUserPreference>(
  {
    theme: {
      type: String,
      default: "light",
    },
    language: {
      type: String,
      default: "en",
    },
  },
  { _id: false }
);

const userSchema = new Schema<TUser>(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    photo: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    preference: {
      type: userPreferenceSchema,
      default: {},
    },
    passwordChangedAt: {
      type: Date,
    },
    lastLogin: {
      type: Date,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    // Add relationships with Chat and Message if needed
    // Example: chats: [{ type: Schema.Types.ObjectId, ref: 'Chat' }],
    // messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }],
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified("password")) return next();

  // Hash password with bcrypt
  this.password = await bcrypt.hash(
    this.password,
    Number(config.bcrypt_salt_rounds)
  );
  next();
});
// After creating or updating a user, remove the password field from the returned document
userSchema.post("save", function (doc, next) {
  doc.password = "";
  next();
});
// Middleware to ensure password is not returned during aggregation
userSchema.pre("aggregate", function (next) {
  const pipeline = this.pipeline();
  pipeline.unshift({ $unset: "password" }); // Remove the password field from the aggregation results
  next();
});

//User static method
userSchema.statics.isJWTIssuedBeforePasswordChanged = function (
  passwordChangedTimeStamp: Date,
  jwtIssuedTimeStamp: number
) {
  const passwordChangedTime =
    new Date(passwordChangedTimeStamp).getTime() / 1000;
  return passwordChangedTime > jwtIssuedTimeStamp;
};

export const User = model<TUser, UserModel>("User", userSchema);
