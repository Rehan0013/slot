import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";

export const revalidate = 0;

export default async function WelcomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const name: string = (session.name as string) || (session.username as string) || "User";
  const firstName = name.split(" ")[0];

  // Fetch quick stats
  await dbConnect();
  const slots = await Slot.find({}).lean() as any[];
  const totalSlots = slots.length;
  const activeSlots = slots.filter((s: any) => s.status === "ACTIVE").length;
  const totalInvested = slots.reduce((sum: number, s: any) => sum + s.amount, 0);
  const totalReturn = slots.reduce((sum: number, s: any) => sum + s.returnAmount, 0);
  const totalProfit = totalReturn - totalInvested;

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val}`;
  };

  // Greeting based on time of day (IST offset = UTC+5:30)
  const nowUTC = Date.now();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const hourIST = new Date(nowUTC + istOffset).getUTCHours();
  const greeting =
    hourIST < 12 ? "Good Morning" : hourIST < 17 ? "Good Afternoon" : "Good Evening";

  const stats = [
    {
      icon: "account_balance_wallet",
      label: "Total Invested",
      value: formatCurrency(totalInvested),
      color: "text-secondary",
      bg: "bg-secondary/10 border-secondary/20",
    },
    {
      icon: "trending_up",
      label: "Expected Return",
      value: formatCurrency(totalReturn),
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      icon: "savings",
      label: "Total Profit",
      value: formatCurrency(totalProfit),
      color: "text-primary",
      bg: "bg-primary/10 border-primary/20",
    },
    {
      icon: "bar_chart",
      label: "Active Slots",
      value: `${activeSlots} / ${totalSlots}`,
      color: "text-tertiary",
      bg: "bg-tertiary/10 border-tertiary/20",
    },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-background text-on-surface">
      {/* Ambient mesh */}
      <div className="bg-mesh" />

      {/* Decorative blobs */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-10%] left-[-5%] w-96 h-96 rounded-full bg-primary/10 blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-secondary/10 blur-[120px] opacity-60" />
      </div>

      <main className="relative z-10 w-full max-w-lg flex flex-col items-center gap-8">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-3xl bg-primary-container/15 border border-primary/25 flex items-center justify-center shadow-[0_0_40px_rgba(34,201,122,0.15)]">
            <span className="material-symbols-outlined text-primary text-[40px]">
              account_balance_wallet
            </span>
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            Slot Tracker
          </p>
        </div>

        {/* Greeting card */}
        <div className="glass-card w-full rounded-3xl p-8 text-center relative overflow-hidden">
          {/* Card glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-on-surface-variant">
              {greeting}
            </p>
            <h1 className="font-sora text-4xl font-extrabold text-on-surface leading-tight">
              Welcome back,<br />
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {firstName}!
              </span>
            </h1>
            <p className="text-sm text-on-surface-variant pt-1">
              Your investment portfolio is ready for you.
            </p>
          </div>
        </div>

        {/* Quick stats grid */}
        {totalSlots > 0 && (
          <div className="w-full grid grid-cols-2 gap-3">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className={`glass-card rounded-2xl p-4 border ${stat.bg} flex flex-col gap-2`}
              >
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-[18px] ${stat.color}`}>
                    {stat.icon}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    {stat.label}
                  </span>
                </div>
                <p className={`font-sora text-xl font-extrabold ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* CTA buttons */}
        <div className="w-full flex flex-col gap-3">
          <Link
            href="/"
            className="w-full h-14 rounded-2xl btn-primary-finance font-bold text-base flex items-center justify-center gap-2 shadow-[0_8px_24px_rgba(34,201,122,0.25)] transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            Go to Dashboard
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/slots/new"
              className="h-12 rounded-xl glass-card border border-primary/20 text-primary font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-primary/5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              New Slot
            </Link>
            <Link
              href="/activity"
              className="h-12 rounded-xl glass-card border border-secondary/20 text-secondary font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-secondary/5 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">timeline</span>
              Activity
            </Link>
          </div>
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-on-surface-variant/50 text-center">
          Logged in as <span className="font-bold text-on-surface-variant">{session.name as string}</span>
        </p>
      </main>
    </div>
  );
}
