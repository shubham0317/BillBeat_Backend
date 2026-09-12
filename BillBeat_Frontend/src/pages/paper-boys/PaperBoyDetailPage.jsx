import { ArrowLeft, CalendarDays, Pencil, Phone, UserRound } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import StatusBadge from '../../components/common/StatusBadge';
import { ErrorState, LoadingState } from '../../components/common/StateViews';
import PageHeader from '../../components/layout/PageHeader';
import { usePaperBoy } from '../../queries/paperBoyQueries';

export default function PaperBoyDetailPage() {
  const { paperBoyId } = useParams();
  const query = usePaperBoy(paperBoyId);
  if (query.isLoading) return <LoadingState label="Loading paper boy details" />;
  if (query.isError) return <div className="space-y-6"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to="/paper-boys"><ArrowLeft size={17} /> Back to paper boys</Link><ErrorState message={query.error.status === 404 ? 'Paper boy not found.' : query.error.message} onRetry={query.refetch} /></div>;
  const paperBoy = query.data;
  return <div className="space-y-8"><Link className="inline-flex items-center gap-2 text-sm font-semibold text-[#706a65] hover:text-[#b42318]" to="/paper-boys"><ArrowLeft size={17} /> Back to paper boys</Link><PageHeader eyebrow="Paper boy detail" title={paperBoy.name} description="Contact and login information returned by the backend." action={<StatusBadge tone={paperBoy.active ? 'success' : 'neutral'}>{paperBoy.active ? 'Active' : 'Inactive'}</StatusBadge>} /><section className="grid gap-4 md:grid-cols-2"><InfoRow icon={Phone} label="Phone" value={paperBoy.phone} /><InfoRow icon={UserRound} label="Login account" value={paperBoy.username || 'No login account'} /><InfoRow icon={CalendarDays} label="Created" value={formatDate(paperBoy.createdAt)} /></section><Link to={`/paper-boys/${paperBoy.id}/edit`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#d92d20] px-4 text-sm font-semibold text-white hover:bg-[#b42318]"><Pencil size={17} /> Edit paper boy</Link><p className="text-xs text-[#8d8782]">Status is supplied by the backend and cannot be changed here.</p></div>;
}

function InfoRow({ icon: Icon, label, value }) { return <div className="flex items-center gap-4 rounded-2xl border border-[#e6e1dd] bg-white p-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f2efec] text-[#706a65]"><Icon size={18} /></span><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-[#8d8782]">{label}</p><p className="mt-1 text-sm font-semibold text-[#272321]">{value}</p></div></div>; }
function formatDate(value) { return value ? new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Not available'; }
