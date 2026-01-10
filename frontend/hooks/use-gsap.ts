"use client";

import { useRef, useEffect, useLayoutEffect, useCallback } from "react";
import gsap from "gsap";

/**
 * useIsomorphicLayoutEffect
 * Uses useLayoutEffect on client, useEffect on server (SSR-safe)
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * useGsapContext
 * Creates a GSAP context scoped to a container ref.
 * Automatically cleans up on unmount.
 * 
 * @example
 * const containerRef = useRef(null);
 * const { contextRef, contextSafe } = useGsapContext(containerRef);
 * 
 * useEffect(() => {
 *   contextSafe(() => {
 *     gsap.to('.element', { opacity: 1 });
 *   });
 * }, [contextSafe]);
 */
export function useGsapContext<T extends HTMLElement = HTMLDivElement>(
  scopeRef: React.RefObject<T | null>
) {
  const contextRef = useRef<gsap.Context | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!scopeRef.current) return;

    // Create GSAP context scoped to the container
    contextRef.current = gsap.context(() => {}, scopeRef.current);

    return () => {
      // Cleanup all GSAP animations in this context
      contextRef.current?.revert();
    };
  }, [scopeRef]);

  const contextSafe = useCallback(
    (callback: () => void) => {
      if (contextRef.current) {
        contextRef.current.add(callback);
      }
    },
    []
  );

  return { contextRef, contextSafe };
}

/**
 * useGsapTimeline
 * Creates a GSAP timeline that's automatically cleaned up.
 * 
 * @example
 * const containerRef = useRef(null);
 * const timeline = useGsapTimeline(containerRef, {
 *   defaults: { duration: 0.5, ease: 'power2.out' }
 * });
 * 
 * useEffect(() => {
 *   if (!timeline) return;
 *   timeline.to('.element', { opacity: 1 });
 * }, [timeline]);
 */
export function useGsapTimeline<T extends HTMLElement = HTMLDivElement>(
  scopeRef: React.RefObject<T | null>,
  vars?: gsap.TimelineVars
) {
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const contextRef = useRef<gsap.Context | null>(null);

  useIsomorphicLayoutEffect(() => {
    if (!scopeRef.current) return;

    contextRef.current = gsap.context(() => {
      timelineRef.current = gsap.timeline(vars);
    }, scopeRef.current);

    return () => {
      contextRef.current?.revert();
    };
  }, [scopeRef, vars]);

  return timelineRef.current;
}

/**
 * useFadeIn
 * Simple fade-in animation for an element.
 * 
 * @example
 * const elementRef = useFadeIn({ delay: 0.2, y: 20 });
 * return <div ref={elementRef}>Content</div>;
 */
export function useFadeIn(options?: {
  delay?: number;
  duration?: number;
  y?: number;
  x?: number;
  ease?: string;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!elementRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        elementRef.current,
        {
          opacity: 0,
          y: options?.y ?? 20,
          x: options?.x ?? 0,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: options?.duration ?? 0.6,
          delay: options?.delay ?? 0,
          ease: options?.ease ?? "power2.out",
        }
      );
    }, elementRef);

    return () => ctx.revert();
  }, [options?.delay, options?.duration, options?.y, options?.x, options?.ease]);

  return elementRef;
}

/**
 * useNeonPulse
 * Creates a continuous neon glow pulse effect.
 * 
 * @example
 * const glowRef = useNeonPulse({ color: 'cyan' });
 * return <button ref={glowRef}>Click me</button>;
 */
