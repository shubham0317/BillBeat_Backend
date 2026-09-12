import { AlertCircle, Inbox, LoaderCircle } from 'lucide-react';

export function LoadingState({ label = 'Loading' }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-sm text-[#706a65]"><LoaderCircle className="animate-spin text-[#d92d20]" size={24} /><span>{label}</span></div>;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-[#f2c9c4] bg-[#fff8f7] p-6 text-center text-sm text-[#8f2d25]"><AlertCircle size={24} /><p>{message}</p>{onRetry && <button className="font-semibold underline" onClick={onRetry}>Try again</button>}</div>;
}

export function EmptyState({ title = 'Nothing here yet.', description }) {
  return <div className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#d8d1cb] bg-white p-6 text-center"><Inbox size={25} className="text-[#9d958e]" /><h2 className="font-semibold text-[#272321]">{title}</h2>{description && <p className="max-w-sm text-sm text-[#706a65]">{description}</p>}</div>;
}
