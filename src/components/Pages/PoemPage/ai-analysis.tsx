/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Lightbulb,
  Sparkles,
  BookOpen,
  Globe,
  History,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import MarkdownRenderer from "@/components/common/MarkdownRenderer";

interface AiAnalysisProps {
  poem: any;
}

// Default data to use if the poem doesn't have AI analysis fields
const defaultAnalysis = {
  emotionalTone:
    "This poem conveys a rich emotional journey that resonates across cultures and time periods.",
  literaryTechniques:
    "The poem employs several powerful literary techniques including vivid imagery and metaphor.",
  modernRelevance:
    "Though ancient in origin, this poem speaks to universal human experiences still relevant today.",
};

export default function AiAnalysis({ poem }: AiAnalysisProps) {
  const [activeTab, setActiveTab] = useState("emotional");
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiConversation, setAiConversation] = useState<
    { role: string; content: string }[]
  >([]);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Get AI analysis data from poem or use defaults
  const analysis = {
    emotionalTone:
      poem?.aiPoweredAnalysis?.emotionalTone || defaultAnalysis.emotionalTone,
    literaryTechniques:
      poem?.aiPoweredAnalysis?.literaryTechniques ||
      defaultAnalysis.literaryTechniques,
    modernRelevance:
      poem?.aiPoweredAnalysis?.modernRelevance ||
      defaultAnalysis.modernRelevance,
  };

  // Extract emotional themes if available
  const emotionalThemes = poem?.aiPoweredAnalysis?.emotionalThemes || [
    { name: "Nostalgia", intensity: "Strong", color: "blue" },
    { name: "Loneliness", intensity: "Moderate", color: "purple" },
    { name: "Tranquility", intensity: "Subtle", color: "green" },
    { name: "Reflection", intensity: "Strong", color: "yellow" },
  ];

  // Extract literary devices if available
  const literaryDevices = poem?.aiPoweredAnalysis?.literaryDevices || [
    {
      name: "Metaphor",
      description:
        "The moonlight is compared to frost on the ground, creating a visual connection between the two white, luminous elements.",
      color: "yellow",
    },
    {
      name: "Contrast",
      description:
        "The poet uses the contrast between looking up (at the moon) and looking down (thinking of home) to create emotional depth.",
      color: "green",
    },
    {
      name: "Imagery",
      description:
        "Vivid visual imagery of moonlight, frost, and the physical actions of looking up and down create a clear mental picture.",
      color: "blue",
    },
  ];

  // Handle AI question submission
  const handleAskAi = () => {
    if (aiQuestion.trim()) {
      setAiConversation((prev) => [
        ...prev,
        { role: "user", content: aiQuestion },
      ]);
      setIsAiThinking(true);

      // Simulate AI response (in a real app, this would be an API call)
      setTimeout(() => {
        const responses = [
          "This poem uses **imagery** to evoke feelings of *nostalgia* and contemplation. The author crafts a scene that invites readers to reflect on their own experiences.",
          "The poem's structure creates a rhythmic flow that mirrors its thematic exploration of time and memory. Here are key elements:\n\n- Precise language\n- Evocative imagery\n- Balanced structure",
          "Looking at the historical context, this poem was written during a period of significant cultural transition, which is reflected in its themes of change and constancy.\n\n> The poet captures both personal emotion and universal experience in these few lines.",
          "The imagery in this poem connects to universal human experiences, making it resonate across different time periods and cultures. Consider how the poet uses:\n\n1. Natural imagery\n2. Contrasting elements\n3. Subtle emotional cues",
        ];

        const randomResponse =
          responses[Math.floor(Math.random() * responses.length)];

        setAiConversation((prev) => [
          ...prev,
          { role: "assistant", content: randomResponse },
        ]);
        setIsAiThinking(false);
        setAiQuestion("");
      }, 1500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAskAi();
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">AI-Powered Analysis</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6 grid grid-cols-1 md:grid-cols-4">
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
          <TabsTrigger value="ask" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Ask AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="emotional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Emotional Analysis
              </CardTitle>
              <CardDescription>
                AI analysis of the emotional tone and impact of the poem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{analysis.emotionalTone}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        Emotional Journey
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2">
                        {poem?.aiPoweredAnalysis?.emotionalJourney ? (
                          // Render dynamic emotional journey if available
                          poem.aiPoweredAnalysis.emotionalJourney.map(
                            (emotion: any, index: number) => (
                              <div key={index}>
                                <div className="flex items-center justify-between">
                                  <span>{emotion.name}</span>
                                  <Badge variant="outline">
                                    Lines {emotion.lines}
                                  </Badge>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full bg-${
                                      emotion.color || "blue"
                                    }-400`}
                                    style={{
                                      width: `${emotion.intensity || 50}%`,
                                    }}
                                  ></div>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          // Default emotional journey
                          <>
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-base">
                        Key Emotional Themes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="grid grid-cols-2 gap-2">
                        {emotionalThemes.map((theme: any, index: number) => (
                          <motion.div
                            key={index}
                            className="border rounded-md p-2 flex flex-col items-center justify-center text-center"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Badge
                              className={`mb-1 bg-${
                                theme.color || "blue"
                              }-100 text-${
                                theme.color || "blue"
                              }-800 hover:bg-${theme.color || "blue"}-100`}
                            >
                              {theme.name}
                            </Badge>
                            <span className="text-sm">
                              {theme.intensity} presence
                            </span>
                          </motion.div>
                        ))}
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
              <CardDescription>
                Analysis of the poetic devices and techniques used in the poem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{analysis.literaryTechniques}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Poetic Devices</h3>

                    <div className="space-y-3">
                      {literaryDevices.map((device: any, index: number) => (
                        <motion.div
                          key={index}
                          className="border rounded-md p-3"
                          whileHover={{
                            y: -5,
                            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Sparkles
                              size={16}
                              className={`text-${device.color || "yellow"}-500`}
                            />
                            <h4 className="font-medium">{device.name}</h4>
                          </div>
                          <p className="text-sm">{device.description}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Structural Analysis</h3>

                    {poem?.aiPoweredAnalysis?.structure ? (
                      // Dynamic structure if available
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">
                          Form: {poem.aiPoweredAnalysis.structure.form}
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {poem.aiPoweredAnalysis.structure.characteristics.map(
                            (item: string, i: number) => (
                              <li key={i}>{item}</li>
                            )
                          )}
                        </ul>
                      </div>
                    ) : (
                      // Default structure
                      <div className="border rounded-md p-4">
                        <h4 className="font-medium mb-2">
                          Form: 五言绝句 (Five-character quatrain)
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>Four lines with five characters each</li>
                          <li>
                            Follows traditional Tang dynasty poetic structure
                          </li>
                          <li>
                            Concise form that requires precision and economy of
                            language
                          </li>
                        </ul>

                        <h4 className="font-medium mt-4 mb-2">
                          Rhythm Pattern
                        </h4>
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
                            <motion.div
                              key={i}
                              className={`p-1 rounded ${
                                tone === "平" ? "bg-blue-100" : "bg-red-100"
                              }`}
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.1 }}
                            >
                              {tone}
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
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
              <CardDescription>
                How this ancient poem connects to contemporary experiences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="prose max-w-none">
                  <p className="text-lg">{analysis.modernRelevance}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <MessageSquare size={18} className="text-blue-500" />
                        <CardTitle className="text-base">
                          Contemporary Parallels
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      {poem?.aiPoweredAnalysis?.contemporaryParallels ? (
                        // Dynamic contemporary parallels if available
                        <ul className="space-y-2 text-sm">
                          {poem.aiPoweredAnalysis.contemporaryParallels.map(
                            (parallel: string, i: number) => (
                              <motion.li
                                key={i}
                                className="flex items-start gap-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                              >
                                <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {i + 1}
                                </span>
                                <span>{parallel}</span>
                              </motion.li>
                            )
                          )}
                        </ul>
                      ) : (
                        // Default contemporary parallels
                        <ul className="space-y-2 text-sm">
                          {[
                            "International students and workers separated from family",
                            "Digital communication connecting distant loved ones",
                            "Universal experience of homesickness and nostalgia",
                          ].map((text, i) => (
                            <motion.li
                              key={i}
                              className="flex items-start gap-2"
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.1 }}
                            >
                              <span className="bg-blue-100 text-blue-800 rounded-full h-5 w-5 flex items-center justify-center flex-shrink-0 mt-0.5">
                                {i + 1}
                              </span>
                              <span>{text}</span>
                            </motion.li>
                          ))}
                        </ul>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <History size={18} className="text-purple-500" />
                        <CardTitle className="text-base">
                          Historical Context vs. Today
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-2 text-sm">
                        {poem?.aiPoweredAnalysis?.historicalComparisons ? (
                          // Dynamic historical comparisons if available
                          poem.aiPoweredAnalysis.historicalComparisons.map(
                            (comparison: any, i: number) => (
                              <div
                                key={i}
                                className="flex items-center justify-between"
                              >
                                <span>{comparison.aspect}</span>
                                <div className="flex">
                                  <span className="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                                    Then: {comparison.then}
                                  </span>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded ml-1">
                                    Now: {comparison.now}
                                  </span>
                                </div>
                              </div>
                            )
                          )
                        ) : (
                          // Default historical comparisons
                          <>
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
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb size={18} className="text-yellow-500" />
                        <CardTitle className="text-base">
                          Modern Interpretations
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="space-y-3 text-sm">
                        {poem?.aiPoweredAnalysis?.modernInterpretations ? (
                          // Dynamic modern interpretations if available
                          poem.aiPoweredAnalysis.modernInterpretations.map(
                            (interp: any, i: number) => (
                              <motion.div
                                key={i}
                                className={`border-l-2 border-${
                                  interp.color || "yellow"
                                }-300 pl-2`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.2 }}
                              >
                                <p className="italic">{interp.quote}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  — {interp.attribution}
                                </p>
                              </motion.div>
                            )
                          )
                        ) : (
                          // Default modern interpretations
                          <>
                            <motion.div
                              className="border-l-2 border-yellow-300 pl-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                            >
                              <p className="italic">
                                "The poem speaks to our digital age where we're
                                constantly connected yet still experience
                                profound loneliness."
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                — Contemporary Literary Analysis
                              </p>
                            </motion.div>
                            <motion.div
                              className="border-l-2 border-green-300 pl-2"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                            >
                              <p className="italic">
                                "Li Bai's work reminds us that despite
                                technological advances, human emotions remain
                                remarkably consistent across centuries."
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                — Cultural Historian
                              </p>
                            </motion.div>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ask">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare size={20} className="text-violet-500" />
                Ask AI About This Poem
              </CardTitle>
              <CardDescription>
                Have a conversation with our AI about any aspect of this poem
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 h-[300px] overflow-y-auto">
                  {aiConversation.length === 0 ? (
                    <div className="text-center text-gray-500 py-10">
                      <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                      <p>Ask a question about this poem to get started</p>
                      <p className="text-sm mt-2">
                        Examples: "What themes are in this poem?" or "Explain
                        the metaphors"
                      </p>
                    </div>
                  ) : (
                    aiConversation.map((message, i) => (
                      <motion.div
                        key={i}
                        className={`mb-3 ${
                          message.role === "user" ? "text-right" : "text-left"
                        }`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div
                          className={`inline-block rounded-lg px-4 py-2 max-w-[80%] ${
                            message.role === "user"
                              ? "bg-violet-600 text-white"
                              : "bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          }`}
                        >
                          {message.role === "user" ? (
                            message.content
                          ) : (
                            <MarkdownRenderer
                              content={message.content}
                              className="text-left"
                            />
                          )}
                        </div>
                      </motion.div>
                    ))
                  )}

                  {isAiThinking && (
                    <div className="flex items-center space-x-2 text-gray-500 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <p>AI is thinking...</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Textarea
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ask a question about this poem..."
                    className="flex-1"
                    onKeyDown={handleKeyDown}
                    disabled={isAiThinking}
                  />
                  <Button
                    onClick={handleAskAi}
                    className="bg-violet-600 hover:bg-violet-700"
                    disabled={!aiQuestion.trim() || isAiThinking}
                  >
                    {isAiThinking ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  <p>
                    You can ask about literary devices, themes, historical
                    context, or interpretations
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
