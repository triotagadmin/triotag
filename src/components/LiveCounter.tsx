import { useEffect, useRef, useState } from "react";

interface LiveCounterProps {
  start: number;
  format: (n: number) => string;
  minStep: number;
  maxStep: number;
  minDelay: number;
  maxDelay: number;
}

const rand = (min: number, max: number) =>
  min + Math.random() * (max - min);

export const LiveCounter = ({
  start,
  format,
  minStep,
  maxStep,
  minDelay,
  maxDelay,
}: LiveCounterProps) => {
  const [display, setDisplay] = useState(start);
  const targetRef = useRef(start);
  const currentRef = useRef(start);
  const rafRef = useRef<number | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const animateTo = (to: number) => {
      const from = currentRef.current;
      if (to <= from) return;
      const duration = 900 + Math.random() * 600;
      const startTime = performance.now();

      const tick = (now: number) => {
        if (cancelled) return;
        const t = Math.min(1, (now - startTime) / duration);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - t, 3);
        const value = from + (to - from) * eased;
        currentRef.current = value;
        setDisplay(value);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(tick);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const scheduleNext = () => {
      const delay = rand(minDelay, maxDelay);
      timeoutRef.current = window.setTimeout(() => {
        if (cancelled) return;
        const step = maxStep > 0 ? Math.round(rand(minStep, maxStep)) : 0;
        if (step > 0) {
          targetRef.current = targetRef.current + step;
          animateTo(targetRef.current);
        }
        scheduleNext();
      }, delay);
    };

    scheduleNext();

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [minStep, maxStep, minDelay, maxDelay]);

  return <span>{format(display)}</span>;
};

export default LiveCounter;
