import { Plus, Repeat2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import SubscriptionCard from '../../components/subscriptions/SubscriptionCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { useCustomer } from '../../queries/customerQueries';
import { useSubscriptions } from '../../queries/subscriptionQueries';

export default function SubscriptionListPage() {
  const { customerId } = useParams();
  const customerQuery = useCustomer(customerId);
  const query = useSubscriptions(customerId);
  if (query.isLoading || (customerId && customerQuery.isLoading)) return <LoadingState label="Loading subscriptions" />;
  if (query.isError || (customerId && customerQuery.isError)) return <div className="space-y-6"><PageHeader eyebrow="Subscriptions" title="Subscriptions" description="The backend could not load subscriptions." /><ErrorState message={(query.error || customerQuery.error).message} onRetry={() => { query.refetch(); customerQuery.refetch(); }} /></div>;
  const subscriptions = query.data || [];
  const customer = customerQuery.data;
  return <div className="space-y-8"><PageHeader eyebrow="Subscriptions" title={customer ? `${customer.name}'s subscriptions` : 'Subscriptions'} description={customer ? 'Newspaper subscriptions currently returned for this customer.' : 'All newspaper subscriptions returned for your vendor account.'} action={<Link to={customerId ? `/customers/${customerId}/subscriptions/new` : '/subscriptions/new'}><span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Plus size={17} /> Add subscription</span></Link>} />{subscriptions.length === 0 ? <EmptyState title="No subscriptions yet" description={customer ? 'This customer has no subscription records returned by the backend.' : 'No subscription records have been returned for this vendor.'} /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{subscriptions.map((subscription) => <SubscriptionCard key={subscription.id} subscription={subscription} />)}</section>}<p className="flex items-center gap-2 text-xs text-[#8d8782]"><Repeat2 size={15} /> Delivery schedules are displayed from the backend response.</p></div>;
}