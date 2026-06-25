'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';

interface CodeLine {
  text: string;
  color?: string;
  indent?: number;
  delay?: number;
}

interface AnimatedCodeProps {
  lines: CodeLine[];
  title?: string;
  className?: string;
}

export default function AnimatedCode({ lines, title, className = '' }: AnimatedCodeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!isInView) return;

    let current = 0;
    const showNext = () => {
      current++;
      setVisibleLines(current);
      if (current < lines.length) {
        const nextDelay = lines[current]?.delay ?? 150;
        setTimeout(showNext, nextDelay);
      }
    };
    setTimeout(showNext, 300);
  }, [isInView, lines.length]);

  const colorMap: Record<string, string> = {
    prompt: '#4ade80',
    command: '#e4e4e7',
    output: '#71717a',
    success: '#34d399',
    warning: '#fbbf24',
    accent: '#60a5fa',
    muted: '#3f3f46',
    peer: '#a78bfa',
  };

  return (
    <div ref={ref} className={className}>
      <div className="rounded-lg border border-zinc-800/60 overflow-hidden">
        {title && (
          <div className="px-4 py-2 bg-zinc-900/50 border-b border-zinc-800/40 flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-700" />
            </div>
            <span className="text-[10px] text-zinc-600 font-mono ml-2">{title}</span>
          </div>
        )}
        <div className="bg-[#0d0d0f] p-5 font-mono text-[13px] leading-relaxed min-h-[120px]">
          {lines.map((line, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={i < visibleLines ? { opacity: 1, x: 0 } : { opacity: 0, x: -4 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{ paddingLeft: (line.indent ?? 0) * 16 }}
            >
              {line.text === '' ? (
                <div className="h-4" />
              ) : (
                <span style={{ color: colorMap[line.color ?? 'output'] }}>
                  {line.text}
                </span>
              )}
            </motion.div>
          ))}
          {visibleLines >= lines.length && (
            <motion.span
              className="inline-block w-2 h-4 bg-zinc-500 ml-0.5"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
