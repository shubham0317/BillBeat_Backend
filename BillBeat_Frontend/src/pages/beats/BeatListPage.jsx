import { Plus, Route } from 'lucide-react';
import PageHeader from '../../components/layout/PageHeader';
import BeatCard from '../../components/beats/BeatCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBeats } from '../../queries/beatQueries';

export default function BeatListPage() {
  const query = useBeats();
  if (query.isLoading) return <LoadingState label="Loading your beats" />;
  if (query.isError) return <div className="space-y-6"><PageHeader eyebrow="Beats" title="Your delivery areas" description="The backend could not load your vendor beats." /><ErrorState message={query.error.message} onRetry={query.refetch} /></div>;
  const beats = query.data || [];
  return <div className="space-y-8"><PageHeader eyebrow="Beats" title="Your delivery areas" description="Open a beat to review its current operational summary." action={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#706a65] ring-1 ring-[#ded9d4]"><Route size={17} /> {beats.length} total</span>} />{beats.length === 0 ? <EmptyState title="No beats yet" description="No delivery areas have been returned for this vendor." /> : <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{beats.map((beat) => <BeatCard key={beat.id} beat={beat} />)}</section>}<p className="text-xs text-[#8d8782]">Beat creation will be added in a later phase.</p></div>;
}