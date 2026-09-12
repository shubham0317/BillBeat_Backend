import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import CustomerForm from '../../components/customers/CustomerForm';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBeats } from '../../queries/beatQueries';
import { usePaperBoys } from '../../queries/paperBoyQueries';
import { useCustomer, useCustomerMutations } from '../../queries/customerQueries';

export default function CustomerFormPage({ mode }) {
  const isEdit = mode === 'edit';
  const { customerId, beatId: routeBeatId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const beatsQuery = useBeats();
  const paperBoysQuery = usePaperBoys();
  const customerQuery = useCustomer(customerId);
  const { create, update } = useCustomerMutations();
  const mutation = isEdit ? update : create;
  const initialValues = isEdit ? customerQuery.data : { beatId: routeBeatId || searchParams.get('beatId') || '' };
  useEffect(() => { if (mutation.isSuccess && mutation.data?.id) navigate(`/customers/${mutation.data.id}`, { replace: true }); }, [mutation.isSuccess, mutation.data, navigate]);
  if (beatsQuery.isLoading || paperBoysQuery.isLoading || (isEdit && customerQuery.isLoading)) return <LoadingState label={isEdit ? 'Loading customer form' : 'Loading form options'} />;
  if (beatsQuery.isError || paperBoysQuery.isError || (isEdit && customerQuery.isError)) return <ErrorState message={(beatsQuery.error || paperBoysQuery.error || customerQuery.error).message} onRetry={() => { beatsQuery.refetch(); paperBoysQuery.refetch(); customerQuery.refetch(); }} />;
  const submit = (request) => isEdit ? update.mutate({ id: customerId, request }) : create.mutate(request);
  return <div className="mx-auto max-w-3xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={isEdit ? `/customers/${customerId}` : routeBeatId ? `/beats/${routeBeatId}/customers` : '/customers'}><ArrowLeft size={17} /> Back</Link><PageHeader eyebrow={isEdit ? 'Edit customer' : 'New customer'} title={isEdit ? customerQuery.data.name : 'Add a customer'} description="Only fields supported by the customer API are shown." /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><CustomerForm initialValues={initialValues} beats={beatsQuery.data || []} paperBoys={paperBoysQuery.data || []} isSubmitting={mutation.isPending} serverError={mutation.error} onSubmit={submit} submitLabel={isEdit ? 'Save changes' : 'Create customer'} /></div></div>;
}
