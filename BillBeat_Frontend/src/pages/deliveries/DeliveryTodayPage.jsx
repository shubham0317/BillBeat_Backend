import { RefreshCw, Truck } from 'lucide-react';
import { useState } from 'react';
import PageHeader from '../../components/layout/PageHeader';
import DeliveryCard from '../../components/deliveries/DeliveryCard';
import DeliveryFilters from '../../components/deliveries/DeliveryFilters';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBeats } from '../../queries/beatQueries';
import { usePaperBoys } from '../../queries/paperBoyQueries';
import { useDeliveryMutations, useTodaysDeliveries } from '../../queries/deliveryQueries';

export default function DeliveryTodayPage() {
  const [beatId, setBeatId] = useState('');
  const [paperBoyId, setPaperBoyId] = useState('');
  const query = useTodaysDeliveries({ beatId, paperBoyId });
  const beatsQuery = useBeats();
  const paperBoysQuery = usePaperBoys();
  const { status } = useDeliveryMutations();
  if (query.isLoading) return <LoadingState label="Loading today's deliveries" />;
  if (query.isError) return <div className="space-y-6"><PageHeader eyebrow="Deliveries" title="Today's deliveries" description="The backend could not load today's delivery records." /><ErrorState message={query.error.message} onRetry={query.refetch} /></div>;
  const deliveries = query.data || [];
  return <div className="space-y-7"><PageHeader eyebrow="Deliveries" title="Today's deliveries" description="Delivery records are generated and dated by the backend when this view loads." action={<span className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#706a65] ring-1 ring-[#ded9d4]"><Truck size={17} /> {deliveries.length} records</span>} /><DeliveryFilters beatId={beatId} paperBoyId={paperBoyId} beats={beatsQuery.data || []} paperBoys={paperBoysQuery.data || []} onBeatChange={setBeatId} onPaperBoyChange={setPaperBoyId} />{query.isFetching && <p className="flex items-center gap-2 text-xs font-semibold text-[#d92d20]"><RefreshCw size={14} className="animate-spin" /> Updating delivery list...</p>}{deliveries.length === 0 ? <EmptyState title="No deliveries today" description="The backend returned no delivery records for the selected filters." /> : <section className="grid gap-4 lg:grid-cols-2">{deliveries.map((delivery) => <DeliveryCard key={delivery.id} delivery={delivery} isUpdating={status.isPending} onStatusChange={(nextStatus) => status.mutate({ id: delivery.id, status: nextStatus })} />)}</section>}<p className="text-xs text-[#8d8782]">Newly generated records follow the backend status, which currently defaults to DELIVERED.</p>{status.isError && <ErrorState message={status.error.message} onRetry={() => status.reset()} />}</div>;
}