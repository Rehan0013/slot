"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { logoutUser } from "@/app/actions/auth";
import BottomNav from "./BottomNav";
import { formatCurrency, formatDate } from "@/lib/utils";
import CapitalFlowChart from "./CapitalFlowChart";

interface SlotData {
  id: string;
  type: "FIX" | "NON_FIX";
  investorName: string;
  mobileNo: string;
  investmentDate: string;
  returnDate: string;
  amount: number;
  returnAmount: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
}

interface PaymentData {
  id: string;
  slotId: string;
  type: "TDS" | "BOOKING";
  amount: number;
  paidAt: string;
  note: string;
}

interface DashboardProps {
  slots: SlotData[];
  payments: PaymentData[];
}

export default function Dashboard({ slots, payments }: DashboardProps) {
  const { theme, setTheme } = useTheme();

  // Calculate totals
  const totalInvested = slots.reduce((sum, slot) => sum + slot.amount, 0);
  const totalReturn = slots.reduce((sum, slot) => sum + slot.returnAmount, 0);
  const totalProfit = totalReturn - totalInvested;

  // Counts
  const completedCount = slots.filter((s) => s.status === "COMPLETED").length;

  // Sort slots by investmentDate descending to show recent first, limit to 10
  const recentSlots = [...slots]
    .sort((a, b) => new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime())
    .slice(0, 10);

  // Calculate TDS & Booking payments for each slot
  const getPaymentSummary = (slotId: string) => {
    const slotPayments = payments.filter((p) => p.slotId === slotId);
    const tds = slotPayments
      .filter((p) => p.type === "TDS")
      .reduce((sum, p) => sum + p.amount, 0);
    const booking = slotPayments
      .filter((p) => p.type === "BOOKING")
      .reduce((sum, p) => sum + p.amount, 0);
    return { tds, booking };
  };

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32 w-full overflow-x-hidden">
      <div className="bg-mesh"></div>

      {/* Top App Bar */}
      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm flex justify-between items-center w-full px-4 h-16">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">menu</span>
          <h1 className="font-sora text-lg font-extrabold text-primary tracking-tight">
            SLOT TRACKER
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="hover:bg-primary/10 transition-colors p-2 rounded-full flex items-center justify-center active:scale-95 duration-150 cursor-pointer"
            aria-label="Toggle theme"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              {theme === "dark" ? "light_mode" : "dark_mode"}
            </span>
          </button>
          <button
            onClick={() => logoutUser()}
            className="hover:bg-primary/10 transition-colors p-2 rounded-full flex items-center justify-center active:scale-95 duration-150 cursor-pointer"
            aria-label="Logout"
          >
            <span className="material-symbols-outlined text-on-surface-variant">
              logout
            </span>
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Summary Grid */}
        <section className="grid grid-cols-2 gap-3">
          <div className="glass-card p-4 rounded-xl flex flex-col gap-1">
            <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              INVESTED
            </span>
            <span className="font-sora text-lg font-semibold text-on-surface">
              {formatCurrency(totalInvested)}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col gap-1">
            <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/70">
              RETURN
            </span>
            <span className="font-sora text-lg font-semibold text-secondary">
              {formatCurrency(totalReturn)}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col gap-1 ring-1 ring-primary/30 bg-primary/5">
            <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-primary/80">
              PROFIT
            </span>
            <span className="font-sora text-lg font-semibold text-primary">
              {formatCurrency(totalProfit)}
            </span>
          </div>
          <div className="glass-card p-4 rounded-xl flex flex-col gap-1 bg-secondary/5 ring-1 ring-secondary/20">
            <span className="font-dm-sans text-[10px] font-bold uppercase tracking-wider text-secondary/80">
              ROI / COMPLETION
            </span>
            <div className="flex justify-between items-baseline mt-1">
              <span className="font-sora text-base font-bold text-secondary">
                {totalInvested > 0 ? `+${((totalProfit / totalInvested) * 100).toFixed(0)}%` : "0%"}
              </span>
              <span className="font-sora text-xs font-semibold text-on-surface-variant">
                {slots.length > 0 ? `${Math.round((completedCount / slots.length) * 100)}% Comp` : "0% Comp"}
              </span>
            </div>
          </div>
        </section>

        {/* Capital Flow Graph */}
        <CapitalFlowChart slots={slots} />

        {/* Slot Cards List */}
        <section className="space-y-4">
          <h2 className="font-sora text-sm font-semibold flex items-center gap-2 text-on-surface">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Recent Investments (Latest 10)
          </h2>

          {recentSlots.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">
                receipt_long
              </span>
              <p>No investment slots found.</p>
            </div>
          ) : (
            recentSlots.map((slot) => {
              const { tds, booking } = getPaymentSummary(slot.id);
              const isOverdue = slot.status === "OVERDUE";
              const isCompleted = slot.status === "COMPLETED";

              // Business logic amounts
              const expectedTds = slot.type === "FIX" ? 170 : 270;
              const expectedBooking = slot.type === "FIX" ? 370 : 500;

              const isTdsPaid = tds > 0;
              const isBookingPaid = booking > 0;

              return (
                <Link
                  key={slot.id}
                  href={`/slots/${slot.id}`}
                  className="block glass-card rounded-2xl overflow-hidden shadow-lg hover:border-primary/45 transition-all duration-300 transform active:scale-[0.98]"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <p className="font-sora text-base font-semibold leading-tight text-on-surface">
                          {slot.investorName}
                        </p>
                        <p className="text-xs text-on-surface-variant flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">
                            call
                          </span>
                          {slot.mobileNo}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 text-[9px] font-bold rounded-full tracking-wider uppercase ${
                          slot.type === "FIX"
                            ? "bg-primary/10 border border-primary/30 text-primary"
                            : "bg-secondary/10 border border-secondary/30 text-secondary"
                        }`}
                      >
                        {slot.type === "FIX" ? "FIX" : "NON-FIX"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between bg-black/25 p-3 rounded-xl border border-white/5">
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase">
                          Investment
                        </p>
                        <p className="font-bold text-sm text-on-surface mt-0.5">
                          {formatCurrency(slot.amount)}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-primary/40 text-[20px]">
                        trending_flat
                      </span>
                      <div className="text-center">
                        <p className="text-[9px] font-bold text-on-surface-variant/60 uppercase">
                          Est. Return
                        </p>
                        <p className="font-bold text-sm text-primary mt-0.5">
                          {formatCurrency(slot.returnAmount)}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1.5 text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px]">
                          calendar_today
                        </span>
                        <span>
                          {formatDate(slot.investmentDate)} – {formatDate(slot.returnDate)}
                        </span>
                      </div>
                      <span
                        className={`flex items-center gap-1 px-3 py-1 font-bold rounded-full text-[10px] uppercase ${
                          isOverdue
                            ? "bg-error/20 text-error border border-error/30 animate-pulse"
                            : isCompleted
                            ? "bg-on-surface-variant/10 text-on-surface-variant border border-outline-variant/30"
                            : "bg-primary/20 text-primary border border-primary/30"
                        }`}
                      >
                        {!isCompleted && !isOverdue && (
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                        )}
                        {slot.status}
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-high/40 px-5 py-3 border-t border-outline-variant/15 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
                    <p className="flex items-center gap-1">
                      <span>TDS:</span>
                      <span className={isTdsPaid ? "text-primary" : "text-error"}>
                        {isTdsPaid ? `Paid (${formatCurrency(expectedTds)})` : `Unpaid (${formatCurrency(expectedTds)})`}
                      </span>
                    </p>
                    <p className="flex items-center gap-1">
                      <span>Booking:</span>
                      <span className={isBookingPaid ? "text-secondary" : "text-error"}>
                        {isBookingPaid ? `Paid (${formatCurrency(expectedBooking)})` : `Unpaid (${formatCurrency(expectedBooking)})`}
                      </span>
                    </p>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </main>

      {/* Floating Action Button (FAB) */}
      <Link
        href="/slots/new"
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(34,201,122,0.4)] transition-all hover:scale-105 active:scale-95 z-40 border border-primary/20"
        aria-label="Add new slot"
      >
        <span className="material-symbols-outlined text-3xl font-bold">add</span>
      </Link>

      <BottomNav />
    </div>
  );
}
