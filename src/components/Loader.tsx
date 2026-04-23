import React from 'react';
import { motion } from 'motion/react';

export default function Loader() {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-bg">
      <svg
        viewBox="0 0 800 200"
        className="w-full max-w-3xl px-4"
      >
        <defs>
          <mask id="textMask">
            <motion.rect
              x="0"
              y="0"
              height="200"
              fill="white"
              initial={{ width: 0 }}
              animate={{ width: 800 }}
              transition={{ duration: 1.0, delay: 2.0, ease: "easeInOut" }}
            />
          </mask>
        </defs>
        
        {/* Background/Outline drawing */}
        <motion.text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter"
          style={{
            stroke: 'var(--color-brand-light)',
            strokeWidth: 1.5,
            fill: 'transparent',
            strokeDasharray: 1000,
          }}
          initial={{ strokeDashoffset: 1000 }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 2.0, ease: "easeInOut" }}
        >
          АРХЕТИП
        </motion.text>

        {/* Filled reveal */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl tracking-tighter"
          style={{
            fill: 'var(--color-brand-light)',
            mask: 'url(#textMask)',
            WebkitMask: 'url(#textMask)',
          }}
        >
          АРХЕТИП
        </text>
      </svg>
    </div>
  );
}
