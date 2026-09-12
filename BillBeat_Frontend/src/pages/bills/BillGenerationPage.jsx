import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import BillGenerationForm from '../../components/bills/BillGenerationForm';
import BillCard from '../../components/bills/BillCard';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { useCustomers } from '../../queries/customerQueries';
import { useBillMutations } from '../../queries/billQueries';

export default function BillGenerationPage() {
  const { customerId } = useParams();
  const customersQuery = useCustomers({ page: 0, size: 100, beatId: '', billStatus: 'ALL', search: '' });
  const { generate } = useBillMutations();
  const [generatedBills, setGeneratedBills] = useState(null);
  if (customersQuery.isLoading) return <LoadingState label="Loading customers" />;
  if (customersQuery.isError) return <ErrorState message={customersQuery.error.message} onRetry={customersQuery.refetch} />;
  const submit = (request) => generate.mutate(request, { onSuccess: setGeneratedBills });
  return <div className="mx-auto max-w-4xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={customerId ? `/customers/${customerId}/bills` : '/bills'}><ArrowLeft size={17} /> Back to bills</Link><PageHeader eyebrow="Bill generation" title={customerId ? 'Generate customer bill' : 'Generate bills'} description="The backend applies scheduled-day billing, prior outstanding balances, and duplicate rules." /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><BillGenerationForm customers={customersQuery.data?.content || []} customerId={customerId} onSubmit={submit} isSubmitting={generate.isPending} error={generate.error} /></div>{generatedBills && <section className="space-y-4"><div className="flex items-center gap-2 text-[#247044]"><CheckCircle2 size={20} /><h2 className="font-display text-xl font-bold">Generation completed</h2></div>{generatedBills.length ? <div className="grid gap-4 sm:grid-cols-2">{generatedBills.map((bill) => <BillCard key={bill.id} bill={bill} />)}</div> : <p className="rounded-2xl border border-dashed border-[#d8d1cb] bg-white p-5 text-sm text-[#706a65]">The backend returned no generated bills. This can mean existing bills were skipped in bulk or customers had no billable items.</p>}</section>}</div>;
}