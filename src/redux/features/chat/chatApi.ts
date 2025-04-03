import { TMessage } from "@/types/messages/TMessages";
import { deepseekModel } from "@/utils/aiModelNameConst";
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
      { prompt: string; chatId: string }
    >({
      queryFn: async ({ prompt, chatId }) => {
        // Create a message structure where content is a direct property of the message object
        const message = {
          chatId,
          userId: "641e23bc79b28a2f9c8d4567",
          user: {
            senderId: "641e23bc79b28a2f9c8d4567",
            senderType: "user",
          },
          content: prompt, // This is directly on the message object, not nested
          message: {
            // Also include in the nested message object for backward compatibility
            content: prompt,
            contentType: "text",
          },
          isAIResponse: false,
          isDeleted: false,
        };

        const body = {
          message,
          modelName: deepseekModel,
          options: {
            temperature: 0.7,
            maxToken: 4000,
          },
        };

        console.log("Request body structure:", JSON.stringify(body, null, 2));

        try {
          const response = await fetch(
            "http://localhost:5000/api/v1/ai/chat/process-message",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Error response:", errorData);
            return { error: errorData };
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          console.error("API request failed:", error);
          return { error: { status: "FETCH_ERROR", error: String(error) } };
        }
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
        // Use the same message structure as requestAiResponse
        const message = {
          chatId,
          userId: "641e23bc79b28a2f9c8d4567",
          user: {
            senderId: "641e23bc79b28a2f9c8d4567",
            senderType: "user",
          },
          content: prompt, // Direct content property
          message: {
            content: prompt,
            contentType: "text",
          },
          isAIResponse: false,
          isDeleted: false,
        };

        const body = {
          message,
          modelName: deepseekModel,
          options: { temperature: 1.3, maxToken: 500 },
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
