import { gsap } from "gsap";

/**
 * Synchronizes a GSAP timeline with an audio element
 * @param timeline The GSAP timeline to synchronize
 * @param audio The audio element to sync with
 */
export const syncAnimationWithAudio = (
  timeline: gsap.core.Timeline,
  audio: HTMLAudioElement
) => {
  const audioDuration = audio.duration;
  const timelineDuration = timeline.duration();

  // Match timeline duration to audio duration if they differ
  if (Math.abs(audioDuration - timelineDuration) > 0.5) {
    timeline.duration(audioDuration);
  }

  // Add a listener to update the timeline position based on audio time
  const updateTimelinePosition = () => {
    if (audio.paused) return;

    const audioProgress = audio.currentTime / audio.duration;
    timeline.progress(audioProgress);

    if (audio.ended) {
      timeline.progress(1);
    }
  };

  // Set up the animation updater
  const intervalId = setInterval(updateTimelinePosition, 50);

  // Clean up when audio ends
  const onEnded = () => {
    clearInterval(intervalId);
    audio.removeEventListener("ended", onEnded);
  };

  audio.addEventListener("ended", onEnded);
};

/**
 * Creates a registry to track animations for a given element
 */
export class AnimationRegistry {
  private static instance: AnimationRegistry;
  private animations: Map<HTMLElement, gsap.core.Tween[]> = new Map();

  private constructor() {}

  public static getInstance(): AnimationRegistry {
    if (!AnimationRegistry.instance) {
      AnimationRegistry.instance = new AnimationRegistry();
    }
    return AnimationRegistry.instance;
  }

  /**
   * Register an animation for a target element
   */
  public registerAnimation(
    element: HTMLElement,
    animation: gsap.core.Tween
  ): void {
    if (!this.animations.has(element)) {
      this.animations.set(element, []);
    }
    this.animations.get(element)?.push(animation);
  }

  /**
   * Get all animations for a target element
   */
  public getAnimations(element: HTMLElement): gsap.core.Tween[] {
    return this.animations.get(element) || [];
  }

  /**
   * Remove an animation from the registry
   */
  public unregisterAnimation(
    element: HTMLElement,
    animation: gsap.core.Tween
  ): void {
    const animations = this.animations.get(element);
    if (animations) {
      const index = animations.indexOf(animation);
      if (index !== -1) {
        animations.splice(index, 1);
      }
    }
  }

  /**
   * Clear all animations for an element
   */
  public clearAnimations(element: HTMLElement): void {
    this.animations.delete(element);
  }
}

/**
 * Creates a pulsing animation effect
 */
export const createPulseAnimation = (
  element: HTMLElement,
  props: { scale: number; duration: number; repeat: number; yoyo: boolean }
): gsap.core.Tween => {
  const registry = AnimationRegistry.getInstance();

  // Kill any existing animations on this element
  gsap.killTweensOf(element);
  registry.clearAnimations(element);

  // Create new animation
  const animation = gsap.to(element, {
    scale: props.scale,
    duration: props.duration,
    repeat: props.repeat,
    yoyo: props.yoyo,
    ease: "sine.inOut",
  });

  // Register the animation
  registry.registerAnimation(element, animation);

  return animation;
};

/**
 * Creates a panning animation effect
 */
export const createPanAnimation = (
  element: HTMLElement,
  props: {
    x: number;
    y: number;
    duration: number;
    repeat: number;
    yoyo: boolean;
  }
): gsap.core.Tween => {
  const registry = AnimationRegistry.getInstance();

  // Kill any existing animations on this element
  gsap.killTweensOf(element);
  registry.clearAnimations(element);

  // Create new animation
  const animation = gsap.to(element, {
    x: props.x,
    y: props.y,
    duration: props.duration,
    repeat: props.repeat,
    yoyo: props.yoyo,
    ease: "sine.inOut",
  });

  // Register the animation
  registry.registerAnimation(element, animation);

  return animation;
};

/**
 * Pauses all animations for an element
 */
export const pauseElementAnimations = (element: HTMLElement): void => {
  const registry = AnimationRegistry.getInstance();
  const animations = registry.getAnimations(element);

  animations.forEach((animation) => {
    animation.pause();
  });
};

/**
 * Resumes all animations for an element
 */
export const resumeElementAnimations = (element: HTMLElement): void => {
  const registry = AnimationRegistry.getInstance();
  const animations = registry.getAnimations(element);

  animations.forEach((animation) => {
    animation.resume();
  });
};
