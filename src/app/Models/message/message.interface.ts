import { Types } from "mongoose";

export type TUser = {
  senderType: string;
  senderId: Types.ObjectId | null;
};

export type TContent = {
  contentType: string;
  content: string;
};

export type TMessage = {
  _id?: string;
  userId: Types.ObjectId;
  user: TUser;
  chatId: Types.ObjectId;
  message: TContent;
  isAIResponse: boolean;
  replyToMessageId?: Types.ObjectId;
  isDeleted: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};
