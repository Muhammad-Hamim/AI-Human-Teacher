import { z } from "zod";

const lineValidationSchema = z.object({
  Chinese: z.string({
    required_error: "Chinese text is required",
  }),
  Pinyin: z.string({
    required_error: "Pinyin is required",
  }),
  translation: z.string({
    required_error: "Translation is required",
  }),
  explanation: z.string().optional(),
});

const createPoemValidationSchema = z.object({
  body: z.object({
    title: z.string({
      required_error: "Title is required",
    }),
    lines: z.array(lineValidationSchema, {
      required_error: "Lines are required",
    }),
    author: z.string({
      required_error: "Author is required",
    }),
    dynasty: z.string({
      required_error: "Dynasty is required",
    }),
    explanation: z.string({
      required_error: "Explanation is required",
    }),
    historicalCulturalContext: z.string({
      required_error: "Historical cultural context is required",
    }),
  }),
});

const updatePoemValidationSchema = z.object({
  body: z.object({
    title: z.string().optional(),
    lines: z.array(lineValidationSchema).optional(),
    author: z.string().optional(),
    dynasty: z.string().optional(),
    explanation: z.string().optional(),
    historicalCulturalContext: z.string().optional(),
  }),
});

export const PoemValidation = {
  createPoemValidationSchema,
  updatePoemValidationSchema,
};
