/* eslint-disable @typescript-eslint/no-explicit-any */
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
  AlertTriangle,
} from "lucide-react";
import { compareText } from "@/utils/compareText";

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
  const [unmatchedChars, setUnmatchedChars] = useState<string[]>([]);
  const [currentTranscriptText, setCurrentTranscriptText] =
    useState<string>("");

  const recognitionRef = useRef<any>(null);

  // Function to check if a character is Chinese
  const isChineseChar = (char: string): boolean => {
    const code = char.charCodeAt(0);
    return (
      (code >= 0x4e00 && code <= 0x9fff) || // CJK Unified Ideographs
      (code >= 0x3400 && code <= 0x4dbf) || // CJK Unified Ideographs Extension A
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
      (code >= 0x3300 && code <= 0x33ff) || // CJK Compatibility
      (code >= 0xfe30 && code <= 0xfe4f) || // CJK Compatibility Forms
      (code >= 0xf900 && code <= 0xfaff) || // CJK Compatibility Ideographs
      (code >= 0x2f800 && code <= 0x2fa1f) // CJK Compatibility Ideographs Supplement
    );
  };

  // Function to filter out non-Chinese characters
  const filterChineseOnly = (text: string): string => {
    return text.split("").filter(isChineseChar).join("");
  };

  // Initialize speech recognition
  useEffect(() => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setFeedback(
        "Your browser doesn't support speech recognition. Try using Chrome."
      );
      return;
    }

    const SpeechRecognition =
      window.webkitSpeechRecognition || window.SpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = "zh-CN";
    recognitionRef.current.maxAlternatives = 1;

    recognitionRef.current.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcriptText = result[0].transcript;

      // Filter to keep only Chinese characters
      const chineseOnlyText = filterChineseOnly(transcriptText);

      // Check if we got meaningful Chinese text
      if (chineseOnlyText.length === 0 && transcriptText.trim().length > 0) {
        console.warn(
          "No Chinese characters detected in speech recognition result:",
          transcriptText
        );
        // Show a warning but don't update the transcript
        setFeedback(
          "No Chinese characters detected. Please try speaking in Chinese."
        );
        return;
      }

      setTranscript(chineseOnlyText);
      setCurrentTranscriptText(chineseOnlyText);
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setFeedback(`Error: ${event.error}`);
      stopListening(true);
    };

    recognitionRef.current.onend = () => {
      console.log("Speech recognition ended");
      setIsListening(false);
    };

    if (poem.lines && poem.lines.length > 0) {
      setSelectedLine(poem.lines[0]);
      setSelectedLineIndex(0);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [poem.lines]);

  // Start listening
  const startListening = () => {
    setTranscript("");
    setFeedback(null);
    setAccuracy(0);
    setUnmatchedChars([]);
    setCurrentTranscriptText("");
    if (recognitionRef.current) {
      try {
        // Always ensure language is set to Chinese before starting
        recognitionRef.current.lang = "zh-CN";
        recognitionRef.current.start();
        setIsListening(true);
        console.log(
          "Started listening with language:",
          recognitionRef.current.lang
        );
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setFeedback(`Error starting speech recognition: ${error}`);
      }
    }
  };

  // Stop listening and optionally evaluate
  const stopListening = (shouldEvaluate = true) => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        console.log("Stopped listening");

        // Only evaluate if we should and have transcript text
        if (shouldEvaluate && currentTranscriptText) {
          const chineseText = filterChineseOnly(currentTranscriptText);
          console.log("Evaluating transcript (Chinese only):", chineseText);
          setTimeout(() => {
            evaluateRecitation(chineseText);
          }, 100); // Small delay to ensure recognition has fully stopped
        }
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
  };

  // Toggle listening state
  const toggleListening = () => {
    if (isListening) {
      // If we're stopping, check if there are any Chinese characters in the transcript
      if (
        currentTranscriptText &&
        filterChineseOnly(currentTranscriptText).length === 0
      ) {
        setFeedback(
          "No Chinese characters detected. Please try speaking in Chinese."
        );
        stopListening(false); // Stop without evaluation
      } else {
        stopListening(true); // Stop and evaluate
      }
    } else {
      startListening();
    }
  };

  // Evaluate recitation using compareText utility
  const evaluateRecitation = (transcriptText: string) => {
    // Ensure we only have Chinese characters
    const chineseText = filterChineseOnly(transcriptText);

    let targetChinese = "";

    // Ensure we have the current practice mode and selected line
    const currentPracticeMode = practiceMode;
    const currentSelectedLine = selectedLine;

    console.log("practiceMode:", currentPracticeMode);
    console.log("Chinese transcript:", chineseText);

    // Get target text based on practice mode
    if (currentPracticeMode === "line" && currentSelectedLine) {
      console.log("selectedLine:", currentSelectedLine);
      targetChinese = currentSelectedLine.chinese;
    } else if (currentPracticeMode === "full") {
      targetChinese = poem.lines.map((line: any) => line.chinese).join("");
    } else {
      console.error("No valid practice mode or selected line");
      return;
    }

    console.log("targetChinese:", targetChinese);

    if (!targetChinese || targetChinese.trim() === "") {
      console.error("Target Chinese text is empty");
      setFeedback(
        "Error: Could not find the target text to compare with. Please select a line to practice."
      );
      return;
    }

    // Use the compareText utility to compare user's speech with target text
    try {
      const comparisonResult = compareText(targetChinese, chineseText);
      console.log("Comparison result:", comparisonResult);

      // Set accuracy based on the comparison result
      setAccuracy(Math.round(comparisonResult.matchPercentage));

      // Store the unmatched characters for feedback
      setUnmatchedChars(comparisonResult.unmatchedCharacters);

      // Generate feedback based on the match percentage
      generateFeedback(
        comparisonResult.matchPercentage,
        comparisonResult.unmatchedCharacters
      );
    } catch (error) {
      console.error("Error comparing text:", error);
      setFeedback(`Error comparing your speech: ${error}`);
    }
  };

  // Generate detailed feedback based on match percentage
  const generateFeedback = (
    matchPercentage: number,
    unmatchedChars: string[]
  ) => {
    let feedbackMessage = "";

    // Determine feedback based on match percentage
    if (matchPercentage >= 90) {
      feedbackMessage =
        "Excellent! Your pronunciation is nearly perfect. 太棒了！";
    } else if (matchPercentage >= 75) {
      feedbackMessage =
        "Great job! Your pronunciation is very good with only a few minor errors.";
    } else if (matchPercentage >= 60) {
      feedbackMessage =
        "Good effort. Your pronunciation needs some improvement in certain areas.";
    } else if (matchPercentage >= 40) {
      feedbackMessage =
        "You're making progress, but there are several pronunciation errors to work on.";
    } else {
      feedbackMessage =
        "Let's keep practicing. Try focusing on pronouncing each character clearly.";
    }

    // Add specific feedback about unmatched characters if there are any
    if (unmatchedChars.length > 0) {
      // Limit to showing just a few of the unmatched characters for clarity
      const displayChars = unmatchedChars.slice(0, 3);
      if (unmatchedChars.length > 3) {
        feedbackMessage += ` Focus on pronouncing these characters from the text: "${displayChars.join(
          '", "'
        )}", and ${unmatchedChars.length - 3} others.`;
      } else {
        feedbackMessage += ` Focus on pronouncing these characters from the text: "${displayChars.join(
          '", "'
        )}".`;
      }
    }

    // Add match percentage information
    feedbackMessage += ` Overall accuracy: ${Math.round(matchPercentage)}%.`;

    // Add suggestions for improvement
    if (matchPercentage < 75) {
      feedbackMessage +=
        " Try listening to the pronunciation again and practice with slower speech.";
    }

    setFeedback(feedbackMessage);
  };

  // Speak function using audio files when available
  const speak = (text: string) => {
    const hasAudioResources =
      poem.audioResources &&
      (poem.audioResources.fullReading ||
        poem.audioResources.lineReadings ||
        poem.audioResources.wordPronunciations);

    if (hasAudioResources) {
      const audioElement = new Audio();

      // Determine which audio to play
      if (practiceMode === "line" && selectedLine) {
        // Find line audio by matching line text
        const lineIndex = poem.lines.findIndex(
          (line: any) => line.chinese === selectedLine.chinese
        );
        if (lineIndex !== -1) {
          const lineAudio = poem.audioResources.lineReadings.find(
            (l: any) => l.lineId === lineIndex + 1
          );

          if (lineAudio && lineAudio.url) {
            audioElement.src = lineAudio.url;
            audioElement
              .play()
              .catch((err) => console.error("Error playing audio:", err));
            return;
          }
        }
      } else if (practiceMode === "full" && poem.audioResources.fullReading) {
        // Play full poem audio
        audioElement.src = poem.audioResources.fullReading.url;
        audioElement
          .play()
          .catch((err) => console.error("Error playing audio:", err));
        return;
      }
    }

    // Fallback to browser speech synthesis if no audio found
    if (!window.speechSynthesis) {
      console.error("Speech synthesis not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Create a new utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.5;

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (voice) => voice.lang.includes("zh") || voice.lang.includes("cmn")
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }

    // Speak the text
    window.speechSynthesis.speak(utterance);
  };

  // Select a line
  const selectLine = (line: any, index: number) => {
    setSelectedLine(line);
    setSelectedLineIndex(index);
    setTranscript("");
    setFeedback(null);
    setAccuracy(0);
    setUnmatchedChars([]);
  };

  // Get color class based on accuracy
  const getAccuracyColorClass = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-900 border-green-700 text-green-200";
    if (accuracy >= 70)
      return "bg-yellow-900 border-yellow-700 text-yellow-200";
    if (accuracy >= 50)
      return "bg-orange-900 border-orange-700 text-orange-200";
    return "bg-red-900 border-red-700 text-red-200";
  };

  // Get icon based on accuracy
  const getAccuracyIcon = (accuracy: number) => {
    if (accuracy >= 90)
      return <CheckCircle size={16} className="text-green-400" />;
    if (accuracy >= 70)
      return <CheckCircle size={16} className="text-yellow-400" />;
    if (accuracy >= 50)
      return <AlertTriangle size={16} className="text-orange-400" />;
    return <XCircle size={16} className="text-red-400" />;
  };

  // Get progress bar color
  const getProgressColor = (accuracy: number) => {
    if (accuracy >= 90) return "bg-green-500";
    if (accuracy >= 70) return "bg-yellow-500";
    if (accuracy >= 50) return "bg-orange-500";
    return "bg-red-500";
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
                  onClick={() => {
                    if (practiceMode === "line" && selectedLine) {
                      speak(selectedLine.chinese);
                    } else if (practiceMode === "full") {
                      speak(
                        poem.lines.map((line: any) => line.chinese).join("")
                      );
                    }
                  }}
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
                      ? "Listening... Speak now in Chinese and click the mic button when done"
                      : "Press the microphone button and speak in Chinese"}
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
                {feedback &&
                  feedback.includes("No Chinese characters detected") && (
                    <div className="mt-2 p-2 border border-yellow-600 rounded bg-yellow-800/30 text-yellow-200 text-sm">
                      <AlertTriangle size={14} className="inline-block mr-1" />
                      Only Chinese speech will be recognized
                    </div>
                  )}
              </div>
              {feedback && (
                <div
                  className={`border rounded-md p-4 ${getAccuracyColorClass(
                    accuracy
                  )}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-200">
                      Feedback:
                    </h3>
                    {getAccuracyIcon(accuracy)}
                  </div>
                  <p className="text-gray-200 whitespace-pre-line">
                    {feedback}
                  </p>

                  {unmatchedChars.length > 0 && (
                    <div className="mt-3 p-2 border border-gray-700/50 rounded-md bg-gray-800/60">
                      <p className="text-xs font-medium mb-1 text-gray-300">
                        Characters from the text to focus on:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {unmatchedChars.slice(0, 8).map((char, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-gray-700/80"
                          >
                            {char}
                          </Badge>
                        ))}
                        {unmatchedChars.length > 8 && (
                          <Badge variant="outline" className="bg-gray-700/80">
                            +{unmatchedChars.length - 8} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 space-y-1">
                    <div className="flex justify-between text-sm text-gray-300">
                      <span>Accuracy</span>
                      <span>{accuracy}%</span>
                    </div>
                    <Progress
                      value={accuracy}
                      className="h-2"
                      style={{
                        ["--progress-background" as any]:
                          getProgressColor(accuracy),
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="flex justify-center pt-4">
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                  className="rounded-full h-16 w-16"
                  onClick={toggleListening}
                >
                  {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                </Button>
              </div>
              <div className="text-center text-sm text-gray-400">
                {isListening
                  ? "Click the mic button again when you're done speaking"
                  : "Click the mic button and start speaking"}
              </div>
              {feedback && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setTranscript("");
                      setFeedback(null);
                      setAccuracy(0);
                      setUnmatchedChars([]);
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
