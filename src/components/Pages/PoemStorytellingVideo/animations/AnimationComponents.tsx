import React from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";

// Animation timing types
interface AnimationTiming {
  duration: number; // in ms
  delay: number; // in ms
  staggering: number; // in ms
}

// Default timing values
const defaultTiming: AnimationTiming = {
  duration: 2000,
  delay: 500,
  staggering: 300,
};

// Common props for all animation components
interface AnimationProps {
  children: React.ReactNode;
  isVisible: boolean;
  timing?: Partial<AnimationTiming>;
  className?: string;
  id?: string;
}

// Fade animation variants
const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: (timing: AnimationTiming) => ({
    opacity: 1,
    transition: {
      duration: timing.duration / 1000,
      delay: timing.delay / 1000,
      ease: "easeOut",
    },
  }),
  exit: {
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Slide animation variants
const slideVariants: Variants = {
  hidden: { x: -50, opacity: 0 },
  visible: (timing: AnimationTiming) => ({
    x: 0,
    opacity: 1,
    transition: {
      duration: timing.duration / 1000,
      delay: timing.delay / 1000,
      ease: "easeOut",
    },
  }),
  exit: {
    x: 50,
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Zoom animation variants
const zoomVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: (timing: AnimationTiming) => ({
    scale: 1,
    opacity: 1,
    transition: {
      duration: timing.duration / 1000,
      delay: timing.delay / 1000,
      ease: "easeOut",
    },
  }),
  exit: {
    scale: 0.9,
    opacity: 0,
    transition: {
      duration: 0.5,
      ease: "easeInOut",
    },
  },
};

// Typewriter animation component (manual implementation since framer doesn't have built-in typewriter)
export const TypewriterAnimation: React.FC<
  AnimationProps & { text: string }
> = ({ text, isVisible, timing = {}, className = "", id }) => {
  const mergedTiming = { ...defaultTiming, ...timing };
  const [displayText, setDisplayText] = React.useState("");

  React.useEffect(() => {
    if (!isVisible) {
      setDisplayText("");
      return;
    }

    // Reset the text
    setDisplayText("");
    const delay = mergedTiming.delay;

    // Start typing after delay
    const delayTimeout = setTimeout(() => {
      let currentIndex = 0;

      // Calculate typing speed based on text length and duration
      const typingInterval = Math.max(
        30, // Minimum 30ms per character
        mergedTiming.duration / text.length
      );

      const typingTimer = setInterval(() => {
        if (currentIndex < text.length) {
          setDisplayText(text.substring(0, currentIndex + 1));
          currentIndex++;
        } else {
          clearInterval(typingTimer);
        }
      }, typingInterval);

      return () => clearInterval(typingTimer);
    }, delay);

    return () => clearTimeout(delayTimeout);
  }, [isVisible, text, mergedTiming]);

  return (
    <div id={id} className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </div>
  );
};

// Fade animation component
export const FadeAnimation: React.FC<AnimationProps> = ({
  children,
  isVisible,
  timing = {},
  className = "",
  id,
}) => {
  const mergedTiming = { ...defaultTiming, ...timing };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id={id}
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={fadeVariants}
          custom={mergedTiming}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Slide animation component
export const SlideAnimation: React.FC<AnimationProps> = ({
  children,
  isVisible,
  timing = {},
  className = "",
  id,
}) => {
  const mergedTiming = { ...defaultTiming, ...timing };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id={id}
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={slideVariants}
          custom={mergedTiming}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Zoom animation component
export const ZoomAnimation: React.FC<AnimationProps> = ({
  children,
  isVisible,
  timing = {},
  className = "",
  id,
}) => {
  const mergedTiming = { ...defaultTiming, ...timing };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id={id}
          className={className}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={zoomVariants}
          custom={mergedTiming}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Staggered animation for multiple elements
interface StaggeredAnimationProps extends AnimationProps {
  items: React.ReactNode[];
  containerClassName?: string;
  itemClassName?: string;
}

// Staggered animation component
export const StaggeredAnimation: React.FC<StaggeredAnimationProps> = ({
  items,
  isVisible,
  timing = {},
  className = "",
  containerClassName = "",
  itemClassName = "",
  id,
}) => {
  const mergedTiming = { ...defaultTiming, ...timing };

  // Staggered container variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: (timing: AnimationTiming) => ({
      opacity: 1,
      transition: {
        delay: timing.delay / 1000,
        staggerChildren: timing.staggering / 1000,
      },
    }),
    exit: {
      opacity: 0,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Staggered item variants
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: mergedTiming.duration / 1000 / 2,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          id={id}
          className={`${className} ${containerClassName}`}
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          custom={mergedTiming}
        >
          {items.map((item, index) => (
            <motion.div
              key={index}
              className={itemClassName}
              variants={itemVariants}
            >
              {item}
            </motion.div>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Helper function to get the appropriate animation component based on style
export const getAnimationComponent = (
  style: string
): React.FC<AnimationProps> => {
  switch (style) {
    case "fade":
      return FadeAnimation;
    case "slide":
      return SlideAnimation;
    case "zoom":
      return ZoomAnimation;
    default:
      return FadeAnimation;
  }
};
