import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Poem {
  _id: string;
  title: string;
  content: string;
  author: string;
  era?: string;
  analysis?: {
    theme?: string;
    emotionalTone?: string;
    culturalContext?: string;
    literarySignificance?: string;
  };
}

export const poemsApi = createApi({
  reducerPath: "poemsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "http://localhost:5000/api/v1" }),
  tagTypes: ["Poems"],
  endpoints: (builder) => ({
    getPoems: builder.query<{ data: Poem[] }, void>({
      query: () => "/poems",
      providesTags: ["Poems"],
    }),
    getPoemById: builder.query<{ data: Poem }, string>({
      query: (poemId) => `/poems/${poemId}`,
      providesTags: (result, error, id) => [{ type: "Poems", id }],
    }),
  }),
});

export const { useGetPoemsQuery, useGetPoemByIdQuery } = poemsApi; 