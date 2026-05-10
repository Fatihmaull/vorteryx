"use client";

import { useCallback, useEffect } from "react";
import confetti from "canvas-confetti";

interface VoteConfettiProps {
  trigger: boolean;
}

export default function VoteConfetti({ trigger }: VoteConfettiProps) {
  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#8b5cf6", "#a78bfa", "#c4b5fd", "#7c3aed", "#6d28d9"];

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
        zIndex: 9999,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
        zIndex: 9999,
      });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    // Big burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors,
      zIndex: 9999,
    });

    frame();
  }, []);

  useEffect(() => {
    if (trigger) fireConfetti();
  }, [trigger, fireConfetti]);

  return null;
}
