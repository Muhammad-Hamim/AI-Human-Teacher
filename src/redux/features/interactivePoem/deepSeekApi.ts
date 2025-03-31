import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface AnalysisRequest {
  poemText: string;
  poemTitle?: string;
  author?: string;
  analysisType: "interpretation" | "themes" | "figurative" | "comparison";
  userLevel?: "beginner" | "intermediate" | "advanced";
}

export interface QuizRequest {
  poemText: string;
  poemTitle?: string;
  quizType: "multiple-choice" | "fill-blank" | "matching";
  difficulty: "easy" | "medium" | "hard";
  previousPerformance?: number;
  userKnowledgeLevel?: "beginner" | "intermediate" | "advanced";
}

export interface PronunciationFeedbackRequest {
  originalAudio: string;
  userAudio: string;
  text: string;
}

export interface CreativeWritingRequest {
  originalPoemText: string;
  theme?: string;
  keywords?: string[];
  style?: "similar" | "modern" | "traditional";
}

export interface StorytellerRequest {
  poemText: string;
  poemTitle?: string;
  author?: string;
  includeSoundEffects?: boolean;
  tone?: "dramatic" | "calm" | "nostalgic";
}

export interface CulturalInsightRequest {
  poemText: string;
  poemTitle?: string;
  author?: string;
  dynasty?: string;
  insightType?: "history" | "art" | "philosophy" | "all";
}

export interface KnowledgeBaseRequest {
  question: string;
  poemContext?: string;
  authorContext?: string;
}

export interface StrokeAnimationRequest {
  character: string;
}

export interface PoemInsightsRequest {
  poemId: string;
}

export interface PoemInsightsResponse {
  success: boolean;
  message: string;
  data: {
    poem: {
      id: string;
      title: string;
      author: string;
      dynasty: string;
    };
    culturalInsights: {
      text: string;
      generatedAt: string;
    };
  };
}

export interface VocabularyTranslation {
  meaning: string;
  partOfSpeech: string;
}

export interface VocabularyExample {
  sentence: string;
  translation: string;
  pinyin: string;
}

export interface VocabularyExplanation {
  word: string;
  pinyin: string;
  translation: VocabularyTranslation[];
  example: VocabularyExample[];
  level?: string;
}

export interface GetVocabularyExplanationRequest {
  poemId: string;
  word: string;
}

export interface GetAllVocabularyExplanationsRequest {
  poemId: string;
}

export interface AllVocabularyExplanationsResponse {
  data: {
    vocabulary: VocabularyExplanation[];
  };
}

