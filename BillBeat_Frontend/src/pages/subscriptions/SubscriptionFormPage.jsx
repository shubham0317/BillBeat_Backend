import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import SubscriptionForm from '../../components/subscriptions/SubscriptionForm';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { useCustomers } from '../../queries/customerQueries';
import { useNewspapers } from '../../queries/newspaperQueries';
import { useSubscription, useSubscriptionMutations } from '../../queries/subscriptionQueries';

export default function SubscriptionFormPage({ mode }) {
  const isEdit = mode === 'edit';
  const { subscriptionId, customerId: routeCustomerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const subscriptionQuery = useSubscription(subscriptionId);
  const customerId = routeCustomerId || searchParams.get('customerId') || subscriptionQuery.data?.customerId;
  const customersQuery = useCustomers({ page: 0, size: 100, beatId: '', billStatus: 'ALL', search: '' });
  const newspapersQuery = useNewspapers();
  const { create, update } = useSubscriptionMutations();
  const mutation = isEdit ? update : create;
  const initialValues = isEdit ? subscriptionQuery.data : { customerId: customerId || '' };
  useEffect(() => { if (mutation.isSuccess && mutation.data?.id) navigate(`/subscriptions/${mutation.data.id}`, { replace: true }); }, [mutation.isSuccess, mutation.data, navigate]);
  if (customersQuery.isLoading || newspapersQuery.isLoading || (isEdit && subscriptionQuery.isLoading)) return <LoadingState label="Loading subscription form" />;
  if (customersQuery.isError || newspapersQuery.isError || (isEdit && subscriptionQuery.isError)) return <ErrorState message={(customersQuery.error || newspapersQuery.error || subscriptionQuery.error).message} onRetry={() => { customersQuery.refetch(); newspapersQuery.refetch(); subscriptionQuery.refetch(); }} />;
  const customers = customersQuery.data?.content || [];
  const submit = (request) => isEdit ? update.mutate({ id: subscriptionId, request }) : create.mutate(request);
  return <div className="mx-auto max-w-4xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={isEdit ? `/subscriptions/${subscriptionId}` : customerId ? `/customers/${customerId}/subscriptions` : '/subscriptions'}><ArrowLeft size={17} /> Back</Link><PageHeader eyebrow={isEdit ? 'Edit subscription' : 'New subscription'} title={isEdit ? subscriptionQuery.data.newspaperName : 'Add a subscription'} description="Use the exact newspaper, customer, date, price, and schedule fields supported by the backend." /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><SubscriptionForm initialValues={initialValues} customers={customers} newspapers={newspapersQuery.data || []} lockedCustomerId={routeCustomerId} isSubmitting={mutation.isPending} serverError={mutation.error} onSubmit={submit} submitLabel={isEdit ? 'Save changes' : 'Create subscription'} /></div></div>;
}