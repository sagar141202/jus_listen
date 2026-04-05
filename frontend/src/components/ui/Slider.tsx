"use client";

import { useRef, useState } from "react";
import { motion } from "framer-motion";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  className = "",
}: SliderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  const percentage = ((value - min) / (max - min)) * 100;

  const handleInteraction = (clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = (clientX - rect.left) / rect.width;
    const clampedPercent = Math.max(0, Math.min(1, percent));
    const newValue = min + clampedPercent * (max - min);
    const steppedValue = Math.round(newValue / step) * step;
    onChange(steppedValue);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    handleInteraction(e.clientX);

    const handleMouseMove = (e: MouseEvent) => {
      handleInteraction(e.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={trackRef}
      onMouseDown={handleMouseDown}
      className={`h-1 bg-surface-elevated rounded-full cursor-pointer group ${className}`}
    >
      <motion.div
        className="h-full bg-text-primary rounded-full relative"
        style={{ width: `${percentage}%` }}
      >
        <motion.div
          initial={false}
          animate={{ scale: isDragging ? 1.2 : 1, opacity: isDragging ? 1 : 0 }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-text-primary rounded-full group-hover:opacity-100 transition-opacity"
        />
      </motion.div>
    </div>
  );
}
