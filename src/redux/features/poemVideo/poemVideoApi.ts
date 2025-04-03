import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface GenerateVideoRequest {
  poemTitle: string;
  poemContent: string;
  images: string[]; // base64 encoded images
  audio?: string; // base64 encoded audio (optional)
  animationStyle: string;
  animationTiming: {
    duration: number;
    delay: number;
    staggering: number;
  };
}

interface GenerateVideoResponse {
  success: boolean;
  message: string;
  data: {
    videoUrl: string;
    processingTime: number;
  };
}

interface TranscodeAudioRequest {
  audioFile: string; // base64 encoded audio
}

interface TranscodeAudioResponse {
  success: boolean;
  message: string;
  data: {
    transcodedAudio: string; // base64 encoded audio in web-compatible format
    duration: number;
  };
}

interface GenerateAudioRequest {
  poemContent: string;
  voice?: string; // optional voice ID
}

interface GenerateAudioResponse {
  success: boolean;
  message: string;
  data: {
    audioUrl: string;
    audioData: string; // base64 encoded audio
    duration: number;
  };
}

// Define response types
interface VideoGenerationResponse {
  success: boolean;
  data: {
    videoUrl: string;
    duration: number;
  };
  error?: string;
}

interface AudioTranscodeResponse {
  success: boolean;
  data: {
    audioUrl: string;
    duration: number;
  };
  error?: string;
}

interface AudioGenerationResponse {
  success: boolean;
  data: {
    audioUrl: string;
    duration: number;
  };
  error?: string;
}