export function useNeonPulse(options?: {
  color?: "cyan" | "pink" | "green" | "gold";
  intensity?: number;
  duration?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  const colorMap = {
    cyan: "rgba(0, 240, 255, VAR)",
    pink: "rgba(255, 0, 128, VAR)",
    green: "rgba(57, 255, 20, VAR)",
    gold: "rgba(255, 215, 0, VAR)",
  };

  useIsomorphicLayoutEffect(() => {
    if (!elementRef.current) return;

    const color = options?.color ?? "cyan";
    const intensity = options?.intensity ?? 0.5;
    const baseColor = colorMap[color].replace("VAR", String(intensity * 0.3));
    const glowColor = colorMap[color].replace("VAR", String(intensity));

    const ctx = gsap.context(() => {
      gsap.to(elementRef.current, {
        boxShadow: `0 0 10px ${baseColor}, 0 0 20px ${glowColor}`,
        duration: options?.duration ?? 1.5,
        repeat: -1,
        yoyo: true,
        ease: "power2.inOut",
      });
    }, elementRef);

    return () => ctx.revert();
  }, [options?.color, options?.intensity, options?.duration]);

  return elementRef;
}

/**
 * useHoverScale
 * Applies scale effect on hover with smooth GSAP animation.
 * 
 * @example
 * const cardRef = useHoverScale({ scale: 1.05 });
 * return <div ref={cardRef}>Card content</div>;
 */
export function useHoverScale(options?: {
  scale?: number;
  duration?: number;
}) {
  const elementRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;
    const scale = options?.scale ?? 1.03;
    const duration = options?.duration ?? 0.3;

    const handleMouseEnter = () => {
      gsap.to(element, {
        scale,
        duration,
        ease: "power2.out",
      });
    };

    const handleMouseLeave = () => {
      gsap.to(element, {
        scale: 1,
        duration,
        ease: "power2.out",
      });
    };

    element.addEventListener("mouseenter", handleMouseEnter);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("mouseenter", handleMouseEnter);
      element.removeEventListener("mouseleave", handleMouseLeave);
      gsap.killTweensOf(element);
    };
  }, [options?.scale, options?.duration]);

  return elementRef;
}

/**
 * useCountdown
 * Animates a countdown number with pop effect.
 * 
 * @example
 * const { ref, countdown, isActive } = useCountdown(3);
 * <span ref={ref}>{countdown}</span>
 */
export function useCountdown(startValue: number, onComplete?: () => void) {
  const elementRef = useRef<HTMLDivElement>(null);
  const countdownRef = useRef(startValue);

  useIsomorphicLayoutEffect(() => {
    if (!elementRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          onComplete?.();
        },
      });

      for (let i = startValue; i >= 0; i--) {
        tl.to(
          {},
          {
            duration: 1,
            onStart: () => {
              countdownRef.current = i;
              // Trigger pop animation
              if (elementRef.current) {
                gsap.fromTo(
                  elementRef.current,
                  { scale: 1.5, opacity: 0 },
                  {
                    scale: 1,
                    opacity: 1,
                    duration: 0.4,
                    ease: "back.out(1.7)",
                  }
                );
              }
            },
          }
        );
      }
    }, elementRef);

    return () => ctx.revert();
  }, [startValue, onComplete]);

  return { ref: elementRef, countdown: countdownRef.current };
}

/**
 * useStaggerReveal
 * Reveals child elements with a stagger effect.
 * 
 * @example
 * const containerRef = useStaggerReveal('.item', { stagger: 0.1 });
 * return (
 *   <div ref={containerRef}>
 *     <div className="item">1</div>
 *     <div className="item">2</div>
 *   </div>
 * );
 */
export function useStaggerReveal(
  selector: string,
  options?: {
    stagger?: number;
    delay?: number;
    duration?: number;
    y?: number;
  }
) {
  const containerRef = useRef<HTMLDivElement>(null);

  useIsomorphicLayoutEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        {
          opacity: 0,
          y: options?.y ?? 30,
        },
        {
          opacity: 1,
          y: 0,
          duration: options?.duration ?? 0.5,
          stagger: options?.stagger ?? 0.1,
          delay: options?.delay ?? 0,
          ease: "power2.out",
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [selector, options?.stagger, options?.delay, options?.duration, options?.y]);

  return containerRef;
}

export { gsap };
