import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Translations } from '../i18n/translations';

interface OfflineIndicatorProps {
  t: Translations;
}

export function OfflineIndicator({ t }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200 px-4 py-2 text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>{t.common.offlineBanner}</span>
    </div>
  );
}
