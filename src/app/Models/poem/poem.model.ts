import { Schema, model } from "mongoose";
import { TLine, TPoem } from "./poem.interface";

const lineSchema = new Schema<TLine>(
  {
    chinese: {
      type: String,
      required: true,
    },
    pinyin: {
      type: String,
      required: true,
    },
    translation: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
    },
  },
  { _id: false }
);

const poemSchema = new Schema<TPoem>(
  {
    title: {
      type: String,
      required: true,
    },
    lines: {
      type: [lineSchema],
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    dynasty: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    historicalCulturalContext: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Poem = model<TPoem>("Poem", poemSchema);
