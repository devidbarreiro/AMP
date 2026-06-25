'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TerminalProps {
  className?: string;
}

interface TerminalSegment {
  text: string;
  color: string;
}

interface TerminalLine {
  segments: TerminalSegment[];
  isBlank?: boolean;
}

const CHAR_DELAY_MS = 50;
const LINE_PAUSE_MS = 800;
const RESTART_DELAY_MS = 3000;

const COLOR_PROMPT = '#4ade80';
const COLOR_WHITE = '#ededed';
const COLOR_OUTPUT = '#a1a1aa';
const COLOR_SUCCESS = '#34d399';
const COLOR_HIGHLIGHT = '#60a5fa';

const TERMINAL_LINES: TerminalLine[] = [
  {
    segments: [
      { text: '$ ', color: COLOR_PROMPT },
      { text: 'amp init', color: COLOR_WHITE },
    ],
  },
  {
    segments: [
      { text: '✓ ', color: COLOR_SUCCESS },
      { text: 'Identity created', color: COLOR_OUTPUT },
    ],
  },
  {
    segments: [
      { text: '  Fingerprint: ', color: COLOR_OUTPUT },
      { text: 'a3:f2:9b:4d:e1:88', color: COLOR_HIGHLIGHT },
    ],
  },
  { segments: [], isBlank: true },
  {
    segments: [
      { text: '$ ', color: COLOR_PROMPT },
      { text: 'amp invite', color: COLOR_WHITE },
    ],
  },
  {
    segments: [
      { text: '  ', color: COLOR_OUTPUT },
      { text: 'amp://invite/eyJ2Ijox...', color: COLOR_HIGHLIGHT },
    ],
  },
  { segments: [], isBlank: true },
  {
    segments: [
      { text: '$ ', color: COLOR_PROMPT },
      { text: 'amp send javier "Deploy is ready"', color: COLOR_WHITE },
    ],
  },
  {
    segments: [
      { text: '  ✓ ', color: COLOR_SUCCESS },
      { text: 'Delivered to ', color: COLOR_OUTPUT },
      { text: 'javier', color: COLOR_WHITE },
      { text: ' (12ms)', color: COLOR_OUTPUT },
    ],
  },
  { segments: [], isBlank: true },
  {
    segments: [
      { text: '$ ', color: COLOR_PROMPT },
      { text: 'amp inbox', color: COLOR_WHITE },
    ],
  },
  {
    segments: [
      { text: '  #a3f2  ', color: COLOR_HIGHLIGHT },
      { text: '💬 ', color: COLOR_OUTPUT },
      { text: 'javier', color: COLOR_WHITE },
      { text: '  2m ago', color: COLOR_OUTPUT },
    ],
  },
  {
    segments: [
      { text: '         "On it! Pulling now."', color: COLOR_OUTPUT },
    ],
  },
];

function getLineText(line: TerminalLine): string {
  if (line.isBlank) return '';
  return line.segments.map((s) => s.text).join('');
}

export default function Terminal({ className = '' }: TerminalProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0);
  const [typedCount, setTypedCount] = useState<number>(0);
  const [isTypingDone, setIsTypingDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLineText = visibleLines < TERMINAL_LINES.length
    ? getLineText(TERMINAL_LINES[visibleLines])
    : '';

  const isCurrentLineBlank = visibleLines < TERMINAL_LINES.length
    && TERMINAL_LINES[visibleLines].isBlank;

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [visibleLines, typedCount, scrollToBottom]);

  useEffect(() => {
    if (visibleLines >= TERMINAL_LINES.length) {
      setIsTypingDone(true);
      timeoutRef.current = setTimeout(() => {
        setVisibleLines(0);
        setTypedCount(0);
        setIsTypingDone(false);
      }, RESTART_DELAY_MS);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (isCurrentLineBlank) {
      timeoutRef.current = setTimeout(() => {
        setVisibleLines((prev) => prev + 1);
        setTypedCount(0);
      }, LINE_PAUSE_MS / 4);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    if (typedCount < currentLineText.length) {
      timeoutRef.current = setTimeout(() => {
        setTypedCount((prev) => prev + 1);
      }, CHAR_DELAY_MS);
      return () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      };
    }

    timeoutRef.current = setTimeout(() => {
      setVisibleLines((prev) => prev + 1);
      setTypedCount(0);
    }, LINE_PAUSE_MS);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visibleLines, typedCount, currentLineText.length, isCurrentLineBlank]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const renderSegments = (
    segments: TerminalSegment[],
    maxChars: number,
  ): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    let remaining = maxChars;

    for (let i = 0; i < segments.length && remaining > 0; i++) {
      const segment = segments[i];
      const visibleText = segment.text.slice(0, remaining);
      remaining -= visibleText.length;

      nodes.push(
        <span key={i} style={{ color: segment.color }}>
          {visibleText}
        </span>,
      );
    }

    return nodes;
  };

  const renderCompletedLine = (line: TerminalLine, index: number): React.ReactNode => {
    if (line.isBlank) {
      return (
        <div key={index} className="h-5" aria-hidden="true" />
      );
    }

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.1 }}
        className="leading-relaxed"
      >
        {renderSegments(line.segments, Infinity)}
      </motion.div>
    );
  };

  return (
    <div
      className={`w-full max-w-2xl mx-auto ${className}`}
      style={{
        filter: 'drop-shadow(0 0 40px rgba(96, 165, 250, 0.08)) drop-shadow(0 0 80px rgba(167, 139, 250, 0.05))',
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center h-10 px-4 rounded-t-xl"
        style={{ background: '#1c1c1e' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#febc2e' }} />
          <div className="w-3 h-3 rounded-full" style={{ background: '#28c840' }} />
        </div>
        <div className="flex-1 text-center">
          <span
            className="text-xs font-medium"
            style={{ color: '#808080' }}
          >
            Terminal &mdash; amp
          </span>
        </div>
        <div className="w-[52px]" />
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="rounded-b-xl p-5 overflow-y-auto"
        style={{
          background: '#0d0d0d',
          boxShadow: 'inset 0 2px 12px rgba(0, 0, 0, 0.5)',
          fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
          fontSize: '13px',
          lineHeight: '1.7',
          maxHeight: '420px',
          minHeight: '280px',
        }}
      >
        {/* Completed lines */}
        {TERMINAL_LINES.slice(0, visibleLines).map((line, i) =>
          renderCompletedLine(line, i),
        )}

        {/* Currently typing line */}
        {visibleLines < TERMINAL_LINES.length && !isCurrentLineBlank && (
          <div className="leading-relaxed">
            {renderSegments(
              TERMINAL_LINES[visibleLines].segments,
              typedCount,
            )}
            <AnimatePresence>
              <motion.span
                key="cursor"
                animate={{ opacity: [1, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'easeInOut',
                }}
                style={{ color: COLOR_WHITE }}
              >
                _
              </motion.span>
            </AnimatePresence>
          </div>
        )}

        {/* Resting cursor after all lines typed */}
        {isTypingDone && (
          <div className="leading-relaxed mt-0">
            <span style={{ color: COLOR_PROMPT }}>$ </span>
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut',
              }}
              style={{ color: COLOR_WHITE }}
            >
              _
            </motion.span>
          </div>
        )}
      </div>
    </div>
  );
}
