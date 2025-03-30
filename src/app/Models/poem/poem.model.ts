import { Schema, model } from "mongoose";
import { TLine, TPoem, TPoemAudioResources } from "./poem.interface";

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

// Create schemas for audio resources
const audioResourceSchema = new Schema(
  {
    url: String,
    contentType: String,
    duration: Number,
  },
  { _id: false }
);

const lineReadingSchema = new Schema(
  {
    lineId: Number,
    text: String,
    pinyin: String,
    url: String,
    contentType: String,
    duration: Number,
  },
  { _id: false }
);

const wordPronunciationSchema = new Schema(
  {
    word: String,
    pinyin: String,
    url: String,
    contentType: String,
    duration: Number,
  },
  { _id: false }
);

const audioResourcesSchema = new Schema<TPoemAudioResources>(
  {
    fullReading: audioResourceSchema,
    lineReadings: [lineReadingSchema],
    wordPronunciations: [wordPronunciationSchema],
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
    audioResources: {
      type: audioResourcesSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Poem = model<TPoem>("Poem", poemSchema);
