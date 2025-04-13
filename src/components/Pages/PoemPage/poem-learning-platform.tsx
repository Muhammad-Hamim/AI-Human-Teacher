/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
  Settings,
  BookOpen,
  PenTool,
  Brain,
  Mic,
  Image,
  Sparkles,
  Keyboard,
  Volume2,
  History,
  HelpCircle,
} from "lucide-react";

import { useAppSelector } from "@/redux/hooks";
import PoemReader from "./poem-reader";
import VirtualStoryteller from "./virtual-storyteller";
import WritingPractice from "./writing-practice";
import AiQuiz from "./ai-quiz";
import LanguageExercises from "./language-exercises";
import CulturalInsights from "./cultural-insights";
import AiAnalysis from "./ai-analysis";
import VoiceRecognition from "./voice-recognition";
import ImagerySymbolism from "./imagery-symbolism";
import KnowledgeBase from "./knowledge-base";
import CreativeWriting from "./creative-writing";
import PersonalizedLearning from "./personalized-learning";

interface PoemLearningPlatformProps {
  poem: any;
}

type FontSize = "small" | "medium" | "large";

export default function PoemLearningPlatform({
  poem,
}: PoemLearningPlatformProps) {
  const [activeTab, setActiveTab] = useState("read");
  const [showAiFeatures, setShowAiFeatures] = useState<Record<string, boolean>>(
    {
      storyteller: false,
      culturalInsights: false,
      knowledgeBase: false,
      aiQuiz: false,
    }
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const themeMode = useAppSelector((state) => state.theme.mode);
  const fontSize = useAppSelector((state) => state.theme.fontSize);
  const highContrast = useAppSelector((state) => state.theme.highContrast);

  // Apply font size class based on Redux state
  const fontSizeClass = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg",
  }[fontSize as FontSize];

  // Apply high contrast class if enabled
  const contrastClass = highContrast ? "high-contrast" : "";

  // Toggle AI feature visibility
  const toggleAiFeature = (feature: string) => {
    setShowAiFeatures((prev) => ({
      ...prev,
      [feature]: !prev[feature],
    }));
  };

  return (
    <Card
      className={`bg-card text-card-foreground shadow-xl overflow-hidden ${fontSizeClass} ${contrastClass}`}
    >
      <div className="p-4 bg-gray-900 text-white text-primary-foreground">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{poem.title}</h2>
            <p className="text-sm opacity-90">
              {poem.author} · {poem.dynasty}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Settings className="h-[1.2rem] w-[1.2rem]" />
              <span className="sr-only">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      <Tabs
        defaultValue="read"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="border-b sticky top-0 bg-background z-10">
          <TabsList className="w-full h-auto p-0 bg-transparent justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger
              value="read"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <BookOpen className="h-4 w-4" />
              Reading
            </TabsTrigger>
            <TabsTrigger
              value="write"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <PenTool className="h-4 w-4" />
              Writing
            </TabsTrigger>
            <TabsTrigger
              value="exercises"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <Brain className="h-4 w-4" />
              Exercises
            </TabsTrigger>
            <TabsTrigger
              value="voice"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <Mic className="h-4 w-4" />
              Voice
            </TabsTrigger>
            <TabsTrigger
              value="imagery"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <Image className="h-4 w-4" />
              Imagery
            </TabsTrigger>
            <TabsTrigger
              value="ai"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <Sparkles className="h-4 w-4" />
              AI Analysis
            </TabsTrigger>
            <TabsTrigger
              value="creative"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <Keyboard className="h-4 w-4" />
              Creative
            </TabsTrigger>
            <TabsTrigger
              value="personal"
              className="py-3 px-4 data-[state=active]:bg-muted data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none flex items-center gap-1"
            >
              <BookOpen className="h-4 w-4" />
              My Learning
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 bg-muted/30 border-b flex flex-wrap gap-2">
          <Button
            variant={showAiFeatures.storyteller ? "default" : "outline"}
            size="sm"
            onClick={() => toggleAiFeature("storyteller")}
            className="flex items-center gap-1"
          >
            <Volume2 className="h-4 w-4" />
            Virtual Storyteller
          </Button>
          <Button
            variant={showAiFeatures.culturalInsights ? "default" : "outline"}
            size="sm"
            onClick={() => toggleAiFeature("culturalInsights")}
            className="flex items-center gap-1"
          >
            <History className="h-4 w-4" />
            Cultural Insights
          </Button>
          <Button
            variant={showAiFeatures.knowledgeBase ? "default" : "outline"}
            size="sm"
            onClick={() => toggleAiFeature("knowledgeBase")}
            className="flex items-center gap-1"
          >
            <HelpCircle className="h-4 w-4" />
            Knowledge Base
          </Button>
          <Button
            variant={showAiFeatures.aiQuiz ? "default" : "outline"}
            size="sm"
            onClick={() => toggleAiFeature("aiQuiz")}
            className="flex items-center gap-1"
          >
            <Brain className="h-4 w-4" />
            AI Quiz
          </Button>
        </div>

        <TabsContent value="read" className="m-0">
          <PoemReader poem={poem} />
          {showAiFeatures.storyteller && <VirtualStoryteller poem={poem} />}
        </TabsContent>

        <TabsContent value="write" className="m-0">
          <WritingPractice poem={poem} />
        </TabsContent>

        <TabsContent value="exercises" className="m-0">
          <LanguageExercises poem={poem} />
          {showAiFeatures.aiQuiz && <AiQuiz poem={poem} />}
        </TabsContent>

        <TabsContent value="voice" className="m-0">
          <VoiceRecognition poem={poem} />
        </TabsContent>

        <TabsContent value="imagery" className="m-0">
          <ImagerySymbolism poem={poem} />
          {showAiFeatures.culturalInsights && <CulturalInsights poem={poem} />}
        </TabsContent>

        <TabsContent value="ai" className="m-0">
          <AiAnalysis poemId={poem._id} />
          {showAiFeatures.knowledgeBase && <KnowledgeBase poem={poem} />}
        </TabsContent>

        <TabsContent value="creative" className="m-0">
          <CreativeWriting poem={poem} />
        </TabsContent>

        <TabsContent value="personal" className="m-0">
          <PersonalizedLearning poem={poem} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
