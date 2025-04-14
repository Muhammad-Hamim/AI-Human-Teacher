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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Brain,
  Trophy,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { useGetAiQuizQuery } from "@/redux/features/interactivePoem/deepSeekApi";
import { addQuizResult } from "@/redux/features/interactivePoem/userProgressSlice";
import ToggleLanguage from "@/components/common/ToggleLanguage";

interface Question {
  id: string;
  type: "multiple-choice" | "fill-blank" | "essay";
  question: string;
  options?: string[];
  correctAnswer: string;
  sampleAnswer?: string;
}

interface Quiz {
  difficulty: string;
  questions: Question[];
  adaptiveRecommendation?: string;
}

interface AiQuizProps {
  poem: any;
}

export default function AiQuiz({ poem }: AiQuizProps) {
  const [userKnowledgeLevel, setUserKnowledgeLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [language, setLanguage] = useState<"zh-CN" | "en-US">("zh-CN");
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [shouldFetchQuiz, setShouldFetchQuiz] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const dispatch = useAppDispatch();

  // Query for AI-generated quiz
  const {
    data: quizData,
    isFetching,
    error,
  } = useGetAiQuizQuery(
    {
      poemId: poem._id,
      language,
      knowledgeLevel: userKnowledgeLevel,
      numQuestions,
    },
    { skip: !shouldFetchQuiz }
  );

  // When data is received, update the state
  const handleGenerateQuiz = async () => {
    setShowResults(false);
    setUserAnswers([]);
    setShouldFetchQuiz(true);
  };

  // Reset fetch flag when data is received
  if (quizData && shouldFetchQuiz) {
    setQuiz(quizData.data.quiz);
    setShouldFetchQuiz(false);
  }

  // Handle answer selection
  const handleAnswerSelect = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Handle essay answer input
  const handleEssayInput = (questionIndex: number, answer: string) => {
    const newAnswers = [...userAnswers];
    newAnswers[questionIndex] = answer;
    setUserAnswers(newAnswers);
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    if (!quiz) return;

    let correctCount = 0;

    quiz.questions.forEach((question: Question, index: number) => {
      if (question.type === "essay") {
        // For essay questions, give credit if they wrote something substantial
        if (userAnswers[index] && userAnswers[index].length > 20) {
          correctCount += 0.5;
        }
      } else if (userAnswers[index] === question.correctAnswer) {
        correctCount++;
      }
    });

    const finalScore = Math.round(correctCount);
    setScore(finalScore);
    setShowResults(true);

    // Save quiz result to Redux store
    dispatch(
      addQuizResult({
        quizType: "AI-generated",
        score: finalScore,
        totalQuestions: quiz.questions.length,
        timestamp: Date.now(),
      })
    );
  };

  // Reset quiz
  const resetQuiz = () => {
    setShowResults(false);
    setUserAnswers([]);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">AI-Tailored Quiz</h2>
        <ToggleLanguage language={language} setLanguage={setLanguage} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Knowledge Assessment</CardTitle>
                <CardDescription>
                  Test your understanding with questions tailored to your
                  knowledge level
                </CardDescription>
              </div>

              {!quiz && (
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="knowledge-level"
                    className="whitespace-nowrap"
                  >
                    Knowledge Level:
                  </Label>
                  <select
                    id="knowledge-level"
                    value={userKnowledgeLevel}
                    onChange={(e) =>
                      setUserKnowledgeLevel(e.target.value as any)
                    }
                    className="p-2 rounded-md border bg-background"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>

                  <Label
                    htmlFor="num-questions"
                    className="whitespace-nowrap ml-4"
                  >
                    Questions:
                  </Label>
                  <select
                    id="num-questions"
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="p-2 rounded-md border bg-background"
                  >
                    <option value="3">3</option>
                    <option value="5">5</option>
                    <option value="8">8</option>
                    <option value="10">10</option>
                  </select>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!quiz ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Brain className="h-12 w-12 mb-4 text-primary opacity-70" />
                <p className="text-center mb-6">
                  Generate a quiz tailored to your knowledge level about this
                  poem
                </p>
                <Button
                  onClick={handleGenerateQuiz}
                  disabled={isFetching}
                  size="lg"
                >
                  {isFetching ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Quiz...
                    </>
                  ) : (
                    "Generate Quiz"
                  )}
                </Button>

                {error && (
                  <p className="text-red-500 mt-4">
                    Error generating quiz. Please try again.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-sm">
                    {quiz.difficulty.charAt(0).toUpperCase() +
                      quiz.difficulty.slice(1)}{" "}
                    Difficulty
                  </Badge>

                  {showResults && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">
                        Score: {score}/{quiz.questions.length} (
                        {Math.round((score / quiz.questions.length) * 100)}%)
                      </span>
                    </div>
                  )}
                </div>

                {quiz.questions.map((question, questionIndex) => (
                  <Card key={question.id} className="overflow-hidden">
                    <CardHeader className="p-4 pb-2 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          Question {questionIndex + 1}
                        </CardTitle>
                        {showResults &&
                          question.type !== "essay" &&
                          (userAnswers[questionIndex] ===
                          question.correctAnswer ? (
                            <CheckCircle className="text-green-500 h-5 w-5" />
                          ) : (
                            <XCircle className="text-red-500 h-5 w-5" />
                          ))}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <p className="mb-4">{question.question}</p>

                      {question.type === "multiple-choice" &&
                        question.options && (
                          <RadioGroup
                            value={userAnswers[questionIndex]}
                            onValueChange={(value) =>
                              handleAnswerSelect(questionIndex, value)
                            }
                            disabled={showResults}
                          >
                            <div className="space-y-2">
                              {question.options.map((option, optionIndex) => (
                                <div
                                  key={optionIndex}
                                  className="flex items-center space-x-2"
                                >
                                  <RadioGroupItem
                                    value={option}
                                    id={`q${questionIndex}-option${optionIndex}`}
                                  />
                                  <Label
                                    htmlFor={`q${questionIndex}-option${optionIndex}`}
                                    className={`flex-1 ${
                                      showResults &&
                                      option === question.correctAnswer
                                        ? "text-green-600 font-medium"
                                        : ""
                                    }`}
                                  >
                                    {option}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </RadioGroup>
                        )}

                      {question.type === "fill-blank" && (
                        <div className="space-y-2">
                          <Input
                            placeholder="Your answer..."
                            value={userAnswers[questionIndex] || ""}
                            onChange={(e) =>
                              handleAnswerSelect(questionIndex, e.target.value)
                            }
                            disabled={showResults}
                            className="max-w-md"
                          />

                          {showResults && (
                            <div className="text-sm">
                              <span className="font-medium">
                                Correct answer:
                              </span>{" "}
                              {question.correctAnswer}
                            </div>
                          )}
                        </div>
                      )}

                      {question.type === "essay" && (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Write your answer..."
                            value={userAnswers[questionIndex] || ""}
                            onChange={(e) =>
                              handleEssayInput(questionIndex, e.target.value)
                            }
                            disabled={showResults}
                            className="min-h-[100px]"
                          />

                          {showResults && question.sampleAnswer && (
                            <div className="mt-4 p-3 border rounded-md bg-muted/30">
                              <p className="font-medium text-sm mb-1">
                                Sample Answer:
                              </p>
                              <p className="text-sm">{question.sampleAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                <div className="flex justify-between">
                  {showResults ? (
                    <>
                      <Button variant="outline" onClick={resetQuiz}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                      <Button onClick={handleGenerateQuiz}>
                        <Brain className="mr-2 h-4 w-4" />
                        New Quiz
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={checkAnswers}
                      disabled={userAnswers.length < quiz.questions.length}
                      className="ml-auto"
                    >
                      Check Answers
                    </Button>
                  )}
                </div>

                {showResults && quiz.adaptiveRecommendation && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/30">
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      AI Recommendation
                    </h3>
                    <p>{quiz.adaptiveRecommendation}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
