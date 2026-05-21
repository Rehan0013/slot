"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { saveMonthlyConfig } from "@/app/actions/monthlyConfig";

interface SlotData {
  id: string;
  type: "FIX" | "NON_FIX";
  quantity: number;
  investorName: string;
  investmentDate: string;
  returnDate: string;
  amount: number;
  returnAmount: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
}

interface MonthlyTradeOverviewProps {
  slots: SlotData[];
  configs?: Record<string, any>;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function getDurationDays(investmentDate: string, returnDate: string): number {
  const inv = new Date(investmentDate);
  const ret = new Date(returnDate);
  return Math.round((ret.getTime() - inv.getTime()) / (1000 * 60 * 60 * 24));
}

function getDurationBucket(days: number): 60 | 90 | 120 | null {
  if (days <= 70) return 60;
  if (days <= 100) return 90;
  if (days <= 135) return 120;
  return null;
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthLabel(key: string) {
  const [year, month] = key.split("-");
  return { month: MONTH_NAMES[parseInt(month) - 1], year };
}

export default function MonthlyTradeOverview({ slots, configs = {} }: MonthlyTradeOverviewProps) {
  // Group slots by investment month
  const grouped = useMemo(() => {
    const map: Record<string, SlotData[]> = {};
    for (const slot of slots) {
      const key = getMonthKey(slot.investmentDate);
      if (!map[key]) map[key] = [];
      map[key].push(slot);
    }
    return map;
  }, [slots]);

  const months = useMemo(
    () => Object.keys(grouped).sort((a, b) => b.localeCompare(a)),
    [grouped]
  );

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] || "");
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({ monthLabel: "", yearLabel: "", investmentDate: "", perSlotAmount: 10000 });

  const monthSlots = grouped[selectedMonth] || [];
  const currentConfig = configs[selectedMonth] || {};

  // Aggregate per duration bucket
  const durationRows = useMemo(() => {
    const buckets: Record<60 | 90 | 120, { fix: number; nonFix: number; fixCount: number; nonFixCount: number; totalInvested: number }> = {
      60: { fix: 0, nonFix: 0, fixCount: 0, nonFixCount: 0, totalInvested: 0 },
      90: { fix: 0, nonFix: 0, fixCount: 0, nonFixCount: 0, totalInvested: 0 },
      120: { fix: 0, nonFix: 0, fixCount: 0, nonFixCount: 0, totalInvested: 0 },
    };

    for (const slot of monthSlots) {
      const days = getDurationDays(slot.investmentDate, slot.returnDate);
      const bucket = getDurationBucket(days);
      if (!bucket) continue;

      if (slot.type === "FIX") {
        buckets[bucket].fix += slot.amount;
        buckets[bucket].fixCount += slot.quantity ?? 1;
      } else {
        buckets[bucket].nonFix += slot.amount;
        buckets[bucket].nonFixCount += slot.quantity ?? 1;
      }
      buckets[bucket].totalInvested += slot.amount;
    }

    return buckets;
  }, [monthSlots]);

  // Month summary stats
  const totalInvested = monthSlots.reduce((s, sl) => s + sl.amount, 0);
  const totalReturn = monthSlots.reduce((s, sl) => s + sl.returnAmount, 0);
  const totalProfit = totalReturn - totalInvested;
  const fixSlots = monthSlots.filter((s) => s.type === "FIX");
  const nonFixSlots = monthSlots.filter((s) => s.type === "NON_FIX");

  const autoEarliestDate = monthSlots.length
    ? new Date(Math.min(...monthSlots.map((s) => new Date(s.investmentDate).getTime())))
    : null;

  const { month: autoMonth, year: autoYear } = selectedMonth
    ? getMonthLabel(selectedMonth)
    : { month: "-", year: "-" };

  const monthLabel = currentConfig.monthLabel || autoMonth;
  const yearLabel = currentConfig.yearLabel || autoYear;
  const earliestDate = currentConfig.investmentDate ? new Date(currentConfig.investmentDate) : autoEarliestDate;
  const perSlotAmount = currentConfig.perSlotAmount || 10000;

