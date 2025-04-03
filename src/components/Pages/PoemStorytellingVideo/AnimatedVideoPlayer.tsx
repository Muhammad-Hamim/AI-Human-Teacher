import React, { useEffect, useRef, useState, useCallback } from "react";
import { gsap } from "gsap";
import {
  syncAnimationWithAudio,
  createPulseAnimation,
  createPanAnimation,
  pauseElementAnimations,
  resumeElementAnimations,
} from "./animations/GsapEffects";
import { useAppSelector } from "../../../redux/hooks";
import { exportVideo, downloadBlob } from "./VideoExporter";

interface AnimatedVideoPlayerProps {
  videoData?: {
    frames: string[];
    frameRate: number;
    duration: number;
  };
  audioSrc?: string;
  autoPlay?: boolean;
  animationStyle?: string;
  onComplete?: () => void;
  imagePreviews?: string[]; // Add prop for image previews
}

const AnimatedVideoPlayer: React.FC<AnimatedVideoPlayerProps> = ({
  videoData,
  audioSrc,
  autoPlay = false,
  animationStyle = "fade",
  onComplete,
  imagePreviews = [],
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<gsap.core.Timeline | null>(null);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Get image previews from Redux store as fallback
  const poemVideoState = useAppSelector((state) => state.poemVideo);

  // Load data from session storage if not provided directly
  const [localVideoData, setLocalVideoData] = useState<{
    frames: string[];
    frameRate: number;
    duration: number;
  } | null>(null);

  // Add worker reference
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    if (videoData) {
      setLocalVideoData(videoData);
    } else {
      // Try to load from session storage or create from uploaded images
      const storedData = sessionStorage.getItem("poem_video_frames");
      if (storedData) {
        try {
          const parsed = JSON.parse(storedData);
          setLocalVideoData(parsed);
        } catch (error) {
          console.error(
            "Failed to parse video data from session storage:",
            error
          );
        }
      } else if (audioSrc) {
        // Use the image previews to create frames if no video data exists
        // This ensures we show all uploaded images
        const audioElement = new Audio(audioSrc);

        // Once we have the audio duration, create frames using all available images
        audioElement.addEventListener("loadedmetadata", () => {
          const duration = audioElement.duration || 10;

          // Get images from props or Redux store
          const availableImages =
            imagePreviews.length > 0
              ? imagePreviews
              : poemVideoState.images.previews;

          // Aim for at least 2 seconds per image, with a minimum of 20 frames total
          const framesPerImage = Math.max(
            20,
            Math.floor(
              (30 * duration) / Math.max(1, availableImages.length || 1)
            )
          );
          const frames: string[] = [];

          if (availableImages.length > 0) {
            // Create frames by cycling through all available images
            for (let i = 0; i < framesPerImage * availableImages.length; i++) {
              const imageIndex =
                Math.floor(i / framesPerImage) % availableImages.length;
              frames.push(availableImages[imageIndex]);
            }

            setLocalVideoData({
              frames,
              frameRate: 30,
              duration: duration,
            });

            // Store in session for potential reuse
            sessionStorage.setItem(
              "poem_video_frames",
              JSON.stringify({
                frames,
                frameRate: 30,
                duration,
              })
            );
          }
        });

        audioElement.load();
      }
    }
  }, [videoData, audioSrc, imagePreviews, poemVideoState.images.previews]);

  // Modified preload images function to log loaded images for debugging
  useEffect(() => {
    if (!localVideoData?.frames?.length) return;

    setIsLoading(true);
    console.log(`Attempting to load ${localVideoData.frames.length} frames`);

    const loadImages = async () => {
      const images = await Promise.all(
        localVideoData.frames.map((src, index) => {
          return new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
              console.log(
                `Loaded image ${index + 1}/${localVideoData.frames.length}`
              );
              resolve(img);
            };
            img.onerror = (e) => {
              console.error(`Failed to load image ${index + 1}:`, e);
              reject(e);
            };
            img.src = src;
          });
        })
      );

      console.log(`Successfully loaded ${images.length} images`);
      setLoadedImages(images);
      setIsLoading(false);

      // Draw first frame
      if (images.length > 0 && canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d");
        if (ctx) {
          ctx.drawImage(
            images[0],
            0,
            0,
            canvasRef.current.width,
            canvasRef.current.height
          );
        }
      }
    };

    loadImages().catch((error) => {
      console.error("Failed to load video frames:", error);
      setIsLoading(false);
    });
  }, [localVideoData]);

  // Add a direct initialization of frames if no local video data exists but we have image previews
  useEffect(() => {
    // Only run this if:
    // 1. We don't have video data yet
    // 2. We have image previews available
    // 3. We're not already loading
    if (
      (!localVideoData ||
        !localVideoData.frames ||
        localVideoData.frames.length === 0) &&
      imagePreviews &&
      imagePreviews.length > 0 &&
      !isLoading
    ) {
      console.log(
        "Creating frames directly from image previews",
        imagePreviews
      );

      // Calculate duration based on audio or default
      const duration = audioRef.current?.duration || 10;

      // Create frames array from image previews
      setLocalVideoData({
        frames: imagePreviews,
        frameRate: 30,
        duration: duration,
      });

      // Store for potential reuse
      sessionStorage.setItem(
        "poem_video_frames",
        JSON.stringify({
          frames: imagePreviews,
          frameRate: 30,
          duration,
        })
      );
    }
  }, [localVideoData, imagePreviews, isLoading]);

  // Add container animations based on animation style
  useEffect(() => {
    if (!canvasContainerRef.current || !animationStyle) return;

    // Apply different ambient animations based on style
    switch (animationStyle) {
      case "zoom":
        // Subtle breathing effect using registry-based animation
        createPulseAnimation(canvasContainerRef.current, {
          scale: 1.02,
          duration: 4,
          repeat: -1,
          yoyo: true,
        });
        break;

      case "slide":
        // Subtle horizontal movement with slight rotation
        createPanAnimation(canvasContainerRef.current, {
          x: 5,
          y: 0,
          duration: 6,
          repeat: -1,
          yoyo: true,
        });
        break;

      case "stagger":
        // Subtle floating effect
        createPanAnimation(canvasContainerRef.current, {
          x: 0,
          y: -5,
          duration: 3,
          repeat: -1,
          yoyo: true,
        });
        break;

      case "typewriter":
        // Subtle paper-like movement
        createPanAnimation(canvasContainerRef.current, {
          x: 0,
          y: 3,
          duration: 4,
          repeat: -1,
          yoyo: true,
        });
        break;

      case "fade":
      default:
        // Very subtle scale pulse
        createPulseAnimation(canvasContainerRef.current, {
          scale: 1.01,
          duration: 2.5,
          repeat: -1,
          yoyo: true,
        });
        break;
    }

    return () => {
      if (canvasContainerRef.current) {
        gsap.killTweensOf(canvasContainerRef.current);
      }
    };
  }, [animationStyle]);

  // Sync container animations with play state
  useEffect(() => {
    if (!canvasContainerRef.current) return;

    // Use the registry-based animation control instead of getTweensOf
    if (isPlaying) {
      resumeElementAnimations(canvasContainerRef.current);
    } else {
      pauseElementAnimations(canvasContainerRef.current);
    }
  }, [isPlaying]);

  // Optimize the applyAdvancedImageTransition function for better performance
  const applyAdvancedImageTransition = (
    ctx: CanvasRenderingContext2D,
    currentImage: HTMLImageElement,
    nextImage: HTMLImageElement | null,
    transition: number,
    width: number,
    height: number,
    frameIndex: number,
    totalFrames: number
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate progress through overall animation (0-1)
    const progressInSequence = frameIndex / (totalFrames - 1);

    // Optimize: Use a smaller number of effects and select based on image index not frame index
    // This ensures each image gets consistent treatment and improves performance
    const effectIndex = Math.floor(frameIndex / 15) % 4; // Reduce number of effects from 7 to 4

    // Save context
    ctx.save();

    // Apply different effect for each image in sequence - simplified for performance
    switch (effectIndex) {
      case 0: // Optimized zoom effect
        // Draw current image
        ctx.globalAlpha = 1 - transition;
        ctx.drawImage(currentImage, 0, 0, width, height);

        // Draw next image with zoom
        if (nextImage) {
          ctx.globalAlpha = transition;
          ctx.translate(width / 2, height / 2);
          const zoomScale = 1 + transition * 0.1; // Reduced scale amount
          ctx.scale(zoomScale, zoomScale);
          ctx.drawImage(nextImage, -width / 2, -height / 2, width, height);
        }
        break;

      case 1: // Optimized slide effect
        // Draw current image with slide
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, -width * transition, 0, width, height);

        // Draw next image
        if (nextImage) {
          ctx.globalAlpha = 1;
          ctx.drawImage(nextImage, width * (1 - transition), 0, width, height);
        }
        break;

      case 2: // Optimized fade effect with color
        // Draw base image
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        // Draw next image with fade
        if (nextImage) {
          ctx.globalAlpha = transition;
          ctx.drawImage(nextImage, 0, 0, width, height);

          // Add a subtle color overlay for visual interest
          ctx.globalAlpha = 0.1 * Math.sin(transition * Math.PI);
          ctx.globalCompositeOperation = "overlay";
          ctx.fillStyle = `hsl(${(frameIndex * 20) % 360}, 70%, 50%)`;
          ctx.fillRect(0, 0, width, height);
          ctx.globalCompositeOperation = "source-over";
        }
        break;

      case 3: // Simple crossfade with vignette
      default:
        // Draw current image
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        // Draw next image with fade
        if (nextImage) {
          ctx.globalAlpha = transition;
          ctx.drawImage(nextImage, 0, 0, width, height);
        }

        // Add subtle vignette
        const vignetteGradient = ctx.createRadialGradient(
          width / 2,
          height / 2,
          0,
          width / 2,
          height / 2,
          width * 0.8
        );
        vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
        vignetteGradient.addColorStop(
          1,
          `rgba(0,0,0,${0.3 * Math.sin(transition * Math.PI)})`
        );

        ctx.globalAlpha = 0.5;
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, width, height);
    }

    // Restore context
    ctx.restore();
  };

  // Simplify the decorative elements for better performance
  const addDecorativeElements = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    transition: number,
    frameIndex: number,
    totalFrames: number
  ) => {
    // Use much simpler decorative elements for performance
    ctx.save();

    // Just add a subtle light effect at one corner
    const lightX = width * 0.2;
    const lightY = height * 0.2;

    const glow = ctx.createRadialGradient(
      lightX,
      lightY,
      0,
      lightX,
      lightY,
      width * 0.4
    );
    glow.addColorStop(
      0,
      `rgba(255, 255, 220, ${0.2 * Math.sin(transition * Math.PI)})`
    );
    glow.addColorStop(1, "rgba(255, 255, 220, 0)");

    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  };

  // Optimize the frame effects for better performance
  const applyFrameEffects = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameIndex: number,
    totalFrames: number
  ) => {
    // Save the current context state
    ctx.save();

    // Calculate progress
    const progress = frameIndex / (totalFrames - 1);

    // Just add a subtle vignette - significantly simplified
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      width * 0.5,
      width / 2,
      height / 2,
      width
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.3)");

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillRect(0, 0, width, height);

    // Restore the context
    ctx.restore();
  };

  // Update the main animation method to use the advanced transition effects
  useEffect(() => {
    if (!loadedImages.length || !canvasRef.current) {
      console.log("Cannot set up animation: missing images or canvas");
      return;
    }

    console.log(
      `Setting up advanced animation with ${loadedImages.length} images`
    );

    // Create a main GSAP timeline with advanced configuration
    const timeline = gsap.timeline({
      paused: true,
      onUpdate: () => {
        // Update progress display
        const progress = timeline.progress();
        setProgress(progress * 100);

        // Calculate current frame index with interpolation
        const frameCount = loadedImages.length;
        const rawFrameIndex = progress * (frameCount - 1);
        const frameIndex = Math.min(Math.floor(rawFrameIndex), frameCount - 1);

        if (frameIndex !== currentFrame) {
          console.log(`Showing frame ${frameIndex + 1}/${frameCount}`);
          setCurrentFrame(frameIndex);

          // Draw the frame on canvas
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Calculate transition progress
              const frameFraction = rawFrameIndex - frameIndex;
              const nextFrameIndex = Math.min(frameIndex + 1, frameCount - 1);

              // Apply our enhanced advanced transition with varied effects
              applyAdvancedImageTransition(
                ctx,
                loadedImages[frameIndex],
                frameIndex < frameCount - 1
                  ? loadedImages[nextFrameIndex]
                  : null,
                frameFraction,
                canvas.width,
                canvas.height,
                frameIndex,
                frameCount
              );

              // Add core visual effects
              applyFrameEffects(
                ctx,
                canvas.width,
                canvas.height,
                frameIndex,
                frameCount
              );
            }
          }
        }
      },
      onComplete: () => {
        setIsPlaying(false);
        if (onComplete) onComplete();

        // Add a completion effect
        if (canvasContainerRef.current) {
          gsap.to(canvasContainerRef.current, {
            opacity: 0.8,
            scale: 1.03,
            duration: 0.8,
            yoyo: true,
            repeat: 1,
            ease: "power2.inOut",
            onComplete: () => {
              gsap.to(canvasContainerRef.current, {
                opacity: 1,
                scale: 1,
                duration: 0.5,
              });
            },
          });
        }
      },
    });

    // Calculate optimal timing
    const audioElement = audioRef.current;
    const baseDuration =
      audioElement?.duration || localVideoData?.duration || 10;
    console.log(`Animation duration: ${baseDuration}s`);

    const frameCount = loadedImages.length;
    const secondsPerFrame = baseDuration / frameCount;

    // Create more dynamic timing for animation effects
    for (let i = 0; i < frameCount; i++) {
      // Calculate position in timeline (0 to 1)
      const position = i / (frameCount - 1);

      // Make timing more interesting based on animation style
      let adjustedDuration = secondsPerFrame;

      // Add variety to timing based on style
      switch (animationStyle) {
        case "zoom":
          // Zoom animations have dramatic timing
          adjustedDuration =
            secondsPerFrame * (0.8 + Math.sin(position * Math.PI) * 0.4);
          break;

        case "slide":
          // Slide animations have slight pauses between slides
          adjustedDuration = secondsPerFrame * (1 + (i % 2 === 0 ? 0.2 : -0.1));
          break;

        case "typewriter":
          // Typewriter animations have irregular timing
          adjustedDuration =
            secondsPerFrame * (0.9 + Math.sin(position * Math.PI * 3) * 0.2);
          break;

        case "stagger":
          // Staggered animations have varied pacing
          adjustedDuration = secondsPerFrame * (1 + (i % 3) * 0.15);
          break;
      }

      // Calculate time position
      const timePosition = i === 0 ? 0 : timeline.duration();

      // Add frame label
      timeline.addLabel(`frame${i}`, timePosition);

      // Add specialized effects for each frame transition
      if (i > 0) {
        const target = canvasContainerRef.current;
        if (target) {
          // Add different effects based on animation style
          switch (animationStyle) {
            case "zoom":
              // Add dynamic zoom effect
              timeline.to(
                target,
                {
                  scale: 1 + (i % 2 === 0 ? 0.05 : -0.03),
                  duration: adjustedDuration * 0.7,
                  ease: "power2.inOut",
                },
                timePosition
              );
              break;

            case "slide":
              // Add slight motion effect for slides
              timeline.to(
                target,
                {
                  x: i % 2 === 0 ? 8 : -8,
                  rotation: i % 2 === 0 ? 0.3 : -0.3,
                  duration: adjustedDuration * 0.6,
                  ease: "power1.inOut",
                },
                timePosition
              );
              break;

            case "typewriter":
              // Add subtle shake effect for typewriter
              if (i % 3 === 0) {
                timeline.to(
                  target,
                  {
                    rotation: Math.random() > 0.5 ? 0.2 : -0.2,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power1.inOut",
                  },
                  timePosition
                );
              }
              break;

            case "stagger":
              // Add subtle floating effect for staggered animations
              timeline.to(
                target,
                {
                  y: i % 3 === 0 ? -4 : i % 3 === 1 ? 4 : 0,
                  duration: adjustedDuration * 0.8,
                  ease: "sine.inOut",
                },
                timePosition
              );
              break;
          }
        }
      }

      // Extend timeline
      if (i < frameCount - 1) {
        timeline.to({}, { duration: adjustedDuration });
      }
    }

    // If we have audio, make sure the animation matches its duration
    if (audioElement) {
      const currentDuration = timeline.duration();
      if (Math.abs(currentDuration - audioElement.duration) > 0.5) {
        // Adjust timeline to match audio duration
        const scale = audioElement.duration / currentDuration;
        timeline.timeScale(scale);
        console.log(
          `Adjusted animation speed to match audio: ${scale.toFixed(2)}x`
        );
      }
    }

    // Store the timeline
    animationRef.current = timeline;
    console.log(`Animation timeline created with ${frameCount} frames`);

    // Auto-play if enabled
    if (autoPlay) {
      setTimeout(() => {
        console.log("Auto-playing animation");
        togglePlayback();
      }, 500);
    }

    return () => {
      // Cleanup on unmount
      if (animationRef.current) {
        animationRef.current.kill();
      }
    };
  }, [loadedImages, autoPlay, currentFrame, onComplete, animationStyle]);

  // Synchronize audio with animation
  useEffect(() => {
    if (!audioRef.current || !animationRef.current) return;

    const audio = audioRef.current;
    const timeline = animationRef.current;

    // Set up custom synchronization with GSAP
    if (isPlaying) {
      syncAnimationWithAudio(timeline, audio);
    }

    // Set up event listeners
    audio.addEventListener("ended", () => setIsPlaying(false));

    return () => {
      audio.removeEventListener("ended", () => setIsPlaying(false));
    };
  }, [isPlaying]);

  // Replace the download functions with a simpler implementation using the utility
  const downloadVideo = useCallback(() => {
    if (!loadedImages.length || !canvasRef.current) {
      console.error("Cannot generate video: missing images or canvas");
      return;
    }

    setIsLoading(true);
    setProgress(0);

    console.log(`Starting video export with ${loadedImages.length} images`);

    // Export the video with the loaded images
    exportVideo(loadedImages, {
      frameRate: 24,
      width: 1280,
      height: 720,
      quality: "medium",
      audioSrc: audioSrc,
      onProgress: (progress) => {
        setProgress(progress);
      },
    })
      .then((blob) => {
        console.log(
          `Video export completed, size: ${(blob.size / (1024 * 1024)).toFixed(
            2
          )} MB`
        );

        // Download the video
        downloadBlob(blob, "poem-video.webm");

        // Reset loading state
        setIsLoading(false);
        setProgress(100);
      })
      .catch((error) => {
        console.error("Video export failed:", error);
        alert(
          `Failed to export video: ${error.message}. Please try again or use a different browser.`
        );
        setIsLoading(false);
      });
  }, [loadedImages, audioSrc]);

  // Clean up worker on component unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  // Update the togglePlayback function for better performance
  const togglePlayback = () => {
    if (!animationRef.current) {
      console.warn(
        "Cannot toggle playback: animation timeline not initialized"
      );
      return;
    }

    const newPlayingState = !isPlaying;
    console.log(`${newPlayingState ? "Playing" : "Pausing"} animation`);

    if (newPlayingState) {
      // Starting playback
      animationRef.current.play();
      if (audioRef.current) {
        audioRef.current.play().catch((err) => {
          console.error("Error playing audio:", err);
        });
      }
    } else {
      // Pausing playback
      animationRef.current.pause();
      if (audioRef.current) audioRef.current.pause();
    }

    setIsPlaying(newPlayingState);
  };

  // Reset animation to beginning
  const resetAnimation = () => {
    if (!animationRef.current) return;

    animationRef.current.progress(0);
    if (audioRef.current) audioRef.current.currentTime = 0;
    setCurrentFrame(0);
    setProgress(0);
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-xl">
      {/* Canvas wrapper with animation effects */}
      <div
        ref={canvasContainerRef}
        className="relative overflow-hidden bg-black"
      >
        {/* Canvas for rendering frames */}
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full aspect-video bg-gray-900"
        />

        {/* Simple visual effects overlay instead of dynamic one */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 to-black/40 opacity-30"></div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 z-10">
          <div className="text-white flex flex-col items-center">
            <svg
              className="animate-spin h-10 w-10 mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span>Loading your poem video...</span>
          </div>
        </div>
      )}

      {/* Audio element (hidden) */}
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          preload="auto"
          className="hidden"
        />
      )}

      {/* Playback controls */}
      <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
        <div className="px-4 py-2 bg-black bg-opacity-40 rounded-full backdrop-blur-sm flex items-center space-x-4">
          <button
            onClick={togglePlayback}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            disabled={isLoading || !loadedImages.length}
          >
            {isPlaying ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <rect x="6" y="4" width="3" height="12" rx="1" />
                <rect x="11" y="4" width="3" height="12" rx="1" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <button
            onClick={resetAnimation}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            disabled={isLoading || !loadedImages.length}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Download button */}
          <button
            onClick={downloadVideo}
            className="text-white p-2 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
            disabled={isLoading || !loadedImages.length}
            title="Download video"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          {/* Progress bar */}
          <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Frame counter */}
          <div className="text-white text-xs">
            {currentFrame + 1}/{loadedImages.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedVideoPlayer;
