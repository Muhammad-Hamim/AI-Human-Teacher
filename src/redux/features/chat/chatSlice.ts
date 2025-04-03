import { TMessage } from "@/types/messages/TMessages";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";



interface ChatState {
  messages: TMessage[];
}

const initialState: ChatState = {
  messages: [],
};

export const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action: PayloadAction<TMessage>) => {
      state.messages.push(action.payload);
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    updateStreamingMessage: (state, action) => {
      const { _id, content } = action.payload;
      const messageIndex = state.messages.findIndex((msg) => msg._id === _id);

      if (messageIndex !== -1) {
        if (typeof content === "function") {
          state.messages[messageIndex].message.content = content(
            state.messages[messageIndex].message.content
          );
        } else {
          state.messages[messageIndex].message.content = content;
        }
      }
    },
  },
});

export const { addMessage, clearMessages,updateStreamingMessage } = chatSlice.actions;
export default chatSlice.reducer;
