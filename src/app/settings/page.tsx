import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import BottomNav from "@/components/BottomNav";
import SettingsClient from "@/components/SettingsClient";

export const revalidate = 0;

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      <header className="sticky top-0 z-50 bg-surface-container/80 backdrop-blur-lg border-b border-outline-variant/20 shadow-sm flex justify-between items-center w-full px-4 h-16">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">settings</span>
          <h1 className="font-sora text-base font-extrabold text-primary tracking-tight">
            APP SETTINGS
          </h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/15">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xl font-bold font-sora">
              {((session?.name || session?.username) as string)?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <p className="font-sora text-sm font-semibold text-on-surface uppercase">
                {(session?.name || session?.username) as string}
              </p>
              <p className="text-[10px] text-on-surface-variant font-medium">
                System Administrator
              </p>
            </div>
          </div>

          <SettingsClient />
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
