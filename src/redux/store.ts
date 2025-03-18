import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./features/chat/chatSlice";
import chatHistoryReducer from "./features/chatHistory/chatHistorySlice";
import { chatApi } from "./features/chat/chatApi";
import { chatHistoryApi } from "./features/chatHistory/chatHistoryApi";

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    chatHistory: chatHistoryReducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [chatHistoryApi.reducerPath]: chatHistoryApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      chatApi.middleware,
      chatHistoryApi.middleware
    ),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
