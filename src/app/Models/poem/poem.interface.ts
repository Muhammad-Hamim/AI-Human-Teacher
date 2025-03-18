export type TLine = {
  chinese: string;
  pinyin: string;
  translation: string;
  explanation?: string;
};

export type TPoem = {
  _id?: string;
  title: string;
  lines: TLine[];
  author: string;
  dynasty: string;
  explanation: string;
  historicalCulturalContext: string;
  createdAt?: Date;
  updatedAt?: Date;
};
