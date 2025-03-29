import {
  TPoem,
  TPoemAudioResources,
  TLineReading,
  TWordPronunciation,
} from "./poem.interface";
import { Poem } from "./poem.model";
import { PoemAudioService } from "../../AI/services/poem-audio.service";

// Create a new poem
const createPoem = async (poemData: TPoem): Promise<TPoem> => {
  const result = await Poem.create(poemData);
  return result;
};

// Get all poems
const getAllPoems = async (): Promise<TPoem[]> => {
  const result = await Poem.find();
  return result;
};

// Get a single poem by ID
const getPoemById = async (id: string): Promise<TPoem | null> => {
  const result = await Poem.findById(id);
  return result;
};

// Get a single poem by ID with audio resources
const getPoemWithAudio = async (
  id: string
): Promise<{ poem: any; audioResources: TPoemAudioResources } | null> => {
  try {
    // Find the poem
    const poem = await Poem.findById(id);

    if (!poem) {
      return null;
    }

    // Check if audio already exists for this poem
    const audioExists = await PoemAudioService.checkAudioExists(id);

    let audioResources;
    if (audioExists) {
      // Just fetch existing audio resources info
      console.log(`Audio resources already exist for poem ${id}`);
      // Perform a search in cloudinary to get existing resources
      // This is a simplified version - in production you might want to store these URLs in a database
      const searchPrefix = `poem_${id}`;
      audioResources = await fetchExistingAudioResources(
        poem.toObject(),
        searchPrefix
      );
    } else {
      // Generate audio resources
      console.log(`Generating audio resources for poem ${id}`);
      audioResources = await PoemAudioService.generatePoemAudio(
        poem.toObject()
      );
    }

    return {
      poem,
      audioResources,
    };
  } catch (error) {
    console.error(`Error getting poem with audio: ${error}`);
    throw error;
  }
};

// Update a poem
const updatePoem = async (
  id: string,
  poemData: Partial<TPoem>
): Promise<TPoem | null> => {
  const result = await Poem.findByIdAndUpdate(id, poemData, {
    new: true,
    runValidators: true,
  });
  return result;
};

// Delete a poem
const deletePoem = async (id: string): Promise<TPoem | null> => {
  const result = await Poem.findByIdAndDelete(id);
  return result;
};

// Helper function to fetch existing audio resources from Cloudinary
const fetchExistingAudioResources = async (
  poem: TPoem,
  searchPrefix: string
): Promise<TPoemAudioResources> => {
  try {
    const poemId = poem._id?.toString() || "";

    // Reconstruct the audio resources based on known naming patterns
    const fullReadingUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_COULD_NAME}/poem_audio/poem_${poemId}_full`;

    const lineReadings: TLineReading[] = poem.lines.map((line, i) => {
      return {
        lineId: i + 1,
        text: line.chinese,
        pinyin: line.pinyin,
        url: `https://res.cloudinary.com/${process.env.CLOUDINARY_COULD_NAME}/poem_audio/poem_${poemId}_line_${i + 1}`,
        contentType: "audio/wav",
        duration: 3.0, // Approximate duration
      };
    });

    // For word pronunciations, we can only include what we've processed before
    // This is a simplification - in production, you might want to store these in a database
    const wordPronunciations: TWordPronunciation[] = [];
    const processedWords = new Set<string>();

    for (const line of poem.lines) {
      const characters = line.chinese.split("");
      const pinyinParts = line.pinyin.split(" ");

      for (let i = 0; i < characters.length && i < pinyinParts.length; i++) {
        const word = characters[i];
        if (processedWords.has(word)) continue;
        processedWords.add(word);

        const hash = require("crypto")
          .createHash("md5")
          .update(word)
          .digest("hex")
          .substring(0, 8);
        wordPronunciations.push({
          word,
          pinyin: pinyinParts[i] || "",
          url: `https://res.cloudinary.com/${process.env.CLOUDINARY_COULD_NAME}/poem_audio/poem_word_${hash}`,
          contentType: "audio/wav",
          duration: 0.8, // Approximate duration for a single character
        });
      }
    }

    return {
      fullReading: {
        url: fullReadingUrl,
        contentType: "audio/wav",
        duration: 30.0, // Approximate duration
      },
      lineReadings,
      wordPronunciations,
    };
  } catch (error) {
    console.error("Error fetching existing audio resources:", error);
    throw error;
  }
};

export const PoemService = {
  createPoem,
  getAllPoems,
  getPoemById,
  getPoemWithAudio,
  updatePoem,
  deletePoem,
};
