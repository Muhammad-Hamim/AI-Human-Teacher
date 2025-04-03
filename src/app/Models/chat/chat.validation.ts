import { z } from "zod";

const createChatValidationSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }),
    user: z.string({
      required_error: "User is required",
    }),
    title: z.string().optional(),
  }),
});

const updateChatValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    lastMessageAt: z.string().optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const ChatValidation = {
  createChatValidationSchema,
  updateChatValidationSchema,
};
