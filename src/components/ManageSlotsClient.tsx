"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";
import { deleteSlot } from "@/app/actions/slots";

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

export default function ManageSlotsClient({ slots }: { slots: SlotData[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [slotToDelete, setSlotToDelete] = useState<SlotData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredSlots = useMemo(() => {
    const s = search.toLowerCase().trim();
    if (!s) return slots;
    return slots.filter(
      (slot) =>
        slot.investorName.toLowerCase().includes(s) || slot.mobileNo.includes(s)
    );
  }, [search, slots]);

  const handleDelete = async () => {
    if (!slotToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSlot(slotToDelete.id);
      setSlotToDelete(null);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-background text-on-surface font-dm-sans min-h-screen pb-32">
      <div className="bg-mesh"></div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl border-b border-white/10 shadow-sm flex items-center justify-between px-4 h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/settings")}
            className="transition-all duration-200 active:scale-95 hover:opacity-80 p-2 text-primary cursor-pointer flex items-center"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="font-headline-sm text-base font-bold text-primary">Manage Slots</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-md mx-auto">
        <div className="glass-card rounded-2xl p-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or mobile no..."
              className="w-full bg-surface-container/50 border border-outline-variant/30 text-on-surface rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-on-surface-variant/50"
            />
          </div>
        </div>

        <section className="space-y-4">
          <h2 className="font-sora text-sm font-semibold flex items-center gap-2 text-on-surface">
            <span className="w-1 h-5 bg-primary rounded-full"></span>
            Search Results ({filteredSlots.length})
          </h2>

          {filteredSlots.length === 0 ? (
            <div className="glass-card rounded-2xl p-8 text-center text-on-surface-variant font-medium">
              <span className="material-symbols-outlined text-[48px] text-outline-variant mb-2">
                search_off
              </span>
              <p>No slots found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSlots.map((slot) => (
                <div key={slot.id} className="glass-card rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-sora text-sm font-semibold text-on-surface">{slot.investorName}</p>
                      <p className="text-xs text-on-surface-variant">{slot.mobileNo}</p>
                    </div>
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                      slot.status === "COMPLETED"
                        ? "bg-on-surface-variant/10 text-on-surface-variant border border-outline-variant/30"
                        : slot.status === "OVERDUE"
                        ? "bg-error/20 text-error border border-error/30"
                        : "bg-primary/20 text-primary border border-primary/30"
                    }`}>
                      {slot.status}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs text-on-surface-variant border-b border-outline-variant/10 pb-3">
                    <p>{formatCurrency(slot.amount)} &rarr; {formatCurrency(slot.returnAmount)}</p>
                    <p>{formatDate(slot.investmentDate)}</p>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Link
                      href={`/slots/${slot.id}/edit`}
                      className="h-9 px-4 rounded-lg border border-primary/30 text-primary font-bold text-[10px] uppercase tracking-wider hover:bg-primary/10 active:scale-95 transition-all flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                      Edit
                    </Link>
                    <button
                      onClick={() => setSlotToDelete(slot)}
                      className="h-9 px-4 rounded-lg bg-error/15 text-error border border-error/30 font-bold text-[10px] uppercase tracking-wider hover:bg-error/25 active:scale-95 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Delete Confirmation Modal */}
      {slotToDelete && (
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
                You are about to delete <strong>{slotToDelete.investorName}</strong>'s slot. This action is permanent and cannot be undone. All recorded payments associated with this slot will be permanently deleted.
              </p>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setSlotToDelete(null)}
                  disabled={isDeleting}
                  className="h-10 px-4 rounded-xl border border-outline-variant/30 text-on-surface-variant font-bold text-xs uppercase tracking-wider hover:bg-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="h-10 px-4 rounded-xl bg-error text-on-error font-bold text-xs uppercase tracking-wider hover:bg-error/95 active:scale-95 shadow-md shadow-error/15 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? (
                    <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                  ) : (
                    "Delete Permanently"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
