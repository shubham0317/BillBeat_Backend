import { Plus, ReceiptText } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import BillCard from '../../components/bills/BillCard';
import BillFilters from '../../components/bills/BillFilters';
import Pagination from '../../components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { useCustomers } from '../../queries/customerQueries';
import { useBills } from '../../queries/billQueries';

export default function BillListPage() {
  const { customerId: routeCustomerId } = useParams();
  const [customerId, setCustomerId] = useState(routeCustomerId || '');
  const [status, setStatus] = useState('ALL');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [page, setPage] = useState(0);
  const filters = { customerId, status, billingPeriod, page, size: 20 };
  const customersQuery = useCustomers({ page: 0, size: 100, beatId: '', billStatus: 'ALL', search: '' });
  const billsQuery = useBills(filters);
  useEffect(() => { setCustomerId(routeCustomerId || ''); setPage(0); }, [routeCustomerId]);
  const customer = (customersQuery.data?.content || []).find((item) => String(item.id) === String(customerId));
  if (billsQuery.isLoading && !billsQuery.data) return <LoadingState label="Loading bills" />;
  if (billsQuery.isError && !billsQuery.data) return <div className="space-y-6"><PageHeader eyebrow="Bills" title="Bills" description="The backend could not load bills." /><ErrorState message={billsQuery.error.message} onRetry={billsQuery.refetch} /></div>;
  const data = billsQuery.data || { content: [], pageNumber: 0, totalPages: 0, totalElements: 0 };
  return <div className="space-y-7"><PageHeader eyebrow="Bills" title={customer ? `${customer.name}'s bills` : 'Bills'} description={customer ? 'Bills returned for this customer.' : 'Review bills returned for your vendor account.'} action={<Link to={customerId ? `/customers/${customerId}/bills/generate` : '/bills/generate'}><span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Plus size={17} /> Generate bills</span></Link>} /><BillFilters customerId={customerId} customers={customersQuery.data?.content || []} status={status} billingPeriod={billingPeriod} onCustomerChange={(value) => { setCustomerId(value); setPage(0); }} onStatusChange={(value) => { setStatus(value); setPage(0); }} onPeriodChange={(value) => { setBillingPeriod(value); setPage(0); }} />{billsQuery.isFetching && <p className="text-xs font-semibold text-[#d92d20]">Updating bill list...</p>}{data.content.length === 0 ? <EmptyState title="No bills found" description="The backend returned no bills for the selected filters." /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{data.content.map((bill) => <BillCard key={bill.id} bill={bill} />)}</section>}<Pagination page={data.pageNumber || 0} totalPages={data.totalPages || 0} totalElements={data.totalElements || 0} onPageChange={setPage} /><p className="flex items-center gap-2 text-xs text-[#8d8782]"><ReceiptText size={15} /> Amounts and statuses are displayed from backend responses.</p></div>;
}