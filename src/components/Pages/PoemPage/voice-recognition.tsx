/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Volume2,
  CheckCircle,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface VoiceRecognitionProps {
  poem: any;
}

export default function VoiceRecognition({ poem }: VoiceRecognitionProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [selectedLine, setSelectedLine] = useState<any>(null);
  const [selectedLineIndex, setSelectedLineIndex] = useState<number | null>(
    null
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [accuracy, setAccuracy] = useState<number>(0);
  const [practiceMode, setPracticeMode] = useState<"line" | "full">("line");

  const recognitionRef = useRef<any>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setFeedback(
        "Your browser doesn't support speech recognition. Try using Chrome."
      );
      return;
    }

    // Create speech recognition instance
    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();

    // Configure
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "zh-CN"; // Set language to Chinese

    // Event handlers
    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[0];
      const transcriptText = result[0].transcript;
      setTranscript(transcriptText);

      // If final result
      if (result.isFinal) {
        stopListening();
        evaluateRecitation(transcriptText);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setFeedback(`Error: ${event.error}`);
      stopListening();
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
    };

    // Set default line
    if (poem.lines && poem.lines.length > 0) {
      setSelectedLine(poem.lines[0]);
      setSelectedLineIndex(0);
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Start listening
  const startListening = () => {
    setTranscript("");
    setFeedback(null);

    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Stop listening
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // Evaluate recitation
  const evaluateRecitation = (transcriptText: string) => {
    let targetText = "";

    if (practiceMode === "line" && selectedLine) {
      targetText = selectedLine.chinese;
    } else if (practiceMode === "full") {
      targetText = poem.lines.map((line: any) => line.chinese).join("");
    }

    // Calculate similarity score
    const score = calculateSimilarity(transcriptText, targetText);
    setAccuracy(score);

    // Provide feedback
    if (score >= 90) {
      setFeedback("Excellent! Your pronunciation is very accurate.");
    } else if (score >= 70) {
      setFeedback("Good job! Your pronunciation is mostly correct.");
    } else if (score >= 50) {
      setFeedback("Keep practicing. Try to match the tones more closely.");
    } else {
      setFeedback("Try again. Focus on pronouncing each character clearly.");
    }
  };

  // Calculate similarity between two strings (simple version)
  const calculateSimilarity = (str1: string, str2: string): number => {
    // Remove spaces and punctuation
    const cleanStr1 = str1.replace(/[^\u4e00-\u9fa5]/g, "");
    const cleanStr2 = str2.replace(/[^\u4e00-\u9fa5]/g, "");

    // Count matching characters
    let matches = 0;
    const minLength = Math.min(cleanStr1.length, cleanStr2.length);

    for (let i = 0; i < minLength; i++) {
      if (cleanStr1[i] === cleanStr2[i]) {
        matches++;
      }
    }

    // Calculate percentage
    return Math.round((matches / cleanStr2.length) * 100);
  };

  // Speak text
  const speak = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.5;
    utterance.pitch = 1;

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
    );

    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    window.speechSynthesis.speak(utterance);
  };

  // Select a line
  const selectLine = (line: any, index: number) => {
    setSelectedLine(line);
    setSelectedLineIndex(index);
    setTranscript("");
    setFeedback(null);
    setAccuracy(0);
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Voice Recognition Practice</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Practice Mode</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={practiceMode === "line" ? "default" : "outline"}
                  onClick={() => setPracticeMode("line")}
                  className="flex-1"
                >
                  Line by Line
                </Button>
                <Button
                  variant={practiceMode === "full" ? "default" : "outline"}
                  onClick={() => setPracticeMode("full")}
                  className="flex-1"
                >
                  Full Poem
                </Button>
              </div>

              {practiceMode === "line" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Select a line to practice:
                  </h3>

                  <div className="space-y-2">
                    {poem.lines.map((line: any, index: number) => (
                      <Button
                        key={index}
                        variant={
                          selectedLineIndex === index ? "default" : "outline"
                        }
                        className="w-full justify-start h-auto py-2"
                        onClick={() => selectLine(line, index)}
                      >
                        <div className="text-left">
                          <div className="font-medium">{line.chinese}</div>
                          <div className="text-xs opacity-70">
                            {line.pinyin}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {practiceMode === "full" && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Full poem practice:</h3>

                  <div className="border rounded-md p-3 space-y-2">
                    {poem.lines.map((line: any, index: number) => (
                      <div key={index} className="space-y-1">
                        <div className="font-medium">{line.chinese}</div>
                        <div className="text-xs text-gray-500">
                          {line.pinyin}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    speak(
                      practiceMode === "line"
                        ? selectedLine.chinese
                        : poem.lines.map((line: any) => line.chinese).join("")
                    )
                  }
                >
                  <Volume2 size={16} className="mr-2" />
                  Listen to Pronunciation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2 bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Voice Recognition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="border border-gray-700 rounded-md p-4 bg-gray-900">
                <h3 className="text-sm font-medium text-gray-200 mb-2">
                  Target Text:
                </h3>
                <p className="text-lg text-gray-100">
                  {practiceMode === "line"
                    ? selectedLine?.chinese
                    : poem.lines.map((line: any) => line.chinese).join("")}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {practiceMode === "line"
                    ? selectedLine?.pinyin
                    : poem.lines.map((line: any) => line.pinyin).join(" ")}
                </p>
              </div>

              <div className="border border-gray-700 rounded-md p-4 min-h-[100px] relative bg-gray-800">
                <h3 className="text-sm font-medium mb-2 text-gray-200">
                  Your Speech:
                </h3>
                {transcript ? (
                  <p className="text-lg text-gray-100">{transcript}</p>
                ) : (
                  <p className="text-gray-400 italic">
                    {isListening
                      ? "Listening..."
                      : "Press the microphone button and speak"}
                  </p>
                )}

                {isListening && (
                  <div className="absolute top-2 right-2">
                    <div className="animate-pulse">
                      <Badge
                        variant="outline"
                        className="bg-red-900 border-red-700 text-red-200"
                      >
                        Recording
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {feedback && (
                <div
                  className={`border rounded-md p-4 ${
                    accuracy >= 70
                      ? "bg-green-900 border-green-700"
                      : accuracy >= 50
                      ? "bg-yellow-900 border-yellow-700"
                      : "bg-red-900 border-red-700"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-200">
                      Feedback:
                    </h3>
                    {accuracy >= 70 ? (
                      <CheckCircle size={16} className="text-green-400" />
                    ) : (
                      <XCircle size={16} className="text-red-400" />
                    )}
                  </div>
                  <p className="text-gray-200">{feedback}</p>

                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Accuracy</span>
                      <span>{accuracy}%</span>
                    </div>
                    <Progress value={accuracy} className="h-2" />
                  </div>
                </div>
              )}

              <div className="flex justify-center pt-4">
                {isListening ? (
                  <Button
                    variant="destructive"
                    size="lg"
                    className="rounded-full h-16 w-16"
                    onClick={stopListening}
                  >
                    <MicOff size={24} />
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="lg"
                    className="rounded-full h-16 w-16"
                    onClick={startListening}
                  >
                    <Mic size={24} />
                  </Button>
                )}
              </div>

              {feedback && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTranscript("");
                      setFeedback(null);
                      setAccuracy(0);
                    }}
                  >
                    <RefreshCw size={16} className="mr-2" />
                    Try Again
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
