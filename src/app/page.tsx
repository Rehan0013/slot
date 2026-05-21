import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import Payment from "@/models/Payment";
import Dashboard from "../components/Dashboard";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export const revalidate = 0;

export default async function Page() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await dbConnect();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Synchronize status with dates
  await Slot.updateMany(
    { status: "ACTIVE", returnDate: { $lt: today } },
    { $set: { status: "OVERDUE" } }
  );

  await Slot.updateMany(
    { status: "OVERDUE", returnDate: { $gte: today } },
    { $set: { status: "ACTIVE" } }
  );

  const rawSlots = await Slot.find({}).sort({ returnDate: 1 }).lean();
  const rawPayments = await Payment.find({}).lean();

  const slots = rawSlots.map((s: any) => {
    const slotId = s._id.toString();
    const tdsPaid = rawPayments
      .filter((p: any) => p.slotId.toString() === slotId && p.type === "TDS")
      .reduce((sum: number, p: any) => sum + p.amount, 0);

    return {
      id: slotId,
      type: s.type,
      quantity: s.quantity ?? 1,
      investorName: s.investorName,
      mobileNo: s.mobileNo,
      investmentDate: s.investmentDate.toISOString(),
      returnDate: s.returnDate.toISOString(),
      amount: s.amount,
      returnAmount: s.returnAmount - tdsPaid,
      status: s.status,
    };
  });

  const payments = rawPayments.map((p: any) => ({
    id: p._id.toString(),
    slotId: p.slotId.toString(),
    type: p.type,
    amount: p.amount,
    paidAt: p.paidAt.toISOString(),
    note: p.note || "",
  }));

  return <Dashboard slots={slots} payments={payments} />;
}
