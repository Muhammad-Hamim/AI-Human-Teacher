import { gsap } from "gsap";
import { useEffect, useRef } from "react";

/**
 * Animation utility to create a pulsing effect with GSAP
 * @param element Target element to animate
 * @param options Animation options
 */
export const createPulseAnimation = (
  element: HTMLElement,
  options = {
    duration: 2,
    scale: 1.05,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut",
  }
) => {
  return gsap.to(element, {
    scale: options.scale,
    duration: options.duration,
    repeat: options.repeat,
    yoyo: options.yoyo,
    ease: options.ease,
  });
};

/**
 * Animation utility to create a pan effect with GSAP
 * @param element Target element to animate
 * @param options Animation options
 */
export const createPanAnimation = (
  element: HTMLElement,
  options = {
    x: 50,
    y: 0,
    duration: 15,
    repeat: -1,
    yoyo: true,
    ease: "none",
  }
) => {
  return gsap.to(element, {
    x: options.x,
    y: options.y,
    duration: options.duration,
    repeat: options.repeat,
    yoyo: options.yoyo,
    ease: options.ease,
  });
};

/**
 * Animation utility to create a text reveal effect with GSAP
 * @param element Target element to animate (container of text elements)
 * @param options Animation options
 */
export const createTextRevealAnimation = (
  element: HTMLElement,
  options = {
    stagger: 0.05,
    y: 20,
    opacity: 0,
    duration: 0.8,
    ease: "power2.out",
    delay: 0,
  }
) => {
  const textElements = element.querySelectorAll<HTMLElement>(
    '[data-animate="text"]'
  );

  return gsap.from(textElements, {
    y: options.y,
    opacity: options.opacity,
    duration: options.duration,
    stagger: options.stagger,
    ease: options.ease,
    delay: options.delay,
  });
};

/**
 * Animation utility to synchronize animations with audio
 * @param timeline GSAP timeline to control
 * @param audio HTML audio element to sync with
 */
export const syncAnimationWithAudio = (
  timeline: gsap.core.Timeline,
  audio: HTMLAudioElement
) => {
  let lastTime = 0;

  const updateAnimation = () => {
    if (audio.paused) return;

    if (audio.currentTime !== lastTime) {
      // Calculate progress based on current time and duration
      const progress = audio.currentTime / audio.duration;
      // Set timeline to match audio progress
      timeline.progress(progress);
      lastTime = audio.currentTime;
    }

    requestAnimationFrame(updateAnimation);
  };

  // Start the update loop
  updateAnimation();

  // Handle audio end
  audio.addEventListener("ended", () => {
    timeline.progress(1);
  });
};

/**
 * Hook to create a text typing animation effect
 * @param text Text to type
 * @param options Animation options
 */
export const useTypewriterEffect = (
  text: string,
  options = {
    speed: 50, // ms per character
    startDelay: 0,
    cursorDuration: 1,
  }
) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const characters = text.split("");
    let currentIndex = 0;

    // Clear any existing content
    element.textContent = "";

    // Create cursor element
    const cursor = document.createElement("span");
    cursor.className = "typing-cursor";
    cursor.textContent = "|";
    cursor.style.animation = `cursorBlink ${options.cursorDuration}s infinite`;

    // Add a style for the cursor blinking
    const style = document.createElement("style");
    style.textContent = `
      @keyframes cursorBlink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    // Add cursor to element
    element.appendChild(cursor);

    // Start typing after delay
    setTimeout(() => {
      const typingInterval = setInterval(() => {
        if (currentIndex >= characters.length) {
          clearInterval(typingInterval);
          return;
        }

        // Insert character before cursor
        const char = document.createTextNode(characters[currentIndex]);
        element.insertBefore(char, cursor);
        currentIndex++;
      }, options.speed);

      // Cleanup on unmount
      return () => {
        clearInterval(typingInterval);
        document.head.removeChild(style);
      };
    }, options.startDelay);
  }, [text, options.speed, options.startDelay, options.cursorDuration]);

  return elementRef;
};

/**
 * React component for an image with GSAP zoom and pan effects
 */
export const AnimatedImage: React.FC<{
  src: string;
  alt?: string;
  animation?: "zoom" | "pan" | "pulse" | "none";
  className?: string;
}> = ({ src, alt = "", animation = "zoom", className = "" }) => {
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (!imageRef.current) return;

    const element = imageRef.current;
    let tween: gsap.core.Tween;

    switch (animation) {
      case "zoom":
        tween = gsap.to(element, {
          scale: 1.1,
          duration: 15,
          ease: "none",
          repeat: -1,
          yoyo: true,
        });
        break;
      case "pan":
        // Set initial position
        gsap.set(element, {
          scale: 1.1, // Slightly zoomed in to allow room for panning
        });
        tween = gsap.to(element, {
          x: "5%",
          duration: 20,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        break;
      case "pulse":
        tween = gsap.to(element, {
          scale: 1.03,
          duration: 2,
          ease: "power1.inOut",
          repeat: -1,
          yoyo: true,
        });
        break;
      default:
        // No animation
        return;
    }

    return () => {
      // Cleanup animation
      tween.kill();
    };
  }, [animation]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

/**
 * React component for text with a typewriter effect
 */
export const TypewriterText: React.FC<{
  text: string;
  speed?: number;
  delay?: number;
  className?: string;
}> = ({ text, speed = 50, delay = 0, className = "" }) => {
  const textRef = useTypewriterEffect(text, {
    speed,
    startDelay: delay,
    cursorDuration: 1,
  });

  return <div ref={textRef} className={className}></div>;
};

/**
 * React component for a staggered text reveal animation
 */
export const StaggeredText: React.FC<{
  text: string;
  staggerDelay?: number;
  className?: string;
}> = ({ text, staggerDelay = 0.05, className = "" }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const words = text.split(" ");

    // Clear container
    container.innerHTML = "";

    // Create word spans
    words.forEach((word) => {
      const wordSpan = document.createElement("span");
      wordSpan.textContent = word + " ";
      wordSpan.setAttribute("data-animate", "text");
      wordSpan.style.display = "inline-block";
      wordSpan.style.opacity = "0";
      container.appendChild(wordSpan);
    });

    // Animate words
    const animation = gsap.to('[data-animate="text"]', {
      opacity: 1,
      y: 0,
      stagger: staggerDelay,
      duration: 0.5,
      ease: "power2.out",
      paused: true,
    });

    // Play animation
    animation.play();

    return () => {
      animation.kill();
    };
  }, [text, staggerDelay]);

  return <div ref={containerRef} className={className}></div>;
};
