import { Plus, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import CustomerCard from '../../components/customers/CustomerCard';
import CustomerFilters from '../../components/customers/CustomerFilters';
import Pagination from '../../components/common/Pagination';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBeats } from '../../queries/beatQueries';
import { useCustomers } from '../../queries/customerQueries';

export default function CustomerListPage() {
  const { beatId: routeBeatId } = useParams();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [beatId, setBeatId] = useState(routeBeatId || '');
  const [billStatus, setBillStatus] = useState('ALL');
  const [page, setPage] = useState(0);
  const size = 20;
  const beatsQuery = useBeats();
  const customersQuery = useCustomers({ beatId, billStatus, search, page, size });

  useEffect(() => { setBeatId(routeBeatId || ''); setPage(0); }, [routeBeatId]);
  useEffect(() => { const timer = setTimeout(() => { setSearch(searchInput); setPage(0); }, 300); return () => clearTimeout(timer); }, [searchInput]);
  const beats = beatsQuery.data || [];
  const selectedBeat = beats.find((beat) => String(beat.id) === String(beatId));
  const pageData = customersQuery.data;
  const customers = pageData?.content || [];
  const heading = selectedBeat ? `${selectedBeat.name} customers` : 'Customers';
  if (customersQuery.isLoading && !pageData) return <LoadingState label="Loading customers" />;
  if (customersQuery.isError && !pageData) return <div className="space-y-6"><PageHeader eyebrow="Customers" title={heading} description="The backend could not load customers." /><ErrorState message={customersQuery.error.message} onRetry={customersQuery.refetch} /></div>;
  return <div className="space-y-7"><PageHeader eyebrow="Customers" title={heading} description={selectedBeat ? `Customers currently assigned to ${selectedBeat.name}.` : 'Search and review customers returned for your vendor account.'} action={<Link to={selectedBeat ? `/beats/${selectedBeat.id}/customers/new` : '/customers/new'}><span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Plus size={17} /> Add customer</span></Link>} /><CustomerFilters search={searchInput} onSearchChange={setSearchInput} beatId={beatId} beats={beats} billStatus={billStatus} onBeatChange={(value) => { setBeatId(value); setPage(0); }} onStatusChange={(value) => { setBillStatus(value); setPage(0); }} />{customersQuery.isFetching && <p className="text-xs font-semibold text-[#d92d20]">Updating customer list...</p>}{customers.length === 0 ? <EmptyState title={search || billStatus !== 'ALL' ? 'No matching customers' : 'No customers yet'} description={search || billStatus !== 'ALL' ? 'Try adjusting the search or filters.' : 'No customers have been returned for this context.'} /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{customers.map((customer) => <CustomerCard key={customer.id} customer={customer} />)}</section>}<Pagination page={pageData?.pageNumber || 0} totalPages={pageData?.totalPages || 0} totalElements={pageData?.totalElements || 0} onPageChange={setPage} /><div className="flex items-center gap-2 text-xs text-[#8d8782]"><Users size={15} /> Customer data is loaded from the backend.</div></div>;
}