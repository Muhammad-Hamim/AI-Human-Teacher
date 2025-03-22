"use client"

import type React from "react"

import { useRef, useEffect } from "react"

interface AudioAnalyzerProps {
  onAnalysis: (intensity: number) => void
  isActive: boolean
}

const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ onAnalysis, isActive }) => {
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    if (isActive) {
      setupAudioAnalyzer()
      startAnalysis()
    } else {
      stopAnalysis()
    }

    return () => {
      stopAnalysis()
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [isActive])

  const setupAudioAnalyzer = () => {
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        const bufferLength = analyserRef.current.frequencyBinCount
        dataArrayRef.current = new Uint8Array(bufferLength)
      }
    } catch (error) {
      console.error("Error setting up audio analyzer:", error)
    }
  }

  const startAnalysis = () => {
    if (!analyserRef.current || !dataArrayRef.current) return

    const analyze = () => {
      analyserRef.current!.getByteFrequencyData(dataArrayRef.current!)

      // Calculate average intensity from frequency data
      let sum = 0
      for (let i = 0; i < dataArrayRef.current!.length; i++) {
        sum += dataArrayRef.current![i]
      }
      const average = sum / dataArrayRef.current!.length
      const normalizedIntensity = average / 255 // Normalize to 0-1 range

      onAnalysis(normalizedIntensity)

      animationFrameRef.current = requestAnimationFrame(analyze)
    }

    analyze()
  }

  const stopAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }

  // This component doesn't render anything visible
  return null
}

export default AudioAnalyzer

