import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../../products/api/productsApi';
import { posApi } from '../api/posApi';
import { customersApi } from '../../customers/api/customersApi';
import { PosProductGrid } from '../components/PosProductGrid';
import { PosCart } from '../components/PosCart';
import { PaymentModal } from '../components/PaymentModal';
import { ReceiptModal } from '../components/ReceiptModal';
import { QuickCustomerModal } from '../components/QuickCustomerModal';
import { HeldOrdersModal } from '../components/HeldOrdersModal';
import type { Product } from '../../products/types/productTypes';
import type { Customer } from '../../customers/types/customerTypes';
import type { CartItem, HeldOrder, SaleResponse } from '../types/posTypes';
import { toast } from 'sonner';

export const PosPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Cart state
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isHeldOrdersOpen, setIsHeldOrdersOpen] = useState(false);
  const [lastCompletedSale, setLastCompletedSale] = useState<SaleResponse | null>(null);

  // Queries
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['pos-products'],
    queryFn: () => productsApi.getProducts({ per_page: 250 }),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => productsApi.getCategories(),
  });

  const { data: customers = [] } = useQuery({
    queryKey: ['quick-customers'],
    queryFn: () => customersApi.getQuickList(),
  });

  // Sound beep effect helper
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Cart Operations
  const handleAddToCart = useCallback((product: Product) => {
    playBeep();
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      const unitPrice = Number(product.selling_price);
      const taxPercent = Number(product.tax_percent || 15);

      if (existing) {
        const newQty = existing.quantity + 1;
        const subtotalBeforeTax = unitPrice * newQty - existing.discount_amount;
        const taxAmount = Number(((subtotalBeforeTax * taxPercent) / 100).toFixed(2));
        const subtotal = subtotalBeforeTax + taxAmount;

        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: newQty, tax_amount: taxAmount, subtotal }
            : item
        );
      } else {
        const qty = 1;
        const subtotalBeforeTax = unitPrice * qty;
        const taxAmount = Number(((subtotalBeforeTax * taxPercent) / 100).toFixed(2));
        const subtotal = subtotalBeforeTax + taxAmount;

        return [
          ...prev,
          {
            product,
            quantity: qty,
            unit_price: unitPrice,
            discount_amount: 0,
            tax_percent: taxPercent,
            tax_amount: taxAmount,
            subtotal,
          },
        ];
      }
    });
  }, []);

  const handleBarcodeSubmit = async (barcode: string) => {
    const localFound = productsData?.data.find((p) => p.barcode === barcode);
    if (localFound) {
      handleAddToCart(localFound);
      toast.success(`تمت إضافة: ${localFound.name}`);
      return;
    }

    try {
      const fetched = await productsApi.findByBarcode(barcode);
      handleAddToCart(fetched);
      toast.success(`تمت إضافة: ${fetched.name}`);
    } catch {
      toast.error(`لم يتم العثور على أي منتج بالباركود: ${barcode}`);
    }
  };

  const handleUpdateQuantity = (productId: number, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(productId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.product.id === productId) {
          const subtotalBeforeTax = item.unit_price * newQty - item.discount_amount;
          const taxAmount = Number(((subtotalBeforeTax * item.tax_percent) / 100).toFixed(2));
          const subtotal = subtotalBeforeTax + taxAmount;
          return { ...item, quantity: newQty, tax_amount: taxAmount, subtotal };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: number) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    if (cartItems.length > 0 && window.confirm('هل أنت متأكد من مسح جميع عناصر السلة؟')) {
      setCartItems([]);
      setOverallDiscount(0);
      setSelectedCustomer(null);
    }
  };

  // Hold & Resume
  const handleHoldOrder = () => {
    if (cartItems.length === 0) return;

    const newHeldOrder: HeldOrder = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      customerName: selectedCustomer?.name,
      items: [...cartItems],
      overallDiscount,
      total: cartItems.reduce((sum, item) => sum + item.subtotal, 0) - overallDiscount,
    };

    setHeldOrders((prev) => [newHeldOrder, ...prev]);
    setCartItems([]);
    setOverallDiscount(0);
    setSelectedCustomer(null);
    toast.info('تم تعليق الفاتورة بنجاح');
  };

  const handleResumeOrder = (order: HeldOrder) => {
    if (cartItems.length > 0) {
      handleHoldOrder();
    }
    setCartItems(order.items);
    setOverallDiscount(order.overallDiscount);
    setHeldOrders((prev) => prev.filter((o) => o.id !== order.id));
    toast.success('تمت استعادة الفاتورة المعلقة');
  };

  const handleDeleteHeldOrder = (orderId: string) => {
    setHeldOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.info('تم حذف الفاتورة من المعلقات');
  };

  // Checkout Mutation
  const checkoutMutation = useMutation({
    mutationFn: posApi.checkout,
    onSuccess: (sale) => {
      queryClient.invalidateQueries({ queryKey: ['pos-products'] });
      queryClient.invalidateQueries({ queryKey: ['products-metrics'] });
      queryClient.invalidateQueries({ queryKey: ['quick-customers'] });
      setLastCompletedSale(sale);
      setIsPaymentModalOpen(false);
      setIsReceiptModalOpen(true);
      setCartItems([]);
      setOverallDiscount(0);
      setSelectedCustomer(null);
      toast.success(`تم إصدار الفاتورة رقم ${sale.invoice_number} بنجاح!`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'فشلت معالجة الفاتورة');
    },
  });

  const handleConfirmCheckout = async (paymentData: {
    customer_id?: number | null;
    payments: { payment_method: 'cash' | 'card' | 'bank_transfer' | 'credit'; amount: number; reference_number?: string }[];
    notes?: string;
  }) => {
    const payload = {
      customer_id: paymentData.customer_id,
      discount_amount: overallDiscount,
      notes: paymentData.notes,
      items: cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_amount: item.discount_amount,
      })),
      payments: paymentData.payments,
    };

    await checkoutMutation.mutateAsync(payload);
  };

  // Hotkey listener (F2 -> Checkout)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        if (cartItems.length > 0) {
          setIsPaymentModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems.length]);

  const subtotalBeforeTax = cartItems.reduce((sum, item) => sum + (item.unit_price * item.quantity - item.discount_amount), 0);
  const totalTax = cartItems.reduce((sum, item) => sum + item.tax_amount, 0);
  const grandTotal = Math.max(0, subtotalBeforeTax + totalTax - overallDiscount);

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col lg:flex-row gap-4 overflow-hidden">
      {/* Left / Main Section: Product Catalog & Barcode Reader */}
      <div className="flex-1 h-full overflow-hidden flex flex-col">
        <PosProductGrid
          products={productsData?.data || []}
          categories={categories}
          onSelectProduct={handleAddToCart}
          onBarcodeSubmit={handleBarcodeSubmit}
          isLoading={isProductsLoading}
        />
      </div>

      {/* Right Section: Active Cart & Checkout Pane */}
      <div className="w-full lg:w-96 xl:w-[420px] h-full flex flex-col">
        <PosCart
          items={cartItems}
          customer={selectedCustomer}
          onSelectCustomerClick={() => setIsPaymentModalOpen(true)}
          onQuickCustomerAdd={() => setIsQuickCustomerOpen(true)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onClearCart={handleClearCart}
          onHoldOrder={handleHoldOrder}
          heldOrdersCount={heldOrders.length}
          onOpenHeldOrders={() => setIsHeldOrdersOpen(true)}
          overallDiscount={overallDiscount}
          onSetOverallDiscount={setOverallDiscount}
          onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        />
      </div>

      {/* Modals */}
      {isPaymentModalOpen && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          grandTotal={grandTotal}
          customer={selectedCustomer}
          customers={customers}
          onSelectCustomer={setSelectedCustomer}
          onConfirmCheckout={handleConfirmCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}

      {isReceiptModalOpen && (
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          sale={lastCompletedSale}
          onNewSale={() => {
            setLastCompletedSale(null);
            setIsReceiptModalOpen(false);
          }}
        />
      )}

      {isQuickCustomerOpen && (
        <QuickCustomerModal
          isOpen={isQuickCustomerOpen}
          onClose={() => setIsQuickCustomerOpen(false)}
          onCustomerCreated={(newCust) => {
            queryClient.invalidateQueries({ queryKey: ['quick-customers'] });
            setSelectedCustomer(newCust);
          }}
        />
      )}

      {isHeldOrdersOpen && (
        <HeldOrdersModal
          isOpen={isHeldOrdersOpen}
          onClose={() => setIsHeldOrdersOpen(false)}
          heldOrders={heldOrders}
          onResumeOrder={handleResumeOrder}
          onDeleteOrder={handleDeleteHeldOrder}
        />
      )}
    </div>
  );
};
