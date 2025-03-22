import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Volume2, VolumeX, Info, BookOpen } from "lucide-react"

interface PoemReaderProps {
  poem: any
}

export default function PoemReader({ poem }: PoemReaderProps) {
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [highlightedChar, setHighlightedChar] = useState<{ lineIndex: number; charIndex: number } | null>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Initialize speech synthesis
  const initSpeechSynthesis = () => {
    if (!speechSynthesisRef.current) {
      speechSynthesisRef.current = new SpeechSynthesisUtterance()

      // Try to find a Chinese voice
      const voices = window.speechSynthesis.getVoices()
      const chineseVoice = voices.find((voice) => voice.lang.includes("zh") || voice.lang.includes("cmn"))

      if (chineseVoice) {
        speechSynthesisRef.current.voice = chineseVoice
      }

      speechSynthesisRef.current.rate = 0.5
      speechSynthesisRef.current.pitch = 1

      speechSynthesisRef.current.onend = () => {
        setIsSpeaking(false)
      }
    }
  }

  useEffect(() => {
    // Load voices when component mounts
    const loadVoices = () => {
      window.speechSynthesis.getVoices()
    }

    loadVoices()

    // Some browsers need this event to load voices
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Speak text
  const speak = (text: string) => {
    if (!window.speechSynthesis) {
      alert("Your browser doesn't support speech synthesis")
      return
    }

    initSpeechSynthesis()

    // Stop any current speech
    window.speechSynthesis.cancel()

    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.text = text
      window.speechSynthesis.speak(speechSynthesisRef.current)
      setIsSpeaking(true)
    }
  }

  // Speak a single character
  const speakCharacter = (char: string, lineIndex: number, charIndex: number) => {
    setHighlightedChar({ lineIndex, charIndex })
    speak(char)

    // Clear highlight after 1.5 seconds
    setTimeout(() => {
      setHighlightedChar(null)
    }, 1500)
  }

  // Speak a line
  const speakLine = (line: any, index: number) => {
    setActiveLineIndex(index)
    speak(line.chinese)
  }

  // Speak the entire poem
  const speakPoem = () => {
    const fullText = poem.lines.map((line: any) => line.chinese).join("，")
    speak(fullText)
  }

  // Stop speaking
  const stopSpeaking = () => {
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap gap-4 mb-6">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          <Info size={18} />
          {showExplanation ? "Hide" : "Show"} Notes
        </Button>

        <Button
          variant={isSpeaking ? "destructive" : "default"}
          className="flex items-center justify-center gap-2"
          onClick={() => (isSpeaking ? stopSpeaking() : speakPoem())}
        >
          {isSpeaking ? <VolumeX size={18} /> : <Volume2 size={18} />}
          {isSpeaking ? "Stop" : "Recite Poem"}
        </Button>

        <Button variant="outline" className="flex items-center justify-center gap-2 ml-auto">
          <BookOpen size={18} />
          Reading Mode
        </Button>
      </div>

      <Tabs defaultValue="reading">
        <TabsList className="mb-4">
          <TabsTrigger value="reading">Reading View</TabsTrigger>
          <TabsTrigger value="study">Study View</TabsTrigger>
        </TabsList>

        <TabsContent value="reading" className="space-y-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8">{poem.title}</h2>

            {poem.lines.map((line: any, index: number) => (
              <div key={index} className={`mb-6 ${activeLineIndex === index ? "bg-blue-50 p-3 rounded-md" : ""}`}>
                <div className="text-2xl tracking-wider text-center mb-2">
                  {line.chinese.split("").map((char: string, charIndex: number) => (
                    <button
                      key={charIndex}
                      className={`mx-2 hover:text-blue-600 transition-colors focus:outline-none ${
                        highlightedChar?.lineIndex === index && highlightedChar?.charIndex === charIndex
                          ? "text-blue-600 bg-blue-100 rounded-md px-1"
                          : ""
                      }`}
                      onClick={() => speakCharacter(char, index, charIndex)}
                    >
                      {char}
                    </button>
                  ))}
                  {index < poem.lines.length - 1 ? "，" : "。"}
                </div>

                <p className="text-center text-gray-500 mb-1">{line.pinyin}</p>
                <p className="text-center italic">{line.translation}</p>

                {showExplanation && (
                  <div className="mt-2 text-sm text-gray-600 border-l-2 border-blue-200 pl-2">{line.explanation}</div>
                )}
              </div>
            ))}

            <div className="text-right text-sm text-gray-500 mt-8">
              {poem.author} · {poem.dynasty}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="study">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {poem.lines.map((line: any, index: number) => (
              <Card key={index} className={`p-4 ${activeLineIndex === index ? "ring-2 ring-blue-400" : ""}`}>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">Line {index + 1}</span>
                  <Button variant="ghost" size="sm" onClick={() => speakLine(line, index)} className="h-6 w-6 p-0">
                    <Volume2 size={16} />
                  </Button>
                </div>

                <div className="mb-2">
                  {line.chinese.split("").map((char: string, charIndex: number) => (
                    <button
                      key={charIndex}
                      className={`mr-2 text-xl hover:text-blue-600 transition-colors focus:outline-none ${
                        highlightedChar?.lineIndex === index && highlightedChar?.charIndex === charIndex
                          ? "text-blue-600 bg-blue-100 rounded-md px-1"
                          : ""
                      }`}
                      onClick={() => speakCharacter(char, index, charIndex)}
                    >
                      {char}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-1 mb-2">
                  {line.chinese.split("").map((char: string, charIndex: number) => {
                    // Find the corresponding pinyin syllable
                    const pinyinParts = line.pinyin.split(" ")
                    const pinyinForChar = pinyinParts[charIndex] || ""

                    return (
                      <div key={charIndex} className="flex items-center">
                        <div className="w-8 text-center mr-2">{char}</div>
                        <div className="text-xs text-gray-500">{pinyinForChar}</div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-sm mb-2">{line.pinyin}</p>
                <p className="italic text-sm">{line.translation}</p>

                {showExplanation && (
                  <div className="mt-2 text-xs text-gray-600 border-l-2 border-blue-200 pl-2">{line.explanation}</div>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

