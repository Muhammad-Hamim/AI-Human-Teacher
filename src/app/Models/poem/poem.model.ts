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

/**
 * when user will ask for an individual poem, it should provide the vocabulary in the following format:
 *  {
        "word": "床",
        "pinyin": "chuáng",
        "translation": [
        {
        "meaning": "bed",
        "partOfSpeech": "noun"
        },
        {
            "meaning": "sleep",
            "partOfSpeech": "verb"
        }
      ],
        "example": [
            {
                "sentence": "这张床很舒服。",
                "translation": "This bed is comfortable.",
                "pinyin": "zhè zhāng chuáng hěn shū fú. "
            },
            {
                "sentence": "我每天晚上都睡在这张床上。",
                "translation": "I sleep on this bed every night.",
                "pinyin": "wǒ měi tiān wǎn shàng dōu shuì zài zhè zhāng chuáng shàng."
            }
        ]
      },
 * 
 */
