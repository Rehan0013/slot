import mongoose, { Document, Model } from "mongoose";

export interface IMonthlyConfig extends Document {
  monthKey: string;
  perSlotAmount: number;
  investmentDate?: Date;
  monthLabel?: string;
  yearLabel?: string;
}

const MonthlyConfigSchema = new mongoose.Schema<IMonthlyConfig>(
  {
    monthKey: { type: String, required: true, unique: true },
    perSlotAmount: { type: Number, required: true, default: 10000 },
    investmentDate: { type: Date },
    monthLabel: { type: String },
    yearLabel: { type: String },
  },
  { timestamps: true }
);

const MonthlyConfig: Model<IMonthlyConfig> =
  mongoose.models.MonthlyConfig || mongoose.model<IMonthlyConfig>("MonthlyConfig", MonthlyConfigSchema);

export default MonthlyConfig;
