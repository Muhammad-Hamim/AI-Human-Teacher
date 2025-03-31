import { Schema, model } from "mongoose";
import { TMeaning, TExample, TVocabulary } from "./vocabulary.interface";

const meaningSchema = new Schema<TMeaning>(
  {
    meaning: {
      type: String,
      required: true,
    },
    partOfSpeech: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const exampleSchema = new Schema<TExample>(
  {
    sentence: {
      type: String,
      required: true,
    },
    translation: {
      type: String,
      required: true,
    },
    pinyin: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const vocabularySchema = new Schema<TVocabulary>(
  {
    word: {
      type: String,
      required: true,
      unique: true, // Ensure words are unique
    },
    pinyin: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      required: true,
    },
    translation: {
      type: [meaningSchema],
      required: true,
    },
    example: {
      type: [exampleSchema],
      required: true,
    },
    poemIds: {
      type: [String],
      default: [],
    },
    version: {
      type: String,
      required: true,
      default: "1.0",
    },
  },
  {
    timestamps: true,
  }
);

export const Vocabulary = model<TVocabulary>("Vocabulary", vocabularySchema);
