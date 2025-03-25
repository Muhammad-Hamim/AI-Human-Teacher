import React, { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  syncAnimationWithAudio,
  createPulseAnimation,
  createPanAnimation,
  pauseElementAnimations,
  resumeElementAnimations,
} from "./animations/GsapEffects";
import { useAppSelector } from "../../../redux/hooks";

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

  // Modified animation setup with improved GSAP timeline
  useEffect(() => {
    if (!loadedImages.length || !canvasRef.current) {
      console.log("Cannot set up animation: missing images or canvas");
      return;
    }

    console.log(`Setting up animation with ${loadedImages.length} images`);

    // Create a main GSAP timeline
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

              // Apply enhanced transition effect
              applyImageTransitionEffect(
                ctx,
                loadedImages[frameIndex],
                frameIndex < frameCount - 1
                  ? loadedImages[nextFrameIndex]
                  : null,
                frameFraction,
                canvas.width,
                canvas.height,
                animationStyle
              );

              // Add visual effects
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

  // Add image transition effect with blend modes and color transformations
  const applyImageTransitionEffect = (
    ctx: CanvasRenderingContext2D,
    currentImage: HTMLImageElement,
    nextImage: HTMLImageElement | null,
    transition: number,
    width: number,
    height: number,
    animationStyle: string
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save the original state
    ctx.save();

    // Apply different transition effects based on animation style
    switch (animationStyle) {
      case "zoom":
        // Zoom transition
        const scale1 = 1 + transition * 0.1;
        const scale2 = 1.1 - transition * 0.1;

        // Draw current image with zoom out effect
        ctx.globalAlpha = 1 - transition;
        ctx.translate(width / 2, height / 2);
        ctx.scale(scale1, scale1);
        ctx.drawImage(currentImage, -width / 2, -height / 2, width, height);
        ctx.resetTransform();

        // Draw next image with zoom in effect if available
        if (nextImage) {
          ctx.globalAlpha = transition;
          ctx.translate(width / 2, height / 2);
          ctx.scale(scale2, scale2);
          ctx.drawImage(nextImage, -width / 2, -height / 2, width, height);
          ctx.resetTransform();
        }
        break;

      case "slide":
        // Slide transition
        const slideOffset = width * transition;

        // Draw current image sliding out
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, -slideOffset, 0, width, height);

        // Draw next image sliding in if available
        if (nextImage) {
          ctx.drawImage(nextImage, width - slideOffset, 0, width, height);
        }
        break;

      case "fade":
        // Enhanced fade transition with color overlay
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        if (nextImage) {
          // Add subtle color gradient overlay during transition
          const gradient = ctx.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, `rgba(30, 64, 175, ${transition * 0.2})`); // blue-700
          gradient.addColorStop(1, `rgba(190, 24, 93, ${transition * 0.2})`); // pink-700

          ctx.globalAlpha = 1;
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, width, height);

          // Blend in next image
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = transition;
          ctx.drawImage(nextImage, 0, 0, width, height);
        }
        break;

      case "typewriter":
        // Typewriter effect with scanline transition
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        if (nextImage) {
          // Create a scanline effect moving down
          const scanlineHeight = Math.floor(height * transition);
          ctx.globalAlpha = 1;

          // Create clipping region for the next image
          ctx.beginPath();
          ctx.rect(0, 0, width, scanlineHeight);
          ctx.clip();

          // Draw the next image in the clipped region
          ctx.drawImage(nextImage, 0, 0, width, height);

          // Add scanline highlight
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = "white";
          ctx.fillRect(0, scanlineHeight - 2, width, 4);
        }
        break;

      case "stagger":
        // Staggered tile reveal
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        if (nextImage) {
          const tileSize = 50;
          const cols = Math.ceil(width / tileSize);
          const rows = Math.ceil(height / tileSize);
          const totalTiles = cols * rows;
          const tilesRevealed = Math.floor(totalTiles * transition);

          for (let i = 0; i < tilesRevealed; i++) {
            // Create a semi-random but consistent reveal pattern
            const row = Math.floor(i / cols);
            const col = i % cols;
            const x = col * tileSize;
            const y = row * tileSize;

            // Draw the tile from the next image
            ctx.save();
            ctx.beginPath();
            ctx.rect(x, y, tileSize, tileSize);
            ctx.clip();
            ctx.drawImage(nextImage, 0, 0, width, height);
            ctx.restore();
          }
        }
        break;

      default:
        // Simple cross-fade
        ctx.globalAlpha = 1;
        ctx.drawImage(currentImage, 0, 0, width, height);

        if (nextImage) {
          ctx.globalAlpha = transition;
          ctx.drawImage(nextImage, 0, 0, width, height);
        }
    }

    // Restore the original state
    ctx.restore();
  };

  // Enhance the frame effects for more dynamic visuals
  const applyFrameEffects = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    frameIndex: number,
    totalFrames: number
  ) => {
    // Save the current context state
    ctx.save();

    // Calculate dynamic parameters based on frame index
    const progress = frameIndex / (totalFrames - 1);
    const radialGradientSize = Math.max(width, height) * 0.8;

    // Apply a more dramatic vignette effect that pulses subtly
    const vignetteIntensity = 0.25 + Math.sin(progress * Math.PI * 4) * 0.05;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radialGradientSize * 0.2,
      width / 2,
      height / 2,
      radialGradientSize
    );

    gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
    gradient.addColorStop(
      0.7,
      `rgba(0, 0, 0, ${0.1 + Math.sin(progress * Math.PI) * 0.05})`
    );
    gradient.addColorStop(1, `rgba(0, 0, 0, ${vignetteIntensity})`);

    ctx.fillStyle = gradient;
    ctx.globalCompositeOperation = "multiply";
    ctx.fillRect(0, 0, width, height);

    // Add dynamic lighting effects with color variation based on progress
    ctx.globalCompositeOperation = "screen";

    // Primary light source with color shifting based on frame position
    const hue1 = Math.floor((progress * 180 + 30) % 360); // Warm tones shifting through the spectrum
    const lightX1 = width * (0.3 + Math.sin(progress * Math.PI * 2) * 0.15);
    const lightY1 = height * (0.4 + Math.cos(progress * Math.PI * 3) * 0.15);

    const lightGradient1 = ctx.createRadialGradient(
      lightX1,
      lightY1,
      0,
      lightX1,
      lightY1,
      width * 0.5
    );

    lightGradient1.addColorStop(
      0,
      `hsla(${hue1}, 90%, 65%, ${0.12 + Math.sin(progress * Math.PI) * 0.05})`
    );
    lightGradient1.addColorStop(0.5, `hsla(${hue1}, 90%, 65%, 0.05)`);
    lightGradient1.addColorStop(1, "hsla(0, 0%, 100%, 0)");

    ctx.fillStyle = lightGradient1;
    ctx.fillRect(0, 0, width, height);

    // Secondary light source with complementary color
    const hue2 = (hue1 + 180) % 360; // Complementary color
    const lightX2 = width * (0.7 + Math.cos(progress * Math.PI * 2.5) * 0.15);
    const lightY2 = height * (0.6 + Math.sin(progress * Math.PI * 3.5) * 0.15);

    const lightGradient2 = ctx.createRadialGradient(
      lightX2,
      lightY2,
      0,
      lightX2,
      lightY2,
      width * 0.4
    );

    lightGradient2.addColorStop(
      0,
      `hsla(${hue2}, 80%, 65%, ${
        0.08 + Math.cos(progress * Math.PI * 2) * 0.03
      })`
    );
    lightGradient2.addColorStop(0.5, `hsla(${hue2}, 80%, 65%, 0.03)`);
    lightGradient2.addColorStop(1, "hsla(0, 0%, 100%, 0)");

    ctx.fillStyle = lightGradient2;
    ctx.fillRect(0, 0, width, height);

    // Enhanced film grain texture with varying intensity
    ctx.globalCompositeOperation = "overlay";
    ctx.globalAlpha = 0.03 + Math.sin(progress * Math.PI * 7) * 0.01; // Pulsing grain intensity

    // More efficient film grain with fewer iterations but larger particles
    for (let i = 0; i < 1000; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 2 + 0.5;

      // Use hue-based coloring for grain to match our lighting
      const grainHue = Math.random() > 0.5 ? hue1 : hue2;
      const brightness = Math.random() * 50 + 50;
      ctx.fillStyle = `hsla(${grainHue}, 30%, ${brightness}%, 0.15)`;
      ctx.fillRect(x, y, size, size);
    }

    // Add a subtle atmospheric mist that moves across the frame
    const mistPosition = (progress * 2) % 1;
    const mistGradient = ctx.createLinearGradient(
      width * mistPosition,
      0,
      (width * (mistPosition + 0.5)) % 1,
      height
    );

    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.05;

    mistGradient.addColorStop(0, `hsla(${hue1}, 30%, 90%, 0.1)`);
    mistGradient.addColorStop(
      0.5,
      `hsla(${(hue1 + 30) % 360}, 30%, 90%, 0.05)`
    );
    mistGradient.addColorStop(1, `hsla(${hue1}, 30%, 90%, 0.1)`);

    ctx.fillStyle = mistGradient;
    ctx.fillRect(0, 0, width, height);

    // Reset composite operation and alpha
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1.0;

    // Restore the context to its original state
    ctx.restore();
  };

  // Update the play/pause function for more reliable playback
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
          // Continue with animation even if audio fails
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

        {/* Additional visual effects overlay */}
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
