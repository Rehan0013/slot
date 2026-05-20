import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { updateSlot } from "@/app/actions/slots";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import SlotForm from "@/components/SlotForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const { id } = await params;

  await dbConnect();
  const slot = await Slot.findById(id).lean();

  if (!slot) {
    notFound();
  }

  const initialData = {
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

  const updateSlotWithId = updateSlot.bind(null, id);

  return (
    <SlotForm
      initialData={initialData}
      onSubmitAction={updateSlotWithId}
      isEditing
    />
  );
}
