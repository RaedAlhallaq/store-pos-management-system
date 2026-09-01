import { useState, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Check, ShoppingBag, Search, Package } from 'lucide-react';
import { toast } from 'sonner';

function ProductSearchPicker({ products, onSelect, placeholder = 'بحث عن منتج...' }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef(null);

  const filtered = query.trim().length > 0
    ? products.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        (p.barcode && p.barcode.includes(query)) ||
        (p.sku && p.sku.toLowerCase().includes(query.toLowerCase()))
      ).slice(0, 8)
    : [];

  const handleSelect = (product) => {
    onSelect(product);
    setQuery('');
    setOpen(false);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.trim().length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-colors placeholder:text-slate-500"
        />
      </div>
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(p)}
              className="w-full text-right px-4 py-2.5 hover:bg-slate-800 flex items-center justify-between border-b border-slate-800 last:border-0 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200 truncate">{p.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {p.category_name && <span>{p.category_name}</span>}
                  {p.sku && <span className="ms-2">SKU: {p.sku}</span>}
                </div>
              </div>
              <div className="text-end ms-3 shrink-0">
                <div className="text-xs font-mono text-emerald-400">{Number(p.cost_price).toFixed(2)} ₪</div>
                <div className="text-xs text-slate-500">المخزون: {p.stock_quantity ?? 0}</div>
              </div>
            </button>
          ))}
        </div>
      )}
      {open && query.trim().length > 0 && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-xl p-4 text-center">
          <Package className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">لا توجد نتائج</p>
        </div>
      )}
    </div>
  );
}

