import { ArrowUpRight, Languages, Newspaper } from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';

export default function NewspaperCard({ newspaper }) {
  return <Link to={`/newspapers/${newspaper.id}`} className="group block rounded-2xl border border-[#e6e1dd] bg-white p-5 shadow-[0_8px_24px_rgba(29,27,26,0.04)] transition hover:-translate-y-0.5 hover:border-[#f0b1ab] hover:shadow-[0_12px_30px_rgba(29,27,26,0.08)]"><div className="flex items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff0ee] text-[#d92d20]"><Newspaper size={19} /></span><div className="min-w-0"><h2 className="truncate font-display text-lg font-bold text-[#1d1b1a]">{newspaper.name}</h2><p className="mt-1 truncate text-sm text-[#706a65]">{newspaper.code || 'No code assigned'}</p></div></div><ArrowUpRight size={19} className="shrink-0 text-[#a29b95] transition group-hover:text-[#d92d20]" /></div><div className="mt-6 flex items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#8d8782]">Default price</p><p className="mt-1 font-display text-2xl font-bold text-[#1d1b1a]">{formatPrice(newspaper.defaultPrice)}</p></div><div className="text-right"><StatusBadge tone={newspaper.active ? 'success' : 'neutral'}>{newspaper.active ? 'Active' : 'Inactive'}</StatusBadge>{newspaper.language && <p className="mt-2 flex items-center justify-end gap-1 text-xs text-[#706a65]"><Languages size={13} /> {newspaper.language}</p>}</div></div></Link>;
}

function formatPrice(value) { return value === null || value === undefined ? 'Not available' : `₹${Number(value).toFixed(2)}`; }