export const deepSeekApi = createApi({
  reducerPath: "deepSeekApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1/",
  }),
  endpoints: (builder) => ({
    getPoemAnalysis: builder.query<any, AnalysisRequest>({
      query: (request) => ({
        url: "analysis",
        method: "POST",
        body: request,
      }),
    }),

    generateQuiz: builder.query<any, QuizRequest>({
      query: (request) => ({
        url: "quiz",
        method: "POST",
        body: request,
      }),
    }),

    getPronunciationFeedback: builder.mutation<
      any,
      PronunciationFeedbackRequest
    >({
      query: (request) => ({
        url: "pronunciation-feedback",
        method: "POST",
        body: request,
      }),
    }),

    generateCreativeWriting: builder.query<any, CreativeWritingRequest>({
      query: (request) => ({
        url: "creative-writing",
        method: "POST",
        body: request,
      }),
    }),

    generateStorytellerNarration: builder.query<any, StorytellerRequest>({
      query: (request) => ({
        url: "storyteller",
        method: "POST",
        body: request,
      }),
    }),

    getCulturalInsights: builder.query<any, CulturalInsightRequest>({
      query: (request) => ({
        url: "cultural-insights",
        method: "POST",
        body: request,
      }),
    }),

    askKnowledgeBase: builder.mutation<any, KnowledgeBaseRequest>({
      query: (request) => ({
        url: "knowledge-base",
        method: "POST",
        body: request,
      }),
    }),

    getCharacterStrokeAnimation: builder.query<any, StrokeAnimationRequest>({
      query: (request) => ({
        url: "stroke-animation",
        method: "POST",
        body: request,
      }),
    }),

    getPoemInsights: builder.mutation<
      PoemInsightsResponse,
      PoemInsightsRequest
    >({
      query: (request) => ({
        url: "ai/poem-insights/generate",
        method: "POST",
        body: request,
      }),
    }),

    getVocabularyExplanation: builder.query<
      { data: VocabularyExplanation },
      GetVocabularyExplanationRequest
    >({
      query: (request) => ({
        url: `ai/vocabulary-explanation/${request.poemId}`,
        method: "GET",
        params: { word: request.word },
      }),
      keepUnusedDataFor: 600, // Cache for 10 minutes
    }),

    getAllVocabularyExplanations: builder.query<
      AllVocabularyExplanationsResponse,
      GetAllVocabularyExplanationsRequest
    >({
      query: (request) => ({
        url: `vocabulary/poem/${request.poemId}?process=true`,
        method: "GET",
      }),
      keepUnusedDataFor: 600, // Cache for 10 minutes
    }),

    // Mock endpoints for development
    getMockPoemAnalysis: builder.query<any, Partial<AnalysisRequest>>({
      queryFn: (request) => {
        // Simulate API response
        return {
          data: {
            interpretation:
              "This poem captures the essence of nostalgia through vivid imagery of moonlight and frost. Li Bai masterfully conveys the universal experience of homesickness through simple yet profound observations.",
            historicalContext:
              "Written during the Tang Dynasty when travel was difficult and communication limited, this poem reflects the common experience of scholars who traveled far from home for imperial examinations or official posts.",
            culturalSignificance:
              "The moon serves as a powerful symbol in Chinese culture, representing connection between separated loved ones. This poem has become one of the most recognized expressions of homesickness in Chinese literature.",
            comparisons:
              "Similar themes can be found in Li Bai's 'Drinking Alone Under the Moon' and Du Fu's 'Spring View', though this poem achieves its emotional impact with remarkable brevity.",
            themes: [
              "nostalgia",
              "homesickness",
              "loneliness",
              "nature",
              "reflection",
            ],
            figurativeLanguage: [
              {
                type: "metaphor",
                text: "疑是地上霜",
                explanation:
                  "The moonlight is compared to frost, creating a visual connection between these two white, luminous elements.",
              },
              {
                type: "juxtaposition",
                text: "举头望明月，低头思故乡",
                explanation:
                  "The contrast between looking up and looking down creates a powerful emotional shift from observation to introspection.",
              },
            ],
          },
        };
      },
    }),

    getMockQuiz: builder.query<any, Partial<QuizRequest>>({
      queryFn: (request) => {
        const userLevel = request.userKnowledgeLevel || "intermediate";

        const quizzes = {
          beginner: {
            questions: [
              {
                type: "multiple-choice",
                question: "What does the poet compare the moonlight to?",
                options: [
                  "Frost on the ground",
                  "Snow on the mountains",
                  "Stars in the sky",
                  "Water in a lake",
                ],
                correctAnswer: "Frost on the ground",
              },
              {
                type: "fill-blank",
                question: "举头望_____，低头思故乡",
                answer: "明月",
              },
              {
                type: "matching",
                pairs: [
                  { term: "床前", definition: "Before the bed" },
                  { term: "明月光", definition: "Bright moonlight" },
                  { term: "故乡", definition: "Homeland" },
                ],
              },
            ],
            difficulty: "easy",
            adaptiveRecommendation:
              "Try learning more basic vocabulary related to nature and emotions.",
          },
          intermediate: {
            questions: [
              {
                type: "multiple-choice",
                question: "What emotion is primarily expressed in this poem?",
                options: ["Joy", "Homesickness", "Anger", "Confusion"],
                correctAnswer: "Homesickness",
              },
              {
                type: "fill-blank",
                question:
                  "The line '举头望明月，低头思故乡' demonstrates what poetic technique?",
                answer: "Juxtaposition",
              },
              {
                type: "multiple-choice",
                question: "During which dynasty was Li Bai active as a poet?",
                options: [
                  "Han Dynasty",
                  "Tang Dynasty",
                  "Song Dynasty",
                  "Ming Dynasty",
                ],
                correctAnswer: "Tang Dynasty",
              },
              {
                type: "essay",
                question:
                  "Explain how the imagery in this poem contributes to its emotional impact.",
                sampleAnswer:
                  "The imagery of moonlight and frost creates a serene yet melancholic atmosphere, while the physical actions of looking up and down represent the poet's emotional journey from observation to introspection.",
              },
            ],
            difficulty: "medium",
            adaptiveRecommendation:
              "Focus on understanding more about Tang Dynasty poetry techniques and historical context.",
          },
          advanced: {
            questions: [
              {
                type: "multiple-choice",
                question: "Which literary device is used in '疑是地上霜'?",
                options: [
                  "Metaphor",
                  "Simile",
                  "Personification",
                  "Alliteration",
                ],
                correctAnswer: "Metaphor",
              },
              {
                type: "essay",
                question:
                  "Compare and contrast Li Bai's approach to expressing homesickness with that of Du Fu in his poetry.",
                sampleAnswer:
                  "While Li Bai often uses natural imagery and concise language to evoke emotional states, Du Fu tends to be more direct and historically grounded in his expressions of homesickness. Li Bai's approach in '静夜思' creates a universal feeling through simple observations, whereas Du Fu often ties his homesickness to specific historical circumstances.",
              },
              {
                type: "multiple-choice",
                question: "How does this poem exemplify Li Bai's poetic style?",
                options: [
                  "Through elaborate descriptions and formal language",
                  "Through simple imagery and profound emotional resonance",
                  "Through political commentary and social criticism",
                  "Through complex rhyme schemes and structural innovations",
                ],
                correctAnswer:
                  "Through simple imagery and profound emotional resonance",
              },
              {
                type: "fill-blank",
                question:
                  "The moon in Chinese poetry often symbolizes _____ and _____.",
                answer: "separation, reunion",
              },
            ],
            difficulty: "hard",
            adaptiveRecommendation:
              "Explore more complex literary analysis and comparative studies of Tang Dynasty poetry.",
          },
        };

        return {
          data: quizzes[userLevel as keyof typeof quizzes],
        };
      },
    }),

    getMockStorytellerNarration: builder.query({
      query: (params) => ({
        url: "/mock/storyteller",
        method: "GET",
        params,
      }),
    }),

    getMockCulturalInsights: builder.query<
      any,
      Partial<CulturalInsightRequest>
    >({
      queryFn: (request) => {
        return {
          data: {
            insights: [
              {
                type: "history",
                title: "Tang Dynasty Travel",
                content:
                  "During the Tang Dynasty (618-907 CE), scholars and officials often traveled far from home to take imperial examinations or serve in government posts. The difficulty of travel and communication made homesickness a common experience, reflected in much of the poetry from this period.",
                relatedArtifact: "Tang Dynasty travel permit, 8th century",
              },
              {
                type: "art",
                title: "Moon in Chinese Painting",
                content:
                  "The moon has been a central motif in Chinese landscape painting for centuries. Artists like Wu Wei (15th century) created famous works depicting moonlit scenes that evoke the same contemplative mood found in Li Bai's poem.",
                relatedArtifact:
                  "Wu Wei's 'Fisherman by Moonlight', Ming Dynasty",
              },
              {
                type: "philosophy",
                title: "Daoist Influences",
                content:
                  "Li Bai was influenced by Daoist philosophy, which emphasizes harmony with nature and contemplation. The quiet observation of natural phenomena (moonlight) leading to emotional insight reflects Daoist principles of finding wisdom through observing the natural world.",
                relatedConcept:
                  "Wu wei (non-action) - the Daoist concept of aligning with the natural flow of the world",
              },
            ],
            recommendedReadings: [
              "The Culture of the Tang Dynasty by Charles Benn",
              "Chinese Landscape Painting as Western Art History by James Cahill",
              "Tao Te Ching by Laozi, translated by Stephen Mitchell",
            ],
          },
        };
      },
    }),

    getMockKnowledgeBaseAnswer: builder.mutation<
      any,
      Partial<KnowledgeBaseRequest>
    >({
      queryFn: (request) => {
        // Sample questions and answers
        const qa = {
          "Who was Li Bai?":
            "Li Bai (701-762 CE), also known as Li Po, was one of China's most renowned poets who lived during the Tang Dynasty. Known as the 'Immortal Poet,' he wrote around 1,000 poems characterized by their imaginative imagery, romantic spirit, and celebration of wine and nature. His work often expresses themes of friendship, solitude, the passage of time, and a carefree wandering life. Despite his literary genius, Li Bai spent much of his life seeking but never securing a permanent official position, instead traveling extensively throughout China.",

          "What is the significance of the moon in Chinese poetry?":
            "The moon holds profound significance in Chinese poetry and culture. It symbolizes reunion (as all separated loved ones see the same moon), beauty, and the cyclical nature of life. In poetry, it often evokes feelings of nostalgia, longing, and connection to absent loved ones. The Mid-Autumn Festival celebrates the full moon as a symbol of family reunion. In Li Bai's '静夜思' (Quiet Night Thoughts), the moon serves as both a beautiful natural phenomenon and a trigger for homesickness, creating a powerful emotional resonance that has made this poem beloved for centuries.",

          "What are the characteristics of Tang Dynasty poetry?":
            "Tang Dynasty poetry (618-907 CE) represents the golden age of Chinese poetry and is characterized by: 1) Formal structures including regulated verse (律诗 lüshi) with strict tonal patterns and line lengths; 2) Rich imagery drawn from nature and everyday life; 3) Emotional depth expressing personal feelings, philosophical reflections, and social concerns; 4) Thematic diversity covering topics from court life to frontier experiences, friendship, solitude, and natural beauty; 5) Technical innovation with new forms and styles; 6) Cultural synthesis incorporating influences from various regions and traditions. Major poets include Li Bai, Du Fu, Wang Wei, and Bai Juyi, whose works continue to influence Chinese literature and culture.",
        };

        // Default answer if question not found
        let answer =
          "I don't have specific information about that question. Would you like to ask something about Li Bai, Tang Dynasty poetry, or the poem '静夜思' (Quiet Night Thoughts)?";

        // Check if we have a pre-defined answer
        if (request.question) {
          for (const [q, a] of Object.entries(qa)) {
            if (request.question.toLowerCase().includes(q.toLowerCase())) {
              answer = a;
              break;
            }
          }
        }

        return {
          data: {
            question: request.question,
            answer: answer,
            sources: [
              "The Cambridge History of Chinese Literature",
              "Classical Chinese Poetry: An Anthology by David Hinton",
              "Li Bai and Du Fu: An Advanced Reader of Chinese Language and Literature",
            ],
          },
        };
      },
    }),

    getMockCreativeWriting: builder.query<any, Partial<CreativeWritingRequest>>(
      {
        queryFn: (request) => {
          return {
            data: {
              generatedPoem: {
                chinese:
                  "城中灯火明，\n远处山川静。\n思绪绕心头，\n何时再相逢？",
                pinyin:
                  "Chéng zhōng dēng huǒ míng,\nYuǎn chù shān chuān jìng.\nSī xù rào xīn tóu,\nHé shí zài xiāng féng?",
                english:
                  "City lights shine bright,\nDistant mountains and rivers still.\nThoughts circle in my mind,\nWhen shall we meet again?",
              },
              explanation:
                "This generated poem follows Li Bai's style of using natural imagery to evoke emotional states. It contrasts urban and natural settings to highlight the feeling of separation.",
            },
          };
        },
      }
    ),
    getPoemNarration: builder.mutation({
      query: ({ poemId }) => {
        console.log(poemId);
        return {
          url: "/ai/poem-narration/generate",
          method: "POST",
          body: { poemId },
        };
      },
    }),
  }),
});

export const {
  useGetPoemAnalysisQuery,
  useGenerateQuizQuery,
  useGetPronunciationFeedbackMutation,
  useGenerateCreativeWritingQuery,
  useGenerateStorytellerNarrationQuery,
  useGetCulturalInsightsQuery,
  useAskKnowledgeBaseMutation,
  useGetCharacterStrokeAnimationQuery,
  useGetMockPoemAnalysisQuery,
  useGetMockQuizQuery,
  useGetMockStorytellerNarrationQuery,
  useGetMockCulturalInsightsQuery,
  useGetMockKnowledgeBaseAnswerMutation,
  useGetMockCreativeWritingQuery,
  useGetPoemNarrationMutation,
  useGetPoemInsightsMutation,
  useGetVocabularyExplanationQuery,
  useGetAllVocabularyExplanationsQuery,
} = deepSeekApi;
