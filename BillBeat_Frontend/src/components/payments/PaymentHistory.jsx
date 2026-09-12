import { CreditCard, ReceiptText } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState } from '../common/StateViews';

const labels = { CASH: 'Cash', UPI: 'UPI', BANK_TRANSFER: 'Bank Transfer', OTHER: 'Other' };

export default function PaymentHistory({ query }) {
  if (query.isLoading) return <LoadingState label="Loading payment history" />;
  if (query.isError) return <ErrorState message={query.error.message} onRetry={query.refetch} />;
  if (!query.data?.length) return <EmptyState title="No payments yet" description="No payment records were returned for this bill." />;
  return <div className="space-y-3">{query.data.map((payment) => <article key={payment.id} className="rounded-2xl border border-[#e6e1dd] bg-white p-4"><div className="flex items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="grid size-9 place-items-center rounded-xl bg-[#f2efec] text-[#706a65]"><CreditCard size={17} /></span><div><p className="font-semibold">{formatMoney(payment.amount)}</p><p className="mt-1 text-sm text-[#706a65]">{labels[payment.paymentMethod] || payment.paymentMethod}</p></div></div><p className="text-right text-xs text-[#8d8782]">{formatDate(payment.paymentDate)}</p></div>{payment.transactionRef && <p className="mt-3 flex items-center gap-2 text-sm text-[#706a65]"><ReceiptText size={14} /> Ref: {payment.transactionRef}</p>}{payment.notes && <p className="mt-2 text-sm text-[#706a65]">{payment.notes}</p>}</article>)}</div>;
}

function formatMoney(value) { return value === null || value === undefined ? 'Not available' : `₹${Number(value).toFixed(2)}`; }
function formatDate(value) { return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available'; }