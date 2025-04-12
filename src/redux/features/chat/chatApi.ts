import { TMessage } from "@/types/messages/TMessages";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1/",
  }),
  tagTypes: ["Messages", "Chat"],
  endpoints: (builder) => ({
    requestAiResponse: builder.mutation<
      TMessage,
      { prompt: string; chatId: string; language: string }
    >({
      query: ({ prompt, chatId, language }) => {
        const message = {
          chatId,
          userId: "641e23bc79b28a2f9c8d4567",
          content: prompt,
          user: {
            senderId: "641e23bc79b28a2f9c8d4567",
            senderType: "user",
          },
          message: {
            content: prompt,
            contentType: "text",
          },
          isAIResponse: false,
          isDeleted: false,
        };

        const body = {
          message,
        };
        console.log("request body:", body);
        return {
          url: `/ai/chat/process-message?language=${language}`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: (result, error, { chatId }) => [
        { type: "Messages", id: chatId },
      ],
    }),
    getMessages: builder.query<{ data: TMessage[] }, string>({
      query: (chatId: string) => `/messages/chat/${chatId}`,
      providesTags: (result, error, chatId) => [
        { type: "Messages", id: chatId },
      ],
    }),
    streamAiResponse: builder.mutation<
      void,
      { prompt: string; chatId: string; onChunk: (chunk: string) => void }
    >({
      queryFn: async ({ prompt, chatId, onChunk }) => {
        const message = {
          chatId,
          userId: "641e23bc79b28a2f9c8d4567",
          content: prompt,
          user: {
            senderId: "641e23bc79b28a2f9c8d4567",
            senderType: "user",
          },
          message: {
            content: prompt,
            contentType: "text",
          },
          isAIResponse: false,
          isDeleted: false,
        };

        const body = {
          message,
        };

        console.log("Stream request body:", JSON.stringify(body, null, 2));

        try {
          const response = await fetch(
            "http://localhost:5000/api/v1/ai/chat/stream-message",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );

          const reader = response.body?.getReader();
          if (!reader) throw new Error("No response body");

          // Process the stream
          const decoder = new TextDecoder();
          let done = false;

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;

            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            // Log raw chunk for debugging
            console.log("Raw SSE chunk:", chunk);

            // Parse SSE format - format is "data: {...}\n\n"
            const lines = chunk.split("\n\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const dataContent = line.substring(6);

                  // Skip the [DONE] message that indicates end of stream
                  if (dataContent === "[DONE]") {
                    console.log("End of stream detected");
                    continue;
                  }

                  console.log("Parsed data content:", dataContent);

                  const data = JSON.parse(dataContent);
                  if (data.content) {
                    onChunk(data.content);
                  } else if (data.message && data.message.content) {
                    onChunk(data.message.content);
                  }
                } catch (e) {
                  // Skip invalid JSON
                  console.error("Error parsing SSE data", e);
                  // If parsing fails but starts with "data: ", try to extract content directly
                  const content = line.substring(6);
                  if (content && typeof content === "string") {
                    onChunk(content);
                  }
                }
              }
            }
          }

          return { data: undefined };
        } catch (error) {
          console.error("API request failed:", error);
          return { error: { status: "CUSTOM_ERROR", error: String(error) } };
        }
      },
      invalidatesTags: (_result, _error, { chatId }) => [
        { type: "Messages", id: chatId },
        { type: "Chat", id: chatId },
      ],
    }),
  }),
});

export const {
  useRequestAiResponseMutation,
  useGetMessagesQuery,
  useStreamAiResponseMutation,
} = chatApi;
