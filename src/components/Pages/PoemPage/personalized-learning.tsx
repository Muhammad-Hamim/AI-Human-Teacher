"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BookOpen, PenTool, Mic, Brain, Trophy, BarChart, Calendar } from "lucide-react"
import { useAppSelector } from "@/redux/hooks"

interface PersonalizedLearningProps {
  poem: any
}

export default function PersonalizedLearning({ poem }: PersonalizedLearningProps) {
  const userProgress = useAppSelector((state) => state.userProgress)
  const [recommendations, setRecommendations] = useState<string[]>([])

  // Generate recommendations based on user progress
  useEffect(() => {
    const newRecommendations = []

    // Check writing skill
    if (userProgress.skillLevels.writing < 5) {
      newRecommendations.push("Practice writing more characters to improve your calligraphy skills")
    }

    // Check speaking skill
    if (userProgress.skillLevels.speaking < 5) {
      newRecommendations.push("Continue pronunciation practice to improve your speaking accuracy")
    }

    // Check comprehension skill
    if (userProgress.skillLevels.comprehension < 5) {
      newRecommendations.push("Take more quizzes to strengthen your understanding of poem themes and vocabulary")
    }

    // Add general recommendations
    newRecommendations.push("Explore more poems from the Tang Dynasty to understand Li Bai's style better")
    newRecommendations.push("Try the creative writing feature to compose your own poem in a similar style")

    setRecommendations(newRecommendations)
  }, [userProgress])

  // Format date for activity log
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Personalized Learning</h2>

      <Tabs defaultValue="progress">
        <TabsList className="mb-6">
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="progress">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Skill Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-500" />
                        <span>Reading</span>
                      </div>
                      <span className="text-sm font-medium">{userProgress.skillLevels.reading.toFixed(1)}/10</span>
                    </div>
                    <Progress value={userProgress.skillLevels.reading * 10} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-green-500" />
                        <span>Writing</span>
                      </div>
                      <span className="text-sm font-medium">{userProgress.skillLevels.writing.toFixed(1)}/10</span>
                    </div>
                    <Progress value={userProgress.skillLevels.writing * 10} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Mic className="h-4 w-4 text-red-500" />
                        <span>Speaking</span>
                      </div>
                      <span className="text-sm font-medium">{userProgress.skillLevels.speaking.toFixed(1)}/10</span>
                    </div>
                    <Progress value={userProgress.skillLevels.speaking * 10} className="h-2" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-500" />
                        <span>Comprehension</span>
                      </div>
                      <span className="text-sm font-medium">
                        {userProgress.skillLevels.comprehension.toFixed(1)}/10
                      </span>
                    </div>
                    <Progress value={userProgress.skillLevels.comprehension * 10} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5 text-blue-500" />
                  Performance Statistics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Quiz Performance</h3>
                    <div className="h-32 flex items-end gap-2">
                      {userProgress.quizResults.length > 0 ? (
                        userProgress.quizResults.map((result, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-primary w-full rounded-t-sm"
                              style={{ height: `${(result.score / result.totalQuestions) * 100}%` }}
                            ></div>
                            <span className="text-xs mt-1">{index + 1}</span>
                          </div>
                        ))
                      ) : (
                        <div className="w-full flex items-center justify-center text-muted-foreground">
                          No quiz data yet
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Pronunciation Accuracy</h3>
                    <div className="h-32 flex items-end gap-2">
                      {userProgress.pronunciationResults.length > 0 ? (
                        userProgress.pronunciationResults.map((result, index) => (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div
                              className="bg-red-500 w-full rounded-t-sm"
                              style={{ height: `${result.accuracy}%` }}
                            ></div>
                            <span className="text-xs mt-1">{index + 1}</span>
                          </div>
                        ))
                      ) : (
                        <div className="w-full flex items-center justify-center text-muted-foreground">
                          No pronunciation data yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Learning Achievements</CardTitle>
              <CardDescription>Track your progress and unlock achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                <div className="border rounded-md p-4 flex flex-col items-center text-center">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${userProgress.quizResults.length >= 5 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Brain className="h-8 w-8" />
                  </div>
                  <h3 className="font-medium">Quiz Master</h3>
                  <p className="text-xs text-muted-foreground mt-1">Complete 5 quizzes</p>
                  <Badge variant="outline" className="mt-2">
                    {userProgress.quizResults.length}/5
                  </Badge>
                </div>

                <div className="border rounded-md p-4 flex flex-col items-center text-center">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${userProgress.pronunciationResults.length >= 10 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    <Mic className="h-8 w-8" />
                  </div>
                  <h3 className="font-medium">Fluent Speaker</h3>
                  <p className="text-xs text-muted-foreground mt-1">Practice pronunciation 10 times</p>
                  <Badge variant="outline" className="mt-2">
                    {userProgress.pronunciationResults.length}/10
                  </Badge>
                </div>

                <div className="border rounded-md p-4 flex flex-col items-center text-center">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${userProgress.writingPractice.length >= 15 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    <PenTool className="h-8 w-8" />
                  </div>
                  <h3 className="font-medium">Calligraphy Expert</h3>
                  <p className="text-xs text-muted-foreground mt-1">Practice writing 15 characters</p>
                  <Badge variant="outline" className="mt-2">
                    {userProgress.writingPractice.length}/15
                  </Badge>
                </div>

                <div className="border rounded-md p-4 flex flex-col items-center text-center">
                  <div
                    className={`h-16 w-16 rounded-full flex items-center justify-center mb-2 ${userProgress.completedLessons.length >= 3 ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-400"}`}
                  >
                    <BookOpen className="h-8 w-8" />
                  </div>
                  <h3 className="font-medium">Poetry Scholar</h3>
                  <p className="text-xs text-muted-foreground mt-1">Complete 3 poem lessons</p>
                  <Badge variant="outline" className="mt-2">
                    {userProgress.completedLessons.length}/3
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle>Personalized Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions based on your learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="border rounded-md p-4 flex items-start gap-3">
                    <div className="bg-primary/10 rounded-full p-2 text-primary">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <p>{recommendation}</p>
                    </div>
                  </div>
                ))}

                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Suggested Learning Path</h3>

                  <div className="relative border-l-2 border-primary/30 pl-6 ml-4 space-y-6">
                    <div className="relative">
                      <div className="absolute w-4 h-4 bg-primary rounded-full -left-[1.65rem] top-0"></div>
                      <h4 className="font-medium">Master Basic Vocabulary</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Focus on the key vocabulary in this poem, especially the nature-related terms
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute w-4 h-4 bg-primary/60 rounded-full -left-[1.65rem] top-0"></div>
                      <h4 className="font-medium">Improve Pronunciation</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Practice reciting the poem with attention to tones and rhythm
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute w-4 h-4 bg-primary/30 rounded-full -left-[1.65rem] top-0"></div>
                      <h4 className="font-medium">Explore Related Poems</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Study other poems by Li Bai that share similar themes of nostalgia
                      </p>
                    </div>

                    <div className="relative">
                      <div className="absolute w-4 h-4 bg-gray-300 rounded-full -left-[1.65rem] top-0"></div>
                      <h4 className="font-medium">Create Your Own Poem</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Apply what you've learned to compose a poem in a similar style
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Learning Activity</CardTitle>
              <CardDescription>Track your recent learning activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userProgress.quizResults.length > 0 &&
                  userProgress.quizResults.map((result, index) => (
                    <div key={`quiz-${index}`} className="flex items-center gap-4 p-3 border-b">
                      <div className="bg-blue-100 text-blue-700 p-2 rounded-full">
                        <Brain className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Completed a {result.quizType} quiz</p>
                        <p className="text-sm text-muted-foreground">
                          Score: {result.score}/{result.totalQuestions} (
                          {Math.round((result.score / result.totalQuestions) * 100)}%)
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                  ))}

                {userProgress.pronunciationResults.length > 0 &&
                  userProgress.pronunciationResults.map((result, index) => (
                    <div key={`pron-${index}`} className="flex items-center gap-4 p-3 border-b">
                      <div className="bg-red-100 text-red-700 p-2 rounded-full">
                        <Mic className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Practiced pronunciation</p>
                        <p className="text-sm text-muted-foreground">
                          Text: "{result.text}" - Accuracy: {result.accuracy}%
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(result.timestamp)}
                      </div>
                    </div>
                  ))}

                {userProgress.writingPractice.length > 0 &&
                  userProgress.writingPractice.map((practice, index) => (
                    <div key={`write-${index}`} className="flex items-center gap-4 p-3 border-b">
                      <div className="bg-green-100 text-green-700 p-2 rounded-full">
                        <PenTool className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Practiced writing character</p>
                        <p className="text-sm text-muted-foreground">
                          Character: {practice.character} - Attempts: {practice.attempts}
                        </p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(practice.lastPracticed)}
                      </div>
                    </div>
                  ))}

                {userProgress.completedLessons.length > 0 &&
                  userProgress.completedLessons.map((lesson, index) => (
                    <div key={`lesson-${index}`} className="flex items-center gap-4 p-3 border-b">
                      <div className="bg-purple-100 text-purple-700 p-2 rounded-full">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Completed lesson</p>
                        <p className="text-sm text-muted-foreground">{lesson}</p>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Recent
                      </div>
                    </div>
                  ))}

                {userProgress.quizResults.length === 0 &&
                  userProgress.pronunciationResults.length === 0 &&
                  userProgress.writingPractice.length === 0 &&
                  userProgress.completedLessons.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                      <Calendar className="h-12 w-12 mb-4 opacity-30" />
                      <p>No activity recorded yet</p>
                      <p className="text-sm mt-1">Start learning to track your progress</p>
                    </div>
                  )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

