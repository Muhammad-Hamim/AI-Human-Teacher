/* eslint-disable @typescript-eslint/no-explicit-any */

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Eraser,
  Download,
  Volume2,
  Play,
  Pause,
  RefreshCw,
  Check,
  X,
  Brain,
} from "lucide-react";
import { useAppDispatch } from "@/redux/hooks";
import { addWritingPractice } from "@/redux/features/interactivePoem/userProgressSlice";
import HanziWriter from "hanzi-writer";

interface WritingPracticeProps {
  poem: any;
}

interface Point {
  x: number;
  y: number;
}

export default function WritingPractice({ poem }: WritingPracticeProps) {
  const [selectedChar, setSelectedChar] = useState<string>("");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPos, setCurrentPos] = useState<Point>({ x: 0, y: 0 });
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [charError, setCharError] = useState<string | null>(null);
  const [isQuizMode, setIsQuizMode] = useState(false);
  const [quizStats, setQuizStats] = useState<{
    totalMistakes: number;
    currentStroke: number;
    strokesRemaining: number;
    isComplete: boolean;
  }>({
    totalMistakes: 0,
    currentStroke: 0,
    strokesRemaining: 0,
    isComplete: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationDivRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const writerRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const dispatch = useAppDispatch();

  // Initialize canvas for drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * dpr;
    canvas.height = canvas.offsetHeight * dpr;

    // Get context and configure
    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = strokeColor;
    context.lineWidth = strokeWidth;

    contextRef.current = context;

    // Clear canvas initially
    clearCanvas();
  }, [selectedChar, strokeColor, strokeWidth]);

  // Function to create grid background in the animation div
  const createGridBackground = () => {
    if (!animationDivRef.current) return;

    // Add grid background using CSS
    animationDivRef.current.style.backgroundImage =
      "linear-gradient(to right, rgba(120, 120, 120, 0.2) 1px, transparent 1px), " +
      "linear-gradient(to bottom, rgba(120, 120, 120, 0.2) 1px, transparent 1px), " +
      "linear-gradient(to right bottom, rgba(120, 120, 120, 0.2) 1px, transparent 1px), " +
      "linear-gradient(to right top, rgba(120, 120, 120, 0.2) 1px, transparent 1px)";

    const size = animationDivRef.current.offsetWidth;
    const gridSize = size / 8;

    animationDivRef.current.style.backgroundSize = `${gridSize}px ${gridSize}px, ${gridSize}px ${gridSize}px, ${size}px ${size}px, ${size}px ${size}px`;
    animationDivRef.current.style.backgroundPosition = "center center";
  };

  // Helper function to set element opacity to avoid TypeScript errors
  const setElementOpacity = (
    element: Element | null | undefined,
    opacity: string
  ) => {
    if (element && "style" in element) {
      (element as HTMLElement).style.opacity = opacity;
    }
  };

  // Helper function to set stroke color
  const setStrokeElements = (color: string) => {
    if (!animationDivRef.current) return;

    try {
      // Get all stroke elements
      const strokes = animationDivRef.current.querySelectorAll(
        ".hanzi-writer-stroke"
      );
      strokes.forEach((stroke) => {
        if (stroke) {
          (stroke as SVGElement).setAttribute("stroke", color);
        }
      });
    } catch (e) {
      console.error("Error setting stroke color:", e);
    }
  };

  // Initialize Hanzi Writer when character changes
  useEffect(() => {
    if (selectedChar && animationDivRef.current) {
      // Reset error state
      setCharError(null);
      setIsLoading(true);

      // Clear previous writer if exists
      if (writerRef.current) {
        writerRef.current = null;
        // Clear the div
        if (animationDivRef.current) {
          animationDivRef.current.innerHTML = "";
        }
      }

      // Get canvas dimensions to match the writer size
      const canvas = canvasRef.current;
      const width = canvas?.offsetWidth || 400;
      const height = canvas?.offsetHeight || 400;

      try {
        // Create new writer with translucent character
        writerRef.current = HanziWriter.create(
          animationDivRef.current,
          selectedChar,
          {
            width: width,
            height: height,
            padding: 20,
            strokeColor: "rgba(0, 0, 0, 0)", // Transparent strokes initially
            radicalColor: "rgba(0, 0, 0, 0)", // Transparent radicals initially
            delayBetweenStrokes: 500,
            strokeAnimationSpeed: 1,
            outlineColor: "rgba(0, 0, 0, 0.2)",
            outlineWidth: 2,
            showCharacter: true,
            showOutline: true,
            onLoadCharDataSuccess: () => {
              setIsLoading(false);

              // Make the character translucent
              try {
                const character = animationDivRef.current?.querySelector(
                  ".hanzi-writer-character"
                );
                setElementOpacity(character, "0.2");

                // Make sure strokes are transparent
                setStrokeElements("rgba(0, 0, 0, 0)");
              } catch (e) {
                console.error("Error adjusting character opacity:", e);
              }

              // Add grid background after writer is created
              createGridBackground();
            },
            onLoadCharDataError: (error: any) => {
              console.error("Error loading character data:", error);
              setIsLoading(false);
              setCharError(`Could not load stroke data for "${selectedChar}"`);
            },
          }
        );

        // Stop animation if it was previously running
        setIsAnimating(false);
      } catch (e) {
        console.error("Error creating Hanzi Writer:", e);
        setIsLoading(false);
        setCharError(`Error initializing character "${selectedChar}"`);
      }
    }
  }, [selectedChar]);

  // Update stroke style when changed
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = strokeColor;
      contextRef.current.lineWidth = strokeWidth;
    }
  }, [strokeColor, strokeWidth]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas || !contextRef.current) return;

      // Save current drawing
      const imageData = contextRef.current.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

      // Resize canvas
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;

      // Restore context settings
      contextRef.current.scale(dpr, dpr);
      contextRef.current.lineCap = "round";
      contextRef.current.lineJoin = "round";
      contextRef.current.strokeStyle = strokeColor;
      contextRef.current.lineWidth = strokeWidth;

      // Restore drawing
      contextRef.current.putImageData(imageData, 0, 0);

      // Update grid background
      createGridBackground();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [strokeColor, strokeWidth]);

  // Toggle animation
  const toggleAnimation = () => {
    if (isAnimating) {
      // Stop animation
      if (writerRef.current) {
        try {
          writerRef.current.pauseAnimation();

          // Reset back to transparent strokes by recreating the writer
          resetAnimation();
        } catch (e) {
          console.error("Error cancelling animation:", e);
          setCharError("Error stopping animation. Please try again.");
        }
      }
      setIsAnimating(false);
    } else {
      // Start animation
      if (writerRef.current && animationDivRef.current && selectedChar) {
        try {
          setIsLoading(true);
          // Clear the animation div
          animationDivRef.current.innerHTML = "";

          // Get canvas dimensions
          const canvas = canvasRef.current;
          const width = canvas?.offsetWidth || 400;
          const height = canvas?.offsetHeight || 400;

          // Create a new writer with visible strokes for animation
          writerRef.current = HanziWriter.create(
            animationDivRef.current,
            selectedChar,
            {
              width: width,
              height: height,
              padding: 20,
              strokeColor: "#FF0000", // Red strokes for animation
              radicalColor: "#FF3333", // Red radical
              delayBetweenStrokes: 500,
              strokeAnimationSpeed: 1,
              outlineColor: "rgba(0, 0, 0, 0.2)",
              outlineWidth: 2,
              showCharacter: true,
              showOutline: true,
              onLoadCharDataSuccess: () => {
                setIsLoading(false);

                // Add grid background after writer is created
                createGridBackground();

                // Start the animation
                writerRef.current.animateCharacter({
                  onComplete: () => {
                    // Reset back to transparent strokes when done
                    resetAnimation();
                    setIsAnimating(false);
                  },
                });

                setIsAnimating(true);
              },
              onLoadCharDataError: (error: any) => {
                console.error("Error loading character data:", error);
                setIsLoading(false);
                setCharError(
                  `Could not load stroke data for "${selectedChar}"`
                );
              },
            }
          );
        } catch (e) {
          console.error("Error starting animation:", e);
          setIsLoading(false);
          setCharError(`Error animating character "${selectedChar}"`);
        }
      }
    }
  };

  // Reset animation
  const resetAnimation = () => {
    if (writerRef.current) {
      try {
        // First cancel any ongoing animations
        writerRef.current.pauseAnimation();

        // Completely remove and reinitialize the writer
        if (animationDivRef.current && selectedChar) {
          setIsLoading(true);
          // Clear the animation div
          animationDivRef.current.innerHTML = "";

          // Get canvas dimensions for the writer
          const canvas = canvasRef.current;
          const width = canvas?.offsetWidth || 400;
          const height = canvas?.offsetHeight || 400;

          // Create a new writer instance
          writerRef.current = HanziWriter.create(
            animationDivRef.current,
            selectedChar,
            {
              width: width,
              height: height,
              padding: 20,
              strokeColor: "rgba(0, 0, 0, 0)", // Transparent strokes
              radicalColor: "rgba(0, 0, 0, 0)", // Transparent radicals
              delayBetweenStrokes: 500,
              strokeAnimationSpeed: 1,
              outlineColor: "rgba(0, 0, 0, 0.2)",
              outlineWidth: 2,
              showCharacter: true,
              showOutline: true,
              onLoadCharDataSuccess: () => {
                setIsLoading(false);

                // Make character translucent again
                const character = animationDivRef.current?.querySelector(
                  ".hanzi-writer-character"
                );
                setElementOpacity(character, "0.2");

                // Make strokes transparent
                setStrokeElements("rgba(0, 0, 0, 0)");

                // Add grid background after writer is created
                createGridBackground();
              },
              onLoadCharDataError: (error: any) => {
                console.error("Error loading character data:", error);
                setIsLoading(false);
                setCharError(
                  `Could not load stroke data for "${selectedChar}"`
                );
              },
            }
          );
        }
      } catch (e) {
        console.error("Error resetting animation:", e);
        setIsLoading(false);
        setCharError(`Error resetting animation for "${selectedChar}"`);
      }
    }

    // Always clear the canvas and reset state
    clearCanvas();
    setIsAnimating(false);
  };

  // Start drawing
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);

    const position = getPointerPosition(e);
    setCurrentPos(position);

    // Start a new path
    if (contextRef.current) {
      contextRef.current.beginPath();
      contextRef.current.moveTo(position.x, position.y);
    }
  };

  // Draw
  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;

    const position = getPointerPosition(e);

    if (contextRef.current) {
      contextRef.current.lineTo(position.x, position.y);
      contextRef.current.stroke();
    }

    setCurrentPos(position);
  };

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false);

    if (contextRef.current) {
      contextRef.current.closePath();
    }
  };

  // Get pointer position (mouse or touch)
  const getPointerPosition = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();

    if ("touches" in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  // Download canvas as image
  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const image = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = image;
    link.download = `${selectedChar}-calligraphy.png`;
    link.click();
  };

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();

      // Set up event listeners
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener("error", () => {
        setIsPlaying(false);
        console.error("Audio playback error");
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Speak the selected character using audio resources from API
  const speakCharacter = () => {
    if (!selectedChar) return;

    // Check if audio resources exist for the poem
    if (poem.audioResources && poem.audioResources.wordPronunciations) {
      // Find the word pronunciation for the selected character
      const wordAudio = poem.audioResources.wordPronunciations.find(
        (w: any) => w.word === selectedChar
      );

      if (wordAudio && wordAudio.url) {
        // Use audio reference for better control
        if (audioRef.current) {
          // Stop any current playback
          if (isPlaying) {
            audioRef.current.pause();
          }

          // Set new audio source and play
          audioRef.current.src = wordAudio.url;
          audioRef.current
            .play()
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.error("Error playing audio:", error);
              setIsPlaying(false);
              fallbackToSpeechSynthesis();
            });
          return;
        }
      }
    }

    // Fallback to speech synthesis if no audio found
    fallbackToSpeechSynthesis();
  };

  // Fallback to using browser's speech synthesis
  const fallbackToSpeechSynthesis = () => {
    const utterance = new SpeechSynthesisUtterance(selectedChar);

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(
      (voice) =>
        voice.lang && (voice.lang.includes("zh") || voice.lang.includes("cmn"))
    );

    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    utterance.rate = 0.5;
    utterance.pitch = 1;
    window.speechSynthesis.speak(utterance);
  };

  // Handle character selection - modified to reset quiz mode
  const handleSelectCharacter = (char: string) => {
    setSelectedChar(char);

    // Reset animation state
    setIsAnimating(false);

    // Reset quiz state
    setIsQuizMode(false);
    setQuizStats({
      totalMistakes: 0,
      currentStroke: 0,
      strokesRemaining: 0,
      isComplete: false,
    });

    // Record practice in Redux store
    dispatch(addWritingPractice({ character: char }));
  };

  // Extract all unique characters from the poem
  const getAllCharacters = (): string[] => {
    if (!poem || !poem.lines) return [];

    const allChars = poem.lines
      .map((line: any) => (line && line.chinese ? line.chinese : ""))
      .join("");

    // Cast the result to string[] to fix the type error
    return [...new Set(allChars.split(""))] as string[];
  };

  const characters = getAllCharacters();

  // Start quiz mode
  const startQuiz = () => {
    if (!writerRef.current || !selectedChar) return;

    try {
      setIsLoading(true);

      // Clear existing canvas
      clearCanvas();

      // Reset the animation div
      if (animationDivRef.current) {
        animationDivRef.current.innerHTML = "";

        // Get canvas dimensions
        const canvas = canvasRef.current;
        const width = canvas?.offsetWidth || 400;
        const height = canvas?.offsetHeight || 400;

        // Create a new writer instance specifically for quiz mode
        writerRef.current = HanziWriter.create(
          animationDivRef.current,
          selectedChar,
          {
            width: width,
            height: height,
            padding: 20,
            strokeColor: strokeColor,
            radicalColor: strokeColor,
            highlightColor: "#FF0000", // Red highlight for hints
            outlineColor: "rgba(0, 0, 0, 0.2)",
            showCharacter: false, // Don't show the character during quiz
            showOutline: true, // Show outline to help with positioning
            showHintAfterMisses: 1, // Show hint after 3 mistakes on a stroke
            highlightOnComplete: true, // Flash when completed successfully
            onLoadCharDataSuccess: () => {
              setIsLoading(false);

              // Add grid background after writer is created
              createGridBackground();

              // Start the quiz
              writerRef.current.quiz({
                onCorrectStroke: (strokeData: any) => {
                  setQuizStats({
                    totalMistakes: strokeData.totalMistakes,
                    currentStroke: strokeData.strokeNum + 1, // strokeNum is 0-indexed
                    strokesRemaining: strokeData.strokesRemaining,
                    isComplete: false,
                  });
                },
                onMistake: (strokeData: any) => {
                  setQuizStats({
                    totalMistakes: strokeData.totalMistakes,
                    currentStroke: strokeData.strokeNum + 1, // strokeNum is 0-indexed
                    strokesRemaining: strokeData.strokesRemaining,
                    isComplete: false,
                  });
                },
                onComplete: (summaryData: any) => {
                  setQuizStats({
                    totalMistakes: summaryData.totalMistakes,
                    currentStroke: 0,
                    strokesRemaining: 0,
                    isComplete: true,
                  });

                  // Record successful practice in Redux store
                  dispatch(
                    addWritingPractice({
                      character: selectedChar,
                      // Removed quizCompleted and mistakesMade props as they're not in the type
                    })
                  );

                  // After a brief delay, reset the quiz status but stay in quiz mode
                  setTimeout(() => {
                    setQuizStats({
                      totalMistakes: 0,
                      currentStroke: 0,
                      strokesRemaining: 0,
                      isComplete: false,
                    });
                  }, 2000);
                },
              });

              setIsQuizMode(true);
            },
            onLoadCharDataError: (error: any) => {
              console.error("Error loading character data for quiz:", error);
              setIsLoading(false);
              setCharError(`Could not load quiz data for "${selectedChar}"`);
            },
          }
        );
      }
    } catch (e) {
      console.error("Error starting quiz:", e);
      setIsLoading(false);
      setCharError(`Error setting up quiz for "${selectedChar}"`);
      setIsQuizMode(false);
    }
  };

  // End quiz mode
  const endQuiz = () => {
    if (writerRef.current) {
      try {
        // Cancel any ongoing quiz
        writerRef.current.cancelQuiz();
        resetAnimation(); // Reset back to practice mode
        setIsQuizMode(false);
        setQuizStats({
          totalMistakes: 0,
          currentStroke: 0,
          strokesRemaining: 0,
          isComplete: false,
        });
      } catch (e) {
        console.error("Error ending quiz:", e);
      }
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Writing Practice</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Characters</h3>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {characters.map((char, index) => (
              <Button
                key={index}
                variant={selectedChar === char ? "default" : "outline"}
                className="h-12 text-xl"
                onClick={() => handleSelectCharacter(char)}
                disabled={isQuizMode}
              >
                {char}
              </Button>
            ))}
          </div>

          {selectedChar && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2">Selected Character</h3>
              <div className="flex items-center justify-between">
                <div className="text-6xl font-bold text-muted-foreground select-none">
                  {selectedChar}
                </div>
                <Button
                  size="sm"
                  onClick={
                    isPlaying
                      ? () => {
                          if (audioRef.current) {
                            audioRef.current.pause();
                            audioRef.current.currentTime = 0;
                            setIsPlaying(false);
                          }
                        }
                      : speakCharacter
                  }
                  variant={isPlaying ? "secondary" : "default"}
                  disabled={isQuizMode}
                >
                  {isPlaying ? (
                    <>
                      <Pause size={16} className="mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Volume2 size={16} className="mr-2" />
                      Pronounce
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Brush Settings</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Brush Color
                </label>
                <div className="flex gap-2">
                  {["#000000", "#FF0000", "#0000FF", "#008000"].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${
                        strokeColor === color
                          ? "ring-2 ring-offset-2 ring-primary"
                          : ""
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStrokeColor(color)}
                      disabled={isQuizMode}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">
                  Brush Size: {strokeWidth}px
                </label>
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                  className="w-full"
                  disabled={isQuizMode}
                />
              </div>
            </div>
          </div>

          
        </Card>

        <Card className="p-4 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Writing Canvas</h3>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button
              variant="outline"
              onClick={clearCanvas}
              disabled={isQuizMode}
            >
              <Eraser size={16} className="mr-2" />
              Clear
            </Button>
            <Button
              variant="outline"
              onClick={downloadCanvas}
              disabled={isQuizMode}
            >
              <Download size={16} className="mr-2" />
              Save
            </Button>

            {selectedChar && (
              <>
                <Button
                  variant={isAnimating ? "destructive" : "default"}
                  onClick={toggleAnimation}
                  className="font-medium"
                  disabled={isQuizMode}
                >
                  {isAnimating ? (
                    <>
                      <Pause size={16} className="mr-2" />
                      Stop
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Animate
                    </>
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={resetAnimation}
                  className="font-medium"
                  disabled={isQuizMode}
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset
                </Button>

                {/* Quiz mode toggle button */}
                {isQuizMode ? (
                  <Button
                    variant="destructive"
                    onClick={endQuiz}
                    className="font-medium ml-auto"
                  >
                    <X size={16} className="mr-2" />
                    End Quiz
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    onClick={startQuiz}
                    className="font-medium ml-auto"
                  >
                    <Check size={16} className="mr-2" />
                    Start Quiz
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="relative border border-muted rounded-lg">
            {selectedChar ? (
              <>
                <canvas
                  ref={canvasRef}
                  className="w-full h-[400px] bg-background rounded-lg touch-none"
                  onMouseDown={!isQuizMode ? startDrawing : undefined}
                  onMouseMove={!isQuizMode ? draw : undefined}
                  onMouseUp={!isQuizMode ? stopDrawing : undefined}
                  onMouseLeave={!isQuizMode ? stopDrawing : undefined}
                  onTouchStart={!isQuizMode ? startDrawing : undefined}
                  onTouchMove={!isQuizMode ? draw : undefined}
                  onTouchEnd={!isQuizMode ? stopDrawing : undefined}
                />

                <div
                  ref={animationDivRef}
                  className={`absolute inset-0 ${
                    isQuizMode ? "" : "pointer-events-none"
                  } flex items-center justify-center`}
                  style={{ zIndex: 10 }}
                />

                {/* Loading indicator */}
                {isLoading && (
                  <div
                    className="absolute inset-0 bg-background/50 flex items-center justify-center"
                    style={{ zIndex: 20 }}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
                      <div className="text-muted-foreground">
                        Loading character data...
                      </div>
                    </div>
                  </div>
                )}

                {/* Error message */}
                {charError && (
                  <div
                    className="absolute inset-0 bg-background/50 flex items-center justify-center"
                    style={{ zIndex: 20 }}
                  >
                    <div className="flex flex-col items-center gap-2 max-w-xs text-center">
                      <div className="text-destructive text-4xl">!</div>
                      <div className="text-destructive font-medium">
                        {charError}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setCharError(null)}
                        variant="outline"
                        className="mt-2"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">
                  Select a character to practice
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>
              {isQuizMode
                ? "Quiz Mode: Draw each stroke in the correct order. After 3 mistakes on a stroke, a hint will appear."
                : "Practice writing the character by tracing over the template or create your own style."}
            </p>
            <p className="mt-1">
              {isQuizMode
                ? "Complete all strokes to finish the quiz. Your progress is tracked above."
                : "The stroke animation shows the correct stroke order in red."}
            </p>{/* Quiz Stats Display */}
          {isQuizMode && (
            <div className="mt-6 p-3 border border-muted rounded-md bg-muted/20">
              <h3 className="text-lg font-semibold mb-2 flex items-center">
                <Brain size={18} className="mr-2" />
                Quiz Progress
              </h3>

              {quizStats.isComplete ? (
                <div className="text-center py-2">
                  <p className="text-green-600 font-medium mb-1">
                    Quiz Complete!
                  </p>
                  <p className="text-muted-foreground">
                    Total mistakes: {quizStats.totalMistakes}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Current stroke:</span>
                    <span className="font-medium">
                      {quizStats.currentStroke}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Strokes remaining:</span>
                    <span className="font-medium">
                      {quizStats.strokesRemaining}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Mistakes made:</span>
                    <span className="font-medium">
                      {quizStats.totalMistakes}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </Card>
      </div>
    </div>
  );
}
