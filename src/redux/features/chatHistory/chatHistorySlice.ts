import { TChatHistory } from "@/types/chat/TChatHistory";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

const initialState: { history: TChatHistory[] } = {
  history: [],
};

export const chatHistorySlice = createSlice({
  name: "chatHistory",
  initialState,
  reducers: {
    addChatHistory: (state, action: PayloadAction<TChatHistory>) => {
      console.log("addChatHistory action dispatched:", action.payload);
      state.history.push(action.payload);
    },
  },
});

export const { addChatHistory } = chatHistorySlice.actions;
export default chatHistorySlice.reducer;
