/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mic, MicOff, X, Volume2, Volume1, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { useStreamAiResponseMutation } from "@/redux/features/chat/chatApi"
import { useParams } from "react-router"
import { useCreateChatMutation } from "@/redux/features/chatHistory/chatHistoryApi"
import { useNavigate } from "react-router"
import AdvancedWaveform from "./AdvancedWaveform"
import AudioAnalyzer from "./AudioAnalyzer"

// Type declarations for browser APIs
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
    AudioContext: any
    webkitAudioContext: any
  }
}

interface TeacherVoiceModalProps {
  isOpen: boolean
  onClose: () => void
}

const TeacherVoiceModal = ({ isOpen, onClose }: TeacherVoiceModalProps) => {
  const { chatId } = useParams<{ chatId: string }>()
  const navigate = useNavigate()
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [aiResponse, setAiResponse] = useState("")
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [speechIntensity, setSpeechIntensity] = useState(0)
  const [createChat] = useCreateChatMutation()
  const [streamAiResponse] = useStreamAiResponseMutation()
  const recognitionRef = useRef<any>(null)
  const speechSynthesisRef = useRef<SpeechSynthesisUtterance | null>(null)
  const [greeting, setGreeting] = useState(true)
  const [wordIndex, setWordIndex] = useState(0)
  const responseWordsRef = useRef<string[]>([])

  // Initialize Web Speech API
  useEffect(() => {
    if (isOpen && greeting) {
      setTimeout(() => {
        const greetingText = "Hello! I'm your AI teacher assistant. How can I help you today?"
        speakText(greetingText)
        setGreeting(false)
      }, 1000)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      if (speechSynthesis) {
        speechSynthesis.cancel()
      }
    }
  }, [isOpen, greeting])

  // Handle speech intensity updates
  const handleAudioAnalysis = (intensity: number) => {
    setSpeechIntensity(intensity)
  }

  const startListening = () => {
    if (!("SpeechRecognition" in window || "webkitSpeechRecognition" in window)) {
      alert("Your browser doesn't support speech recognition. Try Chrome or Edge.")
      return
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition
    recognitionRef.current = new SpeechRecognitionAPI()
    recognitionRef.current.continuous = true
    recognitionRef.current.interimResults = true
    recognitionRef.current.lang = "en-US"

    recognitionRef.current.onstart = () => {
      setIsListening(true)
      setTranscript("")
    }

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = ""
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          setTranscript((prev) => prev + transcript + " ")
        } else {
          interimTranscript += transcript
        }
      }

      // Update with interim results
      const interimElement = document.getElementById("interim-transcript")
      if (interimElement) {
        interimElement.textContent = interimTranscript
      }
    }

    recognitionRef.current.onerror = (event: any) => {
      console.error("Speech recognition error", event.error)
      setIsListening(false)
    }

    recognitionRef.current.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current.start()
  }

  const stopListening = async () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)

      // Process the transcript if it's not empty
      if (transcript.trim()) {
        await processUserQuery(transcript.trim())
      }
    }
  }

  const processUserQuery = async (query: string) => {
    setAiResponse("")
    setWordIndex(0)
    responseWordsRef.current = []
    let currentChatId = chatId

    try {
      if (!currentChatId) {
        const response = await createChat(query)
        if (response.data) {
          currentChatId = response.data.data._id
          navigate(`/${currentChatId}`)
        }
      }

      if (currentChatId) {
        let fullResponse = ""

        await streamAiResponse({
          prompt: query,
          chatId: currentChatId,
          onChunk: (chunk) => {
            if (typeof chunk === "string") {
              fullResponse += chunk
              setAiResponse((prev) => prev + chunk)
            } else if (chunk.message?.content) {
              fullResponse += chunk.message.content
              setAiResponse((prev) => prev + chunk.message.content)
            }
          },
        }).unwrap()

        if (audioEnabled) {
          // Split response into words for word-by-word highlighting
          responseWordsRef.current = fullResponse.split(/\s+/)
          speakText(fullResponse)
        }
      }
    } catch (error) {
      console.error("Error processing query:", error)
      setAiResponse("I'm sorry, I encountered an error processing your request.")
    }
  }

  const speakText = (text: string) => {
    if (!audioEnabled) return

    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
    }

    speechSynthesisRef.current = new SpeechSynthesisUtterance(text)
    speechSynthesisRef.current.rate = 1
    speechSynthesisRef.current.pitch = 1

    // Try to use a male voice
    const voices = speechSynthesis.getVoices()
    const maleVoice = voices.find(
      (voice) =>
        voice.name.includes("Male") ||
        voice.name.includes("male") ||
        (!voice.name.includes("Female") && !voice.name.includes("female")),
    )

    if (maleVoice) {
      speechSynthesisRef.current.voice = maleVoice
    }

    // Word boundary event for highlighting current word
    speechSynthesisRef.current.onboundary = (event) => {
      if (event.name === "word" && responseWordsRef.current.length > 0) {
        const wordIndex = Math.min(event.charIndex, responseWordsRef.current.length - 1)
        setWordIndex(wordIndex)
        setCurrentWord(responseWordsRef.current[wordIndex])
      }
    }

    speechSynthesisRef.current.onstart = () => {
      setIsSpeaking(true)
    }

    speechSynthesisRef.current.onend = () => {
      setIsSpeaking(false)
      setWordIndex(0)
      setCurrentWord("")
    }

    speechSynthesis.speak(speechSynthesisRef.current)
  }

  const toggleAudio = () => {
    setAudioEnabled(!audioEnabled)
    if (speechSynthesis.speaking && audioEnabled) {
      speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  // Render highlighted response text with current word highlighted
  const renderHighlightedResponse = () => {
    if (!aiResponse) return null

    const words = aiResponse.split(/\s+/)

    return (
      <p className="text-white">
        {words.map((word, index) => (
          <React.Fragment key={index}>
            <span className={index === wordIndex && isSpeaking ? "bg-indigo-600 text-white px-1 rounded" : ""}>
              {word}
            </span>{" "}
          </React.Fragment>
        ))}
      </p>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-gray-900 border-gray-800 text-white p-0 overflow-hidden">
        <div className="relative h-[600px] flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-800">
            <h2 className="text-xl font-semibold">AI Teacher Assistant</h2>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAudio}
                className="h-8 w-8 rounded-full hover:bg-gray-800"
              >
                {audioEnabled ? (
                  isSpeaking ? (
                    <Volume2 className="h-4 w-4" />
                  ) : (
                    <Volume1 className="h-4 w-4" />
                  )
                ) : (
                  <VolumeX className="h-4 w-4" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-gray-800">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Teacher Character and Animation */}
          <div className="flex-1 flex flex-col items-center p-6 overflow-hidden">
            

            {/* Audio Visualizer */}
            <div className="w-full h-16 mb-4">
              <AdvancedWaveform
                isActive={isSpeaking}
                intensity={speechIntensity}
                color="#8b5cf6"
                backgroundColor="rgba(30, 30, 30, 0.3)"
              />
              {isSpeaking && <AudioAnalyzer onAnalysis={handleAudioAnalysis} isActive={isSpeaking} />}
            </div>

            {/* Transcript and Response */}
            <div className="w-full max-h-[180px] overflow-y-auto mb-4 bg-gray-800/50 rounded-lg p-4">
              {transcript && (
                <div className="mb-4">
                  <p className="text-sm text-gray-400">You said:</p>
                  <p className="text-white">{transcript}</p>
                  <p id="interim-transcript" className="text-gray-400 italic"></p>
                </div>
              )}

              {aiResponse && (
                <div>
                  <p className="text-sm text-gray-400">AI Teacher:</p>
                  {renderHighlightedResponse()}
                </div>
              )}

              {!transcript && !aiResponse && (
                <p className="text-gray-400 text-center">Click the microphone button to start speaking</p>
              )}
            </div>
          </div>

          {/* Microphone Controls */}
          <div className="p-4 border-t border-gray-800 flex justify-center">
            <AnimatePresence mode="wait">
              {!isListening ? (
                <motion.div
                  key="start"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={startListening}
                    className="h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center"
                  >
                    <Mic className="h-6 w-6" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="stop"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    onClick={stopListening}
                    className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                  >
                    <MicOff className="h-6 w-6" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default TeacherVoiceModal

