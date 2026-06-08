import { Router } from 'express';
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  bulkImportExpenses,
  getExpenseStats,
} from '../controllers/expenseController';

const router = Router();

router.get('/', getExpenses);
router.get('/stats', getExpenseStats);
router.post('/', createExpense);
router.post('/bulk', bulkImportExpenses);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;
