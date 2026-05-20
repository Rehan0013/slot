import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import Payment from "@/models/Payment";
import SlotDetails from "../../../components/SlotDetails";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const revalidate = 0;

export default async function Page({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  await dbConnect();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rawSlotBeforeSync = await Slot.findById(id).lean();
  if (rawSlotBeforeSync && rawSlotBeforeSync.status !== "COMPLETED") {
    const returnDate = new Date(rawSlotBeforeSync.returnDate);
    returnDate.setHours(0, 0, 0, 0);
    const newStatus = today > returnDate ? "OVERDUE" : "ACTIVE";
    if (rawSlotBeforeSync.status !== newStatus) {
      await Slot.findByIdAndUpdate(id, { $set: { status: newStatus } });
    }
  }

  const slot = await Slot.findById(id).lean();
  if (!slot) {
    notFound();
  }

  const rawPayments = await Payment.find({ slotId: id }).sort({ paidAt: -1 }).lean();

  const formattedSlot = {
    id: slot._id.toString(),
    type: slot.type as "FIX" | "NON_FIX",
    investorName: slot.investorName,
    mobileNo: slot.mobileNo,
    investmentDate: slot.investmentDate.toISOString(),
    returnDate: slot.returnDate.toISOString(),
    amount: slot.amount,
    returnAmount: slot.returnAmount,
    status: slot.status as "ACTIVE" | "COMPLETED" | "OVERDUE",
  };

  const payments = rawPayments.map((p: any) => ({
    id: p._id.toString(),
    slotId: p.slotId.toString(),
    type: p.type as "TDS" | "BOOKING",
    amount: p.amount,
    paidAt: p.paidAt.toISOString(),
    note: p.note || "",
  }));

  return <SlotDetails slot={formattedSlot} payments={payments} />;
}
