import { Plus, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import PaperBoyCard from '../../components/paper-boys/PaperBoyCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { usePaperBoys } from '../../queries/paperBoyQueries';

export default function PaperBoyListPage() {
  const query = usePaperBoys();
  if (query.isLoading) return <LoadingState label="Loading paper boys" />;
  if (query.isError) return <div className="space-y-6"><PageHeader eyebrow="Paper boys" title="Delivery team" description="The backend could not load your paper boys." /><ErrorState message={query.error.message} onRetry={query.refetch} /></div>;
  const paperBoys = query.data || [];
  return <div className="space-y-8"><PageHeader eyebrow="Paper boys" title="Delivery team" description="Manage the delivery people available for customer assignments." action={<Link to="/paper-boys/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Plus size={17} /> Add paper boy</Link>} />{paperBoys.length === 0 ? <EmptyState title="No paper boys yet" description="Add a paper boy to make them available for assignments." /> : <><div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#706a65] ring-1 ring-[#ded9d4]"><Users size={17} /> {paperBoys.length} total</div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{paperBoys.map((paperBoy) => <PaperBoyCard key={paperBoy.id} paperBoy={paperBoy} />)}</section></>}</div>;
}
