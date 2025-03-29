/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, History, BookOpen } from "lucide-react";
import { useGetPoemInsightsMutation } from "@/redux/features/interactivePoem/deepSeekApi";

interface CulturalInsightsProps {
  poem: any;
}

interface InsightData {
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
}

export default function CulturalInsights({ poem }: CulturalInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightData | null>(null);

  // Use real API endpoint for cultural insights
  const [getPoemInsights] = useGetPoemInsightsMutation();

  // Handle fetching insights
  const handleFetchInsights = async () => {
    setIsLoading(true);
    try {
      const result = await getPoemInsights({ poemId: poem._id });
      if (result.data) {
        setInsights(result.data.data);
      }
    } catch (error) {
      console.error("Error fetching cultural insights:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-Time Cultural Insights</h2>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cultural Context for "{poem.title}"</CardTitle>
                <CardDescription>
                  Discover historical, artistic, and philosophical connections
                </CardDescription>
              </div>
              <Button onClick={handleFetchInsights} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Get Insights"
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {insights ? (
              <div className="space-y-6">
                <Card className="overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <CardTitle className="text-lg">Cultural Context</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 whitespace-pre-line">
                    {insights.culturalInsights.text}

                    <div className="mt-4 text-sm text-muted-foreground">
                      Generated on:{" "}
                      {new Date(
                        insights.culturalInsights.generatedAt
                      ).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-30" />
                <p>Click "Get Insights" to discover cultural connections</p>
                <p className="text-sm mt-1">
                  Learn how this poem relates to Chinese history, art, and
                  philosophy
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
