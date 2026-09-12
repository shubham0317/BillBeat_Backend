import { ArrowUpRight, Phone, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function PaperBoyCard({ paperBoy }) {
  return <Link to={`/paper-boys/${paperBoy.id}`} className="group block rounded-2xl border border-[#e6e1dd] bg-white p-5 shadow-[0_8px_24px_rgba(29,27,26,0.04)] transition hover:-translate-y-0.5 hover:border-[#f0b1ab] hover:shadow-[0_12px_30px_rgba(29,27,26,0.08)]"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0ee] text-[#d92d20]"><UserRound size={19} /></span><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-[#1d1b1a]">{paperBoy.name}</h2><p className="mt-1 flex items-center gap-1.5 truncate text-sm text-[#706a65]"><Phone size={14} /> {paperBoy.phone}</p></div></div><ArrowUpRight size={19} className="shrink-0 text-[#a29b95] transition group-hover:text-[#d92d20]" /></div><div className="mt-6 flex items-center justify-between gap-3"><StatusBadge tone={paperBoy.active ? 'success' : 'neutral'}>{paperBoy.active ? 'Active' : 'Inactive'}</StatusBadge><p className="truncate text-xs font-medium text-[#706a65]">{paperBoy.username ? `Login: ${paperBoy.username}` : 'No login account'}</p></div></Link>;
}
