"use client"

import { useRef, useEffect } from "react"

interface SpeechWaveformProps {
  isActive: boolean
  color?: string
}

const SpeechWaveform = ({ isActive, color = "#8b5cf6" }: SpeechWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height

    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height)

      if (!isActive) {
        // Draw flat line when not active
        ctx.beginPath()
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
        return
      }

      // Draw animated waveform
      ctx.beginPath()

      const segments = 20
      const segmentWidth = width / segments

      for (let i = 0; i <= segments; i++) {
        const x = i * segmentWidth

        // Create a random amplitude that changes over time
        const time = Date.now() / 1000
        const amplitude = isActive ? Math.sin(i * 0.5 + time * 5) * 20 + Math.random() * 5 : 0

        const y = height / 2 + amplitude

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }

      ctx.strokeStyle = color
      ctx.lineWidth = 2
      ctx.stroke()

      animationRef.current = requestAnimationFrame(drawWaveform)
    }

    drawWaveform()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, color])

  return <canvas ref={canvasRef} width={500} height={100} className="w-full h-full" />
}

export default SpeechWaveform

