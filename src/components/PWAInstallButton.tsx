import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Translations } from '../i18n/translations';

interface PWAInstallButtonProps {
  t: Translations;
  compact?: boolean;
}

export function PWAInstallButton({ t, compact = false }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIosGuide, setShowIosGuide] = useState(false);

  if (isInstalled) return null;
  if (!isInstallable && !isIOS) return null;

  const handleClick = async () => {
    if (isIOS) {
      setShowIosGuide(true);
    } else {
      await install();
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className={
          compact
            ? 'inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer'
            : 'inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer'
        }
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>{t.common.installApp}</span>
      </button>

      {showIosGuide && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
        >
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Share className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  {t.common.iosInstallTitle}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                aria-label={t.common.close}
                className="p-2 min-w-[40px] min-h-[40px] rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {t.common.iosInstallSteps}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowIosGuide(false)}
                className="px-4 py-2 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 cursor-pointer"
              >
                {t.common.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
