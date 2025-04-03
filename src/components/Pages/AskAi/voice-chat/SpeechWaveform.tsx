import { useRef, useEffect } from "react";

interface SpeechWaveformProps {
  isActive: boolean;
  color?: string;
  backgroundColor?: string;
  intensity?: number;
  mode?: "user" | "ai" | "loading";
}

const SpeechWaveform = ({
  isActive,
  color = "#3b82f6",
  backgroundColor = "rgba(17, 24, 39, 0.5)",
  intensity = 0.5,
  mode = "user",
}: SpeechWaveformProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Adjust color based on mode - dark theme colors
    const actualColor =
      mode === "user" ? "#3b82f6" : mode === "ai" ? "#10b981" : "#8b5cf6"; // Blue, Green, Purple
    const finalColor = color || actualColor;

    // Create gradient for more appealing visuals
    const createGradient = () => {
      const gradient = ctx.createLinearGradient(
        0,
        centerY - 20,
        0,
        centerY + 20
      );
      gradient.addColorStop(0, `${finalColor}22`); // Semi-transparent top
      gradient.addColorStop(0.5, finalColor); // Solid in middle
      gradient.addColorStop(1, `${finalColor}22`); // Semi-transparent bottom
      return gradient;
    };

    const drawWaveform = () => {
      ctx.clearRect(0, 0, width, height);

      // Fill background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, width, height);

      if (mode === "loading" && isActive) {
        // Draw subtle loading animation (three dots pulsing)
        const time = Date.now() / 1000;

        for (let i = 0; i < 3; i++) {
          const delay = i * 0.3;
          const pulsePhase = (time + delay) % 1;
          const size = 3 + Math.sin(Math.PI * pulsePhase) * 2;

          ctx.beginPath();
          ctx.arc(width / 2 - 20 + i * 20, centerY, size, 0, Math.PI * 2);
          ctx.fillStyle = finalColor;
          ctx.fill();

          // Add glow effect for loading dots
          ctx.shadowBlur = 5;
          ctx.shadowColor = finalColor;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      } else if (isActive) {
        // Draw ChatGPT-style minimal waveform
        const segments = 60;
        const segmentWidth = width / segments;
        const time = Date.now() / 1000;

        // Create a smoother intensity value
        const smoothIntensity =
          mode === "ai"
            ? intensity * (0.7 + Math.sin(time * 2) * 0.1)
            : intensity;

        // Draw the main wave
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i <= segments; i++) {
          const x = i * segmentWidth;

          // Create a smooth sine wave with multiple frequencies
          // Different pattern for AI vs user
          let y;
          if (mode === "ai") {
            // AI has more regular, smoother pattern
            y =
              centerY +
              Math.sin(i * 0.2 + time * 2) * smoothIntensity * 15 * 0.5 +
              Math.sin(i * 0.1 + time * 1.5) * smoothIntensity * 15 * 0.3 +
              Math.sin(i * 0.05 + time * 3) * smoothIntensity * 15 * 0.2;
          } else {
            // User has more varied, responsive pattern
            y =
              centerY +
              Math.sin(i * 0.3 + time * 3) * smoothIntensity * 18 * 0.4 +
              Math.sin(i * 0.2 + time * 2.5) * smoothIntensity * 18 * 0.3 +
              Math.sin(i * 0.1 + time * 4) * smoothIntensity * 18 * 0.3;
          }

          // Use quadratic curves for smoother waveform (ChatGPT style)
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * segmentWidth;
            const prevY =
              centerY +
              (mode === "ai"
                ? Math.sin((i - 1) * 0.2 + time * 2) *
                    smoothIntensity *
                    15 *
                    0.5 +
                  Math.sin((i - 1) * 0.1 + time * 1.5) *
                    smoothIntensity *
                    15 *
                    0.3 +
                  Math.sin((i - 1) * 0.05 + time * 3) *
                    smoothIntensity *
                    15 *
                    0.2
                : Math.sin((i - 1) * 0.3 + time * 3) *
                    smoothIntensity *
                    18 *
                    0.4 +
                  Math.sin((i - 1) * 0.2 + time * 2.5) *
                    smoothIntensity *
                    18 *
                    0.3 +
                  Math.sin((i - 1) * 0.1 + time * 4) *
                    smoothIntensity *
                    18 *
                    0.3);

            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2;

            ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
          }
        }

        // Complete the path to create a solid shape
        ctx.lineTo(width, centerY + 1);
        ctx.lineTo(0, centerY + 1);
        ctx.closePath();

        // Fill with gradient
        ctx.fillStyle = createGradient();
        ctx.fill();

        // Add subtle stroke to the top of the wave for definition
        ctx.beginPath();
        ctx.moveTo(0, centerY);

        for (let i = 0; i <= segments; i++) {
          const x = i * segmentWidth;

          // Create the same wave as above
          const y =
            centerY +
            (mode === "ai"
              ? Math.sin(i * 0.2 + time * 2) * smoothIntensity * 15 * 0.5 +
                Math.sin(i * 0.1 + time * 1.5) * smoothIntensity * 15 * 0.3 +
                Math.sin(i * 0.05 + time * 3) * smoothIntensity * 15 * 0.2
              : Math.sin(i * 0.3 + time * 3) * smoothIntensity * 18 * 0.4 +
                Math.sin(i * 0.2 + time * 2.5) * smoothIntensity * 18 * 0.3 +
                Math.sin(i * 0.1 + time * 4) * smoothIntensity * 18 * 0.3);

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            const prevX = (i - 1) * segmentWidth;
            const prevY =
              centerY +
              (mode === "ai"
                ? Math.sin((i - 1) * 0.2 + time * 2) *
                    smoothIntensity *
                    15 *
                    0.5 +
                  Math.sin((i - 1) * 0.1 + time * 1.5) *
                    smoothIntensity *
                    15 *
                    0.3 +
                  Math.sin((i - 1) * 0.05 + time * 3) *
                    smoothIntensity *
                    15 *
                    0.2
                : Math.sin((i - 1) * 0.3 + time * 3) *
                    smoothIntensity *
                    18 *
                    0.4 +
                  Math.sin((i - 1) * 0.2 + time * 2.5) *
                    smoothIntensity *
                    18 *
                    0.3 +
                  Math.sin((i - 1) * 0.1 + time * 4) *
                    smoothIntensity *
                    18 *
                    0.3);

            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2;

            ctx.quadraticCurveTo(prevX, prevY, cpX, cpY);
          }
        }

        ctx.strokeStyle = finalColor;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add enhanced glow effect for dark theme
        if (isActive && intensity > 0.3) {
          ctx.shadowBlur = 6;
          ctx.shadowColor = finalColor;
          ctx.stroke();
          ctx.shadowBlur = 0;
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

      animationRef.current = requestAnimationFrame(drawWaveform);
    };

    drawWaveform();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, color, backgroundColor, intensity, mode]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={50}
      className="w-full h-full rounded-lg"
      style={{ maxHeight: "50px" }}
    />
  );
};

export default SpeechWaveform;
