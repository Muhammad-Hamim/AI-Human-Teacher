import { TChatHistory } from "@/types/chat/TChatHistory";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatHistoryApi = createApi({
  reducerPath: "chatHistoryApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/v1" }),
  tagTypes: ["ChatHistory", "Chat"],
  endpoints: (builder) => ({
    createChat: builder.mutation<{ data: TChatHistory }, string>({
      query: (title) => {
        const chat = {
          userId: "641e23bc79b28a2f9c8d4567",
          user: "test@gmail.com",
          title,
        };
        return {
          url: "/chats",
          method: "POST",
          body: chat,
        };
      },
      invalidatesTags: ["ChatHistory"],
    }),
    getChatHistory: builder.query({
      query: (userId) => {
        return {
          url: `/chats/user/${userId}`,
          method: "GET",
        };
      },
      providesTags: ["ChatHistory"],
    }),
    getChats: builder.query({
      query: (chatId) => {
        return {
          url: `/chats/${chatId}`,
          method: "GET",
        };
      },
      providesTags: (result, error, chatId) => [{ type: "Chat", id: chatId }],
    }),
    updateChat: builder.mutation({
      query: ({ id, updates }) => ({
        url: `/chats/${id}`,
        method: "PATCH",
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "Chat", id }],
    }),
    deleteChat: builder.mutation({
      query: (id) => ({
        url: `/chats/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["ChatHistory"],
    }),
  }),
});

export const {
  useCreateChatMutation,
  useGetChatHistoryQuery,
  useGetChatsQuery,
  useUpdateChatMutation,
  useDeleteChatMutation,
} = chatHistoryApi;
