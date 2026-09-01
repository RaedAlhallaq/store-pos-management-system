import { db } from '../../../data/db';
import { apiError } from '../../../data/errors';
import { ensureReady } from '../../../data/runtime';

export const authApi = {
  async checkHealth() {
    const started = performance.now();
    await ensureReady();
    return {
      status: 'ok',
      application: 'Store POS Local',
      version: '1.0.0',
      environment: 'local',
      database: {
        status: 'connected',
        latency_ms: Number((performance.now() - started).toFixed(2)),
        connection: 'indexeddb',
      },
      timestamp: new Date().toISOString(),
    };
  },

  async login(credentials) {
    await ensureReady();
    const users = await db.getAll('users');
    const user = users.find((row) => row.email === credentials.email);
    if (!user || user.password !== credentials.password) {
      apiError('بيانات الاعتماد غير صحيحة (Invalid email or password).');
    }
    if (user.status !== 'active') {
      const error = new Error('الحساب غير مفعّل، يرجى مراجعة المسؤول.');
      error.response = { status: 403, data: { message: error.message } };
      throw error;
    }
    const publicUser = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      token: `local-${user.id}-${Date.now()}`,
      user: publicUser,
    };
  },

  async getUser() {
    await ensureReady();
    const raw = localStorage.getItem('store_pos_user');
    if (!raw) apiError('غير مصرح.');
    return { success: true, user: JSON.parse(raw) };
  },

  async logout() {
    return { success: true, message: 'تم تسجيل الخروج بنجاح.' };
  },
};
