import { TMessage } from "@/types/messages/TMessages";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/v1" }),
  endpoints: (builder) => ({
    requestAiResponse: builder.mutation<
      TMessage,
      { prompt: string; chatId: string }
    >({
      query: ({ prompt, chatId }) => {
        const message: TMessage = {
          user: {
            senderId: "641e23bc79b28a2f9c8d4567",
            senderType: "user",
          },
          message: {
            content: prompt,
            contentType: "text",
          },
          chatId,
          isAIResponse: false,
          userId: "641e23bc79b28a2f9c8d4567",
          isDeleted: false,
        };
        console.log(message);
        return {
          url: "/ai/generate",
          method: "POST",
          body: {
            message,
            modelName: "deepseek-r1",
            options: { temperature: 1.3, maxToken: 5000 },
          },
        };
      },
    }),
    getMessages: builder.query<{ data: TMessage[] }, string>({
      query: (chatId: string) => `/messages/chat/${chatId}`,
    }),
  }),
});

export const { useRequestAiResponseMutation, useGetMessagesQuery } = chatApi;
