import { z } from "zod";

const userValidationSchema = z.object({
  senderType: z.string({
    required_error: "Sender type is required",
  }),
  senderId: z.string().nullable(),
});

const contentValidationSchema = z.object({
  contentType: z.string({
    required_error: "Content type is required",
  }),
  content: z.string({
    required_error: "Content is required",
  }),
});

const createMessageValidationSchema = z.object({
  body: z.object({
    userId: z.string({
      required_error: "User ID is required",
    }),
    user: userValidationSchema,
    chatId: z.string({
      required_error: "Chat ID is required",
    }),
    message: contentValidationSchema,
    isAIResponse: z.boolean().default(false),
    replyToMessageId: z.string().optional(),
    isDeleted: z.boolean().default(false),
  }),
});

const updateMessageValidationSchema = z.object({
  body: z.object({
    message: contentValidationSchema.optional(),
    isDeleted: z.boolean().optional(),
  }),
});

export const MessageValidation = {
  createMessageValidationSchema,
  updateMessageValidationSchema,
};
