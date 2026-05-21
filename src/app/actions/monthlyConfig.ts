"use server";

import dbConnect from "@/lib/db";
import MonthlyConfig from "@/models/MonthlyConfig";
import { revalidatePath } from "next/cache";

export async function saveMonthlyConfig(
  monthKey: string,
  data: {
    perSlotAmount: number;
    investmentDate?: string | null;
    monthLabel?: string | null;
    yearLabel?: string | null;
  }
) {
  try {
    await dbConnect();

    const updateData: any = {
      perSlotAmount: data.perSlotAmount,
    };

    if (data.investmentDate) updateData.investmentDate = new Date(data.investmentDate);
    if (data.monthLabel !== undefined) updateData.monthLabel = data.monthLabel;
    if (data.yearLabel !== undefined) updateData.yearLabel = data.yearLabel;

    await MonthlyConfig.findOneAndUpdate(
      { monthKey },
      { $set: updateData },
      { upsert: true, new: true }
    );

    revalidatePath("/analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save monthly config:", error);
    throw new Error(error.message || "Failed to save config");
  }
}
