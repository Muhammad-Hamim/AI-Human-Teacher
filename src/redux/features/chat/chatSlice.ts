import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Message {
  chatId: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatState {
  messages: Message[];
}

const initialState: ChatState = {
  messages: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);

      // Simulate AI response
      if (action.payload.role === "user") {
        state.messages.push({
          chatId: action.payload.chatId,
          role: "assistant",
          content: `This is a simulated response to: "${action.payload.content}"\n\nIn a real implementation, this would be replaced with an actual AI response.`,
          timestamp: new Date(),
        });
      }
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
});

export const { addMessage, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
