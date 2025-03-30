import {
  TPoem,
  TPoemAudioResources,
  TLineReading,
  TWordPronunciation,
} from "./poem.interface";
import { Poem } from "./poem.model";
import { PoemAudioService } from "../../AI/services/poem-audio.service";
import { createHash } from "crypto";

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

    // Generate or retrieve audio resources (will check DB first)
    const audioResources = await PoemAudioService.generatePoemAudio(
      poem.toObject()
    );

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

export const PoemService = {
  createPoem,
  getAllPoems,
  getPoemById,
  getPoemWithAudio,
  updatePoem,
  deletePoem,
};
