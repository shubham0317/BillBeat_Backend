import { ArrowLeft, CalendarDays, Edit3, Repeat2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { useSubscription, useSubscriptionMutations } from '../../queries/subscriptionQueries';

const statuses = ['ACTIVE', 'PAUSED', 'CANCELLED', 'EXPIRED'];

export default function SubscriptionDetailPage() {
  const { subscriptionId } = useParams();
  const query = useSubscription(subscriptionId);
  const { status } = useSubscriptionMutations();
  if (query.isLoading) return <LoadingState label="Loading subscription" />;
  if (query.isError) return <div className="space-y-6"><BackLink /><ErrorState message={query.error.status === 404 ? 'Subscription not found.' : query.error.message} onRetry={query.refetch} /></div>;
  const subscription = query.data;
  const changeStatus = (nextStatus) => { if (nextStatus !== subscription.status) status.mutate({ id: subscription.id, status: nextStatus }); };
  return <div className="space-y-8"><BackLink customerId={subscription.customerId} /><PageHeader eyebrow="Subscription detail" title={subscription.newspaperName} description={`Subscription for ${subscription.customerName}`} action={<StatusBadge tone={subscription.status === 'ACTIVE' ? 'success' : subscription.status === 'CANCELLED' ? 'danger' : 'warning'}>{subscription.status}</StatusBadge>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Copies" value={subscription.copies} /><Metric label="Price per copy" value={formatPrice(subscription.pricePerCopy)} /><Metric label="Start date" value={subscription.startDate} /><Metric label="End date" value={subscription.endDate || 'No end date'} /></section><section className="rounded-2xl border border-[#e6e1dd] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-xl bg-[#fff0ee] text-[#d92d20]"><Repeat2 size={18} /></span><div><h2 className="font-display text-xl font-bold">Delivery schedule</h2><p className="text-sm text-[#706a65]">Days returned by the backend.</p></div></div><div className="mt-5 flex flex-wrap gap-2">{Object.entries(subscription.deliverySchedule || {}).filter(([, enabled]) => enabled).map(([day]) => <span key={day} className="rounded-full bg-[#f2efec] px-3 py-1.5 text-sm font-semibold capitalize text-[#605b57]">{day}</span>)}</div></section><section className="flex flex-wrap gap-3"><Link to={`/subscriptions/${subscription.id}/edit`}><Button variant="secondary"><Edit3 size={16} /> Edit subscription</Button></Link><div className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#ded9d4]"><CalendarDays size={16} className="text-[#8d8782]" /><select aria-label="Subscription status" value={subscription.status} onChange={(event) => changeStatus(event.target.value)} disabled={status.isPending} className="bg-transparent text-sm font-semibold outline-none">{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select></div></section>{status.isError && <ErrorState message={status.error.message} onRetry={() => status.reset()} />}</div>;
}

function BackLink({ customerId }) { return <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={customerId ? `/customers/${customerId}/subscriptions` : '/subscriptions'}><ArrowLeft size={17} /> Back to subscriptions</Link>; }
function Metric({ label, value }) { return <div className="rounded-2xl border border-[#e6e1dd] bg-white p-5"><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-3 break-words font-display text-2xl font-bold">{value}</p></div>; }
function formatPrice(value) { return value === null || value === undefined ? 'Not available' : `₹${Number(value).toFixed(2)}`; }