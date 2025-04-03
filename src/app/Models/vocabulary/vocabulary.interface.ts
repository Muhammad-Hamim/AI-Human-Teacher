export type TMeaning = {
  meaning: string;
  partOfSpeech: string;
};

export type TExample = {
  sentence: string;
  translation: string;
  pinyin: string;
};

export type TVocabulary = {
  _id?: string;
  word: string;
  pinyin: string;
  level: string; // HSK level
  translation: TMeaning[];
  example: TExample[];
  poemIds: string[]; // References to poems using this word
  version: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type TVocabularyResponse = {
  poemId: string;
  vocabulary: TVocabulary[];
};
