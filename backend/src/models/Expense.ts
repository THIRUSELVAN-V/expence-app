import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  sNo?: number;
  date: Date;
  item: string;
  amount: number;
  description?: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema: Schema = new Schema(
  {
    sNo: { type: Number },
    date: { type: Date, required: true },
    item: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    description: { type: String, trim: true },
    category: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

// Auto-categorization utility based on item names
export const autoCategorize = (itemName: string): string => {
  const name = itemName.toLowerCase().trim();

  // 1. Housing (highest priority, contains housekeeping, rent, appliances)
  if (
    name.includes('house') ||
    name.includes('advance') ||
    name.includes('bloom') ||
    name.includes('stick') ||
    name.includes('kodam') ||
    name.includes('clean') ||
    name.includes('fan') ||
    name.includes('pan') || // e.g., dosa pan
    name.includes('buds') ||
    name.includes('tilo')
  ) {
    return 'Housing';
  }

  // 2. Transport
  if (
    name.includes('auto') ||
    name.includes('ticket') ||
    name.includes('clg') ||
    name.includes('road') ||
    name.includes('travel') ||
    name.includes('bus')
  ) {
    return 'Transport';
  }

  // 3. Snacks & Drinks
  if (
    name.includes('tea') ||
    name.includes('cofee') ||
    name.includes('coffee') ||
    name.includes('juice') ||
    name.includes('snacks') ||
    name.includes('puff') ||
    name.includes('buisket') ||
    name.includes('biscuit') ||
    name.includes('burbun') ||
    name.includes('panipori') ||
    name.includes('mango') ||
    name.includes('lemon') ||
    name.includes('soda') ||
    name.includes('colyflower') ||
    name.includes('cauliflower') ||
    name.includes('sugercan')
  ) {
    return 'Snacks & Drinks';
  }

  // 4. Food / Core Meals
  if (
    name.includes('breakfast') ||
    name.includes('break fast') ||
    name.includes('lunch') ||
    name.includes('dinner') ||
    name.includes('dosa') ||
    name.includes('idly') ||
    name.includes('parota') ||
    name.includes('chapathi') ||
    name.includes('rost') ||
    name.includes('mav') ||
    name.includes('food')
  ) {
    return 'Food';
  }

  return 'Others';
};

// Middleware to auto-populate category before validation
ExpenseSchema.pre('validate', function (next) {
  const expense = this as IExpense;
  if (!expense.category) {
    expense.category = autoCategorize(expense.item);
  }
  next();
});

export default mongoose.model<IExpense>('Expense', ExpenseSchema);
