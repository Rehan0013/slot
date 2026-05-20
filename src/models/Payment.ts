import mongoose, { Schema } from "mongoose";

export interface IPayment extends mongoose.Document {
  slotId: mongoose.Types.ObjectId;
  type: "TDS" | "BOOKING";
  amount: number;
  paidAt: Date;
  note?: string;
  createdAt: Date;
}

const PaymentSchema = new Schema<IPayment>({
  slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
  type: { type: String, enum: ["TDS", "BOOKING"], required: true },
  amount: { type: Number, required: true },
  paidAt: { type: Date, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);
