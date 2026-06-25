"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const RING_CONFIG = [
  { r: 60, color: "#22c55e", label: "mDNS", sublabel: "LAN", nodeCount: 3, delay: 0 },
  { r: 120, color: "#3b82f6", label: "Tailscale", sublabel: "VPN", nodeCount: 4, delay: 0.3 },
  { r: 180, color: "#a855f7", label: "STUN", sublabel: "Internet", nodeCount: 5, delay: 0.6 },
] as const;

function generateNodePositions(
  cx: number,
  cy: number,
  radius: number,
  count: number,
  offset: number = 0
) {
  return Array.from({ length: count }, (_, i) => {
    const angle = (2 * Math.PI * i) / count + offset;
    return { x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle) };
  });
}

export default function NetworkDiagram() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const cx = 220;
  const cy = 220;

  return (
    <div ref={ref} className="flex justify-center">
      <svg
        viewBox="0 0 440 440"
        className="w-full max-w-[440px]"
        fill="none"
      >
        {/* Rings */}
        {RING_CONFIG.map((ring) => (
          <motion.circle
            key={ring.label}
            cx={cx}
            cy={cy}
            r={ring.r}
            stroke={ring.color}
            strokeWidth={1}
            strokeOpacity={0.2}
            fill="none"
            initial={{ scale: 0, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.8, delay: ring.delay, ease: "easeOut" }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
          />
        ))}

        {/* Center node */}
        <motion.circle
          cx={cx}
          cy={cy}
          r={6}
          fill="#e4e4e7"
          initial={{ scale: 0 }}
          animate={isInView ? { scale: 1 } : { scale: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        <motion.text
          x={cx}
          y={cy - 14}
          textAnchor="middle"
          fill="#a1a1aa"
          fontSize={10}
          fontFamily="var(--font-geist-mono), monospace"
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          You
        </motion.text>

        {/* Nodes and connections per ring */}
        {RING_CONFIG.map((ring, ringIdx) => {
          const nodes = generateNodePositions(cx, cy, ring.r, ring.nodeCount, ringIdx * 0.4);
          return nodes.map((node, nodeIdx) => (
            <g key={`${ring.label}-${nodeIdx}`}>
              {/* Connection line to center */}
              <motion.line
                x1={cx}
                y1={cy}
                x2={node.x}
                y2={node.y}
                stroke={ring.color}
                strokeWidth={0.5}
                strokeOpacity={0.15}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={isInView ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
                transition={{ duration: 0.6, delay: ring.delay + nodeIdx * 0.08 }}
              />
              {/* Node dot */}
              <motion.circle
                cx={node.x}
                cy={node.y}
                r={3.5}
                fill={ring.color}
                initial={{ scale: 0, opacity: 0 }}
                animate={isInView ? { scale: 1, opacity: 0.8 } : { scale: 0, opacity: 0 }}
                transition={{ duration: 0.4, delay: ring.delay + 0.2 + nodeIdx * 0.08 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              />
              {/* Pulse animation on first node of each ring */}
              {nodeIdx === 0 && (
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={3.5}
                  fill="none"
                  stroke={ring.color}
                  strokeWidth={1}
                  opacity={0.4}
                  className="animate-ping"
                  style={{ transformOrigin: `${node.x}px ${node.y}px` }}
                />
              )}
            </g>
          ));
        })}

        {/* Ring labels */}
        {RING_CONFIG.map((ring) => (
          <motion.text
            key={`label-${ring.label}`}
            x={cx + ring.r + 8}
            y={cy - 6}
            fill={ring.color}
            fontSize={10}
            fontFamily="var(--font-geist-mono), monospace"
            opacity={0.6}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 0.6 } : { opacity: 0 }}
            transition={{ duration: 0.4, delay: ring.delay + 0.5 }}
          >
            {ring.label}
          </motion.text>
        ))}
      </svg>
    </div>
  );
}
