"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/utils";

interface SlotFormProps {
  initialData?: {
    id: string;
    type: "FIX" | "NON_FIX";
    investorName: string;
    mobileNo: string;
    investmentDate: string;
    returnDate: string;
    amount: number;
    returnAmount: number;
    status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  };
  onSubmitAction: (formData: FormData) => Promise<{ error?: string } | void>;
  isEditing?: boolean;
}

export default function SlotForm({ initialData, onSubmitAction, isEditing = false }: SlotFormProps) {
  const router = useRouter();

  const [type, setType] = useState<"FIX" | "NON_FIX">(initialData?.type || "FIX");
  const [investorName, setInvestorName] = useState(initialData?.investorName || "");
  const [mobileNo, setMobileNo] = useState(initialData?.mobileNo || "");
  
  const formatDateForInput = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString().split("T")[0];
  };

  const [investmentDate, setInvestmentDate] = useState(
    formatDateForInput(initialData?.investmentDate) || new Date().toISOString().split("T")[0]
  );
  const [returnDate, setReturnDate] = useState(
    formatDateForInput(initialData?.returnDate) || ""
  );
  
  const [amount, setAmount] = useState<string>(initialData?.amount?.toString() || "");
  const [returnAmount, setReturnAmount] = useState<string>(initialData?.returnAmount?.toString() || "");
  const [status, setStatus] = useState<"ACTIVE" | "COMPLETED" | "OVERDUE">(initialData?.status || "ACTIVE");

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (type === "FIX" && amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount) && numAmount > 0) {
        const suggested = Math.round(numAmount * 1.3);
        setReturnAmount(suggested.toString());
      }
    }
  }, [type, amount]);

  const validateField = (name: string, value: string) => {
    let err = "";
    if (name === "investorName" && !value.trim()) {
      err = "Investor name is required.";
    } else if (name === "mobileNo") {
      const cleanVal = value.replace(/\s+/g, "");
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!cleanVal) {
        err = "Mobile number is required.";
      } else if (!mobileRegex.test(cleanVal)) {
        err = "Enter a valid 10-digit mobile number (starts with 6-9).";
      }
    } else if (name === "investmentDate" && !value) {
      err = "Investment date is required.";
    } else if (name === "returnDate") {
      if (!value) {
        err = "Return date is required.";
      } else if (investmentDate && new Date(value) <= new Date(investmentDate)) {
        err = "Return date must be after investment date.";
      }
    } else if (name === "amount") {
      const num = parseFloat(value);
      if (!value) {
        err = "Investment amount is required.";
      } else if (isNaN(num) || num <= 0) {
        err = "Investment amount must be greater than 0.";
      }
    } else if (name === "returnAmount") {
      const num = parseFloat(value);
      if (!value) {
        err = "Expected return amount is required.";
      } else if (isNaN(num) || num <= 0) {
        err = "Return amount must be greater than 0.";
      }
    }
    setErrors((prev) => ({ ...prev, [name]: err }));
    return !err;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    validateField(e.target.name, e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isNameValid = validateField("investorName", investorName);
    const isMobileValid = validateField("mobileNo", mobileNo);
    const isInvDateValid = validateField("investmentDate", investmentDate);
    const isRetDateValid = validateField("returnDate", returnDate);
    const isAmountValid = validateField("amount", amount);
    const isReturnValid = validateField("returnAmount", returnAmount);

    if (!isNameValid || !isMobileValid || !isInvDateValid || !isRetDateValid || !isAmountValid || !isReturnValid) {
      return;
    }

    setIsPending(true);
    setServerError(null);

    const formData = new FormData();
    formData.append("slot_type", type);
    formData.append("investor_name", investorName);
    formData.append("mobile_no", mobileNo);
    formData.append("investment_date", investmentDate);
    formData.append("return_date", returnDate);
    formData.append("amount", amount);
    formData.append("return_amount", returnAmount);
    formData.append("status", status);

    try {
      const result = await onSubmitAction(formData);
      if (result && result.error) {
        setServerError(result.error);
        setIsPending(false);
      }
    } catch (err: any) {
      setServerError("An unexpected error occurred. Please try again.");
      setIsPending(false);
    }
  };

  const profit = amount && returnAmount ? parseFloat(returnAmount) - parseFloat(amount) : 0;
  const roi = amount && profit ? (profit / parseFloat(amount)) * 100 : 0;

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="transition-all duration-200 active:scale-95 hover:opacity-80 text-primary cursor-pointer flex items-center"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-base font-bold text-primary">
            {isEditing ? "Edit Investment Slot" : "Add Investment Slot"}
          </h1>
        </div>
      </header>

      <main className="pt-20 px-4 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6" id="slotForm">
          {serverError && (
            <div className="p-4 rounded-xl bg-error/15 border border-error/30 text-sm text-error font-medium">
              {serverError}
            </div>
          )}

          <div className="space-y-3">
            <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant px-1">
              Slot Type
            </label>
            <div className="glass-panel p-1 rounded-xl flex gap-1">
              <button
                type="button"
                onClick={() => setType("FIX")}
                className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 cursor-pointer text-xs uppercase tracking-wider ${
                  type === "FIX"
                    ? "bg-primary-container text-on-primary-container shadow-md"
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                FIX
              </button>
              <button
                type="button"
                onClick={() => setType("NON_FIX")}
                className={`flex-1 py-3 rounded-lg font-bold transition-all duration-300 cursor-pointer text-xs uppercase tracking-wider ${
                  type === "NON_FIX"
                    ? "bg-primary-container text-on-primary-container shadow-md"
                    : "text-on-surface-variant hover:bg-white/5"
                }`}
              >
                NON-FIX
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-5">
            <div className="space-y-2">
              <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                Investor Name
              </label>
              <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.investorName ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                <span className="material-symbols-outlined pl-3 text-on-surface-variant text-[20px]">person</span>
                <input
                  name="investorName"
                  value={investorName}
                  onChange={(e) => setInvestorName(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] text-sm focus:outline-none"
                  placeholder="Enter name"
                  required
                />
              </div>
              {errors.investorName && (
                <p className="text-xs text-error font-medium ml-1">{errors.investorName}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                Mobile Number
              </label>
              <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.mobileNo ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                <span className="material-symbols-outlined pl-3 text-on-surface-variant text-[20px]">call</span>
                <input
                  name="mobileNo"
                  type="tel"
                  value={mobileNo}
                  onChange={(e) => setMobileNo(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] text-sm focus:outline-none"
                  placeholder="Enter mobile number"
                  required
                />
              </div>
              {errors.mobileNo && (
                <p className="text-xs text-error font-medium ml-1">{errors.mobileNo}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                  Inv. Date
                </label>
                <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.investmentDate ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                  <input
                    name="investmentDate"
                    type="date"
                    value={investmentDate}
                    onChange={(e) => setInvestmentDate(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] text-sm focus:outline-none text-center"
                    required
                  />
                </div>
                {errors.investmentDate && (
                  <p className="text-xs text-error font-medium ml-1">{errors.investmentDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                  Return Date
                </label>
                <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.returnDate ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                  <input
                    name="returnDate"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    onBlur={handleBlur}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] text-sm focus:outline-none text-center"
                    required
                  />
                </div>
                {errors.returnDate && (
                  <p className="text-xs text-error font-medium ml-1">{errors.returnDate}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                Investment Amount (₹)
              </label>
              <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.amount ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                <span className="pl-4 text-primary font-bold text-base">₹</span>
                <input
                  name="amount"
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] font-bold text-base focus:outline-none"
                  required
                />
              </div>
              {errors.amount && (
                <p className="text-xs text-error font-medium ml-1">{errors.amount}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                Expected Return (₹) {type === "FIX" && <span className="text-primary text-[10px] font-bold ml-1">(+30% Suggested)</span>}
              </label>
              <div className={`relative flex items-center bg-black/25 rounded-xl border ${errors.returnAmount ? 'border-error/50' : 'border-white/5'} transition-all input-focus-effect`}>
                <span className="pl-4 text-secondary font-bold text-base">₹</span>
                <input
                  name="returnAmount"
                  type="number"
                  placeholder="0"
                  value={returnAmount}
                  onChange={(e) => setReturnAmount(e.target.value)}
                  onBlur={handleBlur}
                  className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] font-bold text-base focus:outline-none"
                  required
                />
              </div>
              {errors.returnAmount && (
                <p className="text-xs text-error font-medium ml-1">{errors.returnAmount}</p>
              )}
            </div>

            {isEditing && (
              <div className="space-y-2">
                <label className="font-label-uppercase text-[11px] uppercase tracking-wider font-bold text-on-surface-variant block ml-1">
                  Status
                </label>
                <div className="relative flex items-center bg-black/25 rounded-xl border border-white/5 transition-all input-focus-effect">
                  <span className="material-symbols-outlined pl-3 text-on-surface-variant text-[20px]">info</span>
                  <select
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-transparent border-none focus:ring-0 text-on-surface py-3 px-3 min-h-[48px] text-sm focus:outline-none appearance-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="OVERDUE">OVERDUE</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {profit > 0 && (
            <div className="glass-panel rounded-2xl p-5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
              <div className="relative z-10 space-y-2">
                <h3 className="font-headline-sm text-xs font-semibold text-on-surface">
                  Technical Return Summary
                </h3>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Net Profit margin:</span>
                  <span className="text-primary font-bold">{formatCurrency(profit)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant">Projected ROI:</span>
                  <span className="text-secondary font-bold">{roi.toFixed(1)}%</span>
                </div>
                <div className="pt-2 flex items-center gap-2">
                  <div className="h-1 flex-1 bg-surface-container-highest rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                      style={{ width: `${Math.min(roi, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] font-bold text-primary uppercase">Calculated</span>
                </div>
              </div>
            </div>
          )}
        </form>
      </main>

      <div className="fixed bottom-0 w-full p-4 bg-gradient-to-t from-surface via-surface/95 to-transparent pt-10 z-30">
        <button
          type="submit"
          form="slotForm"
          disabled={isPending}
          className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 h-14 bg-primary-container text-on-primary-container font-bold rounded-xl shadow-[0_8px_24px_rgba(34,201,122,0.3)] hover:scale-[1.01] active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-75"
        >
          {isPending ? (
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          ) : (
            <>
              <span className="material-symbols-outlined text-[20px]">save</span>
              Save Investment Slot
            </>
          )}
        </button>
      </div>
    </div>
  );
}
