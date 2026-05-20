"use client";

import React, { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";

interface MonthlyReturnsBreakdownProps {
  slotId: string;
  amount: number;
  returnAmount: number;
  investmentDate: string;
  returnDate: string;
}

interface MonthlyBreakdown {
  monthIndex: number;
  monthLabel: string;
  opening: number;
  interest: number;
  closing: number;
  yieldPercent: number;
}

// Seeded pseudo-random generator
const createSeededRng = (seedStr: string) => {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return () => {
    const x = Math.sin(hash++) * 10000;
    return x - Math.floor(x);
  };
};

export default function MonthlyReturnsBreakdown({
  slotId,
  amount,
  returnAmount,
  investmentDate,
  returnDate,
}: MonthlyReturnsBreakdownProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const breakdown = useMemo((): MonthlyBreakdown[] => {
    const start = new Date(investmentDate);
    const end = new Date(returnDate);

    let monthCount = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    // Minimum 1 month
    if (monthCount < 1) monthCount = 1;

    const totalProfit = returnAmount - amount;
    const rng = createSeededRng(slotId);

    // Generate weights
    const weights: number[] = [];
    let sumWeights = 0;
    for (let i = 0; i < monthCount; i++) {
      const w = 0.3 + rng() * 0.7; // random weight between 0.3 and 1.0
      weights.push(w);
      sumWeights += w;
    }

    // Distribute profits
    const profits: number[] = [];
    let distributedProfit = 0;
    for (let i = 0; i < monthCount; i++) {
      if (i === monthCount - 1) {
        profits.push(totalProfit - distributedProfit);
      } else {
        const p = Math.round(totalProfit * (weights[i] / sumWeights));
        profits.push(p);
        distributedProfit += p;
      }
    }

    // Construct breakdown objects
    const data: MonthlyBreakdown[] = [];
    let currentBalance = amount;
    let currentDate = new Date(start);

    for (let i = 0; i < monthCount; i++) {
      const monthLabel = currentDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const opening = currentBalance;
      const interest = profits[i];
      const closing = opening + interest;
      const yieldPercent = opening > 0 ? (interest / opening) * 100 : 0;

      data.push({
        monthIndex: i + 1,
        monthLabel,
        opening,
        interest,
        closing,
        yieldPercent,
      });

      currentBalance = closing;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return data;
  }, [slotId, amount, returnAmount, investmentDate, returnDate]);

  if (breakdown.length === 0) return null;

  // Chart config
  const width = 500;
  const height = 300;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Maximum value for scaling Y
  const maxClosing = Math.max(...breakdown.map((b) => b.closing));
  const maxVal = maxClosing * 1.15; // 15% top padding

  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const formatYAxis = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(1)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(0)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Bar math
  const barGap = breakdown.length > 8 ? 8 : 16;
  const totalGaps = barGap * (breakdown.length - 1);
  const barWidth = Math.max(12, (chartWidth - totalGaps) / breakdown.length);

  const activeItem = hoveredIndex !== null ? breakdown[hoveredIndex] : null;

  return (
    <section className="space-y-6">
      {/* Chart Card */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 relative flex flex-col space-y-4">
        <div>
          <h4 className="font-sora text-sm font-bold text-on-surface uppercase tracking-tight">
            MONTHLY RETURNS BREAKDOWN
          </h4>
          <p className="text-[10px] text-on-surface-variant">
            Month-on-month compounding valuation and yield analysis
          </p>
        </div>

        {/* SVG Canvas */}
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none touch-none">
            {/* Grid lines */}
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
                    stroke="rgba(255, 255, 255, 0.07)"
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

            {/* Bars */}
            {breakdown.map((item, idx) => {
              const x = paddingLeft + idx * (barWidth + barGap);
              const yClosing = paddingTop + (1 - item.closing / maxVal) * chartHeight;
              const yOpening = paddingTop + (1 - item.opening / maxVal) * chartHeight;
              const yBottom = paddingTop + chartHeight;

              const grayBarHeight = yBottom - yOpening;
              const greenBarHeight = yOpening - yClosing;

              const isHovered = hoveredIndex === idx;

              return (
                <g key={idx}>
                  {/* Hover background highlight */}
                  {isHovered && (
                    <rect
                      x={x - barGap / 4}
                      y={paddingTop - 10}
                      width={barWidth + barGap / 2}
                      height={chartHeight + 20}
                      fill="rgba(255, 255, 255, 0.03)"
                      rx="6"
                    />
                  )}

                  {/* Gray opening balance bar */}
                  <rect
                    x={x}
                    y={yOpening}
                    width={barWidth}
                    height={Math.max(2, grayBarHeight)}
                    fill="var(--on-surface)"
                    className="opacity-15 transition-all duration-150"
                    rx="3"
                  />

                  {/* Green interest cap bar */}
                  <rect
                    x={x}
                    y={yClosing}
                    width={barWidth}
                    height={Math.max(2, greenBarHeight)}
                    fill="#22c97a"
                    className="transition-all duration-150"
                    rx="3"
                  />

                  {/* X Axis Label */}
                  <text
                    x={x + barWidth / 2}
                    y={height - paddingBottom + 20}
                    fill="var(--on-surface-variant)"
                    fontSize="10"
                    fontFamily="DM Sans"
                    textAnchor="middle"
                    opacity={isHovered ? 1 : 0.8}
                    fontWeight={isHovered ? "bold" : "normal"}
                  >
                    {item.monthLabel}
                  </text>

                  {/* Interactive Invisible Overlay for Hover */}
                  <rect
                    x={x - barGap / 2}
                    y={paddingTop}
                    width={barWidth + barGap}
                    height={chartHeight}
                    fill="transparent"
                    className="cursor-pointer"
                    onMouseEnter={(e) => {
                      setHoveredIndex(idx);
                      const rectX = x + barWidth / 2;
                      setTooltipPos({ x: rectX, y: yClosing });
                    }}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Tooltip Popup */}
          {activeItem && (
            <div
              className="absolute bg-surface-container-high/95 backdrop-blur-md border border-outline-variant/30 rounded-xl p-4 shadow-xl z-30 pointer-events-none w-60"
              style={{
                left: `${Math.max(5, Math.min(50, (tooltipPos.x / width) * 100 - 25))}%`,
                top: `20px`,
              }}
            >
              <p className="font-sora text-xs font-bold text-on-surface uppercase tracking-wider mb-2 pb-1 border-b border-outline-variant/20">
                {activeItem.monthLabel.toUpperCase()}
              </p>
              <div className="space-y-1.5 text-[11px] font-dm-sans">
                <div className="flex justify-between items-center text-on-surface-variant">
                  <span>OPENING</span>
                  <span className="font-bold text-on-surface">
                    {formatCurrency(activeItem.opening)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-primary">
                  <span>MONTHLY PROFIT</span>
                  <span className="font-bold text-primary">
                    +{formatCurrency(activeItem.interest)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-on-surface border-t border-outline-variant/10 pt-1.5 mt-1.5">
                  <span className="font-bold uppercase tracking-wider text-[10px]">CLOSING</span>
                  <span className="font-extrabold text-on-surface text-xs">
                    {formatCurrency(activeItem.closing)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-secondary">
                  <span>YIELD</span>
                  <span className="font-extrabold text-secondary">
                    {activeItem.yieldPercent.toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Section */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-outline-variant/10">
          <h4 className="font-sora text-xs font-bold text-on-surface uppercase tracking-wider">
            Ledger & Yield Breakdown
          </h4>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/2 border-b border-outline-variant/10 text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">
                <th className="py-3 px-4 w-12 text-center">M</th>
                <th className="py-3 px-3">Opening</th>
                <th className="py-3 px-3">Interest</th>
                <th className="py-3 px-4 text-right">Closing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {breakdown.map((row) => (
                <tr
                  key={row.monthIndex}
                  className="hover:bg-white/2 transition-colors duration-100"
                >
                  <td className="py-3.5 px-4 text-center font-bold text-on-surface-variant bg-white/1">
                    {row.monthIndex}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-on-surface">
                    {formatCurrency(row.opening)}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-primary">
                    +{formatCurrency(row.interest)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-on-surface">
                    {formatCurrency(row.closing)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
