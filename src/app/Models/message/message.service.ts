import { TMessage } from "./message.interface";
import { Message } from "./message.model";
import { ChatService } from "../chat/chat.service";

// Create a new message
const createMessage = async (payload: TMessage): Promise<TMessage> => {
  // Create the message
  const result = await Message.create(payload);

  // Update the last message in the chat
  if (result.message.contentType === "text") {
    await ChatService.updateLastMessage(
      payload.chatId.toString(),
      result.message.content.substring(0, 50) // First 50 chars as snippet
    ); 
  } else {
    await ChatService.updateLastMessage(
      payload.chatId.toString(),
      `[${result.message.contentType}]` // Indicate content type if not text
    );
  }

  return result;
};

// Get all messages for a chat
const getMessagesForChat = async (chatId: string): Promise<TMessage[]> => {
  const result = await Message.find({ chatId, isDeleted: false }).sort({
    createdAt: 1,
  });
  return result;
};

// Get a message by ID
const getMessageById = async (id: string): Promise<TMessage | null> => {
  const result = await Message.findOne({ _id: id, isDeleted: false });
  return result;
};

// Update a message
const updateMessage = async (
  id: string,
  payload: Partial<TMessage>
): Promise<TMessage | null> => {
  const result = await Message.findByIdAndUpdate(id, payload, { new: true });
  return result;
};

// Delete a message (soft delete)
const deleteMessage = async (id: string): Promise<TMessage | null> => {
  const result = await Message.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true }
  );
  return result;
};

export const MessageService = {
  createMessage,
  getMessagesForChat,
  getMessageById,
  updateMessage,
  deleteMessage,
};
