/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Heart, Lightbulb, Sparkles, BookOpen, Globe, History, MessageSquare } from "lucide-react"

interface AiAnalysisProps {
  poem: any
}

export default function AiAnalysis({ poem }: AiAnalysisProps) {
  const [activeTab, setActiveTab] = useState("emotional")

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">AI-Powered Analysis</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-1 md:grid-cols-3">
          <TabsTrigger value="emotional" className="flex items-center gap-2">
            <Heart size={16} />
            Emotional Tone
          </TabsTrigger>
          <TabsTrigger value="literary" className="flex items-center gap-2">
            <BookOpen size={16} />
            Literary Techniques
          </TabsTrigger>
          <TabsTrigger value="modern" className="flex items-center gap-2">
            <Globe size={16} />
            Modern Relevance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emotional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Emotional Analysis
              </CardTitle>
              <CardDescription>AI analysis of the emotional tone and impact of the poem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{poem.aiPoweredAnalysis.emotionalTone}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Emotional Journey</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Contemplation</span>
                          <Badge variant="outline">Lines 1-2</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-400 w-1/2"></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Longing</span>
                          <Badge variant="outline">Line 3</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-400 w-3/4"></div>
                        </div>

                        <div className="flex items-center justify-between">
                          <span>Homesickness</span>
                          <Badge variant="outline">Line 4</Badge>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-400 w-full"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">Key Emotional Themes</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="border rounded-md p-2 flex flex-col items-center justify-center text-center">
                          <Badge className="mb-1 bg-blue-100 text-blue-800 hover:bg-blue-100">Nostalgia</Badge>
                          <span className="text-sm">Strong presence</span>
                        </div>
                        <div className="border rounded-md p-2 flex flex-col items-center justify-center text-center">
                          <Badge className="mb-1 bg-purple-100 text-purple-800 hover:bg-purple-100">Loneliness</Badge>
                          <span className="text-sm">Moderate presence</span>
                        </div>
                        <div className="border rounded-md p-2 flex flex-col items-center justify-center text-center">
                          <Badge className="mb-1 bg-green-100 text-green-800 hover:bg-green-100">Tranquility</Badge>
                          <span className="text-sm">Subtle presence</span>
                        </div>
                        <div className="border rounded-md p-2 flex flex-col items-center justify-center text-center">
                          <Badge className="mb-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Reflection</Badge>
                          <span className="text-sm">Strong presence</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="literary">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen size={20} className="text-blue-500" />
                Literary Techniques
              </CardTitle>
              <CardDescription>Analysis of the poetic devices and techniques used in the poem</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{poem.aiPoweredAnalysis.literaryTechniques}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Poetic Devices</h3>

                    <div className="space-y-3">
                      <div className="border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={16} className="text-yellow-500" />
                          <h4 className="font-medium">Metaphor</h4>
                        </div>
                        <p className="text-sm">
                          The moonlight is compared to frost on the ground, creating a visual connection between the two
                          white, luminous elements.
                        </p>
                      </div>

                      <div className="border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={16} className="text-green-500" />
                          <h4 className="font-medium">Contrast</h4>
                        </div>
                        <p className="text-sm">
                          The poet uses the contrast between looking up (at the moon) and looking down (thinking of
                          home) to create emotional depth.
                        </p>
                      </div>

                      <div className="border rounded-md p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Sparkles size={16} className="text-blue-500" />
                          <h4 className="font-medium">Imagery</h4>
                        </div>
                        <p className="text-sm">
                          Vivid visual imagery of moonlight, frost, and the physical actions of looking up and down
                          create a clear mental picture.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Structural Analysis</h3>

                    <div className="border rounded-md p-4">
                      <h4 className="font-medium mb-2">Form: 五言绝句 (Five-character quatrain)</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        <li>Four lines with five characters each</li>
                        <li>Follows traditional Tang dynasty poetic structure</li>
                        <li>Concise form that requires precision and economy of language</li>
                      </ul>

                      <h4 className="font-medium mt-4 mb-2">Rhythm Pattern</h4>
                      <div className="grid grid-cols-5 gap-1 text-center text-sm">
                        {[
                          "平",
                          "平",
                          "平",
                          "仄",
                          "平",
                          "仄",
                          "仄",
                          "平",
                          "平",
                          "平",
                          "仄",
                          "平",
                          "平",
                          "仄",
                          "平",
                          "仄",
                          "平",
                          "仄",
                          "平",
                          "平",
                        ].map((tone, i) => (
                          <div key={i} className={`p-1 rounded ${tone === "平" ? "bg-blue-100" : "bg-red-100"}`}>
                            {tone}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modern">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe size={20} className="text-green-500" />
                Modern Relevance
              </CardTitle>
              <CardDescription>How this ancient poem connects to contemporary experiences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{poem.aiPoweredAnalysis.modernRelevance}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" />
                        <CardTitle className="text-base">Contemporary Parallels</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            1
                          </span>
                          <span>International students and workers separated from family</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            2
                          </span>
                          <span>Digital communication connecting distant loved ones</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                            3
                          </span>
                          <span>Universal experience of homesickness and nostalgia</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <History size={18} className="text-purple-500" />
                        <CardTitle className="text-base">Historical Context vs. Today</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span>Travel Difficulty</span>
                          <div className="flex">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Then: High
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-1">
                              Now: Low
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Communication</span>
                          <div className="flex">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Then: Slow
                            </span>
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-1">
                              Now: Instant
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Homesickness</span>
                          <div className="flex">
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                              Then: Intense
                            </span>
                            <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded ml-1">
                              Now: Intense
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-yellow-500" />
                        <CardTitle className="text-base">Modern Interpretations</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3 text-sm">
                        <div className="border-l-2 border-yellow-300 pl-2">
                          <p className="italic">
                            "The poem speaks to our digital age where we're constantly connected yet still experience
                            profound loneliness."
                          </p>
                          <p className="text-xs text-gray-500 mt-1">— Contemporary Literary Analysis</p>
                        </div>
                        <div className="border-l-2 border-green-300 pl-2">
                          <p className="italic">
                            "Li Bai's work reminds us that despite technological advances, human emotions remain
                            remarkably consistent across centuries."
                          </p>
                          <p className="text-xs text-gray-500 mt-1">— Cultural Historian</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

