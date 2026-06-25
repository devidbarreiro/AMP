'use client';

import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const ANIM = { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const };

function Node({ label, sub, x, y, delay, color }: { label: string; sub: string; x: number; y: number; delay: number; color: string }) {
  return (
    <motion.g
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...ANIM, delay }}
    >
      <rect x={x} y={y} width={180} height={120} rx={8}
        fill="#111113" stroke={color} strokeWidth={1} opacity={0.8} />
      <text x={x + 90} y={y + 28} textAnchor="middle"
        fill="#e4e4e7" fontSize={13} fontWeight={600} fontFamily="var(--font-geist-sans), system-ui">
        {label}
      </text>
      <text x={x + 90} y={y + 46} textAnchor="middle"
        fill="#52525b" fontSize={10} fontFamily="var(--font-geist-mono), monospace">
        {sub}
      </text>
      {/* Internal boxes */}
      <rect x={x + 16} y={y + 58} width={68} height={22} rx={3}
        fill="#09090b" stroke="#27272a" strokeWidth={0.5} />
      <text x={x + 50} y={y + 73} textAnchor="middle"
        fill="#3f3f46" fontSize={9} fontFamily="var(--font-geist-mono), monospace">
        MCP
      </text>
      <rect x={x + 96} y={y + 58} width={68} height={22} rx={3}
        fill="#09090b" stroke="#27272a" strokeWidth={0.5} />
      <text x={x + 130} y={y + 73} textAnchor="middle"
        fill="#3f3f46" fontSize={9} fontFamily="var(--font-geist-mono), monospace">
        SQLite
      </text>
      <rect x={x + 16} y={y + 88} width={148} height={20} rx={3}
        fill="#09090b" stroke={color} strokeWidth={0.5} opacity={0.5} />
      <text x={x + 90} y={y + 102} textAnchor="middle"
        fill={color} fontSize={9} fontWeight={500} fontFamily="var(--font-geist-mono), monospace">
        AMP Daemon :9800
      </text>
    </motion.g>
  );
}

function Particle({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <motion.circle
      r={3}
      fill="#3b82f6"
      filter="url(#particleGlow)"
      initial={{ cx: x1, cy: y1, opacity: 0 }}
      animate={{
        cx: [x1, (x1 + x2) / 2, x2],
        cy: [y1, y1 - 20, y2],
        opacity: [0, 1, 0],
      }}
      transition={{
        duration: 2,
        delay,
        repeat: Infinity,
        repeatDelay: 3,
        ease: 'easeInOut',
      }}
    />
  );
}

export default function ArchitectureDiagram() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <div ref={ref} className="w-full overflow-hidden">
      {isInView && (
        <motion.svg
          viewBox="0 0 620 200"
          className="w-full max-w-3xl mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <defs>
            <filter id="particleGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" />
            </filter>
          </defs>

          {/* Left node */}
          <Node label="Your Machine" sub="Claude Code" x={20} y={40} delay={0.1} color="#3b82f6" />

          {/* Right node */}
          <Node label="Their Machine" sub="Cursor" x={420} y={40} delay={0.3} color="#8b5cf6" />

          {/* Connection line */}
          <motion.line
            x1={200} y1={100} x2={420} y2={100}
            stroke="#27272a" strokeWidth={1} strokeDasharray="4 4"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ ...ANIM, delay: 0.5 }}
          />

          {/* Connection label */}
          <motion.g
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...ANIM, delay: 0.7 }}
          >
            <rect x={248} y={72} width={124} height={20} rx={10} fill="#111113" stroke="#27272a" strokeWidth={0.5} />
            <text x={310} y={86} textAnchor="middle"
              fill="#52525b" fontSize={8} fontFamily="var(--font-geist-mono), monospace" letterSpacing={0.5}>
              encrypted P2P
            </text>
          </motion.g>

          {/* Crypto labels */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ ...ANIM, delay: 0.9 }}
          >
            <text x={310} y={118} textAnchor="middle"
              fill="#3f3f46" fontSize={8} fontFamily="var(--font-geist-mono), monospace">
              Ed25519 + X25519
            </text>
            <text x={310} y={132} textAnchor="middle"
              fill="#3f3f46" fontSize={8} fontFamily="var(--font-geist-mono), monospace">
              NaCl SecretBox
            </text>
          </motion.g>

          {/* Animated particles traveling between nodes */}
          <Particle x1={200} y1={100} x2={420} y2={100} delay={1.2} />
          <Particle x1={420} y1={100} x2={200} y2={100} delay={2.8} />
        </motion.svg>
      )}
    </div>
  );
}
