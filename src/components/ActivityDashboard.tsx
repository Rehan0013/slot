"use client";

import { useState } from "react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import BottomNav from "./BottomNav";

interface SlotData {
  id: string;
  type: "FIX" | "NON_FIX";
  quantity: number;
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

interface ActivityDashboardProps {
  slots: SlotData[];
  payments: PaymentData[];
}

export default function ActivityDashboard({ slots, payments }: ActivityDashboardProps) {
  const [activeTab, setActiveTab] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Sort slots by investmentDate descending to show latest first
  const sortedSlots = [...slots].sort(
    (a, b) => new Date(b.investmentDate).getTime() - new Date(a.investmentDate).getTime()
  );

  // Filtering logic
  const filteredSlots = sortedSlots.filter((slot) => {
    // Tab filter
    if (activeTab === "Fix" && slot.type !== "FIX") return false;
    if (activeTab === "Non-Fix" && slot.type !== "NON_FIX") return false;
    if (activeTab === "Active" && slot.status !== "ACTIVE") return false;
    if (activeTab === "Completed" && slot.status !== "COMPLETED") return false;
    if (activeTab === "Overdue" && slot.status !== "OVERDUE") return false;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        slot.investorName.toLowerCase().includes(query) ||
        slot.mobileNo.includes(query)
      );
    }

    return true;
  });

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

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm flex justify-between items-center w-full px-4 h-16">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          <h1 className="font-sora text-base font-extrabold text-primary tracking-tight">
            ALL INVESTMENTS
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        {/* Search Input */}
        <section className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search investor by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl input-recessed font-dm-sans text-sm text-on-surface placeholder:text-outline-variant/50 focus:ring-0"
          />
        </section>

        {/* Filter Chips */}
        <section className="flex flex-nowrap overflow-x-scroll gap-2 -mx-4 px-4 pb-2 touch-pan-x">
          {["All", "Fix", "Non-Fix", "Active", "Completed", "Overdue"].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-shrink-0 px-5 py-2 rounded-full font-bold whitespace-nowrap text-[11px] uppercase tracking-wider transition-all duration-200 cursor-pointer ${isActive
                    ? "bg-primary-container text-on-primary-container shadow-[0_4px_12px_rgba(34,201,122,0.2)]"
                    : "bg-surface-container-high border border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant"
                  }`}
              >
                {tab}
              </button>
            );
          })}
          {/* Scroll container edge spacer */}
          <div className="w-4 flex-shrink-0" />
        </section>

        {/* Slot Cards List */}
        <section className="space-y-4">
          <h2 className="font-sora text-sm font-semibold flex items-center gap-2 text-on-surface">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Investments ({filteredSlots.length})
          </h2>

          {filteredSlots.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">
                receipt_long
              </span>
              <p>No investment slots found.</p>
            </div>
          ) : (
            filteredSlots.map((slot) => {
              const { tds, booking } = getPaymentSummary(slot.id);
              const isOverdue = slot.status === "OVERDUE";
              const isCompleted = slot.status === "COMPLETED";

              // Expected business logic amounts
              const slotQty = (slot as any).quantity ?? 1;
              const expectedTds = (slot.type === "FIX" ? 170 : 270) * slotQty;
              const expectedBooking = (slot.type === "FIX" ? 370 : 500) * slotQty;

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
                        className={`px-3 py-1 text-[9px] font-bold rounded-full tracking-wider uppercase ${slot.type === "FIX"
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
                        className={`flex items-center gap-1 px-3 py-1 font-bold rounded-full text-[10px] uppercase ${isOverdue
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

      <BottomNav />
    </div>
  );
}
