export type TChatHistory = {
  id: string;
  userId: string;
  user: string;
  title: string;
  lastMessage: string;
  lastMessageAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