export function PurchaseModal({ isOpen, onClose, suppliers, products, onSave, isLoading = false }) {
  const [supplierId, setSupplierId] = useState(suppliers[0]?.id ? String(suppliers[0].id) : '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  const createEmptyItem = (product = null) => ({
    product_id: product?.id || 0,
    product_name: product?.name || '',
    quantity: 1,
    unit_cost: Number(product?.cost_price || 0),
    selling_price: Number(product?.selling_price || 0),
    tax_percent: Number(product?.tax_percent || 15),
  });

  const [items, setItems] = useState([createEmptyItem(products[0])]);

  const handleAddItemRow = () => {
    setItems((prev) => [...prev, createEmptyItem()]);
  };

  const handleRemoveItemRow = (index) => {
    if (items.length <= 1) {
      toast.error('يجب أن تحتوي الفاتورة على صنف واحد على الأقل');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductPicked = (index, product) => {
    setItems((prev) => prev.map((item, i) => i === index ? {
      ...item,
      product_id: product.id,
      product_name: product.name,
      unit_cost: Number(product.cost_price),
      selling_price: Number(product.selling_price),
      tax_percent: Number(product.tax_percent || 15),
    } : item));
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
    if (items.every((it) => !it.product_id)) {
      toast.error('يجب إضافة صنف واحد على الأقل');
      return;
    }
    if (paymentMethod === 'credit' && !supplierId) {
      toast.error('يرجى تحديد مورد للشراء الآجل');
      return;
    }
    const payload = {
      supplier_id: supplierId ? Number(supplierId) : null,
      supplier_invoice_number: supplierInvoiceNumber.trim() || undefined,
      invoice_date: invoiceDate,
      discount_amount: discountNum,
      notes: notes.trim() || undefined,
      items: items.filter((it) => it.product_id).map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        selling_price: it.selling_price > 0 ? it.selling_price : undefined,
        tax_percent: it.tax_percent,
      })),
      payments: [{ payment_method: paymentMethod, amount: grandTotal }],
    };
    await onSave(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="تسجيل فاتورة مشتريات وتوريد" subtitle="إضافة كميات للمخزون وتحديث أسعار الشراء والبيع" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Supplier & Invoice Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="المورد *"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            options={suppliers.map((s) => ({ value: s.id, label: s.name }))}
            placeholderOption="اختر المورد..."
          />
          <Input
            label="رقم فاتورة المورد (اختياري)"
            placeholder="INV-998822"
            value={supplierInvoiceNumber}
            onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
          />
          <Input
            type="date"
            label="تاريخ الفاتورة"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>

        {/* Items Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-brand-400" />
              <span>الأصناف الموردة ({items.length})</span>
            </label>
            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20 hover:bg-brand-500/20 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف</span>
            </button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineSubtotal = item.unit_cost * item.quantity;
              const lineTax = (lineSubtotal * item.tax_percent) / 100;
              const lineTotal = lineSubtotal + lineTax;
              const profit = item.selling_price > 0 ? (item.selling_price - item.unit_cost) * item.quantity : 0;

              return (
                <div key={idx} className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-colors">
                  {/* Row header: product picker + remove */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-xs font-bold text-brand-400">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      {item.product_id ? (
                        <div className="flex items-center justify-between bg-slate-900 rounded-xl px-3 py-2 border border-slate-700">
                          <span className="text-sm font-medium text-slate-200 truncate">{item.product_name}</span>
                          <button
                            type="button"
                            onClick={() => handleProductPicked(idx, { id: 0, name: '', cost_price: 0, selling_price: 0, tax_percent: 15 })}
                            className="text-xs text-slate-500 hover:text-rose-400 me-2 transition-colors"
                          >
                            تغيير
                          </button>
                        </div>
                      ) : (
                        <ProductSearchPicker
                          products={products}
                          onSelect={(p) => handleProductPicked(idx, p)}
                          placeholder="ابحث عن منتج..."
                        />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                      title="حذف الصنف"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Row fields */}
                  {item.product_id > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">الكمية</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 text-slate-100 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">سعر التكلفة</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost}
                          onChange={(e) => handleItemFieldChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 text-emerald-400 font-bold border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 mb-1 block">سعر البيع</label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.selling_price}
                          onChange={(e) => handleItemFieldChange(idx, 'selling_price', parseFloat(e.target.value) || 0)}
                          className="w-full bg-slate-900 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono text-center focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                        />
                      </div>
                      <div className="flex flex-col items-center justify-center">
                        <span className="text-[10px] text-slate-500 mb-1">الإجمالي</span>
                        <span className="font-mono text-sm font-bold text-slate-100">{lineTotal.toFixed(2)} ₪</span>
                        {profit > 0 && (
                          <span className="text-[10px] text-emerald-400">ربح +{profit.toFixed(2)} ₪</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="طريقة السداد *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              options={[
                { value: 'cash', label: 'نقداً' },
                { value: 'bank_transfer', label: 'حوالة بنكية' },
                { value: 'credit', label: 'آجل (ذمة مورد)' },
                { value: 'card', label: 'بطاقة مدى' },
              ]}
            />
            <Input
              type="number"
              step="0.5"
              label="خصم الفاتورة"
              placeholder="0.00"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          <div className="pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>المجموع الفرعي</span>
              <span className="font-mono">{calculatedSubtotal.toFixed(2)} ₪</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>الضريبة</span>
              <span className="font-mono">{calculatedTax.toFixed(2)} ₪</span>
            </div>
            {discountNum > 0 && (
              <div className="flex items-center justify-between text-xs text-rose-400 mb-1">
                <span>الخصم</span>
                <span className="font-mono">-{discountNum.toFixed(2)} ₪</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-end">
              <div className="text-end">
                <span className="text-xs text-slate-400 block font-sans">الإجمالي</span>
                <span className="text-2xl font-black text-slate-100 font-mono">{grandTotal.toFixed(2)} ₪</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Input
          label="ملاحظات"
          placeholder="بيان الفاتورة..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            إلغاء
          </Button>
          <Button type="submit" isLoading={isLoading} rightIcon={<Check className="w-4 h-4" />}>
            حفظ وتوريد للمخزون
          </Button>
        </div>
      </form>
    </Modal>
  );
}
