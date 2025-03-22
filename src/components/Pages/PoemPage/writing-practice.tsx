/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Eraser, Download, Volume2, Play, Pause, RefreshCw } from "lucide-react"
import { useGetMockCharacterStrokeAnimationQuery } from "@/redux/features/interactivePoem/deepSeekApi"
import { useAppDispatch } from "@/redux/hooks"
import { addWritingPractice } from "@/redux/features/interactivePoem/userProgressSlice"

interface WritingPracticeProps {
  poem: any
}

export default function WritingPractice({ poem }: WritingPracticeProps) {
  const [selectedChar, setSelectedChar] = useState<string>("")
  const [strokeColor, setStrokeColor] = useState<string>("#000000")
  const [strokeWidth, setStrokeWidth] = useState<number>(3)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPosition, setLastPosition] = useState({ x: 0, y: 0 })
  const [showAnimation, setShowAnimation] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const [currentStroke, setCurrentStroke] = useState(0)
  const [strokeData, setStrokeData] = useState<any>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationCanvasRef = useRef<HTMLCanvasElement>(null)
  const contextRef = useRef<CanvasRenderingContext2D | null>(null)
  const animationContextRef = useRef<CanvasRenderingContext2D | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const dispatch = useAppDispatch()

  // Fetch stroke data for animation
  const { data: strokeAnimationData, refetch: fetchStrokeData } = useGetMockCharacterStrokeAnimationQuery(
    {
      character: selectedChar,
    },
    { skip: !selectedChar || !showAnimation },
  )

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Set canvas dimensions
    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr

    // Get context and configure
    const context = canvas.getContext("2d")
    if (!context) return

    context.scale(dpr, dpr)
    context.lineCap = "round"
    context.lineJoin = "round"
    context.strokeStyle = strokeColor
    context.lineWidth = strokeWidth

    contextRef.current = context

    // Clear canvas initially
    clearCanvas()

    // Initialize animation canvas if showing animation
    if (showAnimation) {
      const animCanvas = animationCanvasRef.current
      if (!animCanvas) return

      animCanvas.width = animCanvas.offsetWidth * dpr
      animCanvas.height = animCanvas.offsetHeight * dpr

      const animContext = animCanvas.getContext("2d")
      if (!animContext) return

      animContext.scale(dpr, dpr)
      animContext.lineCap = "round"
      animContext.lineJoin = "round"
      animContext.strokeStyle = "#FF0000"
      animContext.lineWidth = 3

      animationContextRef.current = animContext
    }
  }, [selectedChar, showAnimation])

  // Update stroke style when changed
  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = strokeColor
      contextRef.current.lineWidth = strokeWidth
    }
  }, [strokeColor, strokeWidth])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas || !contextRef.current) return

      // Save current drawing
      const imageData = contextRef.current.getImageData(0, 0, canvas.width, canvas.height)

      // Resize canvas
      const dpr = window.devicePixelRatio || 1
      canvas.width = canvas.offsetWidth * dpr
      canvas.height = canvas.offsetHeight * dpr

      // Restore context settings
      contextRef.current.scale(dpr, dpr)
      contextRef.current.lineCap = "round"
      contextRef.current.lineJoin = "round"
      contextRef.current.strokeStyle = strokeColor
      contextRef.current.lineWidth = strokeWidth

      // Restore drawing
      contextRef.current.putImageData(imageData, 0, 0)

      // Resize animation canvas if showing animation
      if (showAnimation) {
        const animCanvas = animationCanvasRef.current
        if (!animCanvas || !animationContextRef.current) return

        animCanvas.width = animCanvas.offsetWidth * dpr
        animCanvas.height = animCanvas.offsetHeight * dpr

        animationContextRef.current.scale(dpr, dpr)
        animationContextRef.current.lineCap = "round"
        animationContextRef.current.lineJoin = "round"
        animationContextRef.current.strokeStyle = "#FF0000"
        animationContextRef.current.lineWidth = 3
      }
    }

    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [strokeColor, strokeWidth, showAnimation])

  // Fetch stroke data when character changes and animation is shown
  useEffect(() => {
    if (selectedChar && showAnimation) {
      fetchStrokeData().then((result) => {
        if (result.data) {
          setStrokeData(result.data.strokeData)
          setCurrentStroke(0)
          setIsAnimating(false)

          // Clear animation canvas
          if (animationContextRef.current && animationCanvasRef.current) {
            animationContextRef.current.clearRect(
              0,
              0,
              animationCanvasRef.current.width,
              animationCanvasRef.current.height,
            )
          }
        }
      })
    }
  }, [selectedChar, showAnimation, fetchStrokeData])

  // Handle animation
  useEffect(() => {
    if (isAnimating && strokeData && strokeData.strokes && strokeData.strokes.length > 0) {
      let startTime: number | null = null
      let strokeProgress = 0

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp
        const elapsed = timestamp - startTime

        // Animation timing: 1000ms per stroke
        strokeProgress = Math.min(elapsed / 1000, 1)

        // Draw current stroke with progress
        drawStrokeWithProgress(currentStroke, strokeProgress)

        // If stroke is complete, move to next stroke after a delay
        if (strokeProgress >= 1) {
          if (currentStroke < strokeData.strokes.length - 1) {
            setTimeout(() => {
              setCurrentStroke((prev) => prev + 1)
              startTime = null
            }, 500) // 500ms pause between strokes
          } else {
            // Animation complete
            setIsAnimating(false)
            return
          }
        }

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animationFrameRef.current = requestAnimationFrame(animate)

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
      }
    }
  }, [isAnimating, currentStroke, strokeData])

  // Draw stroke with progress
  const drawStrokeWithProgress = (strokeIndex: number, progress: number) => {
    if (!strokeData || !strokeData.strokes || !animationContextRef.current || !animationCanvasRef.current) return

    const stroke = strokeData.strokes[strokeIndex]
    if (!stroke) return

    // Clear canvas for current stroke
    animationContextRef.current.clearRect(0, 0, animationCanvasRef.current.width, animationCanvasRef.current.height)

    // Draw completed strokes
    for (let i = 0; i < strokeIndex; i++) {
      const completedStroke = strokeData.strokes[i]
      if (completedStroke) {
        drawStrokePath(completedStroke.path, 1)
      }
    }

    // Draw current stroke with progress
    drawStrokePath(stroke.path, progress)
  }

  // Draw stroke path with progress
  const drawStrokePath = (path: string, progress: number) => {
    if (!animationContextRef.current) return

    const parts = path.split(" ")
    if (parts.length < 4) return

    // Parse path (simple line for demo)
    const startX = Number.parseFloat(parts[1].replace(",", ""))
    const startY = Number.parseFloat(parts[2])
    const endX = Number.parseFloat(parts[4].replace(",", ""))
    const endY = Number.parseFloat(parts[5])

    // Calculate progress point
    const currentX = startX + (endX - startX) * progress
    const currentY = startY + (endY - startY) * progress

    // Draw line
    animationContextRef.current.beginPath()
    animationContextRef.current.moveTo(startX, startY)
    animationContextRef.current.lineTo(currentX, currentY)
    animationContextRef.current.stroke()
  }

  // Toggle animation
  const toggleAnimation = () => {
    if (isAnimating) {
      setIsAnimating(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    } else {
      setCurrentStroke(0)
      setIsAnimating(true)
    }
  }

  // Reset animation
  const resetAnimation = () => {
    setCurrentStroke(0)
    setIsAnimating(false)

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }

    // Clear animation canvas
    if (animationContextRef.current && animationCanvasRef.current) {
      animationContextRef.current.clearRect(0, 0, animationCanvasRef.current.width, animationCanvasRef.current.height)
    }
  }

  // Start drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true)

    const position = getPointerPosition(e)
    setLastPosition(position)

    // Start a new path
    if (contextRef.current) {
      contextRef.current.beginPath()
      contextRef.current.moveTo(position.x, position.y)
    }
  }

  // Draw
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return

    const position = getPointerPosition(e)

    if (contextRef.current) {
      contextRef.current.lineTo(position.x, position.y)
      contextRef.current.stroke()
    }

    setLastPosition(position)
  }

  // Stop drawing
  const stopDrawing = () => {
    setIsDrawing(false)

    if (contextRef.current) {
      contextRef.current.closePath()
    }
  }

  // Get pointer position (mouse or touch)
  const getPointerPosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()

    if ("touches" in e) {
      // Touch event
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      }
    } else {
      // Mouse event
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }
  }

  // Clear canvas
  const clearCanvas = () => {
    const canvas = canvasRef.current
    const context = contextRef.current

    if (canvas && context) {
      context.clearRect(0, 0, canvas.width, canvas.height)
    }
  }

  // Download canvas as image
  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const image = canvas.toDataURL("image/png")
    const link = document.createElement("a")
    link.href = image
    link.download = `${selectedChar}-calligraphy.png`
    link.click()
  }

  // Speak the selected character
  const speakCharacter = () => {
    if (!selectedChar) return

    const utterance = new SpeechSynthesisUtterance(selectedChar)

    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices()
    const chineseVoice = voices.find((voice) => voice.lang.includes("zh") || voice.lang.includes("cmn"))

    if (chineseVoice) {
      utterance.voice = chineseVoice
    }
    utterance.rate = 0.5
    utterance.pitch = 1
    window.speechSynthesis.speak(utterance)
  }

  // Handle character selection
  const handleSelectCharacter = (char: string) => {
    setSelectedChar(char)

    // Record practice in Redux store
    dispatch(addWritingPractice({ character: char }))
  }

  // Extract all unique characters from the poem
  const getAllCharacters = () => {
    const allChars = poem.lines.map((line: any) => line.chinese).join("")
    return [...new Set(allChars.split(""))]
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Writing Practice</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-4 col-span-1">
          <h3 className="text-lg font-semibold mb-4">Characters</h3>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {getAllCharacters().map((char, index) => (
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
                <div className="text-6xl font-bold text-muted-foreground select-none">{selectedChar}</div>
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
                <label className="text-sm text-muted-foreground mb-1 block">Brush Color</label>
                <div className="flex gap-2">
                  {["#000000", "#FF0000", "#0000FF", "#008000"].map((color) => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${strokeColor === color ? "ring-2 ring-offset-2 ring-primary" : ""}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setStrokeColor(color)}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">Brush Size: {strokeWidth}px</label>
                <Slider
                  value={[strokeWidth]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setStrokeWidth(value[0])}
                  className="w-full"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground">Show Stroke Animation</label>
                <Button
                  variant={showAnimation ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowAnimation(!showAnimation)}
                >
                  {showAnimation ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 col-span-1 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Writing Canvas</h3>

          <div className="flex gap-2 mb-4">
            <Button variant="outline" onClick={clearCanvas}>
              <Eraser size={16} className="mr-2" />
              Clear
            </Button>
            <Button variant="outline" onClick={downloadCanvas}>
              <Download size={16} className="mr-2" />
              Save
            </Button>

            {showAnimation && selectedChar && (
              <>
                <Button variant={isAnimating ? "destructive" : "outline"} onClick={toggleAnimation}>
                  {isAnimating ? (
                    <>
                      <Pause size={16} className="mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play size={16} className="mr-2" />
                      Animate
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={resetAnimation}>
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

                {showAnimation && <canvas ref={animationCanvasRef} className="absolute inset-0 pointer-events-none" />}
              </>
            ) : (
              <div className="w-full h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Select a character to practice</p>
              </div>
            )}

            {selectedChar && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-9xl text-muted-foreground opacity-20">{selectedChar}</span>
              </div>
            )}
          </div>

          <div className="mt-4 text-sm text-muted-foreground">
            <p>Practice writing the character by tracing over the faded template or create your own style.</p>
            {showAnimation && <p className="mt-1">The stroke animation shows the correct stroke order in red.</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}

