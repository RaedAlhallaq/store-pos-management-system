import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { paginate } from '../../../data/paginate';
import { currentUser, ensureReady, money, nextSequence, nowIso } from '../../../data/runtime';

function formatExpense(expense, categories) {
  const category = categories.find((c) => c.id === expense.expense_category_id) || null;
  return {
    ...expense,
    amount: money(expense.amount).toFixed(2),
    category,
    user_name: expense.user_name || 'النظام',
  };
}

export const expensesApi = {
  async getExpenses(params = {}) {
    await ensureReady();
    const [rows, categories] = await Promise.all([
      db.getAll('expenses'),
      db.getAll('expenseCategories'),
    ]);
    let items = rows.map((e) => formatExpense(e, categories));

    if (params.search) {
      const term = String(params.search).toLowerCase();
      items = items.filter((e) =>
        [e.expense_number, e.description, e.reference_number].some((v) =>
          String(v || '').toLowerCase().includes(term)
        )
      );
    }
    if (params.expense_category_id && params.expense_category_id !== 'all') {
      items = items.filter((e) => e.expense_category_id === Number(params.expense_category_id));
    }
    if (params.payment_method) {
      items = items.filter((e) => e.payment_method === params.payment_method);
    }
    if (params.date_from || params.date_to) {
      items = items.filter((e) => {
        const day = String(e.expense_date || '').slice(0, 10);
        if (params.date_from && day < params.date_from) return false;
        if (params.date_to && day > params.date_to) return false;
        return true;
      });
    }
    items.sort((a, b) => b.id - a.id);
    return paginate(items, params.page, params.per_page || 15);
  },

  async createExpense(payload) {
    await ensureReady();
    const user = currentUser();
    const expenseNumber = await nextSequence('EXP', 'expenses', 'expense_number');
    const now = nowIso();
    const id = await db.add('expenses', {
      expense_number: expenseNumber,
      expense_category_id: payload.expense_category_id,
      description: payload.description,
      amount: money(payload.amount),
      payment_method: payload.payment_method || 'cash',
      expense_date: payload.expense_date || now.slice(0, 10),
      reference_number: payload.reference_number || '',
      notes: payload.notes || '',
      user_id: user.id,
      user_name: user.name,
      created_at: now,
    });
    const categories = await db.getAll('expenseCategories');
    return formatExpense(await db.get('expenses', id), categories);
  },

  async deleteExpense(id) {
    await ensureReady();
    const expense = await db.get('expenses', id);
    if (!expense) apiError('المصروف غير موجود.');
    await db.delete('expenses', id);
    return { success: true, message: 'تم حذف المصروف بنجاح.' };
  },

  async getCategories() {
    await ensureReady();
    const [categories, expenses] = await Promise.all([
      db.getAll('expenseCategories'),
      db.getAll('expenses'),
    ]);
    return categories.map((cat) => ({
      ...cat,
      expenses_count: expenses.filter((e) => e.expense_category_id === cat.id).length,
    }));
  },

  async createCategory(data) {
    await ensureReady();
    const id = await db.add('expenseCategories', {
      name: data.name,
      description: data.description || '',
      is_active: data.is_active !== false,
      created_at: nowIso(),
    });
    return db.get('expenseCategories', id);
  },

  async updateCategory(id, data) {
    await ensureReady();
    const cat = await db.get('expenseCategories', id);
    if (!cat) apiError('تصنيف المصروف غير موجود.');
    await db.put('expenseCategories', { ...cat, ...data, id });
    return db.get('expenseCategories', id);
  },

  async deleteCategory(id) {
    await ensureReady();
    const expenses = await db.getAll('expenses');
    if (expenses.some((e) => e.expense_category_id === id)) {
      apiError('لا يمكن حذف هذا التصنيف لوجود مصروفات مرتبطة به.');
    }
    await db.delete('expenseCategories', id);
    return { success: true, message: 'تم حذف التصنيف بنجاح.' };
  },
};
