import { Request, Response } from 'express';
import Expense, { autoCategorize } from '../models/Expense';

// Get all expenses (with search and filter)
export const getExpenses = async (req: Request, res: Response) => {
  try {
    const { search, category, startDate, endDate } = req.query;
    const query: any = {};

    if (search) {
      query.$or = [
        { item: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate as string);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate as string);
      }
    }

    const expenses = await Expense.find(query).sort({ date: -1, createdAt: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving expenses', error });
  }
};

// Create a new expense
export const createExpense = async (req: Request, res: Response) => {
  try {
    const { sNo, date, item, amount, description, category } = req.body;

    const parsedDate = date ? new Date(date) : new Date();
    const parsedCategory = category || autoCategorize(item);

    const newExpense = new Expense({
      sNo,
      date: parsedDate,
      item,
      amount: Number(amount),
      description,
      category: parsedCategory,
    });

    const savedExpense = await newExpense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: 'Error creating expense', error });
  }
};

// Update an expense
export const updateExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sNo, date, item, amount, description, category } = req.body;

    const updateData: any = {};
    if (sNo !== undefined) updateData.sNo = sNo;
    if (date) updateData.date = new Date(date);
    if (item) {
      updateData.item = item;
      // Re-categorize if the item name changed and no category was explicitly provided
      if (!category) {
        updateData.category = autoCategorize(item);
      }
    }
    if (amount !== undefined) updateData.amount = Number(amount);
    if (description !== undefined) updateData.description = description;
    if (category) updateData.category = category;

    const updatedExpense = await Expense.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: 'Error updating expense', error });
  }
};

// Delete an expense
export const deleteExpense = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deletedExpense = await Expense.findByIdAndDelete(id);

    if (!deletedExpense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json({ message: 'Expense deleted successfully', id });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting expense', error });
  }
};

// Bulk import expenses
export const bulkImportExpenses = async (req: Request, res: Response) => {
  try {
    const { expenses, overwrite } = req.body;

    if (!Array.isArray(expenses) || expenses.length === 0) {
      return res.status(400).json({ message: 'Invalid expenses array provided' });
    }

    if (overwrite) {
      // Clear database first if requested
      await Expense.deleteMany({});
    }

    const formattedExpenses = expenses.map((exp: any) => ({
      sNo: exp.sNo,
      date: exp.date ? new Date(exp.date) : new Date(),
      item: exp.item,
      amount: Number(exp.amount),
      description: exp.description || '',
      category: exp.category || autoCategorize(exp.item),
    }));

    const imported = await Expense.insertMany(formattedExpenses);
    res.status(201).json({
      message: `Successfully imported ${imported.length} expenses`,
      count: imported.length,
    });
  } catch (error) {
    res.status(400).json({ message: 'Error importing expenses', error });
  }
};

// Get aggregate dashboard statistics
export const getExpenseStats = async (req: Request, res: Response) => {
  try {
    // 1. Total Spend
    const totalResult = await Expense.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalSpent = totalResult[0]?.total || 0;
    const totalCount = totalResult[0]?.count || 0;

    // 2. Spending by category
    const categoryBreakdown = await Expense.aggregate([
      { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
    ]);

    // 3. Timeline trends (aggregated by month)
    const monthlyTrend = await Expense.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          _id: 0,
          year: '$_id.year',
          month: '$_id.month',
          total: 1,
        },
      },
    ]);

    // 4. Highest Expense
    const highestExpense = await Expense.findOne().sort({ amount: -1 }).limit(1);

    res.json({
      totalSpent,
      totalCount,
      categoryBreakdown: categoryBreakdown.map((item) => ({
        category: item._id,
        total: item.total,
        count: item.count,
      })),
      monthlyTrend,
      highestExpense,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating expense statistics', error });
  }
};
