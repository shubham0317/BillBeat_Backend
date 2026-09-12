import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import PaymentForm from '../../components/payments/PaymentForm';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBill } from '../../queries/billQueries';
import { usePaymentMutations } from '../../queries/paymentQueries';

export default function PaymentFormPage() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const billQuery = useBill(billId);
  const { record } = usePaymentMutations();
  useEffect(() => { if (record.isSuccess) navigate(`/bills/${billId}`, { replace: true, state: { paymentRecorded: true } }); }, [billId, navigate, record.isSuccess]);
  if (billQuery.isLoading) return <LoadingState label="Loading bill for payment" />;
  if (billQuery.isError) return <ErrorState message={billQuery.error.status === 404 ? 'Bill not found.' : billQuery.error.message} onRetry={billQuery.refetch} />;
  return <div className="mx-auto max-w-xl space-y-7"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to={`/bills/${billId}`}><ArrowLeft size={17} /> Back to bill</Link><PageHeader eyebrow="Payment" title="Record payment" description={`Record a payment against ${billQuery.data.customerName}'s bill.`} /><div className="rounded-3xl border border-[#e6e1dd] bg-white p-5 sm:p-8"><PaymentForm bill={billQuery.data} isSubmitting={record.isPending} serverError={record.error} onSubmit={(request) => record.mutate(request)} /></div></div>;
}