export const poemVideoApi = createApi({
  reducerPath: "poemVideoApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/api/v1/",
  }),
  tagTypes: ["PoemVideo"],
  endpoints: (builder) => ({
    // These are the original API endpoints that would connect to the backend
    // Keeping them commented out for future reference
    /*
    generateVideo: builder.mutation<
      GenerateVideoResponse,
      GenerateVideoRequest
    >({
      query: (payload) => ({
        url: "/poem-video/generate",
        method: "POST",
        body: payload,
      }),
    }),
    */

    // Simulate video generation (client-side implementation)
    simulateVideoGeneration: builder.mutation<
      VideoGenerationResponse,
      {
        poemTitle: string;
        poemContent: string;
        images: string[];
        audio?: string;
        animationStyle: string;
        animationTiming: {
          duration: number;
          delay: number;
          staggering: number;
        };
      }
    >({
      queryFn: async (args) => {
        // This is a client-side simulation since we don't have a backend
        try {
          // Artificial delay to simulate processing time
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Parse the poem into lines
          const poemLines = args.poemContent
            .split("\n")
            .filter((line) => line.trim() !== "");

          // Create a video-like animation sequence rendered on canvas
          const canvasWidth = 1280;
          const canvasHeight = 720;
          const framesPerSecond = 30;
          const totalDuration = Math.max(10, args.images.length * 3); // At least 10 seconds, or 3 seconds per image
          const totalFrames = totalDuration * framesPerSecond;

          // Create canvas
          const canvas = document.createElement("canvas");
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext("2d", { alpha: false });

          if (!ctx) {
            throw new Error("Could not get canvas context");
          }

          // Load all images first
          const loadedImages = await Promise.all(
            args.images.map((src) => {
              return new Promise<HTMLImageElement>((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
              });
            })
          );

          // Create frames at specific keypoints to simulate a video
          // We'll create several key frames (beginning, middle points, end)
          const frames: string[] = [];

          // Function to draw a specific keyframe
          const drawKeyframe = (frameIndex: number) => {
            // Clear canvas
            ctx.fillStyle = "#000000";
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);

            // Determine which image to show based on frame index
            const progress = frameIndex / totalFrames;
            const imageIndex = Math.min(
              Math.floor(progress * loadedImages.length),
              loadedImages.length - 1
            );

            // Calculate transition effects
            const withinImageProgress = (progress * loadedImages.length) % 1;

            // Enhanced animation effects based on the selected style
            let animationEffect = 1.0;
            let rotationAngle = 0;
            let blurAmount = 0;
            let xOffset = 0;
            let yOffset = 0;
            let scaleFactor = 1.0;

            // Apply custom effects based on animation style
            switch (args.animationStyle) {
              case "fade":
                // Enhanced fade effect with subtle zoom
                animationEffect =
                  0.7 + 0.3 * Math.sin(withinImageProgress * Math.PI);
                scaleFactor =
                  1.0 + 0.05 * Math.sin(withinImageProgress * Math.PI * 2);
                break;

              case "zoom":
                // More dramatic zoom effect
                scaleFactor =
                  1.0 + 0.15 * Math.sin(withinImageProgress * Math.PI);
                blurAmount = 2 * (1 - Math.sin(withinImageProgress * Math.PI));
                break;

              case "slide":
                // Enhanced slide with direction changes
                const slideDirection = imageIndex % 2 === 0 ? -1 : 1;
                xOffset =
                  slideDirection *
                  canvasWidth *
                  0.1 *
                  (1 - Math.sin(withinImageProgress * Math.PI));
                animationEffect =
                  0.8 + 0.2 * Math.sin(withinImageProgress * Math.PI);
                break;

              case "typewriter":
                // Visual effect complementing typewriter text
                scaleFactor = 1.0 + 0.02 * Math.sin(progress * Math.PI * 10);
                break;

              case "stagger":
                // Visual effect complementing staggered appearance
                if (withinImageProgress < 0.5) {
                  yOffset =
                    (0.5 - withinImageProgress) *
                    20 *
                    Math.sin(withinImageProgress * Math.PI);
                }
                rotationAngle = (0.5 - Math.abs(withinImageProgress - 0.5)) * 2;
                break;

              default:
                // Default effect with subtle pulse
                scaleFactor =
                  1.0 + 0.03 * Math.sin(withinImageProgress * Math.PI * 4);
                break;
            }

            // Draw current image with enhanced effects
            const currentImage = loadedImages[imageIndex];

            // Handle image positioning and scaling to fit canvas while maintaining aspect ratio
            const imgRatio = currentImage.width / currentImage.height;
            const canvasRatio = canvasWidth / canvasHeight;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
              // Image is wider than canvas
              drawHeight = canvasHeight;
              drawWidth =
                currentImage.width * (drawHeight / currentImage.height);
              offsetX = (canvasWidth - drawWidth) / 2;
              offsetY = 0;
            } else {
              // Image is taller than canvas
              drawWidth = canvasWidth;
              drawHeight =
                currentImage.height * (drawWidth / currentImage.width);
              offsetX = 0;
              offsetY = (canvasHeight - drawHeight) / 2;
            }

            // Apply enhanced zoom effect with the calculated scale factor
            const zoomedWidth = drawWidth * scaleFactor;
            const zoomedHeight = drawHeight * scaleFactor;

            // Adjust offsets for zoom, rotation, and position effects
            const adjustedOffsetX =
              offsetX - (zoomedWidth - drawWidth) / 2 + xOffset;
            const adjustedOffsetY =
              offsetY - (zoomedHeight - drawHeight) / 2 + yOffset;

            // Save the current context state for transformations
            ctx.save();

            // Apply rotation if needed
            if (rotationAngle !== 0) {
              ctx.translate(canvasWidth / 2, canvasHeight / 2);
              ctx.rotate((rotationAngle * Math.PI) / 180);
              ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
            }

            // Draw the current image with applied effects
            ctx.globalAlpha = animationEffect;

            // Apply blur if needed (simulate with multiple draws)
            if (blurAmount > 0) {
              // Draw multiple slightly offset images to create blur effect
              for (let b = 0; b < 3; b++) {
                const blurOffset = (b - 1) * blurAmount;
                ctx.globalAlpha = animationEffect * (b === 1 ? 0.6 : 0.2);
                ctx.drawImage(
                  currentImage,
                  adjustedOffsetX + blurOffset,
                  adjustedOffsetY,
                  zoomedWidth,
                  zoomedHeight
                );
              }
              ctx.globalAlpha = animationEffect;
            } else {
              // Normal draw without blur
              ctx.drawImage(
                currentImage,
                adjustedOffsetX,
                adjustedOffsetY,
                zoomedWidth,
                zoomedHeight
              );
            }

            // Restore context state
            ctx.restore();

            // If we're transitioning between images, blend in the next image
            if (
              withinImageProgress > 0.7 &&
              imageIndex < loadedImages.length - 1
            ) {
              const nextImage = loadedImages[imageIndex + 1];
              const nextImageAlpha = (withinImageProgress - 0.7) / 0.3; // Fade from 0 to 1 during last 30% of current image time

              // Apply transition effects between images based on style
              let transitionAlpha = 0.4 * nextImageAlpha;
              let transitionScale = 1.0;
              let transitionX = 0;
              let transitionY = 0;

              switch (args.animationStyle) {
                case "fade":
                  transitionAlpha = 0.5 * nextImageAlpha;
                  break;
                case "zoom":
                  transitionAlpha = 0.4 * nextImageAlpha;
                  transitionScale = 1.1 - nextImageAlpha * 0.1;
                  break;
                case "slide":
                  transitionAlpha = 0.6 * nextImageAlpha;
                  transitionX =
                    (1 - nextImageAlpha) *
                    (imageIndex % 2 === 0
                      ? canvasWidth * 0.05
                      : -canvasWidth * 0.05);
                  break;
                default:
                  transitionAlpha = 0.4 * nextImageAlpha;
                  break;
              }

              // Draw the next image with transition effects
              const nextImgRatio = nextImage.width / nextImage.height;
              let nextDrawWidth, nextDrawHeight, nextOffsetX, nextOffsetY;

              if (nextImgRatio > canvasRatio) {
                nextDrawHeight = canvasHeight;
                nextDrawWidth =
                  nextImage.width * (nextDrawHeight / nextImage.height);
                nextOffsetX = (canvasWidth - nextDrawWidth) / 2;
                nextOffsetY = 0;
              } else {
                nextDrawWidth = canvasWidth;
                nextDrawHeight =
                  nextImage.height * (nextDrawWidth / nextImage.width);
                nextOffsetX = 0;
                nextOffsetY = (canvasHeight - nextDrawHeight) / 2;
              }

              // Apply transition effects
              const transWidth = nextDrawWidth * transitionScale;
              const transHeight = nextDrawHeight * transitionScale;
              const transX =
                nextOffsetX - (transWidth - nextDrawWidth) / 2 + transitionX;
              const transY =
                nextOffsetY - (transHeight - nextDrawHeight) / 2 + transitionY;

              // Save context for transitions
              ctx.save();
              ctx.globalAlpha = transitionAlpha;

              // Draw the next image with transition effects
              ctx.drawImage(nextImage, transX, transY, transWidth, transHeight);

              // Restore context
              ctx.restore();
            }

            // Apply visual effects overlay based on animation style
            applyStyleEffects(
              ctx,
              canvasWidth,
              canvasHeight,
              progress,
              args.animationStyle
            );

            // Overlay text with enhanced styling
            ctx.globalAlpha = 1.0;

            // Title at top with improved styling
            const titleAreaHeight = 100;

            // Draw title background with gradient
            const titleGradient = ctx.createLinearGradient(
              0,
              0,
              0,
              titleAreaHeight
            );
            titleGradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
            titleGradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
            ctx.fillStyle = titleGradient;
            ctx.fillRect(0, 0, canvasWidth, titleAreaHeight);

            // Add subtle line under title
            ctx.beginPath();
            ctx.moveTo(canvasWidth * 0.3, titleAreaHeight);
            ctx.lineTo(canvasWidth * 0.7, titleAreaHeight);
            ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw title text with shadow
            ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
            ctx.shadowBlur = 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = "#ffffff";
            ctx.font = "bold 42px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(args.poemTitle, canvasWidth / 2, titleAreaHeight / 2);

            // Reset shadow
            ctx.shadowColor = "transparent";
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            // Determine which line of poem to show based on progress
            const lineIndex = Math.min(
              Math.floor(progress * poemLines.length),
              poemLines.length - 1
            );

            // Show current poem line at bottom with enhanced styling
            if (poemLines.length > 0) {
              const bottomAreaHeight = 120;

              // Create gradient for bottom text area
              const bottomGradient = ctx.createLinearGradient(
                0,
                canvasHeight - bottomAreaHeight,
                0,
                canvasHeight
              );
              bottomGradient.addColorStop(0, "rgba(0, 0, 0, 0.2)");
              bottomGradient.addColorStop(1, "rgba(0, 0, 0, 0.8)");
              ctx.fillStyle = bottomGradient;
              ctx.fillRect(
                0,
                canvasHeight - bottomAreaHeight,
                canvasWidth,
                bottomAreaHeight
              );

              // Add decorative elements
              ctx.beginPath();
              ctx.moveTo(canvasWidth * 0.3, canvasHeight - bottomAreaHeight);
              ctx.lineTo(canvasWidth * 0.7, canvasHeight - bottomAreaHeight);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
              ctx.lineWidth = 2;
              ctx.stroke();

              // Apply text shadow for better readability
              ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;

              ctx.fillStyle = "#ffffff";
              ctx.font = "italic 26px Georgia";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";

              // Calculate line height based on available space
              const text = poemLines[lineIndex];
              const textY = canvasHeight - bottomAreaHeight / 2;

              // Draw text with fading effect
              const lineProgress = progress * poemLines.length - lineIndex;
              const fadeInEffect = Math.min(1, lineProgress * 4); // Fade in quickly
              ctx.globalAlpha = fadeInEffect;
              ctx.fillText(text, canvasWidth / 2, textY);

              // Reset shadow and alpha
              ctx.shadowColor = "transparent";
              ctx.shadowBlur = 0;
              ctx.globalAlpha = 1.0;
            }

            // Return the frame as data URL
            return canvas.toDataURL("image/jpeg", 0.92);
          };

          // Generate key frames (we'll generate 10-20 frames to simulate a video)
          const numKeyframes = 16; // Enough frames to show a smooth animation sequence
          for (let i = 0; i < numKeyframes; i++) {
            const frameIndex = Math.floor(
              (i / (numKeyframes - 1)) * totalFrames
            );
            frames.push(drawKeyframe(frameIndex));
          }

          // Create an animated gif-like data URL using the frames
          // This is a simplified approach - in a real implementation, you would use a video encoding library
          // or a backend service to create an actual video

          // For now, we'll return the first frame as the "video" with metadata containing all frames
          const videoData = {
            frames: frames,
            frameRate: framesPerSecond,
            duration: totalDuration,
            firstFrame: frames[0],
          };

          // Store the frames in sessionStorage for playback
          sessionStorage.setItem(
            "poem_video_frames",
            JSON.stringify(videoData)
          );

          return {
            data: {
              success: true,
              data: {
                videoUrl: frames[0], // First frame as preview
                duration: totalDuration,
              },
            },
          };
        } catch (error) {
          console.error("Error in video generation simulation:", error);
          return {
            error: {
              status: "CUSTOM_ERROR",
              error:
                "Failed to generate video: " +
                (error instanceof Error ? error.message : String(error)),
            },
          };
        }
      },
    }),

    // Transcode audio
    transcodeAudio: builder.mutation<
      AudioTranscodeResponse,
      {
        audioBase64: string;
      }
    >({
      queryFn: async (args) => {
        try {
          // This is a client-side simulation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          return {
            data: {
              success: true,
              data: {
                audioUrl: args.audioBase64,
                duration: 30, // seconds
              },
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Failed to transcode audio",
            },
          };
        }
      },
    }),

    // Generate audio from text
    generateAudio: builder.mutation<
      AudioGenerationResponse,
      {
        text: string;
        voice?: string;
      }
    >({
      queryFn: async (args) => {
        try {
          // This is a client-side simulation
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // In a real implementation, this would call a text-to-speech API

          return {
            data: {
              success: true,
              data: {
                audioUrl:
                  "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAAeAAAZIAAICAgQEBAYGBggICApKSkxMTE5OTlCQkJKSkpSUlJaWlpjY2Nra2tzc3N7e3uEhISMjIyUlJScnJylpaWtra21tbW9vb3GxsbOzs7W1tbe3t7n5+fv7+/39/f///8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAUHg",
                duration: 5, // seconds
              },
            },
          };
        } catch (error) {
          return {
            error: {
              status: "CUSTOM_ERROR",
              error: "Failed to generate audio",
            },
          };
        }
      },
    }),
  }),
});

