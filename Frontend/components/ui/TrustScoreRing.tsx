"use client";

import { useEffect, useState } from "react";

interface TrustScoreRingProps {
  score: number;
  size?: number;
}

export default function TrustScoreRing({ score, size = 240 }: TrustScoreRingProps) {
  const [animatedOffset, setAnimatedOffset] = useState(502); // Initial full offset (circumference of r=80 is ~502)
  const [animatedScore, setAnimatedScore] = useState(0);

  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius; // ~502.65
  const offset = circumference - (circumference * score) / 1000;

  useEffect(() => {
    // Animate stroke dash offset
    const offsetTimer = setTimeout(() => {
      setAnimatedOffset(offset);
    }, 100);

    // Count up score number animation
    let start = 0;
    const duration = 800; // 800ms
    const stepTime = Math.max(Math.floor(duration / score), 5);
    
    const countTimer = setInterval(() => {
      start += Math.ceil(score / 80);
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(countTimer);
      } else {
        setAnimatedScore(start);
      }
    }, stepTime);

    return () => {
      clearTimeout(offsetTimer);
      clearInterval(countTimer);
    };
  }, [score, offset]);

  // Determine credit assessment text and colors
  let rating = "Low Risk · Excellent";
  let ratingColor = "text-success bg-emerald-50 border-emerald-100";
  if (score < 600) {
    rating = "High Risk · Warning";
    ratingColor = "text-danger bg-red-50 border-red-100";
  } else if (score < 750) {
    rating = "Medium Risk · Good";
    ratingColor = "text-warning bg-amber-50 border-amber-100";
  }

  const strokeDashoffset = animatedOffset;

  return (
    <div className="flex flex-col items-center justify-center select-none">
      <div className="relative" style={{ width: size, height: size }}>
        {/* Glow drop-shadow SVG filter definition */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1A56DB" /> {/* Primary Blue */}
              <stop offset="100%" stopColor="#7C3AED" /> {/* Accent Violet */}
            </linearGradient>
            <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background circle track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-100 fill-none"
            strokeWidth={strokeWidth}
          />

          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="fill-none transition-all duration-1000 ease-out"
            stroke="url(#scoreGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: "drop-shadow(0px 0px 8px rgba(124, 58, 237, 0.45))",
            }}
          />
        </svg>

        {/* Center Score Labels */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="font-mono text-5xl font-extrabold text-text-primary tracking-tight">
            {animatedScore}
          </span>
          <span className="text-xs uppercase tracking-widest text-text-muted font-semibold mt-1">
            Trust Score
          </span>
          <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted font-mono bg-slate-100 px-2 py-0.5 rounded-full">
            <span>Max 1000</span>
          </div>
        </div>
      </div>

      {/* Below Ring Badge */}
      <div className={`mt-4 px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${ratingColor}`}>
        {rating}
      </div>
    </div>
  );
}
