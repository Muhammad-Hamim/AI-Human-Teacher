import { TChat } from "./chat.interface";
import { Chat } from "./chat.model";

// Create a new chat
const createChat = async (payload: TChat): Promise<TChat> => {
  const result = await Chat.create(payload);
  return result;
};

// Get all chats for a user
const getChatsForUser = async (userId: string): Promise<TChat[]> => {

  const result = await Chat.find({ userId, isDeleted: { $ne: true } }).sort({
    updatedAt: -1,
  });
  return result;
};

// Get a chat by ID
const getChatById = async (id: string): Promise<TChat | null> => {
  const result = await Chat.findById(id);
  return result;
};

// Update a chat
const updateChat = async (
  id: string,
  payload: Partial<TChat>
): Promise<TChat | null> => {
  const result = await Chat.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

// Delete a chat (soft delete)
const deleteChat = async (id: string): Promise<TChat | null> => {
  const result = await Chat.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

// Update last message info
const updateLastMessage = async (
  chatId: string,
  snippet: string
): Promise<TChat | null> => {
  const result = await Chat.findByIdAndUpdate(
    chatId,
    {
      lastMessageSnippet: snippet,
      lastMessageAt: new Date(),
    },
    { new: true }
  );
  return result;
};

export const ChatService = {
  createChat,
  getChatsForUser,
  getChatById,
  updateChat,
  deleteChat,
  updateLastMessage,
};
