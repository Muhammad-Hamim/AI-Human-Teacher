import { configureStore } from "@reduxjs/toolkit";
import aiResponseReducer from "./features/aiResponse/aiResponseSlice";
import chatReducer from './features/chat/chatSlice'
export const store = configureStore({
  reducer: {
    aiResponse: aiResponseReducer,
    chat: chatReducer,
  },
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;
