export type TSuggestion = {
  id: string;
  text: string;
};
export type TMessage = {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
};

export const suggestions = [
  {
    id: 1,
    text: "Li bai",
  },
  {
    id: 2,
    text: "Li bai",
  },
  {
    id: 3,
    text: "Li bai",
  },
];
export const message = [
  {
    id: 1,
    content: "Hello world",
    isUser: true,
    timestamp: new Date(),
  },
];
