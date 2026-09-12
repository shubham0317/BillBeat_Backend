import { Newspaper, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import NewspaperCard from '../../components/newspapers/NewspaperCard';
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { useNewspapers } from '../../queries/newspaperQueries';

export default function NewspaperListPage() {
  const query = useNewspapers();
  if (query.isLoading) return <LoadingState label="Loading newspapers" />;
  if (query.isError) return <div className="space-y-6"><PageHeader eyebrow="Newspapers" title="Newspaper catalog" description="The backend could not load your newspaper catalog." /><ErrorState message={query.error.message} onRetry={query.refetch} /></div>;
  const newspapers = query.data || [];
  return <div className="space-y-8"><PageHeader eyebrow="Newspapers" title="Newspaper catalog" description="Manage the newspapers available when creating subscriptions." action={<Link to="/newspapers/new" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Plus size={17} /> Add newspaper</Link>} />{newspapers.length === 0 ? <EmptyState title="No newspapers yet" description="Add a newspaper to make it available for subscriptions." /> : <><div className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#706a65] ring-1 ring-[#ded9d4]"><Newspaper size={17} /> {newspapers.length} total</div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{newspapers.map((newspaper) => <NewspaperCard key={newspaper.id} newspaper={newspaper} />)}</section></>}</div>;
}
