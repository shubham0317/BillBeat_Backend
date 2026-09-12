import { Search } from 'lucide-react';

export default function SearchInput({ placeholder = 'Search', ...props }) {
  return (
    <label className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-[#ded9d4] focus-within:ring-2 focus-within:ring-[#d92d20]">
      <Search size={18} className="text-[#8d8782]" aria-hidden="true" />
      <input className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#a29b95]" placeholder={placeholder} {...props} />
    </label>
  );
}
