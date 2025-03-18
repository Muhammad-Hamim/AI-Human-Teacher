
export type TChat = {
  // userId: Types.ObjectId;
  userId: string;
  user: string;
  title: string;
  lastMessageAt?: Date;
  isDeleted?: boolean;
};
