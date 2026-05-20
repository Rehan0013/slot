"use server";

import { revalidatePath } from "next/cache";
import dbConnect from "@/lib/db";
import Payment from "@/models/Payment";
import Slot from "@/models/Slot";
import { getSession } from "@/lib/session";

export async function addPayment(
  slotId: string,
  type: "TDS" | "BOOKING",
  amount: number,
  paidAtStr: string,
  note?: string
) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  if (!slotId || !type || !amount || !paidAtStr) {
    return { error: "All fields are required." };
  }

  if (amount <= 0) {
    return { error: "Amount must be greater than 0." };
  }

  const paidAt = new Date(paidAtStr);
  if (isNaN(paidAt.getTime())) {
    return { error: "Please enter a valid date." };
  }

  try {
    await dbConnect();
    const slot = await Slot.findById(slotId);
    if (!slot) {
      return { error: "Slot not found." };
    }

    const newPayment = new Payment({
      slotId,
      type,
      amount,
      paidAt,
      note: note || undefined,
    });

    await newPayment.save();
  } catch (err: any) {
    console.error("Add payment error:", err);
    return { error: "Failed to add payment. Please try again." };
  }

  revalidatePath("/");
  revalidatePath(`/slots/${slotId}`);
  return { success: true };
}

export async function deletePayment(paymentId: string, slotId: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  try {
    await dbConnect();
    await Payment.findByIdAndDelete(paymentId);
  } catch (err: any) {
    console.error("Delete payment error:", err);
    return { error: "Failed to delete payment." };
  }

  revalidatePath("/");
  revalidatePath(`/slots/${slotId}`);
  return { success: true };
}
