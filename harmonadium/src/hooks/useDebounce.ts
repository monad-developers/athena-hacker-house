import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function useAngleStabilityDebounce(
  angle: number | null,
  debounceTime: number = 3000
) {
  const [stableAngle, setStableAngle] = useState<number | null>(null);
  const [isStabilizing, setIsStabilizing] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (angle === null) {
      setStableAngle(null);
      setIsStabilizing(false);
      setCountdown(0);
      return;
    }

    setIsStabilizing(true);
    setCountdown(debounceTime / 1000);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const debounceTimer = setTimeout(() => {
      setStableAngle(angle);
      setIsStabilizing(false);
      setCountdown(0);
    }, debounceTime);

    return () => {
      clearTimeout(debounceTimer);
      clearInterval(countdownInterval);
    };
  }, [angle, debounceTime]);

  return {
    stableAngle,
    isStabilizing,
    countdown,
  };
}