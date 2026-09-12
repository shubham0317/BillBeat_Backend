export default function PageHeader({ eyebrow = 'BillBeat', title, description, action }) {
  return <header className="flex flex-col gap-4 border-b border-[#e6e1dd] pb-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[#d92d20]">{eyebrow}</p><h1 className="font-display text-3xl font-bold tracking-tight text-[#1d1b1a] sm:text-4xl">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#706a65]">{description}</p>}</div>{action}</header>;
}
