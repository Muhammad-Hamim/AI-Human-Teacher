import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { parsePoemLines, generateTimestamps } from "./utils";
import {
  FadeAnimation,
  SlideAnimation,
  ZoomAnimation,
  TypewriterAnimation,
  StaggeredAnimation,
} from "./animations/AnimationComponents";

interface AnimatedPreviewProps {
  poemTitle: string;
  poemContent: string;
  images: string[]; // URLs for the images
  audioSrc?: string; // URL or base64 audio
  animationStyle: string;
  animationTiming: {
    duration: number;
    delay: number;
    staggering: number;
  };
  onComplete?: () => void;
}

const AnimatedPreview: React.FC<AnimatedPreviewProps> = ({
  poemTitle,
  poemContent,
  images,
  audioSrc,
  animationStyle,
  animationTiming,
  onComplete,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse poem into lines
  const poemLines = parsePoemLines(poemContent);

  // Generate timestamps for each line based on audio duration
  const lineTimings = generateTimestamps(poemLines, audioDuration);

  // Initialize audio
  useEffect(() => {
    if (audioSrc) {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioSrc);

        audioRef.current.addEventListener("loadedmetadata", () => {
          if (audioRef.current) {
            setAudioDuration(audioRef.current.duration);
          }
        });

        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false);
          setIsComplete(true);
          if (onComplete) onComplete();
        });
      } else {
        audioRef.current.src = audioSrc;
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [audioSrc, onComplete]);

  // Track current line based on audio time
  useEffect(() => {
    if (!isPlaying || !audioRef.current) return;

    const checkTime = () => {
      if (!audioRef.current) return;

      const currentTime = audioRef.current.currentTime;

      // Find which line should be displayed based on timestamps
      for (let i = 0; i < lineTimings.length; i++) {
        const timing = lineTimings[i];
        // Calculate an approximate end time for this line (start of next line or +3 seconds)
        const nextTiming = lineTimings[i + 1];
        const endTime = nextTiming ? nextTiming.time : timing.time + 3;

        if (currentTime >= timing.time && currentTime < endTime) {
          setCurrentLineIndex(i);

          // Change image if needed - roughly every 1/3 of the poem
          const imageChangePoints = Math.max(3, poemLines.length);
          const segment = Math.floor(
            i / (poemLines.length / imageChangePoints)
          );
          const targetImageIndex = Math.min(segment, images.length - 1);
          if (targetImageIndex !== currentImageIndex) {
            setCurrentImageIndex(targetImageIndex);
          }

          break;
        }
      }
    };

    const interval = setInterval(checkTime, 100);
    return () => clearInterval(interval);
  }, [
    isPlaying,
    lineTimings,
    poemLines.length,
    images.length,
    currentImageIndex,
  ]);

  // Play/pause functionality
  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current) return;

      // Reset if ended
      if (isComplete) {
        setCurrentLineIndex(-1);
        setCurrentImageIndex(0);
        setIsComplete(false);
        audioRef.current.currentTime = 0;
      }

      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error("Error playing audio:", err));
    }
  };

  // Render the appropriate animation component based on style
  const renderAnimatedLine = (line: string, index: number) => {
    const isVisible = currentLineIndex === index || isComplete;
    const props = {
      isVisible,
      timing: animationTiming,
      className: "mb-4 text-xl leading-relaxed",
    };

    switch (animationStyle) {
      case "fade":
        return (
          <FadeAnimation key={index} {...props}>
            <p>{line}</p>
          </FadeAnimation>
        );
      case "slide":
        return (
          <SlideAnimation key={index} {...props}>
            <p>{line}</p>
          </SlideAnimation>
        );
      case "zoom":
        return (
          <ZoomAnimation key={index} {...props}>
            <p>{line}</p>
          </ZoomAnimation>
        );
      case "typewriter":
        return <TypewriterAnimation key={index} text={line} {...props} />;
      case "stagger":
        // For staggered animation, we break the line into words
        const words = line.split(" ").map((word, i) => (
          <span key={i} className="inline-block mx-0.5">
            {word}
          </span>
        ));
        return (
          <StaggeredAnimation
            key={index}
            items={words}
            {...props}
            containerClassName="flex flex-wrap mb-4 text-xl leading-relaxed"
          />
        );
      default:
        return (
          <FadeAnimation key={index} {...props}>
            <p>{line}</p>
          </FadeAnimation>
        );
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto" ref={containerRef}>
      {/* Main container with background image */}
      <div className="relative aspect-video overflow-hidden bg-gray-900 rounded-lg shadow-xl">
        {/* Background image with animation */}
        {images.length > 0 && (
          <div className="absolute inset-0 filter brightness-50">
            {images.map((src, index) => (
              <motion.div
                key={index}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: currentImageIndex === index ? 1 : 0 }}
                transition={{ duration: 1 }}
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Content overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center text-white">
          {/* Title */}
          <FadeAnimation
            isVisible={isPlaying || isComplete}
            timing={{ ...animationTiming, delay: 0 }}
            className="mb-6"
          >
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              {poemTitle}
            </h2>
          </FadeAnimation>

          {/* Poem lines */}
          <div className="max-w-2xl mx-auto">
            {poemLines.map((line, index) => renderAnimatedLine(line, index))}
          </div>
        </div>

        {/* Playback controls */}
        <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
          <button
            onClick={togglePlay}
            className="px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full backdrop-blur-sm flex items-center transition-all text-white"
          >
            {isPlaying ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <rect x="6" y="4" width="3" height="12" rx="1" />
                  <rect x="11" y="4" width="3" height="12" rx="1" />
                </svg>
                Pause
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
                {isComplete ? "Replay" : "Play"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnimatedPreview;
