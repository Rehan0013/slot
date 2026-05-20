"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteSlot, toggleSlotCompletion } from "@/app/actions/slots";
import { addPayment, deletePayment } from "@/app/actions/payments";
import MonthlyReturnsBreakdown from "./MonthlyReturnsBreakdown";

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

interface SlotDetailsProps {
  slot: SlotData;
  payments: PaymentData[];
}

export default function SlotDetails({ slot, payments }: SlotDetailsProps) {
  const router = useRouter();
  const [showDeleteSlotModal, setShowDeleteSlotModal] = useState(false);
  const [showTdsPendingModal, setShowTdsPendingModal] = useState(false);

  // Pending states for payment transitions
  const [isTdsPending, setIsTdsPending] = useState(false);
  const [isBookingPending, setIsBookingPending] = useState(false);

  // Loading state for toggle completion
  const [isTogglePending, setIsTogglePending] = useState(false);

  const profit = slot.returnAmount - slot.amount;

  // Filter payments by type
  const tdsPayments = payments.filter((p) => p.type === "TDS");
  const bookingPayments = payments.filter((p) => p.type === "BOOKING");

  // Expected business logic amounts
  const expectedTds = slot.type === "FIX" ? 170 : 270;
  const expectedBooking = slot.type === "FIX" ? 370 : 500;

  const isTdsPaid = tdsPayments.length > 0;
  const isBookingPaid = bookingPayments.length > 0;

  const clientToday = new Date();
  clientToday.setHours(0, 0, 0, 0);
  const clientReturnDate = new Date(slot.returnDate);
  clientReturnDate.setHours(0, 0, 0, 0);
  const isReturnDatePassedOrToday = clientReturnDate <= clientToday;

  const getDaysLeftText = () => {
    if (slot.status === "COMPLETED") return "Completed";

    const diffTime = clientReturnDate.getTime() - clientToday.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} Day${diffDays > 1 ? "s" : ""} Left`;
    } else if (diffDays === 0) {
      return "Due Today";
    } else {
      return `Overdue by ${Math.abs(diffDays)} Day${Math.abs(diffDays) > 1 ? "s" : ""}`;
    }
  };

  const handleToggleCompletion = async () => {
    if (isTogglePending) return;

    if (slot.status !== "COMPLETED") {
      if (!isTdsPaid) {
        setShowTdsPendingModal(true);
        return;
      }
    }

    setIsTogglePending(true);
    try {
      await toggleSlotCompletion(slot.id, slot.status);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTogglePending(false);
    }
  };

  const handleDeleteSlot = async () => {
    try {
      await deleteSlot(slot.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkTdsPaid = async () => {
    if (isTdsPending) return;
    setIsTdsPending(true);
    try {
      await addPayment(slot.id, "TDS", expectedTds, new Date().toISOString(), "Marked Paid");
    } catch (err) {
      console.error(err);
    } finally {
      setIsTdsPending(false);
    }
  };

  const handleMarkBookingPaid = async () => {
    if (isBookingPending) return;
    setIsBookingPending(true);
    try {
      await addPayment(slot.id, "BOOKING", expectedBooking, new Date().toISOString(), "Marked Paid");
    } catch (err) {
      console.error(err);
    } finally {
      setIsBookingPending(false);
    }
  };

  const handleMarkUnpaid = async (paymentId: string, type: "TDS" | "BOOKING") => {
    if (!confirm(`Are you sure you want to mark this ${type} payment as Unpaid?`)) return;
    if (type === "TDS") setIsTdsPending(true);
    else setIsBookingPending(true);

    try {
      await deletePayment(paymentId, slot.id);
    } catch (err) {
      console.error(err);
    } finally {
      if (type === "TDS") setIsTdsPending(false);
      else setIsBookingPending(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      {/* Header Section */}
      <header className="fixed top-0 w-full z-40 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="transition-all duration-200 active:scale-95 hover:opacity-80 p-2 text-primary cursor-pointer flex items-center"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-base font-bold text-primary">Slot Details</h1>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/slots/${slot.id}/edit`}
            className="transition-all duration-200 active:scale-95 hover:opacity-80 p-2 text-primary flex items-center"
            aria-label="Edit slot"
          >
            <span className="material-symbols-outlined">edit</span>
          </Link>
          <button
            onClick={() => setShowDeleteSlotModal(true)}
            className="transition-all duration-200 active:scale-95 hover:opacity-80 p-2 text-error cursor-pointer flex items-center"
            aria-label="Delete slot"
          >
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </header>

      <main className="mt-20 px-4 space-y-6 max-w-md mx-auto">
        {/* Profile Card */}
        <section className="glass-card rounded-xl p-5 overflow-hidden relative">
          <div className="absolute -right-12 -top-12 w-32 h-32 bg-primary/10 blur-[60px] rounded-full"></div>
          <div className="flex justify-between items-start relative z-10">
            <div className="space-y-1">
              <h2 className="font-sora text-lg font-semibold text-on-surface">
                {slot.investorName}
              </h2>
              <a
                href={`tel:${slot.mobileNo}`}
                className="text-on-surface-variant font-medium text-xs flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
                {slot.mobileNo}
              </a>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <span
                className={`px-3 py-0.5 border text-[9px] font-bold tracking-wider uppercase rounded-full ${slot.type === "FIX"
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "bg-secondary/10 border-secondary/30 text-secondary"
                  }`}
              >
                {slot.type === "FIX" ? "FIX" : "NON-FIX"}
              </span>
              <button
                onClick={handleToggleCompletion}
                disabled={isTogglePending}
                className={`px-3 py-0.5 border text-[9px] font-bold tracking-wider uppercase rounded-full cursor-pointer flex items-center gap-1 hover:scale-105 active:scale-95 transition-all ${slot.status === "COMPLETED"
                  ? "bg-on-surface-variant/20 border-outline-variant/40 text-on-surface-variant"
                  : slot.status === "OVERDUE"
                    ? "bg-error/20 border-error/40 text-error animate-pulse"
                    : "bg-primary-container/20 border-primary-container/40 text-primary-container"
                  }`}
              >
                {isTogglePending ? (
                  <span className="material-symbols-outlined animate-spin text-[10px]">
                    progress_activity
                  </span>
                ) : (
                  slot.status
                )}
              </button>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between bg-surface-container/50 p-3 rounded-lg border border-white/5 relative z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-[18px]">
                calendar_today
              </span>
              <span className="text-xs text-on-surface-variant">
                {formatDate(slot.investmentDate)} – {formatDate(slot.returnDate)}
              </span>
            </div>
            <span className="text-xs font-bold text-outline uppercase">{getDaysLeftText()}</span>
          </div>
        </section>

        {/* Complete Payment Banner */}
        {isReturnDatePassedOrToday && slot.status !== "COMPLETED" && (
          <section className="glass-card rounded-xl p-5 border border-primary/30 relative overflow-hidden bg-primary/5 ring-1 ring-primary/20 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 space-y-3">
              <h3 className="font-sora text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">assignment_turned_in</span>
                Investment Due for Completion
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                The return date has been reached or passed. Verify the payments and mark this investment as completed.
              </p>
              <button
                onClick={handleToggleCompletion}
                disabled={isTogglePending}
                className="w-full h-12 bg-primary-container text-on-primary-container font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(34,201,122,0.3)] hover:scale-[1.01] active:scale-95 disabled:opacity-75"
              >
                {isTogglePending ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Complete the Payment
                  </>
                )}
              </button>
            </div>
          </section>
        )}
        {/* Completed Status Revert Banner */}
        {slot.status === "COMPLETED" && (
          <section className="glass-card rounded-xl p-5 border border-white/10 relative overflow-hidden bg-white/5 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="relative z-10 space-y-3">
              <h3 className="font-sora text-sm font-semibold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">task_alt</span>
                Investment Completed
              </h3>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This investment is marked as completed. You can revert it to active status at any time.
              </p>
              <button
                onClick={handleToggleCompletion}
                disabled={isTogglePending}
                className="w-full h-11 border border-outline-variant/30 text-on-surface hover:bg-white/5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {isTogglePending ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">undo</span>
                    Retrieve Payment
                  </>
                )}
              </button>
            </div>
          </section>
        )}

        {/* Investment Cards Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 col-span-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Total Investment
            </p>
            <h3 className="font-sora text-2xl font-semibold text-on-surface">
              {formatCurrency(slot.amount)}
            </h3>
          </div>
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-secondary-container">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Exp. Return
            </p>
            <p className="font-sora text-base font-bold text-on-surface">
              {formatCurrency(slot.returnAmount)}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4 border-l-4 border-l-primary-container">
            <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              Net Profit
            </p>
            <p className="font-sora text-base font-bold text-primary-container">
              {formatCurrency(profit)}
            </p>
          </div>
        </section>

        {/* Unified Payment Tracking Sections */}
        <section className="space-y-4">
          <h3 className="font-sora text-base font-bold text-on-surface flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Fee Collection Status
          </h3>

          <div className="space-y-4">
            {/* TDS Payment Block */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isTdsPaid
                    ? "bg-primary/10 border-primary/20 text-primary"
                    : "bg-surface-container-highest border-outline-variant/30 text-on-surface-variant"
                    }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {isTdsPaid ? "check_circle" : "receipt_long"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-sora text-sm font-bold text-on-surface">TDS Payment</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                      Expected Amount: {formatCurrency(expectedTds)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${isTdsPaid ? "bg-primary/20 text-primary border border-primary/30" : "bg-error/20 text-error border border-error/30"
                  }`}>
                  {isTdsPaid ? "Paid" : "Unpaid"}
                </span>
              </div>

              {isTdsPaid ? (
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-white/5">
                  <div className="text-xs">
                    <p className="text-on-surface-variant/80">Received on:</p>
                    <p className="font-bold text-on-surface mt-0.5">
                      {formatDate(tdsPayments[0].paidAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkUnpaid(tdsPayments[0].id, "TDS")}
                    disabled={isTdsPending}
                    className="h-9 px-4 border border-error/30 hover:bg-error/10 text-error font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isTdsPending ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">undo</span>
                        Mark Unpaid
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMarkTdsPaid}
                  disabled={isTdsPending}
                  className="w-full h-11 bg-primary-container text-on-primary-container hover:bg-primary-container/90 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(34,201,122,0.2)] disabled:opacity-75"
                >
                  {isTdsPending ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">done</span>
                      Mark TDS as Paid ({formatCurrency(expectedTds)})
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Booking Payment Block */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${isBookingPaid
                    ? "bg-secondary/10 border-secondary/20 text-secondary"
                    : "bg-surface-container-highest border-outline-variant/30 text-on-surface-variant"
                    }`}>
                    <span className="material-symbols-outlined text-[20px]">
                      {isBookingPaid ? "check_circle" : "confirmation_number"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-sora text-sm font-bold text-on-surface">Booking Fee</h4>
                    <p className="text-[10px] text-on-surface-variant uppercase tracking-wider mt-0.5">
                      Expected Amount: {formatCurrency(expectedBooking)}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${isBookingPaid ? "bg-secondary/20 text-secondary border border-secondary/30" : "bg-error/20 text-error border border-error/30"
                  }`}>
                  {isBookingPaid ? "Paid" : "Unpaid"}
                </span>
              </div>

              {isBookingPaid ? (
                <div className="flex justify-between items-center bg-black/25 p-3 rounded-xl border border-white/5">
                  <div className="text-xs">
                    <p className="text-on-surface-variant/80">Received on:</p>
                    <p className="font-bold text-on-surface mt-0.5">
                      {formatDate(bookingPayments[0].paidAt)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleMarkUnpaid(bookingPayments[0].id, "BOOKING")}
                    disabled={isBookingPending}
                    className="h-9 px-4 border border-error/30 hover:bg-error/10 text-error font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                  >
                    {isBookingPending ? (
                      <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">undo</span>
                        Mark Unpaid
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleMarkBookingPaid}
                  disabled={isBookingPending}
                  className="w-full h-11 bg-secondary-container text-on-secondary-container hover:bg-secondary-container/90 font-bold text-[11px] uppercase tracking-wider rounded-xl transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-[0_4px_12px_rgba(0,166,224,0.2)] disabled:opacity-75"
                >
                  {isBookingPending ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">done</span>
                      Mark Booking as Paid ({formatCurrency(expectedBooking)})
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Monthly Returns Breakdown Chart & Ledger */}
        <MonthlyReturnsBreakdown
          slotId={slot.id}
          amount={slot.amount}
          returnAmount={slot.returnAmount}
          investmentDate={slot.investmentDate}
          returnDate={slot.returnDate}
        />
      </main>

      {/* Delete Slot Dialog Modal */}
      {showDeleteSlotModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-error/30">
            <header className="mb-4">
              <h3 className="font-sora text-base font-bold text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-error">warning</span>
                Delete Investment Slot?
              </h3>
            </header>

            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                This action is permanent and cannot be undone. All recorded payments (TDS and Booking) associated with this slot will be permanently deleted from the database.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowDeleteSlotModal(false)}
                  className="h-10 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSlot}
                  className="h-10 px-4 rounded-xl bg-error text-on-error font-bold text-xs uppercase tracking-wider hover:bg-error/95 active:scale-95 shadow-md shadow-error/15 transition-all cursor-pointer"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TDS Warning Dialog Modal */}
      {showTdsPendingModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-sm rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200 border-error/30">
            <header className="mb-4">
              <h3 className="font-sora text-base font-bold text-error flex items-center gap-1.5">
                <span className="material-symbols-outlined text-error">warning</span>
                TDS Payment Pending
              </h3>
            </header>

            <div className="space-y-4">
              <p className="text-xs text-on-surface-variant leading-relaxed">
                You cannot mark this investment as completed because the TDS payment is pending. Please mark TDS as paid first.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setShowTdsPendingModal(false)}
                  className="h-10 px-6 rounded-xl bg-primary-container text-on-primary-container font-bold text-xs uppercase tracking-wider hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-md"
                >
                  Understood
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
