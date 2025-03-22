"use client"

import type React from "react"
import { useRef, useEffect } from "react"

interface AdvancedWaveformProps {
  isActive: boolean
  intensity: number
  color?: string
  backgroundColor?: string
}

const AdvancedWaveform: React.FC<AdvancedWaveformProps> = ({
  isActive,
  intensity,
  color = "#8b5cf6",
  backgroundColor = "rgba(30, 30, 30, 0.5)",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const pointsRef = useRef<Array<{ x: number; y: number; vy: number }>>([])

  // Initialize points for the waveform
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.width
    const numPoints = 40

    pointsRef.current = Array.from({ length: numPoints }, (_, i) => ({
      x: (i / (numPoints - 1)) * width,
      y: canvas.height / 2,
      vy: 0,
    }))
  }, [])

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const width = canvas.width
    const height = canvas.height
    const centerY = height / 2

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      // Draw background
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      if (!isActive && intensity === 0) {
        // Draw flat line when not active
        ctx.beginPath()
        ctx.moveTo(0, centerY)
        ctx.lineTo(width, centerY)
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.stroke()
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      // Update points
      const points = pointsRef.current
      const maxAmplitude = 30 * (isActive ? intensity : 0.1)

      for (let i = 0; i < points.length; i++) {
        // Skip first and last point to keep them anchored
        if (i > 0 && i < points.length - 1) {
          // Add some randomness to velocity
          points[i].vy += (Math.random() - 0.5) * 0.3

          // Apply velocity to position
          points[i].y += points[i].vy

          // Apply spring force to return to center
          const displacement = points[i].y - centerY
          const springForce = -0.1 * displacement
          points[i].vy += springForce

          // Apply damping
          points[i].vy *= 0.95

          // Constrain amplitude
          const maxDisplacement = maxAmplitude * (1 - Math.abs(i / points.length - 0.5) * 1.5)
          if (Math.abs(points[i].y - centerY) > maxDisplacement) {
            points[i].y = centerY + Math.sign(points[i].y - centerY) * maxDisplacement
            points[i].vy *= -0.5
          }
        } else {
          // Keep first and last points at center
          points[i].y = centerY
        }
      }

      // Draw waveform
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)

      // Use quadratic curves for smoother waveform
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2
        const yc = (points[i].y + points[i + 1].y) / 2
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc)
      }

      // Connect to the last point
      ctx.quadraticCurveTo(
        points[points.length - 2].x,
        points[points.length - 2].y,
        points[points.length - 1].x,
        points[points.length - 1].y,
      )

      // Style and stroke the path
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.stroke()

      // Add glow effect
      if (isActive) {
        ctx.shadowBlur = 10
        ctx.shadowColor = color
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, intensity, color, backgroundColor])

  return <canvas ref={canvasRef} width={600} height={100} className="w-full h-full rounded-lg" />
}

export default AdvancedWaveform

