import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ManageSlotsClient from "@/components/ManageSlotsClient";

export const revalidate = 0;

export default async function ManageSlotsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  await dbConnect();

  const rawSlots = await Slot.find({}).sort({ returnDate: 1 }).lean();

  const slots = rawSlots.map((s: any) => ({
    id: s._id.toString(),
    type: s.type,
    quantity: s.quantity ?? 1,
    investorName: s.investorName,
    mobileNo: s.mobileNo,
    investmentDate: s.investmentDate.toISOString(),
    returnDate: s.returnDate.toISOString(),
    amount: s.amount,
    returnAmount: s.returnAmount,
    status: s.status,
  }));

  return <ManageSlotsClient slots={slots} />;
}
