"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

interface SlotData {
  investmentDate: string;
  returnDate: string;
  amount: number;
  returnAmount: number;
}

interface CapitalFlowChartProps {
  slots: SlotData[];
}

export default function CapitalFlowChart({ slots }: CapitalFlowChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Generate timeline data
  const data = useMemo(() => {
    if (slots.length === 0) return [];
    
    // Sort slots by investment date
    const sorted = [...slots].sort(
      (a, b) => new Date(a.investmentDate).getTime() - new Date(b.investmentDate).getTime()
    );

    // Padding: 6 months before first investment, 4 months after last investment
    const padBefore = 6 * 30 * 24 * 60 * 60 * 1000;
    const padAfter = 4 * 30 * 24 * 60 * 60 * 1000;

    const minTime = new Date(sorted[0].investmentDate).getTime() - padBefore;
    const maxTime = Math.max(...slots.map((s) => new Date(s.investmentDate).getTime())) + padAfter;

    const minDate = new Date(minTime);
    minDate.setDate(1);
    const maxDate = new Date(maxTime);
    maxDate.setDate(1);

    const timeline: { label: string; date: Date; invested: number; returns: number }[] = [];
    let current = new Date(minDate);

    while (current <= maxDate) {
      const label = current.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      timeline.push({
        label,
        date: new Date(current),
        invested: 0,
        returns: 0,
      });
      current.setMonth(current.getMonth() + 1);
    }

    // Calculate monthly totals based on investment date wise only (non-cumulative)
    timeline.forEach((item) => {
      const startOfMonth = new Date(item.date);
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const endOfMonth = new Date(item.date);
      endOfMonth.setMonth(endOfMonth.getMonth() + 1);
      endOfMonth.setDate(0);
      endOfMonth.setHours(23, 59, 59, 999);

      // Filter slots invested in this month
      const monthlySlots = slots.filter((s) => {
        const d = new Date(s.investmentDate);
        return d >= startOfMonth && d <= endOfMonth;
      });

      item.invested = monthlySlots.reduce((sum, s) => sum + s.amount, 0);
      item.returns = monthlySlots.reduce((sum, s) => sum + s.returnAmount, 0);
    });

    return timeline;
  }, [slots]);

  if (data.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-on-surface-variant">
        <p className="text-xs">Add investment slots to view capital flow analytics.</p>
      </div>
    );
  }

  // SVG Chart configuration
  const width = 500;
  const height = 280;
  const paddingLeft = 60;
  const paddingRight = 20;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max value for Y scale
  const maxVal = Math.max(
    ...data.map((d) => Math.max(d.invested, d.returns)),
    100000 // default minimum max value
  );

  // Map to points
  const points = data.map((d, i) => {
    const x = paddingLeft + (i / (data.length - 1)) * chartWidth;
    const yInvested = height - paddingBottom - (d.invested / maxVal) * chartHeight;
    const yReturns = height - paddingBottom - (d.returns / maxVal) * chartHeight;
    return { x, yInvested, yReturns, ...d };
  });

  // Generate Bezier Curve paths
  const getSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const investedPts = points.map((p) => ({ x: p.x, y: p.yInvested }));
  const returnsPts = points.map((p) => ({ x: p.x, y: p.yReturns }));

  const pathInvested = getSmoothPath(investedPts);
  const pathReturns = getSmoothPath(returnsPts);

  // Area paths
  const areaInvested = investedPts.length > 0
    ? `${pathInvested} L ${investedPts[investedPts.length - 1].x} ${height - paddingBottom} L ${investedPts[0].x} ${height - paddingBottom} Z`
    : "";

  const areaReturns = returnsPts.length > 0
    ? `${pathReturns} L ${returnsPts[returnsPts.length - 1].x} ${height - paddingBottom} L ${returnsPts[0].x} ${height - paddingBottom} Z`
    : "";

  // Grid line levels
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const formatYAxis = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Handle interaction
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Transform coordinates based on SVG viewbox scaling
    const scaleX = width / rect.width;
    const svgX = mouseX * scaleX;
    
    const relativeX = svgX - paddingLeft;
    const percent = Math.max(0, Math.min(1, relativeX / chartWidth));
    const index = Math.round(percent * (data.length - 1));

    if (index >= 0 && index < data.length) {
      setHoveredIndex(index);
      const xPos = paddingLeft + (index / (data.length - 1)) * chartWidth;
      setTooltipPos({ x: xPos, y: 40 });
    }
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  // ROI Projected margin
  const activeRoi = activePoint && activePoint.invested > 0
    ? ((activePoint.returns - activePoint.invested) / activePoint.invested) * 100
    : 0;

  // Filter X-axis labels to avoid crowding on mobile
  const xLabels = points.filter((_, idx) => {
    if (points.length <= 6) return true;
    if (points.length <= 12) return idx % 2 === 0;
    return idx % 3 === 0;
  });

  return (
    <div className="glass-card rounded-2xl p-5 relative flex flex-col space-y-4">
      {/* Title */}
      <div>
        <h4 className="font-sora text-sm font-bold text-on-surface uppercase tracking-tight">
          CAPITAL FLOW & PROJECTIONS
        </h4>
        <p className="text-[10px] text-on-surface-variant">
          Cumulative investments vs expected maturity valuations
        </p>
      </div>

      {/* SVG Canvas */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none touch-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onTouchMove={(e) => {
            if (e.touches.length > 0) {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = touch.clientX - rect.left;
              const scaleX = width / rect.width;
              const svgX = mouseX * scaleX;
              const relativeX = svgX - paddingLeft;
              const percent = Math.max(0, Math.min(1, relativeX / chartWidth));
              const index = Math.round(percent * (data.length - 1));
              if (index >= 0 && index < data.length) {
                setHoveredIndex(index);
                const xPos = paddingLeft + (index / (data.length - 1)) * chartWidth;
                setTooltipPos({ x: xPos, y: 40 });
              }
            }
          }}
          onTouchEnd={handleMouseLeave}
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="gradientInvested" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5f6874" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#5f6874" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradientReturns" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c97a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#22c97a" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Y Grid Lines */}
          {gridLevels.map((lvl, idx) => {
            const y = paddingTop + lvl * chartHeight;
            const val = maxVal * (1 - lvl);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="var(--outline-variant)"
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 10}
                  y={y + 4}
                  fill="var(--on-surface-variant)"
                  fontSize="10"
                  fontFamily="DM Sans"
                  fontWeight="bold"
                  textAnchor="end"
                  opacity="0.7"
                >
                  {formatYAxis(val)}
                </text>
              </g>
            );
          })}

          {/* Area under curves */}
          <path d={areaInvested} fill="url(#gradientInvested)" />
          <path d={areaReturns} fill="url(#gradientReturns)" />

          {/* Lines */}
          <path
            d={pathInvested}
            fill="none"
            stroke="#5f6874"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.85"
          />
          <path
            d={pathReturns}
            fill="none"
            stroke="#22c97a"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* X Axis Labels */}
          {xLabels.map((p, idx) => (
            <text
              key={idx}
              x={p.x}
              y={height - paddingBottom + 20}
              fill="var(--on-surface-variant)"
              fontSize="10"
              fontFamily="DM Sans"
              textAnchor="middle"
              opacity="0.8"
            >
              {p.label}
            </text>
          ))}

          {/* Active Vertical Guideline & Dots */}
          {activePoint && (
            <g>
              <line
                x1={activePoint.x}
                y1={paddingTop}
                x2={activePoint.x}
                y2={height - paddingBottom}
                stroke="var(--outline-variant)"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              
              {/* Invested Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.yInvested}
                r="6"
                fill="#5f6874"
                stroke="#fff"
                strokeWidth="1.5"
              />
              {/* Expected Return Dot */}
              <circle
                cx={activePoint.x}
                cy={activePoint.yReturns}
                r="6"
                fill="#22c97a"
                stroke="#fff"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Custom HTML Tooltip */}
        {activePoint && (
          <div
            className="absolute bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/30 rounded-xl p-4 shadow-xl z-30 transition-all duration-75 pointer-events-none w-60"
            style={{
              left: `${Math.max(5, Math.min(50, (tooltipPos.x / width) * 100 - 25))}%`,
              top: `20px`,
            }}
          >
            <p className="font-sora text-xs font-bold text-on-surface uppercase tracking-wider mb-2 pb-1 border-b border-outline-variant/20">
              {activePoint.label.toUpperCase()}
            </p>
            <div className="space-y-1.5 text-[11px] font-dm-sans">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span>Total Invested</span>
                <span className="font-bold text-on-surface">
                  {formatCurrency(activePoint.invested)}
                </span>
              </div>
              <div className="flex justify-between items-center text-primary">
                <span>Expected Return</span>
                <span className="font-bold text-primary">
                  {formatCurrency(activePoint.returns)}
                </span>
              </div>
              <div className="flex justify-between items-center text-secondary border-t border-outline-variant/10 pt-1.5 mt-1.5">
                <span className="font-bold tracking-wider text-[10px]">PROJECTED ROI</span>
                <span className="font-extrabold text-secondary text-xs">
                  +{activeRoi.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-1 items-center justify-center text-[10px] font-bold text-on-surface-variant pt-2 border-t border-outline-variant/10 uppercase tracking-wider">
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded bg-[#22c97a] inline-block"></span>
            <span>Expected Return Valuation</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded bg-[#5f6874] inline-block"></span>
            <span>Invested Capital</span>
          </div>
        </div>
      </div>
    </div>
  );
}
