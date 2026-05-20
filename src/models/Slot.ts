import mongoose, { Schema } from "mongoose";

export interface ISlot extends mongoose.Document {
  type: "FIX" | "NON_FIX";
  investorName: string;
  mobileNo: string;
  investmentDate: Date;
  returnDate: Date;
  amount: number;
  returnAmount: number;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
  createdAt: Date;
  updatedAt: Date;
}

const SlotSchema = new Schema<ISlot>({
  type: { type: String, enum: ["FIX", "NON_FIX"], required: true },
  investorName: { type: String, required: true },
  mobileNo: { type: String, required: true },
  investmentDate: { type: Date, required: true },
  returnDate: { type: Date, required: true },
  amount: { type: Number, required: true },
  returnAmount: { type: Number, required: true },
  status: { type: String, enum: ["ACTIVE", "COMPLETED", "OVERDUE"], default: "ACTIVE", required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update the updatedAt field before saving
SlotSchema.pre("save", function () {
  this.updatedAt = new Date();
});

export default mongoose.models.Slot || mongoose.model<ISlot>("Slot", SlotSchema);
