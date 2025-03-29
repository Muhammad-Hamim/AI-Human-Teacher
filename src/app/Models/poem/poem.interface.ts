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

export type TPoem = {
  _id?: string;
  title: string;
  lines: TLine[];
  author: string;
  dynasty: string;
  explanation: string;
  historicalCulturalContext: string;
  audioResources?: TPoemAudioResources;
  createdAt?: Date;
  updatedAt?: Date;
};
