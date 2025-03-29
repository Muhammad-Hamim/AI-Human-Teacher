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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationDivRef = useRef<HTMLDivElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const writerRef = useRef<any>(null);
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
  const setElementOpacity = (element: Element | null, opacity: string) => {
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
        }
      );

      // Make the character translucent
      try {
        const character = animationDivRef.current.querySelector(
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

      // Stop animation if it was previously running
      setIsAnimating(false);
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
        }
      }
      setIsAnimating(false);
    } else {
      // Start animation
      if (writerRef.current && animationDivRef.current && selectedChar) {
        try {
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
            }
          );

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
        } catch (e) {
          console.error("Error starting animation:", e);
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
            }
          );

          // Make character translucent again
          const character = animationDivRef.current.querySelector(
            ".hanzi-writer-character"
          );
          setElementOpacity(character, "0.2");

          // Make strokes transparent
          setStrokeElements("rgba(0, 0, 0, 0)");

          // Add grid background after writer is created
          createGridBackground();
        }
      } catch (e) {
        console.error("Error resetting animation:", e);
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

  // Speak the selected character
  const speakCharacter = () => {
    if (!selectedChar) return;

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

  // Handle character selection
  const handleSelectCharacter = (char: string) => {
    setSelectedChar(char);

    // Reset animation state
    setIsAnimating(false);

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
                <Button size="sm" onClick={speakCharacter}>
                  <Volume2 size={16} className="mr-2" />
                  Pronounce
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
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Writing Canvas</h3>

          <div className="flex gap-2 mb-4 flex-wrap">
            <Button variant="outline" onClick={clearCanvas}>
              <Eraser size={16} className="mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={downloadCanvas}>
              <Download size={16} className="mr-2" />
              Save
            </Button>

            {selectedChar && (
              <>
                <Button
                  variant={isAnimating ? "destructive" : "default"}
                  onClick={toggleAnimation}
                  className="font-medium"
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
                >
                  <RefreshCw size={16} className="mr-2" />
                  Reset
                </Button>
              </>
            )}
          </div>

          <div className="relative border border-muted rounded-lg">
            {selectedChar ? (
              <>
                <canvas
                  ref={canvasRef}
                  className="w-full h-[400px] bg-background rounded-lg touch-none"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                <div
                  ref={animationDivRef}
                  className="absolute inset-0 pointer-events-none flex items-center justify-center"
                  style={{ zIndex: 10 }}
                />
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
              Practice writing the character by tracing over the template or
              create your own style.
            </p>
            <p className="mt-1">
              The stroke animation shows the correct stroke order in red.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
