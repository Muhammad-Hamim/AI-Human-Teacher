import { TPoem } from "./poem.interface";
import { Poem } from "./poem.model";

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
  updatePoem,
  deletePoem,
};
