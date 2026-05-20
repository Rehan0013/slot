import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import Payment from "@/models/Payment";
import BottomNav from "@/components/BottomNav";
import { formatCurrency } from "@/lib/utils";
import CapitalFlowChart from "@/components/CapitalFlowChart";

export const revalidate = 0;

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await dbConnect();
  const slots = await Slot.find().lean();
  const payments = await Payment.find().lean();

  const serializedSlots = slots.map((s: any) => ({
    id: s._id.toString(),
    investmentDate: s.investmentDate.toISOString(),
    returnDate: s.returnDate.toISOString(),
    amount: s.amount,
    returnAmount: s.returnAmount,
  }));

  const totalInvested = slots.reduce((sum, s) => sum + s.amount, 0);
  const totalReturn = slots.reduce((sum, s) => sum + s.returnAmount, 0);
  const totalProfit = totalReturn - totalInvested;

  const fixCount = slots.filter((s) => s.type === "FIX").length;
  const nonFixCount = slots.filter((s) => s.type === "NON_FIX").length;

  const activeCount = slots.filter((s) => s.status === "ACTIVE").length;
  const completedCount = slots.filter((s) => s.status === "COMPLETED").length;
  const overdueCount = slots.filter((s) => s.status === "OVERDUE").length;

  const totalTdsCollected = payments.filter((p) => p.type === "TDS").reduce((sum, p) => sum + p.amount, 0);
  const totalBookingCollected = payments.filter((p) => p.type === "BOOKING").reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm flex justify-between items-center w-full px-4 h-16">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">monitoring</span>
          <h1 className="font-sora text-base font-extrabold text-primary tracking-tight">
            ANALYTICS & METRICS
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-sora text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Portfolio Performance
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase">ROI Margin</p>
              <div className="flex justify-between items-baseline mt-1">
                <span className="text-xl font-bold text-primary">
                  {totalInvested > 0 ? ((totalProfit / totalInvested) * 100).toFixed(1) : 0}%
                </span>
                <span className="text-xs text-on-surface-variant">
                  {formatCurrency(totalProfit)} net profit
                </span>
              </div>
            </div>
            <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary" style={{ width: "30%" }}></div>
            </div>
          </div>
        </section>

        {/* Capital Flow Graph */}
        <CapitalFlowChart slots={serializedSlots} />

        <section className="grid grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase">FIX Slots</p>
            <p className="font-sora text-2xl font-bold text-primary mt-2">{fixCount}</p>
            <span className="text-[10px] text-on-surface-variant mt-1">slots recorded</span>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase">NON-FIX Slots</p>
            <p className="font-sora text-2xl font-bold text-secondary mt-2">{nonFixCount}</p>
            <span className="text-[10px] text-on-surface-variant mt-1">slots recorded</span>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-sora text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Status Overview
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-primary font-bold">Active</span>
              <span className="text-on-surface font-semibold">{activeCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-on-surface-variant font-bold">Completed</span>
              <span className="text-on-surface font-semibold">{completedCount}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-error font-bold">Overdue</span>
              <span className="text-on-surface font-semibold">{overdueCount}</span>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-5 space-y-4">
          <h3 className="font-sora text-sm font-semibold text-on-surface flex items-center gap-2">
            <span className="w-1 h-5 bg-secondary rounded-full"></span>
            Collected Fees Summary
          </h3>
          <div className="grid grid-cols-2 gap-2 text-center pt-2">
            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase">Total TDS</p>
              <p className="font-bold text-sm text-primary mt-1">{formatCurrency(totalTdsCollected)}</p>
            </div>
            <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <p className="text-[9px] font-bold text-on-surface-variant uppercase">Total Booking</p>
              <p className="font-bold text-sm text-secondary mt-1">{formatCurrency(totalBookingCollected)}</p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
