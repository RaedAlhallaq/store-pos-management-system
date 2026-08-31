import React, { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2, Check, ShoppingBag } from 'lucide-react';
import type { Supplier } from '../../suppliers/types/supplierTypes';
import type { Product } from '../../products/types/productTypes';
import type { CreatePurchasePayload } from '../types/purchaseTypes';
import { toast } from 'sonner';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: Supplier[];
  products: Product[];
  onSave: (payload: CreatePurchasePayload) => Promise<void>;
  isLoading?: boolean;
}

interface PurchaseRowItem {
  product_id: number;
  product_name: string;
  quantity: number;
  unit_cost: number;
  selling_price: number;
  tax_percent: number;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  suppliers,
  products,
  onSave,
  isLoading = false,
}) => {
  const [supplierId, setSupplierId] = useState<string>(suppliers[0]?.id ? String(suppliers[0].id) : '');
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'bank_transfer' | 'credit'>('cash');
  const [discountAmount, setDiscountAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  // Items table
  const [items, setItems] = useState<PurchaseRowItem[]>([
    {
      product_id: products[0]?.id || 0,
      product_name: products[0]?.name || '',
      quantity: 1,
      unit_cost: Number(products[0]?.cost_price || 0),
      selling_price: Number(products[0]?.selling_price || 0),
      tax_percent: Number(products[0]?.tax_percent || 15),
    },
  ]);

  const handleAddItemRow = () => {
    const firstProd = products[0];
    setItems((prev) => [
      ...prev,
      {
        product_id: firstProd?.id || 0,
        product_name: firstProd?.name || '',
        quantity: 1,
        unit_cost: Number(firstProd?.cost_price || 0),
        selling_price: Number(firstProd?.selling_price || 0),
        tax_percent: Number(firstProd?.tax_percent || 15),
      },
    ]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length <= 1) {
      toast.error('يجب أن تحتوي الفاتورة على صنف واحد على الأقل');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, productId: number) => {
    const found = products.find((p) => p.id === productId);
    if (!found) return;

    setItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              product_id: found.id,
              product_name: found.name,
              unit_cost: Number(found.cost_price),
              selling_price: Number(found.selling_price),
              tax_percent: Number(found.tax_percent || 15),
            }
          : item
      )
    );
  };

  const handleItemFieldChange = (index: number, field: keyof PurchaseRowItem, value: number) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // Calculations
  const calculatedSubtotal = items.reduce((sum, item) => sum + item.unit_cost * item.quantity, 0);
  const calculatedTax = items.reduce(
    (sum, item) => sum + (item.unit_cost * item.quantity * item.tax_percent) / 100,
    0
  );
  const discountNum = Number(discountAmount || 0);
  const grandTotal = Math.max(0, calculatedSubtotal + calculatedTax - discountNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === 'credit' && !supplierId) {
      toast.error('يرجى تحديد مورد مسجل للشراء الآجل');
      return;
    }

    const payload: CreatePurchasePayload = {
      supplier_id: supplierId ? Number(supplierId) : null,
      supplier_invoice_number: supplierInvoiceNumber.trim() || undefined,
      invoice_date: invoiceDate,
      discount_amount: discountNum,
      notes: notes.trim() || undefined,
      items: items.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        selling_price: it.selling_price > 0 ? it.selling_price : undefined,
        tax_percent: it.tax_percent,
      })),
      payments: [
        {
          payment_method: paymentMethod,
          amount: grandTotal,
        },
      ],
    };

    await onSave(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="تسجيل فاتورة مشتريات وتوريد"
      subtitle="إضافة كميات للمخزون، تحديث أسعار الشراء والبيع، وترحيل المستحقات"
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Top Supplier & Invoice Meta */}
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
            placeholder="مثال: INV-998822"
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

        {/* Multi-Items Inward Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShoppingBag className="w-4 h-4 text-brand-400" />
              <span>الأصناف الموردة للمخزون ({items.length})</span>
            </label>

            <button
              type="button"
              onClick={handleAddItemRow}
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 bg-brand-500/10 px-2.5 py-1 rounded-lg border border-brand-500/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف آخر</span>
            </button>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const lineTotal = item.unit_cost * item.quantity;
              const lineTax = (lineTotal * item.tax_percent) / 100;
              const lineGrand = lineTotal + lineTax;

              return (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                    {/* Product Select */}
                    <div className="sm:col-span-4">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleProductChange(idx, Number(e.target.value))}
                        className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.001"
                        min="0.001"
                        placeholder="الكمية"
                        value={item.quantity}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-slate-100 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center focus:outline-none"
                      />
                    </div>

                    {/* Unit Cost */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="سعر التكلفة"
                        value={item.unit_cost}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'unit_cost', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-emerald-400 font-bold border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center focus:outline-none"
                      />
                    </div>

                    {/* New Selling Price */}
                    <div className="sm:col-span-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="سعر البيع"
                        value={item.selling_price}
                        onChange={(e) =>
                          handleItemFieldChange(idx, 'selling_price', parseFloat(e.target.value) || 0)
                        }
                        className="w-full bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-2.5 py-2 text-xs font-mono text-center focus:outline-none"
                      />
                    </div>

                    {/* Line Total & Remove */}
                    <div className="sm:col-span-2 flex items-center justify-between gap-1">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {lineGrand.toFixed(2)} ₪
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment & Summary */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select
              label="طريقة السداد للمورد *"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              options={[
                { value: 'cash', label: 'نقداً من الصندوق (Cash)' },
                { value: 'bank_transfer', label: 'حوالة بنكية' },
                { value: 'credit', label: 'آجل على حساب المورد (Credit)' },
                { value: 'card', label: 'بطاقة مدى / حساب بنكي' },
              ]}
            />

            <Input
              type="number"
              step="0.5"
              label="خصم الفاتورة (إن وجد)"
              placeholder="0.00"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(e.target.value)}
            />
          </div>

          {/* Grand Total Bar */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              <span>المجموع قبل الضريبة: {calculatedSubtotal.toFixed(2)} ₪</span>
              <span className="mr-3">الضريبة (15%): {calculatedTax.toFixed(2)} ₪</span>
            </div>
            <div className="text-left font-mono">
              <span className="text-xs text-slate-400 block font-sans">الإجمالي النهائي المستحق:</span>
              <span className="text-xl font-black text-slate-100">{grandTotal.toFixed(2)} ₪</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Input
          label="ملاحظات أو بيان الفاتورة"
          placeholder="سند توريد، شحنة، إلخ..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Action Buttons */}
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
};
