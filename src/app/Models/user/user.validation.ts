import { z } from "zod";

const userPreferenceValidationSchema = z.object({
  theme: z.string().optional(),
  language: z.string().optional(),
});

const createUserValidationSchema = z.object({
  body: z.object({
    name: z.string({
      required_error: "Name is required",
    }),
    email: z
      .string({
        required_error: "Email is required",
      })
      .email("Invalid email format"),
    password: z
      .string({
        required_error: "Password is required",
      })
      .min(6, "Password must be at least 6 characters"),
    photo: z.string().optional(),
    role: z.enum(["user", "admin"]).default("user"),
    preference: userPreferenceValidationSchema.optional(),
  }),
});

const updateUserValidationSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .optional(),
    photo: z.string().optional(),
    role: z.enum(["user", "admin", "teacher"]).optional(),
    preference: userPreferenceValidationSchema.optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const UserValidation = {
  createUserValidationSchema,
  updateUserValidationSchema,
};
