/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, History, Palette, BookOpen } from "lucide-react"
import { useGetMockCulturalInsightsQuery } from "@/redux/features/interactivePoem/deepSeekApi"

interface CulturalInsightsProps {
  poem: any
}

export default function CulturalInsights({ poem }: CulturalInsightsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [activeInsightType, setActiveInsightType] = useState<"history" | "art" | "philosophy" | "all">("all")
  const [insights, setInsights] = useState<any>(null)

  // Use mock query for development
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: mockData, refetch: fetchInsights } = useGetMockCulturalInsightsQuery(
    {
      poemText: poem.lines.map((line: any) => line.chinese).join("\n"),
      poemTitle: poem.title,
      author: poem.author,
      dynasty: poem.dynasty,
      insightType: activeInsightType,
    },
    { skip: !isLoading },
  )

  // Handle fetching insights
  const handleFetchInsights = async () => {
    setIsLoading(true)
    try {
      const result = await fetchInsights()
      if (result.data) {
        setInsights(result.data)
      }
    } catch (error) {
      console.error("Error fetching cultural insights:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Filter insights by type
  const filteredInsights =
    insights?.insights.filter((insight: any) => activeInsightType === "all" || insight.type === activeInsightType) || []

  // Get icon for insight type
  const getInsightIcon = (type: string) => {
    switch (type) {
      case "history":
        return <History className="h-5 w-5 text-blue-500" />
      case "art":
        return <Palette className="h-5 w-5 text-purple-500" />
      case "philosophy":
        return <BookOpen className="h-5 w-5 text-green-500" />
      default:
        return <History className="h-5 w-5" />
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Real-Time Cultural Insights</h2>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Cultural Context for "{poem.title}"</CardTitle>
                <CardDescription>Discover historical, artistic, and philosophical connections</CardDescription>
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
                <Tabs
                  defaultValue="all"
                  value={activeInsightType}
                  onValueChange={(value) => setActiveInsightType(value as any)}
                >
                  <TabsList className="mb-4">
                    <TabsTrigger value="all">All Insights</TabsTrigger>
                    <TabsTrigger value="history">Historical</TabsTrigger>
                    <TabsTrigger value="art">Artistic</TabsTrigger>
                    <TabsTrigger value="philosophy">Philosophical</TabsTrigger>
                  </TabsList>

                  <div className="space-y-4">
                    {filteredInsights.length > 0 ? (
                      filteredInsights.map((insight: any, index: number) => (
                        <Card key={index} className="overflow-hidden">
                          <CardHeader className="p-4 pb-2 flex flex-row items-center gap-2">
                            {getInsightIcon(insight.type)}
                            <CardTitle className="text-lg">{insight.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="p-4">
                            <p className="mb-4">{insight.content}</p>

                            {insight.relatedArtifact && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="outline">Related Artifact</Badge>
                                {insight.relatedArtifact}
                              </div>
                            )}

                            {insight.relatedConcept && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                                <Badge variant="outline">Related Concept</Badge>
                                {insight.relatedConcept}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No insights available for this category. Try another category.
                      </div>
                    )}
                  </div>
                </Tabs>

                {insights.recommendedReadings && insights.recommendedReadings.length > 0 && (
                  <div className="mt-6 border-t pt-4">
                    <h3 className="text-lg font-medium mb-2">Recommended Readings</h3>
                    <ul className="space-y-2">
                      {insights.recommendedReadings.map((reading: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{reading}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <History className="h-12 w-12 mb-4 opacity-30" />
                <p>Click "Get Insights" to discover cultural connections</p>
                <p className="text-sm mt-1">Learn how this poem relates to Chinese history, art, and philosophy</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

