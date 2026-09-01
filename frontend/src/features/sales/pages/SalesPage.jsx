import { useCallback, useEffect, useState } from 'react';
import { posApi } from '../../pos/api/posApi';
import { ReceiptModal } from '../../pos/components/ReceiptModal';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Pagination } from '../../../components/ui/Pagination';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Receipt, Search, Printer, Ban, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function SalesPage() {
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [viewingSale, setViewingSale] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [isSalesLoading, setIsSalesLoading] = useState(true);

  const refreshSales = useCallback(async () => {
    setIsSalesLoading(true);
    try {
      const data = await posApi.getSales({
        page,
        search: search || undefined,
        payment_status: paymentStatus || undefined,
        invoice_status: invoiceStatus || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        per_page: 15,
      });
      setSalesData(data);
    } finally {
      setIsSalesLoading(false);
    }
  }, [dateFrom, dateTo, invoiceStatus, page, paymentStatus, search]);

  useEffect(() => {
    refreshSales();
  }, [refreshSales]);

  const handleVoidInvoice = async (sale) => {
    const reason = window.prompt(`ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø³Ø¨Ø¨ Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© Ø±Ù‚Ù… (${sale.invoice_number}):`);
    if (!reason || !reason.trim()) return;

    try {
      await posApi.voidSale(sale.id, reason.trim());
      await refreshSales();
      toast.success('ØªÙ… Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© ÙˆØ¹ÙƒØ³ Ø±ØµÙŠØ¯ Ø§Ù„Ù…Ø®Ø²ÙˆÙ† Ø¨Ù†Ø¬Ø§Ø­');
    } catch (err) {
      toast.error(err.response?.data?.message || 'ÙØ´Ù„ Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø©');
    }
  };

  const getPaymentStatusBadge = (status) => {
    switch (status) {
      case 'paid': return <Badge variant="success">Ù…Ø¯ÙÙˆØ¹Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„</Badge>;
      case 'partial': return <Badge variant="warning">Ù…Ø¯ÙÙˆØ¹Ø© Ø¬Ø²Ø¦ÙŠØ§Ù‹</Badge>;
      case 'due': return <Badge variant="danger">Ø¢Ø¬Ù„Ø© / ØºÙŠØ± Ù…Ø³Ø¯Ø¯Ø©</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"><div><h1 className="text-xl md:text-2xl font-bold text-slate-100 flex items-center gap-2"><Receipt className="w-6 h-6 text-brand-400" /><span>Ø³Ø¬Ù„ Ø§Ù„ÙÙˆØ§ØªÙŠØ± ÙˆØ§Ù„Ù…Ø¨ÙŠØ¹Ø§Øª</span></h1><p className="text-xs md:text-sm text-slate-400 mt-0.5">Ø£Ø±Ø´ÙŠÙ Ø§Ù„ÙÙˆØ§ØªÙŠØ± Ø§Ù„Ù…ØµØ¯Ø±Ø©ØŒ Ø¥Ø¹Ø§Ø¯Ø© Ø§Ù„Ø·Ø¨Ø§Ø¹Ø©ØŒ ÙˆØ­Ø§Ù„Ø§Øª Ø§Ù„Ø³Ø¯Ø§Ø¯ ÙˆØ§Ù„Ø¥Ù„ØºØ§Ø¡</p></div></div>

      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2"><div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400"><Search className="w-4 h-4" /></div><input type="text" placeholder="Ø§Ø¨Ø­Ø« Ø¨Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©ØŒ Ø§Ø³Ù… Ø§Ù„Ø¹Ù…ÙŠÙ„ØŒ Ø£Ùˆ Ø§Ù„Ù‡Ø§ØªÙ..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50" /></div>
          <div><select value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"><option value="">Ø¬Ù…ÙŠØ¹ Ø­Ø§Ù„Ø§Øª Ø§Ù„Ø³Ø¯Ø§Ø¯</option><option value="paid">Ù…Ø¯ÙÙˆØ¹Ø© Ø¨Ø§Ù„ÙƒØ§Ù…Ù„</option><option value="partial">Ù…Ø¯ÙÙˆØ¹Ø© Ø¬Ø²Ø¦ÙŠØ§Ù‹</option><option value="due">Ø¢Ø¬Ù„Ø© / ØºÙŠØ± Ù…Ø³Ø¯Ø¯Ø©</option></select></div>
          <div><select value={invoiceStatus} onChange={(e) => { setInvoiceStatus(e.target.value); setPage(1); }} className="w-full bg-slate-950/80 text-slate-100 border border-slate-800 rounded-xl px-3 py-2.5 text-xs md:text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/50"><option value="">Ø¬Ù…ÙŠØ¹ Ø­Ø§Ù„Ø§Øª Ø§Ù„ÙÙˆØ§ØªÙŠØ±</option><option value="completed">Ù…ÙƒØªÙ…Ù„Ø© ÙˆØµØ§Ù„Ø­Ø©</option><option value="void">ÙÙˆØ§ØªÙŠØ± Ù…Ù„ØºØ§Ø© (Void)</option></select></div>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs"><span className="text-slate-400 font-semibold flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-brand-400" /><span>Ù†Ø·Ø§Ù‚ Ø§Ù„ØªØ§Ø±ÙŠØ®:</span></span><div className="flex items-center gap-2"><span className="text-slate-500">Ù…Ù†:</span><input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none" /></div><div className="flex items-center gap-2"><span className="text-slate-500">Ø¥Ù„Ù‰:</span><input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="bg-slate-950 text-slate-200 border border-slate-800 rounded-lg px-2.5 py-1 text-xs focus:outline-none" /></div>{(dateFrom || dateTo || search || paymentStatus || invoiceStatus) && <button type="button" onClick={() => { setDateFrom(''); setDateTo(''); setSearch(''); setPaymentStatus(''); setInvoiceStatus(''); setPage(1); }} className="text-[11px] text-brand-400 hover:underline mr-auto">Ø¥Ø¹Ø§Ø¯Ø© Ø¶Ø¨Ø· Ø§Ù„ÙÙ„Ø§ØªØ±</button>}</div>
      </div>

      <Card className="overflow-hidden border-slate-800 bg-slate-900/70">
        {isSalesLoading ? <div className="py-16 flex flex-col items-center justify-center gap-3"><LoadingSpinner size="lg" /><span className="text-xs text-slate-400">Ø¬Ø§Ø±Ù ØªØ­Ù…ÙŠÙ„ Ø§Ù„ÙÙˆØ§ØªÙŠØ±...</span></div> : !salesData?.data || salesData.data.length === 0 ? <EmptyState title="Ù„Ø§ ØªÙˆØ¬Ø¯ ÙÙˆØ§ØªÙŠØ± Ù…Ø·Ø§Ø¨Ù‚Ø©" description="Ø³ØªØ¸Ù‡Ø± Ù‡Ù†Ø§ ÙƒØ§ÙØ© ÙÙˆØ§ØªÙŠØ± Ù†Ù‚Ø§Ø· Ø§Ù„Ø¨ÙŠØ¹ Ø§Ù„Ù…ØµØ¯Ø±Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹Ø© ÙˆØ§Ù„Ø·Ø¨Ø§Ø¹Ø©" /> : <div><div className="overflow-x-auto"><table className="w-full text-right text-xs"><thead><tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold select-none"><th className="py-3.5 px-4">Ø±Ù‚Ù… Ø§Ù„ÙØ§ØªÙˆØ±Ø©</th><th className="py-3.5 px-4">Ø§Ù„ØªØ§Ø±ÙŠØ® ÙˆØ§Ù„ÙˆÙ‚Øª</th><th className="py-3.5 px-4">Ø§Ù„Ø¹Ù…ÙŠÙ„</th><th className="py-3.5 px-4">Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (â‚ª)</th><th className="py-3.5 px-4">Ø§Ù„Ù…Ø¯ÙÙˆØ¹ / Ø§Ù„Ù…ØªØ¨Ù‚ÙŠ</th><th className="py-3.5 px-4">Ø·Ø±ÙŠÙ‚Ø© Ø§Ù„Ø¯ÙØ¹</th><th className="py-3.5 px-4">Ø­Ø§Ù„Ø© Ø§Ù„Ø³Ø¯Ø§Ø¯</th><th className="py-3.5 px-4 text-center">Ø¥Ø¬Ø±Ø§Ø¡Ø§Øª</th></tr></thead><tbody className="divide-y divide-slate-800/60">{salesData.data.map((sale) => { const isVoid = sale.invoice_status === 'void'; return <tr key={sale.id} className={`hover:bg-slate-850/50 transition-colors ${isVoid ? 'opacity-50 bg-rose-950/10' : ''}`}><td className="py-3.5 px-4"><div className="flex items-center gap-2"><span className="font-mono font-bold text-slate-100 text-sm">{sale.invoice_number}</span>{isVoid && <Badge variant="danger" size="sm">Ù…Ù„ØºØ§Ø©</Badge>}</div></td><td className="py-3.5 px-4 font-mono text-slate-400">{sale.created_at ? new Date(sale.created_at).toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' }) : 'â€”'}</td><td className="py-3.5 px-4"><span className="text-slate-200 font-medium block">{sale.customer?.name || 'Ø¹Ù…ÙŠÙ„ Ù†Ù‚Ø¯ÙŠ'}</span></td><td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-sm">{Number(sale.grand_total).toFixed(2)} â‚ª</td><td className="py-3.5 px-4 font-mono"><div><span className="text-emerald-400 font-semibold">{Number(sale.paid_amount).toFixed(2)} â‚ª</span>{Number(sale.due_amount) > 0 && <span className="text-[11px] text-amber-400 block font-bold">Ù…ØªØ¨Ù‚ÙŠ: {Number(sale.due_amount).toFixed(2)} â‚ª</span>}</div></td><td className="py-3.5 px-4"><span className="text-slate-300 font-medium">{sale.payment_method === 'cash' ? 'Ù†Ù‚Ø¯Ø§Ù‹' : sale.payment_method === 'card' ? 'Ø¨Ø·Ø§Ù‚Ø© Ù…Ø¯Ù‰' : sale.payment_method === 'credit' ? 'Ø¢Ø¬Ù„ (Ø°Ù…Ø©)' : 'Ø¯ÙØ¹ Ù…Ø¬Ø²Ø£'}</span></td><td className="py-3.5 px-4">{getPaymentStatusBadge(sale.payment_status)}</td><td className="py-3.5 px-4"><div className="flex items-center justify-center gap-1.5"><Button variant="ghost" size="sm" title="Ù…Ø¹Ø§ÙŠÙ†Ø© ÙˆØ·Ø¨Ø§Ø¹Ø© Ø§Ù„ÙØ§ØªÙˆØ±Ø©" onClick={() => setViewingSale(sale)} className="text-brand-400 hover:bg-brand-500/10 p-1.5"><Printer className="w-4 h-4" /></Button>{!isVoid && <Button variant="ghost" size="sm" title="Ø¥Ù„ØºØ§Ø¡ Ø§Ù„ÙØ§ØªÙˆØ±Ø© ÙˆØ¹ÙƒØ³ Ø§Ù„Ù…Ø®Ø²ÙˆÙ†" onClick={() => handleVoidInvoice(sale)} className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-1.5"><Ban className="w-4 h-4" /></Button>}</div></td></tr>; })}</tbody></table></div>{salesData.meta && <div className="px-4 border-t border-slate-800"><Pagination currentPage={salesData.meta.current_page} lastPage={salesData.meta.last_page} total={salesData.meta.total} from={salesData.meta.from ?? 1} to={salesData.meta.to ?? salesData.meta.total} onPageChange={(p) => setPage(p)} /></div>}</div>}
      </Card>
      {viewingSale && <ReceiptModal isOpen={!!viewingSale} onClose={() => setViewingSale(null)} sale={viewingSale} />}
    </div>
  );
}
