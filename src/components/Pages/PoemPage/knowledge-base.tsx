/* eslint-disable @typescript-eslint/no-explicit-any */
import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, BookOpen, User, Bot } from "lucide-react"
import { useGetMockKnowledgeBaseAnswerMutation } from "@/redux/features/interactivePoem/deepSeekApi"

interface KnowledgeBaseProps {
  poem: any
}

export default function KnowledgeBase({ poem }: KnowledgeBaseProps) {
  const [question, setQuestion] = useState("")
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const chatEndRef = useRef<HTMLDivElement>(null)

  // Use mock mutation for development
  const [askQuestion, { isLoading }] = useGetMockKnowledgeBaseAnswerMutation()

  // Handle asking a question
  const handleAskQuestion = async () => {
    if (!question.trim()) return

    // Add user question to chat history
    setChatHistory((prev) => [...prev, { role: "user", content: question }])

    try {
      const result = await askQuestion({
        question,
        poemContext: poem.title,
        authorContext: poem.author,
      }).unwrap()

      // Add AI response to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: result.answer,
          sources: result.sources,
        },
      ])

      // Clear input
      setQuestion("")

      // Scroll to bottom
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
      }, 100)
    } catch (error) {
      console.error("Error asking question:", error)

      // Add error message to chat history
      setChatHistory((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I couldn't process your question. Please try again.",
          error: true,
        },
      ])
    }
  }

  // Handle key press (Enter to submit)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleAskQuestion()
    }
  }

  // Suggested questions
  const suggestedQuestions = [
    "Who was Li Bai?",
    "What is the significance of the moon in Chinese poetry?",
    "What are the characteristics of Tang Dynasty poetry?",
    "How does this poem reflect Chinese cultural values?",
  ]

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Knowledge Base</h2>

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Ask About Chinese Poetry</CardTitle>
            <CardDescription>
              Get instant answers about poems, poets, literary techniques, and cultural context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col h-[500px]">
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {chatHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <BookOpen className="h-12 w-12 mb-4 opacity-30" />
                    <p>Ask a question about Chinese poetry or this poem</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-md">
                      {suggestedQuestions.map((q, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start h-auto py-2 text-left"
                          onClick={() => {
                            setQuestion(q)
                            setTimeout(() => handleAskQuestion(), 100)
                          }}
                        >
                          {q}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  chatHistory.map((message, index) => (
                    <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : message.error
                              ? "bg-destructive text-destructive-foreground"
                              : "bg-muted"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                          <span className="text-xs font-medium">
                            {message.role === "user" ? "You" : "AI Assistant"}
                          </span>
                        </div>
                        <p className="whitespace-pre-line">{message.content}</p>

                        {message.sources && (
                          <div className="mt-2 pt-2 border-t border-primary-foreground/20 text-xs">
                            <p className="font-medium mb-1">Sources:</p>
                            <ul className="list-disc list-inside space-y-1">
                              {message.sources.map((source: string, i: number) => (
                                <li key={i}>{source}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Ask a question about Chinese poetry..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                />
                <Button onClick={handleAskQuestion} disabled={!question.trim() || isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

