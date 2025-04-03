import { configureStore } from "@reduxjs/toolkit";
import chatReducer from "./features/chat/chatSlice";
import chatHistoryReducer from "./features/chatHistory/chatHistorySlice";
import { chatApi } from "./features/chat/chatApi";
import { chatHistoryApi } from "./features/chatHistory/chatHistoryApi";
import { deepSeekApi } from "./features/interactivePoem/deepSeekApi";
import userProgressReducer from "./features/interactivePoem/userProgressSlice";
import themeReducer from "./features/interactivePoem/themeSlice";
import voiceChatReducer from "./features/voiceChat/voiceChatSlice";
import poemVideoReducer from "./features/poemVideo/poemVideoSlice";
import { poemVideoApi } from "./features/poemVideo/poemVideoApi";
import { poemsApi } from "./features/poems/poemsApi";
import { poemInsightsApi } from "./features/interactivePoem/poemInsightsApi";

// Create an object with all API reducers
const apiReducers = {
  [chatApi.reducerPath]: chatApi.reducer,
  [chatHistoryApi.reducerPath]: chatHistoryApi.reducer,
  [deepSeekApi.reducerPath]: deepSeekApi.reducer,
  [poemVideoApi.reducerPath]: poemVideoApi.reducer,
  [poemsApi.reducerPath]: poemsApi.reducer,
  [poemInsightsApi.reducerPath]: poemInsightsApi.reducer,
};

// Create an array of all API middleware
const apiMiddleware = [
  chatApi.middleware,
  chatHistoryApi.middleware,
  deepSeekApi.middleware,
  poemVideoApi.middleware,
  poemsApi.middleware,
  poemInsightsApi.middleware,
];

export const store = configureStore({
  reducer: {
    chat: chatReducer,
    chatHistory: chatHistoryReducer,
    userProgress: userProgressReducer,
    theme: themeReducer,
    poemVideo: poemVideoReducer,
    ...apiReducers,
    voiceChat: voiceChatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddleware),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
