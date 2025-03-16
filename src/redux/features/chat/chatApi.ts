import { TPrompt } from "@/types/aiResponse/TAiResponse";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const chatApi = createApi({
  reducerPath: "chatApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/v1" }),
  endpoints: (builder) => ({
    requestAiResponse: builder.mutation<TPrompt, string>({
      query: (prompt) => ({
        url: "/prompt",
        method: "POST",
        body: { prompt },
      }),
    }),
  }),
});

export const { useRequestAiResponseMutation } = chatApi;
