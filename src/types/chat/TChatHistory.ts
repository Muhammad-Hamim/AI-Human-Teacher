export type TChatHistory = {
  _id: string;
  userId: string;
  user: string;
  title: string;
  lastMessageAt: Date;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};
