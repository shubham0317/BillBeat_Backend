import { CheckCheck, Clock3, MessageCircle, OctagonAlert, Send, XCircle } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

const statusLabels = { CREATED: 'Not sent', QUEUED: 'Queued', SENDING: 'Sending', SENT: 'Sent', DELIVERED: 'Delivered', READ: 'Read', FAILED: 'Failed', RETRY_PENDING: 'Retry pending' };
const statusTones = { CREATED: 'neutral', QUEUED: 'warning', SENDING: 'warning', SENT: 'success', DELIVERED: 'success', READ: 'success', FAILED: 'danger', RETRY_PENDING: 'warning' };
const icons = { CREATED: Clock3, QUEUED: Clock3, SENDING: Send, SENT: Send, DELIVERED: CheckCheck, READ: CheckCheck, FAILED: XCircle, RETRY_PENDING: OctagonAlert };

export default function WhatsAppStatus({ status, details, isLoading, error, compact = false }) {
  const safeStatus = status || 'CREATED';
  const Icon = icons[safeStatus] || MessageCircle;

  if (compact) {
    const iconColor = safeStatus === 'FAILED'
      ? 'text-[#b42318]'
      : safeStatus === 'CREATED'
      ? 'text-[#8d8782]'
      : ['QUEUED', 'SENDING', 'RETRY_PENDING'].includes(safeStatus)
      ? 'text-[#b54708]'
      : 'text-[#247044]';

    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-[#706a65]">
        <Icon size={13} className={iconColor} />
        <StatusBadge tone={statusTones[safeStatus] || 'neutral'}>
          {statusLabels[safeStatus] || safeStatus}
        </StatusBadge>
      </span>
    );
  }

  if (isLoading) return <div className="flex items-center gap-2 text-sm text-[#706a65]"><Clock3 size={16} className="animate-pulse" /> Checking WhatsApp status...</div>;
  if (error?.status === 404) return <div className="flex items-center gap-2 text-sm text-[#706a65]"><Clock3 size={17} className="text-[#8d8782]" /><StatusBadge tone="neutral">Not sent</StatusBadge></div>;
  if (error && !status) return <p className="text-sm text-[#b42318]">{error.message}</p>;

  const iconColor = safeStatus === 'FAILED' ? 'text-[#b42318]' : 'text-[#247044]';

  return <div className="flex flex-wrap items-center gap-2"><Icon size={17} className={iconColor} /><StatusBadge tone={statusTones[safeStatus] || 'neutral'}>{statusLabels[safeStatus] || safeStatus}</StatusBadge>{details?.attemptCount > 0 && <span className="text-xs text-[#8d8782]">Attempt {details.attemptCount}</span>}{details?.lastError && <span className="text-xs text-[#b42318]">{details.lastError}</span>}</div>;
}