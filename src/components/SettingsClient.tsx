"use client";

import { useTheme } from "next-themes";
import { logoutUser } from "@/app/actions/auth";

export default function SettingsClient() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-4 pt-2">
      <div className="flex justify-between items-center">
        <div className="space-y-0.5">
          <p className="text-xs font-bold text-on-surface-variant uppercase">Dark Mode</p>
          <p className="text-[10px] text-on-surface-variant/75">Toggle visual interface colors</p>
        </div>
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-10 h-10 bg-surface-container-highest border border-outline-variant/20 hover:bg-surface-variant text-on-surface p-2 rounded-full flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>

      <button
        onClick={() => logoutUser()}
        className="w-full h-12 mt-6 bg-error/15 hover:bg-error/20 border border-error/30 text-error font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
      >
        <span className="material-symbols-outlined text-[18px]">logout</span>
        Log Out Session
      </button>
    </div>
  );
}