  const handleEditOverview = () => {
    setConfigForm({
      monthLabel: currentConfig.monthLabel || "",
      yearLabel: currentConfig.yearLabel || "",
      investmentDate: currentConfig.investmentDate ? currentConfig.investmentDate.split("T")[0] : "",
      perSlotAmount: currentConfig.perSlotAmount || 10000,
    });
    setIsEditingConfig(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    try {
      await saveMonthlyConfig(selectedMonth, {
        perSlotAmount: Number(configForm.perSlotAmount),
        investmentDate: configForm.investmentDate || null,
        monthLabel: configForm.monthLabel || null,
        yearLabel: configForm.yearLabel || null,
      });
      setIsEditingConfig(false);
    } catch (err) {
      console.error(err);
      alert("Failed to save configuration.");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Group current month slots by formatted date
  const slotsByDate = useMemo(() => {
    const map: Record<string, SlotData[]> = {};
    for (const slot of monthSlots) {
      const dStr = new Date(slot.investmentDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      if (!map[dStr]) map[dStr] = [];
      map[dStr].push(slot);
    }
    return map;
  }, [monthSlots]);

  const sortedDates = useMemo(() => {
    // We can just sort the keys by parsing them back to Date
    return Object.keys(slotsByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [slotsByDate]);

  if (months.length === 0) {
    return (
      <section className="glass-card rounded-2xl p-8 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-[48px] text-outline-variant block mb-2">
          calendar_month
        </span>
        <p className="font-medium text-sm">No trade data yet.</p>
      </section>
    );
  }

  return (
    <div className="space-y-5">
      {/* Month Selector */}
      <div className="flex flex-nowrap overflow-x-auto gap-2 -mx-4 px-4 pb-1 touch-pan-x">
        {months.map((key) => {
          const { month, year } = getMonthLabel(key);
          const isActive = key === selectedMonth;
          return (
            <button
              key={key}
              onClick={() => setSelectedMonth(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full font-bold whitespace-nowrap text-[10px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                isActive
                  ? "bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(34,201,122,0.25)]"
                  : "bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              {month.slice(0, 3)} {year}
            </button>
          );
        })}
      </div>

      {/* Header Info Card (Prospectus style) */}
      <section className="glass-card rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute -left-8 -bottom-8 w-28 h-28 bg-secondary/8 rounded-full blur-3xl" />
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-3">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Fix &amp; Non-Fix Trading · Monthly Report
            </p>
            <button
              onClick={handleEditOverview}
              className="text-[10px] flex items-center gap-1 font-bold text-primary bg-primary/10 px-2 py-1 rounded-md hover:bg-primary/20 transition-colors active:scale-95 border border-primary/20 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span>
              Edit
            </button>
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1 border-b border-outline-variant/20 pb-3">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Month</p>
              <p className="font-sora text-base font-bold text-on-surface">{monthLabel}</p>
            </div>
            <div className="space-y-1 border-b border-outline-variant/20 pb-3">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Year</p>
              <p className="font-sora text-base font-bold text-primary">{yearLabel}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Investment Date</p>
              <p className="font-sora text-sm font-semibold text-on-surface">
                {earliestDate
                  ? earliestDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                  : "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Per-Slot Amount</p>
              <p className="font-sora text-sm font-bold text-secondary">{formatCurrency(perSlotAmount)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Summary Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Invested</p>
          <p className="font-sora text-sm font-extrabold text-on-surface mt-1">{formatCurrency(totalInvested)}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider">Return</p>
          <p className="font-sora text-sm font-extrabold text-secondary mt-1">{formatCurrency(totalReturn)}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center ring-1 ring-primary/20">
          <p className="text-[9px] font-bold text-primary/80 uppercase tracking-wider">Profit</p>
          <p className="font-sora text-sm font-extrabold text-primary mt-1">{formatCurrency(totalProfit)}</p>
        </div>
      </div>

      {/* Duration × Type Table (core prospectus table) */}
      <section className="glass-card rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">table_chart</span>
          <h3 className="font-sora text-sm font-bold text-on-surface">Duration-wise Return</h3>
          <span className="ml-auto text-[9px] text-on-surface-variant font-bold uppercase tracking-wider">Days → Fix / Non-Fix</span>
        </div>

        {/* Header row */}
        <div className="grid grid-cols-[100px_1fr_1fr] bg-surface-container-high/40 border-b border-outline-variant/10">
          <div className="px-4 py-3 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-outline text-[14px]">schedule</span>
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Duration</span>
          </div>
          <div className="px-3 py-3 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider">Fix Invested</span>
          </div>
          <div className="px-3 py-3 text-center">
            <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">Non-Fix Invested</span>
          </div>
        </div>

        {([60, 90, 120] as const).map((days, idx) => {
          const row = durationRows[days];
          const hasData = row.fixCount > 0 || row.nonFixCount > 0;
          return (
            <div
              key={days}
              className={`grid grid-cols-[100px_1fr_1fr] border-b border-outline-variant/8 transition-colors ${
                hasData ? "" : "opacity-40"
              } ${idx % 2 === 0 ? "bg-black/5" : ""}`}
            >
              {/* Days cell */}
              <div className="px-4 py-4 flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <span className="font-sora text-base font-extrabold text-on-surface">{days}</span>
                  <span className="text-[9px] font-bold text-on-surface-variant uppercase">Days</span>
                </div>
                <span className="material-symbols-outlined text-primary/50 text-[18px] ml-1">arrow_forward</span>
              </div>

              {/* Fix return */}
              <div className="px-3 py-4 flex flex-col items-center justify-center gap-0.5 border-l border-outline-variant/10">
                {row.fixCount > 0 ? (
                  <>
                    <span className="font-sora text-sm font-extrabold text-primary">
                      {formatCurrency(row.fix)}
                    </span>
                    <span className="text-[9px] text-on-surface-variant">
                      {row.fixCount} slot{row.fixCount > 1 ? "s" : ""} invested
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-outline-variant font-medium tracking-widest">— — —</span>
                )}
              </div>

              {/* Non-Fix return */}
              <div className="px-3 py-4 flex flex-col items-center justify-center gap-0.5 border-l border-outline-variant/10">
                {row.nonFixCount > 0 ? (
                  <>
                    <span className="font-sora text-sm font-extrabold text-secondary">
                      {formatCurrency(row.nonFix)}
                    </span>
                    <span className="text-[9px] text-on-surface-variant">
                      {row.nonFixCount} slot{row.nonFixCount > 1 ? "s" : ""} invested
                    </span>
                  </>
                ) : (
                  <span className="text-[11px] text-outline-variant font-medium tracking-widest">— — —</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Total row */}
        <div className="grid grid-cols-[100px_1fr_1fr] bg-surface-container-high/60">
          <div className="px-4 py-3 flex items-center">
            <span className="text-[10px] font-bold text-on-surface uppercase tracking-wider">Total</span>
          </div>
          <div className="px-3 py-3 flex flex-col items-center border-l border-outline-variant/10">
            <span className="font-sora text-sm font-extrabold text-primary">
              {fixSlots.length > 0 ? formatCurrency(fixSlots.reduce((s, sl) => s + sl.amount, 0)) : "—"}
            </span>
            {fixSlots.length > 0 && (
              <span className="text-[9px] text-primary/70">{fixSlots.length} fix slot{fixSlots.length > 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="px-3 py-3 flex flex-col items-center border-l border-outline-variant/10">
            <span className="font-sora text-sm font-extrabold text-secondary">
              {nonFixSlots.length > 0 ? formatCurrency(nonFixSlots.reduce((s, sl) => s + sl.amount, 0)) : "—"}
            </span>
            {nonFixSlots.length > 0 && (
              <span className="text-[9px] text-secondary/70">{nonFixSlots.length} non-fix slot{nonFixSlots.length > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      </section>

      {/* Individual Slots in this month grouped by date */}
      {monthSlots.length > 0 && (
        <section className="space-y-5">
          <h3 className="font-sora text-sm font-bold text-on-surface flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full" />
            Investments Timeline ({monthSlots.length})
          </h3>
          
          {sortedDates.map((dateLabel) => (
            <div key={dateLabel} className="space-y-3">
              <div className="flex items-center gap-2 text-on-surface-variant font-sora text-[11px] font-bold bg-surface-container-high/60 py-1.5 px-3 rounded-lg w-max border border-outline-variant/10 shadow-sm">
                <span className="material-symbols-outlined text-[14px] text-primary">calendar_today</span>
                {dateLabel}
              </div>
              
              {slotsByDate[dateLabel].map((slot) => {
                const days = getDurationDays(slot.investmentDate, slot.returnDate);
                const profit = slot.returnAmount - slot.amount;
                const qty = slot.quantity ?? 1;
                return (
                  <div
                    key={slot.id}
                    className={`glass-card rounded-xl p-4 border-l-4 ${
                      slot.type === "FIX" ? "border-l-primary" : "border-l-secondary"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-sora text-sm font-bold text-on-surface">{slot.investorName}</p>
                          <Link
                            href={`/slots/${slot.id}/edit`}
                            className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center bg-black/20 p-1 rounded-full active:scale-95 border border-white/5"
                            title="Edit Slot"
                          >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                          </Link>
                        </div>
                        <p className="text-[10px] text-on-surface-variant mt-0.5">
                          Return on: {new Date(slot.returnDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                            slot.type === "FIX"
                              ? "bg-primary/15 border border-primary/25 text-primary"
                              : "bg-secondary/15 border border-secondary/25 text-secondary"
                          }`}
                        >
                          {slot.type === "FIX" ? "Fix" : "Non-Fix"}
                        </span>
                        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">
                          {days} days{qty > 1 ? ` · ×${qty}` : ""}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div className="text-center bg-black/20 rounded-lg p-2">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Invested</p>
                        <p className="font-bold text-xs text-on-surface mt-0.5">{formatCurrency(slot.amount)}</p>
                      </div>
                      <div className="text-center bg-black/20 rounded-lg p-2">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Return</p>
                        <p className={`font-bold text-xs mt-0.5 ${slot.type === "FIX" ? "text-primary" : "text-secondary"}`}>
                          {formatCurrency(slot.returnAmount)}
                        </p>
                      </div>
                      <div className="text-center bg-black/20 rounded-lg p-2">
                        <p className="text-[9px] text-on-surface-variant uppercase font-bold">Profit</p>
                        <p className="font-bold text-xs text-primary mt-0.5">{formatCurrency(profit)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </section>
      )}

      {/* Important Notes */}
      <section className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">info</span>
          <h3 className="font-sora text-sm font-bold text-on-surface">Important Points</h3>
        </div>
        <ul className="space-y-2.5">
          {[
            { icon: "lock", text: "The fix slot profit will be same, as it came." },
            { icon: "show_chart", text: "Non-fix Slot is not fixed, it depends on market." },
            { icon: "confirmation_number", text: "Booking amount for Fix → ₹370 per slot · Non-Fix → ₹500 per slot." },
            { icon: "receipt_long", text: "TDS for Fix → ₹170 · TDS for Non-Fix → ₹270." },
            { icon: "verified_user", text: "Your amount is secure with us." },
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-primary/70 text-[16px] mt-0.5 flex-shrink-0">{item.icon}</span>
              <p className="text-xs text-on-surface leading-relaxed">{item.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Edit Overview Modal */}
      {isEditingConfig && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-outline-variant/30">
            <header className="mb-5 flex justify-between items-center">
              <h3 className="font-sora text-base font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_document</span>
                Edit Overview
              </h3>
              <button
                onClick={() => setIsEditingConfig(false)}
                className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Per-Slot Amount</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={configForm.perSlotAmount}
                  onChange={(e) => setConfigForm({ ...configForm, perSlotAmount: Number(e.target.value) })}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Investment Date (Override)</label>
                <input
                  type="date"
                  value={configForm.investmentDate}
                  onChange={(e) => setConfigForm({ ...configForm, investmentDate: e.target.value })}
                  className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:border-primary/50 transition-colors block"
                />
                <p className="text-[9px] text-on-surface-variant mt-1">Leave blank to auto-calculate from slots.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Month Label</label>
                  <input
                    type="text"
                    placeholder="e.g. May"
                    value={configForm.monthLabel}
                    onChange={(e) => setConfigForm({ ...configForm, monthLabel: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Year Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 2026"
                    value={configForm.yearLabel}
                    onChange={(e) => setConfigForm({ ...configForm, yearLabel: e.target.value })}
                    className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm font-medium text-on-surface focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditingConfig(false)}
                  className="flex-1 h-11 rounded-xl border border-outline-variant/30 text-on-surface font-bold text-[11px] uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingConfig}
                  className="flex-1 h-11 rounded-xl bg-primary-container text-on-primary-container font-bold text-[11px] uppercase tracking-wider hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-md disabled:opacity-75 flex items-center justify-center gap-2"
                >
                  {isSavingConfig ? (
                    <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                  ) : (
                    "Save Config"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
