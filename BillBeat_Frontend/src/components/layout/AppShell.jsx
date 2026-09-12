import { BarChart3, Boxes, FileText, Menu, Newspaper, Repeat2, Truck, UserRound, Users, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/beats', label: 'Beats', icon: Boxes },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/paper-boys', label: 'Paper boys', icon: UserRound },
  { to: '/newspapers', label: 'Newspapers', icon: Newspaper },
  { to: '/subscriptions', label: 'Subscriptions', icon: Repeat2 },
  { to: '/bills', label: 'Bills', icon: FileText },
  { to: '/deliveries/today', label: "Today's delivery", icon: Truck },
];

function Navigation({ mobile = false, onNavigate }) {
  return <nav className={mobile ? 'grid grid-cols-4' : 'space-y-1'}>{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={onNavigate} className={({ isActive }) => `flex ${mobile ? 'flex-col gap-1 px-2 py-3 text-[10px]' : 'gap-3 px-3 py-2.5 text-sm'} items-center rounded-xl font-semibold transition-colors ${isActive ? 'bg-[#fff0ee] text-[#b42318]' : 'text-[#706a65] hover:bg-[#f2efec] hover:text-[#272321]'}`}><Icon size={mobile ? 19 : 18} /><span>{label}</span></NavLink>)}</nav>;
}

export default function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { clearSession, user } = useAuth();
  const signOut = () => { clearSession(); navigate('/login', { replace: true }); };
  return <div className="min-h-screen bg-[#f7f5f2] text-[#1d1b1a]"><aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-[#e6e1dd] bg-white px-5 py-6 lg:flex lg:flex-col"><Brand /><div className="mt-10 flex-1"><Navigation /></div><div className="border-t border-[#e6e1dd] pt-4"><p className="truncate px-3 text-xs text-[#8d8782]">{user?.businessName || user?.username || 'Authenticated vendor'}</p><button className="mt-2 min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-[#706a65] hover:bg-[#f2efec] hover:text-[#b42318]" onClick={signOut}>Sign out</button></div></aside><div className="lg:pl-64"><header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#e6e1dd] bg-[#f7f5f2]/95 px-4 backdrop-blur sm:px-8 lg:hidden"><Brand compact /><button className="rounded-lg p-2 text-[#605b57]" aria-label="Open navigation" onClick={() => setMobileMenuOpen(true)}><Menu size={22} /></button></header>{mobileMenuOpen && <div className="fixed inset-0 z-40 bg-[#1d1b1a]/30 lg:hidden" onClick={() => setMobileMenuOpen(false)}><div className="h-full w-72 bg-white p-5" onClick={(event) => event.stopPropagation()}><div className="flex justify-between"><Brand compact /><button aria-label="Close navigation" onClick={() => setMobileMenuOpen(false)}><X size={22} /></button></div><div className="mt-10"><Navigation onNavigate={() => setMobileMenuOpen(false)} /></div><button className="mt-8 min-h-11 w-full rounded-xl px-3 text-left text-sm font-semibold text-[#706a65] hover:bg-[#f2efec] hover:text-[#b42318]" onClick={signOut}>Sign out</button></div></div>}<main className="mx-auto max-w-7xl px-4 py-7 pb-24 sm:px-8 lg:py-10 lg:pb-10"><Outlet /></main><div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#e6e1dd] bg-white lg:hidden"><Navigation mobile /></div></div></div>;
}

function Brand({ compact = false }) { return <div className="flex items-center gap-2"><span className="grid size-9 place-items-center rounded-xl bg-[#d92d20] font-display text-lg font-bold text-white">B</span><span className={`font-display text-xl font-bold tracking-tight ${compact ? '' : 'text-[#1d1b1a]'}`}>BillBeat</span></div>; }
