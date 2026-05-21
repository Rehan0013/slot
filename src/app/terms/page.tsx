import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import Link from "next/link";

export const revalidate = 0;

export default async function TermsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm flex items-center gap-3 w-full px-4 h-16">
        <Link
          href="/settings"
          className="transition-all duration-200 active:scale-95 hover:opacity-80 text-primary flex items-center"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-sora text-base font-extrabold text-primary tracking-tight">
          TERMS &amp; CONDITIONS
        </h1>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">

        {/* Hero Banner */}
        <section className="glass-card rounded-2xl p-6 relative overflow-hidden text-center">
          <div className="absolute -left-10 -top-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-secondary/10 rounded-full blur-3xl" />
          <div className="relative z-10 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
              Official Document
            </p>
            <h2 className="font-sora text-2xl font-extrabold text-on-surface">
              Prospectus of Trade
            </h2>
            <p className="font-sora text-sm font-semibold text-primary mt-1">
              Fix &amp; Non-Fix Trading
            </p>
          </div>
        </section>

        {/* General Terms */}
        <section className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">gavel</span>
            </div>
            <h3 className="font-sora text-base font-bold text-on-surface">Terms &amp; Conditions</h3>
          </div>

          <ol className="space-y-3">
            {[
              "There are 15 slots in every 15 days.",
              "Each slot is of ₹10,000 (Ten Thousand Rupees).",
              "It gives the profit according to slots came in a month.",
              "Profit always depends on trade and with 60, 90, 120 days return policy.",
              "There are two slots in a month — Fix slot and Non-Fix slot.",
            ].map((point, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/15 border border-primary/25 text-primary text-[11px] font-extrabold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-on-surface leading-relaxed">{point}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Fix Slot */}
        <section className="glass-card rounded-2xl p-5 space-y-4 border border-primary/20">
          <div className="absolute inset-0 rounded-2xl pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
            </div>
            <h3 className="font-sora text-base font-bold text-primary">Fix Slot</h3>
            <span className="ml-auto px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider bg-primary/15 border border-primary/25 text-primary">
              Guaranteed
            </span>
          </div>

          <ul className="space-y-3">
            {[
              { icon: "event_repeat", text: "The fix slot occurs twice a month: on the 1st and the 15th day of month." },
              { icon: "confirmation_number", text: "If you want to book a slot, you will be charged ₹370 per slot." },
              { icon: "receipt_long", text: "Once you earn a profit, a TDS charge of ₹170 will be deducted from your profit amount." },
              { icon: "trending_up", text: "The slot is fix, and the profit ranges between ₹2K and ₹5K." },
              { icon: "info", text: "The exact profit amount you receive from the fix slot will depend on your total slot investment." },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-primary/70 text-[18px] mt-0.5 flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-on-surface leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>

          {/* Fix slot amounts pill */}
          <div className="flex gap-3 pt-1">
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Booking Fee</p>
              <p className="font-sora text-lg font-extrabold text-primary">₹370</p>
              <p className="text-[10px] text-on-surface-variant">per slot</p>
            </div>
            <div className="flex-1 bg-error/10 border border-error/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-error/70 uppercase tracking-wider">TDS Deduction</p>
              <p className="font-sora text-lg font-extrabold text-error">₹170</p>
              <p className="text-[10px] text-on-surface-variant">from profit</p>
            </div>
            <div className="flex-1 bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-secondary/70 uppercase tracking-wider">Profit Range</p>
              <p className="font-sora text-lg font-extrabold text-secondary">₹2K–5K</p>
              <p className="text-[10px] text-on-surface-variant">per slot</p>
            </div>
          </div>
        </section>

        {/* Non-Fix Slot */}
        <section className="glass-card rounded-2xl p-5 space-y-4 border border-secondary/20">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/15 border border-secondary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-secondary text-[18px]">show_chart</span>
            </div>
            <h3 className="font-sora text-base font-bold text-secondary">Non-Fix Slot</h3>
            <span className="ml-auto px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider bg-secondary/15 border border-secondary/25 text-secondary">
              Market-Based
            </span>
          </div>

          <ul className="space-y-3">
            {[
              { icon: "event_repeat", text: "The non-fixed slot also occurs twice a month, on the 1st and the 15th day of month." },
              { icon: "confirmation_number", text: "If you want to book a slot, you will be charged ₹500 per slot." },
              { icon: "receipt_long", text: "Once you earn a profit, a TDS charge of ₹270 will be deducted from your profit amount." },
              { icon: "candlestick_chart", text: "The slot is non fix, it depends on market." },
              { icon: "trending_up", text: "This slot starts from ₹7K and goes up to ₹20K." },
              { icon: "warning", text: "Unlike the fix slot, there is no guaranteed profit with non-fix." },
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary/70 text-[18px] mt-0.5 flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-on-surface leading-relaxed">{item.text}</p>
              </li>
            ))}
          </ul>

          {/* Non-Fix slot amounts pill */}
          <div className="flex gap-3 pt-1">
            <div className="flex-1 bg-secondary/10 border border-secondary/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-secondary/70 uppercase tracking-wider">Booking Fee</p>
              <p className="font-sora text-lg font-extrabold text-secondary">₹500</p>
              <p className="text-[10px] text-on-surface-variant">per slot</p>
            </div>
            <div className="flex-1 bg-error/10 border border-error/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-error/70 uppercase tracking-wider">TDS Deduction</p>
              <p className="font-sora text-lg font-extrabold text-error">₹270</p>
              <p className="text-[10px] text-on-surface-variant">from profit</p>
            </div>
            <div className="flex-1 bg-primary/10 border border-primary/20 rounded-xl p-3 text-center">
              <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">Profit Range</p>
              <p className="font-sora text-lg font-extrabold text-primary">₹7K–20K</p>
              <p className="text-[10px] text-on-surface-variant">per slot</p>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant/15 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">compare</span>
            <h3 className="font-sora text-sm font-bold text-on-surface">Slot Comparison</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-container-high/40">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
                    Detail
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-primary">
                    Fix Slot
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-wider text-secondary">
                    Non-Fix Slot
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {[
                  { label: "Slot Value", fix: "₹10,000", nonfix: "₹10,000" },
                  { label: "Booking Fee", fix: "₹370", nonfix: "₹500" },
                  { label: "TDS Charge", fix: "₹170", nonfix: "₹270" },
                  { label: "Profit Range", fix: "₹2K – ₹5K", nonfix: "₹7K – ₹20K" },
                  { label: "Guaranteed", fix: "Yes", nonfix: "No" },
                  { label: "Depends On", fix: "Fixed Plan", nonfix: "Market" },
                  { label: "Occurs", fix: "1st & 15th", nonfix: "1st & 15th" },
                ].map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-black/10" : ""}>
                    <td className="px-4 py-3 text-[11px] font-semibold text-on-surface-variant">{row.label}</td>
                    <td className="px-4 py-3 text-center text-[12px] font-bold text-primary">{row.fix}</td>
                    <td className="px-4 py-3 text-center text-[12px] font-bold text-secondary">{row.nonfix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="glass-card rounded-2xl p-5 border border-error/15 space-y-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-error text-[18px]">warning</span>
            <h3 className="font-sora text-sm font-bold text-error">Disclaimer</h3>
          </div>
          <p className="text-xs text-on-surface-variant leading-relaxed">
            All investments are subject to market risks. Profit from Non-Fix slots is not guaranteed and depends entirely on market conditions. Please read all terms carefully and invest responsibly. This document serves as the official prospectus of trade.
          </p>
        </section>

      </main>
    </div>
  );
}
