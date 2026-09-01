import { useState } from 'react';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { customersApi } from '../../customers/api/customersApi';

export function QuickCustomerModal({ isOpen, onClose, onCustomerCreated }) {
  const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [creditLimit, setCreditLimit] = useState('1000.00'); const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (event) => { event.preventDefault(); if (!name.trim()) { toast.error('يرجى إدخال اسم العميل'); return; } try { setIsSubmitting(true); const customer = await customersApi.createCustomer({ name: name.trim(), phone: phone.trim() || undefined, credit_limit: creditLimit || '0', is_active: true }); toast.success(`تمت إضافة العميل "${customer.name}" واختياره للفاتورة`); onCustomerCreated(customer); onClose(); setName(''); setPhone(''); setCreditLimit('1000.00'); } catch (error) { toast.error(error.response?.data?.message || 'فشلت إضافة العميل'); } finally { setIsSubmitting(false); } };
  return <Modal isOpen={isOpen} onClose={onClose} title="إضافة عميل سريع" subtitle="تسجيل عميل جديد واختياره فوراً للفاتورة" maxWidth="sm"><form onSubmit={handleSubmit} className="space-y-4"><Input label="اسم العميل *" placeholder="مثال: خالد العتيبي" value={name} onChange={(event) => setName(event.target.value)} autoFocus /><Input label="رقم الهاتف / الجوال" placeholder="مثال: 0551234567" value={phone} onChange={(event) => setPhone(event.target.value)} /><Input type="number" step="50" label="الحد الائتماني للديون (₪)" placeholder="1000.00" value={creditLimit} onChange={(event) => setCreditLimit(event.target.value)} /><div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800"><Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>إلغاء</Button><Button type="submit" isLoading={isSubmitting} rightIcon={<Check className="w-4 h-4" />}>حفظ واختيار</Button></div></form></Modal>;
}
