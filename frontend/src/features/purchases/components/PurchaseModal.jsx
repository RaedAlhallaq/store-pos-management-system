import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Check, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';

export function PurchaseModal({ isOpen, onClose, suppliers, products, onSave, isLoading = false }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ? String(suppliers[0].id) : '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([{
    product_id: products[0]?.id || 0,
    product_name: products[0]?.name || '',
    quantity: 1,
    unit_cost: Number(products[0]?.cost_price || 0),
    selling_price: Number(products[0]?.selling_price || 0),
    tax_percent: Number(products[0]?.tax_percent || 15),
  }]);

  const handleAddItemRow = () => {
    const first = products[0];
    setItems((prev) => [...prev, { product_id: first?.id || 0, product_name: first?.name || '', quantity: 1, unit_cost: Number(first?.cost_price || 0), selling_price: Number(first?.selling_price || 0), tax_percent: Number(first?.tax_percent || 15) }]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) { toast.error('يجب أن تحتوي الفاتورة على صنف واحد على الأقل'); return; }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index, productId) => {
    const found = products.find((p) => p.id === Number(productId));
    if (!found) return;
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, product_id: found.id, product_name: found.name, unit_cost: Number(found.cost_price), selling_price: Number(found.selling_price), tax_percent: Number(found.tax_percent || 15) } : item));
  };

  const handleItemFieldChange = (index, field, value) => {
    setItems((prev) => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const calculatedSubtotal = items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);
  const calculatedTax = items.reduce((sum, item) => sum + (item.unit_cost * item.quantity * item.tax_percent) / 100, 0);
  const discountNum = Number(discountAmount || 0);
  const grandTotal = Math.max(0, calculatedSubtotal + calculatedTax - discountNum);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'credit' && !supplierId) { toast.error('يرجى تحديد مورد للشراء الآجل'); return; }
    const payload = {
      supplier_id: supplierId ? Number(supplierId) : null,
      supplier_invoice_number: supplierInvoiceNumber.trim() || undefined,
      invoice_date: invoiceDate,
      discount_amount: discountNum,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity, unit_cost: it.unit_cost, selling_price: it.selling_price > 0 ? it.selling_price : undefined, tax_percent: it.tax_percent })),
      payments: [{ payment_method: paymentMethod, amount: grandTotal }],
    };
    await onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل فاتورة مشتريات وتوريد" subtitle="إضافة كميات للمخزون وتحديث أسعار الشراء والبيع" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="المورد *" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} options={suppliers.map((s) => ({ value: s.id, label: s.name }))} placeholderOption="اختر المورد..." />
          <Input label="رقم فاتورة المورد (اختياري)" placeholder="INV-998822" value={supplierInvoiceNumber} onChange={(e) => setSupplierInvoiceNumber(e.target.value)} />
          <Input type="date" label="تاريخ الفاتورة" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5"><ShoppingBag className="w-4 h-4 text-brand-400" /><span>الأصناف الموردة ({items.length})</span></label>
            <button type="button" onClick={handleAddItemRow} className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"><Plus className="w-3.5 h-3.5" /><span>إضافة صنف</span></button>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineGrand = item.unit_cost * item.quantity + (item.unit_cost * item.quantity * item.tax_percent) / 100;
              return (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    <div className="sm:col-span-4"><select value={item.product_id} onChange={(e) => handleProductChange(idx, e.target.value)} className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2 text-xs">{products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                    <div className="sm:col-span-2"><input type="number" step="0.001" min="0.001" placeholder="الكمية" value={item.quantity} onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center" /></div>
                    <div className="sm:col-span-2"><input type="number" step="0.01" min="0" placeholder="سعر التكلفة" value={item.unit_cost} onChange={(e) => handleItemFieldChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 text-emerald-400 font-bold border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center" /></div>
                    <div className="sm:col-span-2"><input type="number" step="0.01" min="0" placeholder="سعر البيع" value={item.selling_price} onChange={(e) => handleItemFieldChange(idx, 'selling_price', parseFloat(e.target.value) || 0)} className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center" /></div>
                    <div className="sm:col-span-2 flex items-center justify-between gap-1"><span className="font-mono text-xs font-bold text-slate-200">{lineGrand.toFixed(2)} ₪</span><button type="button" onClick={() => handleRemoveItemRow(idx)} className="text-slate-500 hover:text-rose-400 p-1"><Trash2 className="w-3.5 h-3.5" /></button></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="طريقة السداد *" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} options={[{ value: 'cash', label: 'نقداً' }, { value: 'bank_transfer', label: 'حوالة بنكية' }, { value: 'credit', label: 'آجل (ذمة مورد)' }, { value: 'card', label: 'بطاقة مدى' }]} />
            <Input type="number" step="0.5" label="خصم الفاتورة" placeholder="0.00" value={discountAmount} onChange={(e) => setDiscountAmount(e.target.value)} />
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400"><span>المجموع: {calculatedSubtotal.toFixed(2)} ₪</span><span className="mr-3">الضريبة: {calculatedTax.toFixed(2)} ₪</span></div>
            <div className="text-left font-mono"><span className="text-xs text-slate-400 block font-sans">الإجمالي:</span><span className="text-xl font-black text-slate-100">{grandTotal.toFixed(2)} ₪</span></div>
          </div>
        </div>

        <Input label="ملاحظات" placeholder="بيان الفاتورة..." value={notes} onChange={(e) => setNotes(e.target.value)} />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>إلغاء</Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>حفظ وتوريد للمخزون</Button>
        </div>
      </form>
    </Modal>
  );
}
