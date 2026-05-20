import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import Payment from "@/models/Payment";
import ActivityDashboard from "@/components/ActivityDashboard";

export const revalidate = 0;

export default async function ActivityPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await dbConnect();
  const rawSlots = await Slot.find().lean();
  const rawPayments = await Payment.find().lean();

  const slots = rawSlots.map((s: any) => ({
    id: s._id.toString(),
    type: s.type,
    investorName: s.investorName,
    mobileNo: s.mobileNo,
    investmentDate: s.investmentDate.toISOString(),
    returnDate: s.returnDate.toISOString(),
    amount: s.amount,
    returnAmount: s.returnAmount,
    status: s.status,
  }));

  const payments = rawPayments.map((p: any) => ({
    id: p._id.toString(),
    slotId: p.slotId.toString(),
    type: p.type,
    amount: p.amount,
    paidAt: p.paidAt.toISOString(),
    note: p.note || "",
  }));

  return <ActivityDashboard slots={slots} payments={payments} />;
}
