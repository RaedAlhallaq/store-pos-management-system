import { db } from '../../../data/db';
import { ensureReady, money, nowIso } from '../../../data/runtime';
import { defaultSettings } from '../../../data/seed';

export const settingsApi = {
  async getSettings() {
    await ensureReady();
    const rows = await db.getAll('settings');
    return rows.length > 0 ? rows[0] : defaultSettings();
  },

  async updateSettings(data) {
    await ensureReady();
    const rows = await db.getAll('settings');
    const existing = rows.length > 0 ? rows[0] : { id: 1 };
    const updated = { ...existing, ...data, id: 1, updated_at: nowIso() };
    await db.put('settings', updated);
    return updated;
  },

  async exportBackup() {
    await ensureReady();
    const payload = await db.exportAll();
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `store_pos_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  async restoreBackup(file) {
    await ensureReady();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const payload = JSON.parse(e.target.result);
          await db.importAll(payload);
          resolve({ success: true, message: 'تمت استعادة النسخة الاحتياطية بنجاح.' });
        } catch (err) {
          reject(new Error('ملف النسخة الاحتياطية غير صالح.'));
        }
      };
      reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
      reader.readAsText(file);
    });
  },
};
