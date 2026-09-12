import { ArrowLeft, CalendarDays, Edit3, Hash, Languages, Newspaper } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { useNewspaper } from '../../queries/newspaperQueries';

export default function NewspaperDetailPage() {
  const { newspaperId } = useParams();
  const query = useNewspaper(newspaperId);
  if (query.isLoading) return <LoadingState label="Loading newspaper details" />;
  if (query.isError) return <div className="space-y-6"><BackLink /><ErrorState message={query.error.status === 404 ? 'Newspaper not found.' : query.error.message} onRetry={query.refetch} /></div>;
  const newspaper = query.data;
  return <div className="space-y-8"><BackLink /><PageHeader eyebrow="Newspaper detail" title={newspaper.name} description="Newspaper catalog information returned by the backend." action={<StatusBadge tone={newspaper.active ? 'success' : 'neutral'}>{newspaper.active ? 'Active' : 'Inactive'}</StatusBadge>} /><section className="grid gap-4 sm:grid-cols-2"><InfoRow icon={Newspaper} label="Default price" value={formatPrice(newspaper.defaultPrice)} /><InfoRow icon={Hash} label="Code" value={newspaper.code || 'Not assigned'} />{newspaper.language && <InfoRow icon={Languages} label="Language" value={newspaper.language} />}<InfoRow icon={CalendarDays} label="Created" value={formatDate(newspaper.createdAt)} /></section><Link to={`/newspapers/${newspaper.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Edit3 size={17} /> Edit newspaper</Link><p className="text-xs text-[#8d8782]">Status is supplied by the backend and cannot be changed here.</p></div>;
}

function BackLink() { return <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to="/newspapers"><ArrowLeft size={17} /> Back to newspapers</Link>; }
function InfoRow({ icon: Icon, label, value }) { return <div className="flex items-center gap-4 rounded-2xl border border-[#e6e1dd] bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2efec] text-[#706a65]"><Icon size={18} /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-1 text-sm font-semibold text-[#272321]">{value}</p></div></div>; }
function formatPrice(value) { return value === null || value === undefined ? 'Not available' : `₹${Number(value).toFixed(2)}`; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not available'; }
