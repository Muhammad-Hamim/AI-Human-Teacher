import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface ImagerySymbolismData {
  imageryAndSymbolism: Record<
    string,
    {
      description: string;
      keywords: string[];
      culturalSignificance: string[];
      icon: string;
    }
  >;
  visualRepresentation?: {
    title: string;
    description: string;
  };
}

interface PoemImageResponse {
  success: boolean;
  message: string;
  data: {
    poem: {
      id: string;
      title: string;
      author: string;
      dynasty: string;
    };
    imageBase64: string;
    prompt: string;
  };
}

export const poemInsightsApi = createApi({
  reducerPath: "poemInsightsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1/",
  }),
  endpoints: (builder) => ({
    getPoemImagerySymbolism: builder.mutation<
      { success: boolean; data: ImagerySymbolismData },
      { poemId: string; language: string }
    >({
      query: ({ poemId, language }) => ({
        url: `poems/imagery-symbolism/${poemId}?language=${language}`,
        method: "GET",
      }),
    }),
    getPoemImage: builder.mutation<PoemImageResponse, string>({
      query: (poemId) => ({
        url: `poems/image/${poemId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetPoemImagerySymbolismMutation, useGetPoemImageMutation } =
  poemInsightsApi;
