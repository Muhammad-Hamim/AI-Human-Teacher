export type TLine = {
  chinese: string;
  pinyin: string;
  translation: string;
  explanation?: string;
};

export type TAudioResource = {
  url: string;
  contentType: string;
  duration: number;
};

export type TLineReading = TAudioResource & {
  lineId: number;
  text: string;
  pinyin: string;
};

export type TWordPronunciation = TAudioResource & {
  word: string;
  pinyin: string;
};

export type TPoemAudioResources = {
  fullReading: TAudioResource;
  lineReadings: TLineReading[];
  wordPronunciations: TWordPronunciation[];
};

export type TWord = {
  word: string;
  pinyin: string;
};

export type TSymbolismItem = {
  description: string;
  keywords: string[];
  culturalSignificance: string[];
  icon: string;
};

export type TImagerySymbolism = {
  [key: string]: TSymbolismItem;
};

export type TPoem = {
  _id?: string;
  title: string;
  lines: TLine[];
  author: string;
  dynasty: string;
  explanation: string;
  historicalCulturalContext: string;
  imageryAndSymbolism?: TImagerySymbolism;
  audioResources?: TPoemAudioResources;
  createdAt?: Date;
  updatedAt?: Date;
};
