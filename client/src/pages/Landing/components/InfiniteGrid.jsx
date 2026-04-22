import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useAnimationFrame,
} from "framer-motion";

function GridPattern({ offsetX, offsetY, id }) {
  return (
    <svg className="w-full h-full">
      <defs>
        <motion.pattern
          id={id}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
          x={offsetX}
          y={offsetY}
        >
          <path
            d="M 40 0 L 0 0 0 40"
            fill="none"
            stroke="#2B4EFF"
            strokeWidth="1"
          />
        </motion.pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export default function InfiniteGrid() {
  const containerRef = useRef(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const gridOffsetX = useMotionValue(0);
  const gridOffsetY = useMotionValue(0);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  useAnimationFrame(() => {
    gridOffsetX.set((gridOffsetX.get() + 0.3) % 40);
    gridOffsetY.set((gridOffsetY.get() + 0.3) % 40);
  });

  const maskImage = useMotionTemplate`radial-gradient(400px circle at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="absolute inset-0 z-0 overflow-hidden"
      style={{ pointerEvents: 'auto' }}
    >
      {/* Static visible grid */}
      <div className="absolute inset-0" style={{ opacity: 0.12 }}>
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-static" />
      </div>

      {/* Mouse-reveal bright grid */}
      <motion.div
        className="absolute inset-0"
        style={{ opacity: 0.45, maskImage, WebkitMaskImage: maskImage }}
      >
        <GridPattern offsetX={gridOffsetX} offsetY={gridOffsetY} id="grid-hover" />
      </motion.div>

      {/* Gradient glow orbs — like original reference */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top-right orange/warm glow */}
        <div
          className="absolute"
          style={{
            right: '-15%',
            top: '-25%',
            width: '70%',
            height: '70%',
            borderRadius: '50%',
            background: 'rgba(255, 140, 50, 0.15)',
            filter: 'blur(100px)',
          }}
        />
        {/* Top-right blue accent */}
        <div
          className="absolute"
          style={{
            right: '0%',
            top: '-10%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'rgba(43, 78, 255, 0.12)',
            filter: 'blur(90px)',
          }}
        />
        {/* Bottom-left blue glow */}
        <div
          className="absolute"
          style={{
            left: '-10%',
            bottom: '-20%',
            width: '50%',
            height: '50%',
            borderRadius: '50%',
            background: 'rgba(43, 78, 255, 0.15)',
            filter: 'blur(80px)',
          }}
        />
      </div>
    </div>
  );
}
