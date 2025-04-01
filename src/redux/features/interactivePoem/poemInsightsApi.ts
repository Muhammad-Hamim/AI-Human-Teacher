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

export const poemInsightsApi = createApi({
  reducerPath: "poemInsightsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/v1/" }),
  endpoints: (builder) => ({
    getPoemImagerySymbolism: builder.mutation<
      { success: boolean; data: ImagerySymbolismData },
      string
    >({
      query: (poemId) => ({
        url: `poems/imagery-symbolism/${poemId}`,
        method: "GET",
      }),
    }),
  }),
});

export const { useGetPoemImagerySymbolismMutation } = poemInsightsApi;
