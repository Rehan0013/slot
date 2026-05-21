"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import dbConnect from "@/lib/db";
import Slot from "@/models/Slot";
import Payment from "@/models/Payment";
import { getSession } from "@/lib/session";

export async function createSlot(formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const type = formData.get("slot_type") as "FIX" | "NON_FIX";
  const investorName = formData.get("investor_name") as string;
  const mobileNo = formData.get("mobile_no") as string;
  const investmentDateStr = formData.get("investment_date") as string;
  const returnDateStr = formData.get("return_date") as string;
  const amountStr = formData.get("amount") as string;
  const returnAmountStr = formData.get("return_amount") as string;
  const quantityStr = formData.get("quantity") as string;

  if (!type || !investorName || !mobileNo || !investmentDateStr || !returnDateStr || !amountStr || !returnAmountStr) {
    return { error: "All fields are required." };
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobileNo.replace(/\s+/g, ""))) {
    return { error: "Please enter a valid 10-digit mobile number." };
  }

  const investmentDate = new Date(investmentDateStr);
  const returnDate = new Date(returnDateStr);

  if (isNaN(investmentDate.getTime()) || isNaN(returnDate.getTime())) {
    return { error: "Please enter valid dates." };
  }

  if (returnDate <= investmentDate) {
    return { error: "Return date must be after investment date." };
  }

  const amount = parseFloat(amountStr);
  const returnAmount = parseFloat(returnAmountStr);
  const quantity = quantityStr ? parseInt(quantityStr, 10) : 1;

  if (isNaN(amount) || amount <= 0) {
    return { error: "Investment amount must be greater than 0." };
  }

  if (isNaN(returnAmount) || returnAmount <= 0) {
    return { error: "Return amount must be greater than 0." };
  }

  if (isNaN(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }

  let status: "ACTIVE" | "COMPLETED" | "OVERDUE" = "ACTIVE";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const returnDateOnly = new Date(returnDate);
  returnDateOnly.setHours(0, 0, 0, 0);

  if (today > returnDateOnly) {
    status = "OVERDUE";
  }

  try {
    await dbConnect();
    const newSlot = new Slot({
      type,
      quantity,
      investorName,
      mobileNo,
      investmentDate,
      returnDate,
      amount,
      returnAmount,
      status,
    });

    await newSlot.save();
  } catch (err: any) {
    console.error("Create slot error:", err);
    return { error: "Failed to create investment slot. Please try again." };
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateSlot(id: string, formData: FormData) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  const type = formData.get("slot_type") as "FIX" | "NON_FIX";
  const investorName = formData.get("investor_name") as string;
  const mobileNo = formData.get("mobile_no") as string;
  const investmentDateStr = formData.get("investment_date") as string;
  const returnDateStr = formData.get("return_date") as string;
  const amountStr = formData.get("amount") as string;
  const returnAmountStr = formData.get("return_amount") as string;
  const statusInput = formData.get("status") as "ACTIVE" | "COMPLETED" | "OVERDUE";
  const quantityStr = formData.get("quantity") as string;

  if (!type || !investorName || !mobileNo || !investmentDateStr || !returnDateStr || !amountStr || !returnAmountStr) {
    return { error: "All fields are required." };
  }

  const mobileRegex = /^[6-9]\d{9}$/;
  if (!mobileRegex.test(mobileNo.replace(/\s+/g, ""))) {
    return { error: "Please enter a valid 10-digit mobile number." };
  }

  const investmentDate = new Date(investmentDateStr);
  const returnDate = new Date(returnDateStr);

  if (isNaN(investmentDate.getTime()) || isNaN(returnDate.getTime())) {
    return { error: "Please enter valid dates." };
  }

  if (returnDate <= investmentDate) {
    return { error: "Return date must be after investment date." };
  }

  const amount = parseFloat(amountStr);
  const returnAmount = parseFloat(returnAmountStr);
  const quantity = quantityStr ? parseInt(quantityStr, 10) : 1;

  if (isNaN(amount) || amount <= 0) {
    return { error: "Investment amount must be greater than 0." };
  }

  if (isNaN(returnAmount) || returnAmount <= 0) {
    return { error: "Return amount must be greater than 0." };
  }

  if (isNaN(quantity) || quantity < 1) {
    return { error: "Quantity must be at least 1." };
  }

  let status: "ACTIVE" | "COMPLETED" | "OVERDUE" = statusInput || "ACTIVE";
  if (status !== "COMPLETED") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const returnDateOnly = new Date(returnDate);
    returnDateOnly.setHours(0, 0, 0, 0);
    if (today > returnDateOnly) {
      status = "OVERDUE";
    } else {
      status = "ACTIVE";
    }
  }

  try {
    await dbConnect();
    await Slot.findByIdAndUpdate(id, {
      type,
      quantity,
      investorName,
      mobileNo,
      investmentDate,
      returnDate,
      amount,
      returnAmount,
      status,
    });
  } catch (err: any) {
    console.error("Update slot error:", err);
    return { error: "Failed to update slot. Please try again." };
  }

  revalidatePath("/");
  revalidatePath(`/slots/${id}`);
  redirect(`/slots/${id}`);
}

export async function deleteSlot(id: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  try {
    await dbConnect();
    await Slot.findByIdAndDelete(id);
    await Payment.deleteMany({ slotId: id });
  } catch (err: any) {
    console.error("Delete slot error:", err);
    return { error: "Failed to delete slot." };
  }

  revalidatePath("/");
  redirect("/");
}

export async function toggleSlotCompletion(id: string, currentStatus: string) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized." };
  }

  try {
    await dbConnect();
    const slot = await Slot.findById(id);
    if (!slot) return { error: "Slot not found" };

    let newStatus: "ACTIVE" | "COMPLETED" | "OVERDUE" = "COMPLETED";
    if (currentStatus === "COMPLETED") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const returnDateOnly = new Date(slot.returnDate);
      returnDateOnly.setHours(0, 0, 0, 0);
      newStatus = today > returnDateOnly ? "OVERDUE" : "ACTIVE";
    }

    await Slot.findByIdAndUpdate(id, { status: newStatus });
  } catch (err: any) {
    console.error("Toggle slot completion error:", err);
    return { error: "Failed to update slot status." };
  }

  revalidatePath("/");
  revalidatePath(`/slots/${id}`);
}
