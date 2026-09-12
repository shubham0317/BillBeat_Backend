const tones = {
  neutral: 'bg-[#f2efec] text-[#605b57]',
  success: 'bg-[#e8f5ed] text-[#247044]',
  danger: 'bg-[#fff0ee] text-[#b42318]',
  warning: 'bg-[#fff7df] text-[#8a6116]',
};

export default function StatusBadge({ children, tone = 'neutral' }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}
