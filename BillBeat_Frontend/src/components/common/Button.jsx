export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-[#d92d20] text-white hover:bg-[#b42318]',
    secondary: 'bg-white text-[#1d1b1a] ring-1 ring-[#ded9d4] hover:bg-[#f7f5f2]',
    ghost: 'text-[#605b57] hover:bg-[#f2efec] hover:text-[#1d1b1a]',
  };

  return (
    <button
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
