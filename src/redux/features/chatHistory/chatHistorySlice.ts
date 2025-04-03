import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
  messages: any[];
}

interface ChatHistoryState {
  chats: Chat[];
  loading: boolean;
  error: string | null;
}

const initialState: ChatHistoryState = {
  chats: [],
  loading: false,
  error: null,
};

const chatHistorySlice = createSlice({
  name: "chatHistory",
  initialState,
  reducers: {
    addChat: (state, action: PayloadAction<Chat>) => {
      state.chats.unshift(action.payload);
    },
    updateChat: (
      state,
      action: PayloadAction<{ id: string; updates: Partial<Chat> }>
    ) => {
      const index = state.chats.findIndex(
        (chat) => chat.id === action.payload.id
      );
      if (index !== -1) {
        state.chats[index] = {
          ...state.chats[index],
          ...action.payload.updates,
        };
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const { addChat, updateChat, setLoading, setError } =
  chatHistorySlice.actions;
export default chatHistorySlice.reducer;
