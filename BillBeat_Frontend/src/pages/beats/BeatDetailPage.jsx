import { ArrowLeft, CalendarDays, MapPin, UserRound, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import { useBeat } from '../../queries/beatQueries';

export default function BeatDetailPage() {
  const { beatId } = useParams();
  const query = useBeat(beatId);
  if (query.isLoading) return <LoadingState label="Loading beat details" />;
  if (query.isError) return <div className="space-y-6"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to="/beats"><ArrowLeft size={17} /> Back to beats</Link><ErrorState message={query.error.status === 404 ? 'Beat not found.' : query.error.message} onRetry={query.refetch} /></div>;
  const beat = query.data;
  return <div className="space-y-8"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to="/beats"><ArrowLeft size={17} /> Back to beats</Link><PageHeader eyebrow="Beat detail" title={beat.name} description={beat.description || 'Operational summary returned by the backend.'} action={<StatusBadge tone={beat.active ? 'success' : 'neutral'}>{beat.active ? 'Active' : 'Inactive'}</StatusBadge>} /><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric icon={Users} label="Customers" value={beat.customerCount} /><Metric icon={Users} label="Paid" value={beat.paidCount} tone="success" /><Metric icon={Users} label="Due" value={beat.dueCount} tone="danger" /><Metric icon={MapPin} label="Code" value={beat.code || 'Not assigned'} /></section><section className="flex flex-wrap gap-3"><Link to={`/beats/${beat.id}/customers`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Users size={17} /> View customers</Link><Link to={`/beats/${beat.id}/customers/new`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-semibold text-[#272321] ring-1 ring-[#ded9d4] hover:bg-[#f7f5f2]">Add customer</Link></section><section className="grid gap-4 md:grid-cols-2"><InfoRow icon={UserRound} label="Default paper boy" value={beat.defaultPaperBoyName || 'Not assigned'} /><InfoRow icon={CalendarDays} label="Created" value={formatDate(beat.createdAt)} /></section></div>;
}

function Metric({ icon: Icon, label, value, tone = 'neutral' }) { return <div className="rounded-2xl border border-[#e6e1dd] bg-white p-5"><Icon size={18} className={tone === 'danger' ? 'text-[#d92d20]' : tone === 'success' ? 'text-[#247044]' : 'text-[#8d8782]'} /><p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-2 break-words font-display text-2xl font-bold text-[#1d1b1a]">{value}</p></div>; }
function InfoRow({ icon: Icon, label, value }) { return <div className="flex items-center gap-4 rounded-2xl border border-[#e6e1dd] bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2efec] text-[#706a65]"><Icon size={18} /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-1 text-sm font-semibold text-[#272321]">{value}</p></div></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not available'; }