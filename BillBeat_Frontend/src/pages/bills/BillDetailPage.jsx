import { ArrowLeft, CalendarDays, FileText, MessageCircle } from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { formatMoney } from '../../utils/billUtils';
import { useBill } from '../../queries/billQueries';
import PaymentHistory from '../../components/payments/PaymentHistory';
import { usePayments } from '../../queries/paymentQueries';
import WhatsAppStatus from '../../components/whatsapp/WhatsAppStatus';
import { inFlightStatuses, terminalStatuses, useWhatsAppMutations, useWhatsAppStatus } from '../../queries/whatsappQueries';
import { useCustomer } from '../../queries/customerQueries';
import { useEffect, useRef, useState } from 'react';

export default function BillDetailPage() {
  const { billId } = useParams();
  const location = useLocation();
  const query = useBill(billId);
  const bill = query.data;

  const customerQuery = useCustomer(bill?.customerId);
  const customer = customerQuery.data;

  const paymentsQuery = usePayments({ billId });
  const [polling, setPolling] = useState(false);
  const pollingTimeoutRef = useRef(null);

  const initialStatus = bill?.whatsAppStatus;
  const isInitialInFlight = Boolean(initialStatus && inFlightStatuses.has(initialStatus));

  useEffect(() => {
    if (isInitialInFlight && !polling) {
      setPolling(true);
    }
  }, [bill?.id, isInitialInFlight]);

  useEffect(() => {
    if (!polling) {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      return undefined;
    }

    pollingTimeoutRef.current = setTimeout(() => {
      setPolling(false);
    }, 30000);

    return () => {
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
    };
  }, [polling]);

  const shouldEnableWhatsAppQuery = Boolean(billId && (bill?.whatsAppStatus || polling));
  const whatsappQuery = useWhatsAppStatus(billId, shouldEnableWhatsAppQuery, polling);
  const { send } = useWhatsAppMutations();

  const whatsappDetails = whatsappQuery.data;
  const whatsappStatus = whatsappDetails?.status || bill?.whatsAppStatus;

  useEffect(() => {
    if (polling && whatsappDetails?.status && terminalStatuses.has(whatsappDetails.status)) {
      setPolling(false);
    }
  }, [polling, whatsappDetails?.status]);

  if (query.isLoading) return <LoadingState label="Loading bill detail" />;
  if (query.isError) return <div className="space-y-6"><BackLink /><ErrorState message={query.error.status === 404 ? 'Bill not found.' : query.error.message} onRetry={query.refetch} /></div>;

  const isCustomerLoading = customerQuery.isLoading;
  const isCustomerError = customerQuery.isError;
  const isWhatsAppEligible = customer?.whatsAppEnabled === true;
  const isInFlight = ['QUEUED', 'SENDING'].includes(whatsappStatus);
  const canSend = !isCustomerLoading && !isCustomerError && isWhatsAppEligible && !isInFlight;

  let buttonLabel = 'Send bill';
  if (send.isPending) {
    buttonLabel = 'Sending...';
  } else if (isCustomerLoading) {
    buttonLabel = 'Checking eligibility...';
  } else if (isInFlight) {
    buttonLabel = whatsappStatus === 'QUEUED' ? 'Queued...' : 'Sending in progress...';
  } else if (['FAILED', 'RETRY_PENDING'].includes(whatsappStatus)) {
    buttonLabel = 'Retry send';
  } else if (['SENT', 'DELIVERED', 'READ'].includes(whatsappStatus)) {
    buttonLabel = 'Resend bill';
  }

  const sendWhatsApp = () => {
    if (!canSend || send.isPending) return;
    const confirmMessage = ['FAILED', 'RETRY_PENDING'].includes(whatsappStatus)
      ? "Retry sending this bill to the customer's WhatsApp?"
      : ['SENT', 'DELIVERED', 'READ'].includes(whatsappStatus)
      ? "Resend this bill to the customer's WhatsApp?"
      : "Send this bill to the customer's WhatsApp?";

    if (!window.confirm(confirmMessage)) return;
    send.mutate(bill.id, { onSuccess: () => setPolling(true) });
  };

  return <div className="space-y-8"><BackLink customerId={bill.customerId} />{location.state?.paymentRecorded && <p className="rounded-xl bg-[#e8f5ed] px-4 py-3 text-sm font-semibold text-[#247044]">Payment recorded successfully. Bill balances were refreshed from the backend.</p>}<PageHeader eyebrow={`Bill ${bill.billingPeriod}`} title={bill.customerName} description={`${bill.startDate} to ${bill.endDate}`} action={<StatusBadge tone={bill.status === 'PAID' ? 'success' : bill.status === 'UNPAID' ? 'danger' : 'warning'}>{bill.status}</StatusBadge>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Current amount" value={formatMoney(bill.currentAmount)} /><Metric label="Previous outstanding" value={formatMoney(bill.previousOutstanding)} /><Metric label="Total amount" value={formatMoney(bill.totalAmount)} emphasis /><Metric label="Due amount" value={formatMoney(bill.dueAmount)} /></section><section className="flex flex-wrap gap-3">{Number(bill.dueAmount) > 0 ? <Link to={`/bills/${bill.id}/payment`}><Button><FileText size={16} /> Record payment</Button></Link> : <p className="rounded-xl bg-[#e8f5ed] px-4 py-3 text-sm font-semibold text-[#247044]">This bill is fully paid. No payment is currently due.</p>}</section><section className="rounded-2xl border border-[#e6e1dd] bg-white p-5"><div className="flex items-center justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">WhatsApp bill notification</p><div className="mt-3"><WhatsAppStatus status={whatsappStatus} details={whatsappDetails} isLoading={whatsappQuery.isLoading} error={whatsappQuery.error} /></div></div><MessageCircle className="text-[#247044]" size={22} /></div><div className="mt-5 flex flex-wrap items-center gap-3"><Button variant="secondary" onClick={sendWhatsApp} disabled={send.isPending || !canSend}>{buttonLabel}</Button>{!isCustomerLoading && !isCustomerError && !isWhatsAppEligible && <span className="text-xs text-[#b42318]">WhatsApp notifications are disabled for this customer.</span>}{isCustomerError && <span className="text-xs text-[#b42318]">Unable to verify customer WhatsApp eligibility.</span>}{isInFlight && !send.isPending && <span className="text-xs text-[#706a65]">Message is currently being processed by the system.</span>}{send.isError && <span className="text-sm text-[#b42318]">{send.error.message}</span>}{send.isSuccess && <span className="text-sm font-semibold text-[#247044]">WhatsApp bill notification queued/sent.</span>}</div></section><section className="rounded-2xl border border-[#e6e1dd] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0ee] text-[#d92d20]"><FileText size={18} /></span><div><h2 className="font-display text-xl font-bold">Bill items</h2><p className="text-sm text-[#706a65]">Itemized values returned by the backend.</p></div></div>{bill.billItems?.length ? <div className="mt-5 space-y-3">{bill.billItems.map((item) => <div key={item.id} className="grid gap-2 border-t border-[#eee9e5] pt-3 text-sm sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-semibold">{item.newspaperName}</p><p className="text-xs text-[#706a65]">{item.copies} copies · {item.daysCount} delivery days · {formatMoney(item.unitPrice)} each</p></div><span className="text-[#706a65]">{formatMoney(item.amount)}</span><span className="font-semibold">{formatMoney(item.amount)}</span></div>)}</div> : <p className="mt-5 text-sm text-[#706a65]">No bill items were returned.</p>}</section><section className="grid gap-4 md:grid-cols-2"><Info label="Customer mobile" value={bill.customerMobile || 'Not available'} /><Info label="Paid amount" value={formatMoney(bill.paidAmount)} /><Info label="Billing period" value={bill.billingPeriod} /><Info label="Created" value={formatDate(bill.createdAt)} /></section><section className="space-y-4"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">Payments</p><h2 className="mt-1 font-display text-2xl font-bold">Payment history</h2></div><PaymentHistory query={paymentsQuery} /></section><p className="flex items-center gap-2 text-xs text-[#8d8782]"><CalendarDays size={15} /> Payment recording is handled by the backend transaction.</p></div>;
}

function BackLink({ customerId }) { return <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={customerId ? `/customers/${customerId}/bills` : '/bills'}><ArrowLeft size={17} /> Back to bills</Link>; }
function Metric({ label, value, emphasis = false }) { return <div className={`rounded-2xl border border-[#e6e1dd] bg-white p-5 ${emphasis ? 'ring-2 ring-[#f0b1ab]' : ''}`}><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-3 break-words font-display text-2xl font-bold">{value}</p></div>; }
function Info({ label, value }) { return <div className="rounded-2xl border border-[#e6e1dd] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-2 text-sm font-semibold">{value}</p></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : 'Not available'; }