export const {
  useSimulateVideoGenerationMutation,
  useTranscodeAudioMutation,
  useGenerateAudioMutation,
} = poemVideoApi;

// Helper function to apply style-specific effects
const applyStyleEffects = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
  style: string
) => {
  // Add style-specific overlays and effects
  switch (style) {
    case "fade":
      // Soft vignette effect
      const vignetteGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.4,
        width / 2,
        height / 2,
        height * 0.9
      );
      vignetteGradient.addColorStop(0, "rgba(0,0,0,0)");
      vignetteGradient.addColorStop(1, "rgba(0,0,0,0.4)");
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
      break;

    case "zoom":
      // Add radial highlight at center
      const glowGradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        height * 0.8
      );
      glowGradient.addColorStop(0, "rgba(255,255,255,0.1)");
      glowGradient.addColorStop(0.5, "rgba(255,255,255,0.05)");
      glowGradient.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = glowGradient;
      ctx.fillRect(0, 0, width, height);
      break;

    case "slide":
      // Add subtle directional light from one side
      const slideDirection = Math.floor(progress * 4) % 2 === 0 ? 1 : -1;
      const lightX = width / 2 + slideDirection * width * 0.4;

      const sideGlow = ctx.createRadialGradient(
        lightX,
        height / 2,
        0,
        lightX,
        height / 2,
        width * 0.8
      );
      sideGlow.addColorStop(0, "rgba(255,255,255,0.15)");
      sideGlow.addColorStop(0.3, "rgba(255,255,255,0.05)");
      sideGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = sideGlow;
      ctx.fillRect(0, 0, width, height);
      break;

    case "typewriter":
      // Add subtle paper texture effect
      ctx.fillStyle = "rgba(255,252,242,0.03)";
      for (let i = 0; i < height; i += 4) {
        ctx.fillRect(0, i, width, 1);
      }
      break;

    case "stagger":
      // Add subtle moving highlight based on progress
      const highlightY =
        height * (0.3 + 0.4 * Math.sin(progress * Math.PI * 2));

      const highlight = ctx.createLinearGradient(
        0,
        highlightY - 50,
        0,
        highlightY + 50
      );
      highlight.addColorStop(0, "rgba(0,0,0,0)");
      highlight.addColorStop(0.5, "rgba(255,255,255,0.1)");
      highlight.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = highlight;
      ctx.fillRect(0, 0, width, height);
      break;

    default:
      // Default subtle vignette
      const defaultVignette = ctx.createRadialGradient(
        width / 2,
        height / 2,
        height * 0.5,
        width / 2,
        height / 2,
        height
      );
      defaultVignette.addColorStop(0, "rgba(0,0,0,0)");
      defaultVignette.addColorStop(1, "rgba(0,0,0,0.3)");
      ctx.fillStyle = defaultVignette;
      ctx.fillRect(0, 0, width, height);
      break;
  }

  // Add subtle film grain effect to all styles
  ctx.globalCompositeOperation = "overlay";
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 20; i++) {
    const grainX = Math.random() * width;
    const grainY = Math.random() * height;
    const grainSize = Math.random() * 40 + 10;

    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#000000";
    ctx.fillRect(grainX, grainY, grainSize, grainSize);
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1.0;
};
