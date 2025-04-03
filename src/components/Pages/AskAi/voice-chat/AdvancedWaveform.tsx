import React, { useRef, useEffect } from "react";

interface AdvancedWaveformProps {
  isActive: boolean;
  intensity: number;
  color?: string;
  backgroundColor?: string;
  mode?: "user" | "ai" | "loading";
}

const AdvancedWaveform: React.FC<AdvancedWaveformProps> = ({
  isActive,
  intensity = 0.5,
  color = "#0ea5e9",
  backgroundColor = "rgba(0, 0, 0, 0.05)",
  mode = "user",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Adjust color based on mode
    const actualColor =
      mode === "user" ? "#0ea5e9" : mode === "ai" ? "#10b981" : "#8b5cf6";
    const finalColor = color || actualColor;

    // Calculate number of bars based on width
    const numBars = Math.floor(width / 4); // 3px bar + 1px gap

    // Create gradient for smoother appearance
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(
        0,
        centerY - 30,
        0,
        centerY + 30
      );
      gradient.addColorStop(0, `${finalColor}22`); // Semi-transparent top
      gradient.addColorStop(0.5, finalColor); // Solid middle
      gradient.addColorStop(1, `${finalColor}22`); // Semi-transparent bottom
      return gradient;
    };

    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height);

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (mode === "loading" && isActive) {
        // Draw loading pattern (pulsating circle)
        const time = Date.now() / 1000;
        const pulseSize = 4 + Math.sin(time * 3) * 2;

        for (let i = 0; i < 3; i++) {
          const delay = i * 0.3;
          const pulsePhase = (time + delay) % 2;
          const pulseOpacity = pulsePhase > 1 ? 2 - pulsePhase : pulsePhase;

          ctx.beginPath();
          ctx.arc(width / 2 - 25 + i * 25, centerY, pulseSize, 0, Math.PI * 2);
          ctx.fillStyle = `${finalColor}${Math.floor(pulseOpacity * 255)
            .toString(16)
            .padStart(2, "0")}`;
          ctx.fill();
        }
      } else if (isActive) {
        // For waveform visualization (both user and AI)
        const time = Date.now() / 1000;

        // Create a smoother transition for intensity changes
        const smoothIntensity =
          mode === "ai"
            ? intensity * (0.4 + Math.sin(time * 2) * 0.1)
            : intensity;

        for (let i = 0; i < numBars; i++) {
          const x = i * 4;

          // Calculate height using multiple sine waves for natural look
          let barHeight;

          if (mode === "ai") {
            // AI voice pattern - more uniform with subtle variations
            barHeight =
              smoothIntensity *
              30 *
              (0.6 +
                0.2 * Math.sin(i * 0.1 + time * 4) +
                0.2 * Math.sin(i * 0.05 + time * 2.5));
          } else {
            // User voice pattern - more responsive to actual input
            barHeight =
              smoothIntensity *
              35 *
              (0.5 +
                0.3 * Math.sin(i * 0.15 + time * 3) +
                0.2 * Math.cos(i * 0.1 + time * 4));
          }

          // Add randomness for more natural look
          barHeight *= 0.8 + Math.random() * 0.4;

          // Ensure minimum height when active
          barHeight = Math.max(barHeight, isActive ? 2 : 0);

          // Draw bar
          const barY = centerY - barHeight / 2;

          ctx.fillStyle = createGradient();
          ctx.fillRect(x, barY, 2, barHeight);
        }
      } else {
        // Draw flat line when not active
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = finalColor;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, intensity, color, backgroundColor, mode]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={60}
      className="w-full h-full rounded-lg"
      style={{ maxHeight: "60px" }}
    />
  );
};

export default AdvancedWaveform;
