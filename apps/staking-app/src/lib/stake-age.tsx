export function calculateStakeAge(timestampSec: number) {
  const nowSec = Date.now() / 1000;
  const stakeAge = (nowSec - timestampSec) / 100;
  const maxStakeAge = (1000 * 24 * 60 * 60) / 100;
  return Math.min(Math.max(stakeAge, 0), maxStakeAge);
}

import { useEffect, useRef, useState } from "react";

export function useAnimatedStakeAge(stakeStartAtSec: number) {
  const [age, setAge] = useState(() => calculateStakeAge(stakeStartAtSec));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const tick = () => {
      if (!mounted) return;
      setAge(calculateStakeAge(stakeStartAtSec));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      mounted = false;
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [stakeStartAtSec]);

  return age;
}
