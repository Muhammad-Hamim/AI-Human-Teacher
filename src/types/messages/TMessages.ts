export type TUser = {
  senderType: string;
  senderId: string | null;
};

export type TContent = {
  contentType: string;
  content: string;
};

export type TAudio = {
  url: string;
  voiceId?: string;
  data?: string;
  contentType?: string;
};

export type TMessage = {
  _id?: string;
  userId: string;
  user: TUser;
  chatId: string;
  message: TContent;
  isAIResponse: boolean;
  replyToMessageId?: string;
  isDeleted: boolean;
  isStreaming?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  audio?: TAudio;
  content?: string;
};
