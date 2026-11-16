import { useState } from 'react';
import { Camera, ExternalLink, ImageOff, RefreshCw } from 'lucide-react';
import { Translations } from '../i18n/translations';
import { WikimediaImage } from '../types';

interface VocabPhotoProps {
  image?: WikimediaImage | null;
  alt: string;
  t: Translations;
  heightClass?: string;
  onRequestPick?: () => void;
  onFetchSingle?: () => void;
  isFetching?: boolean;
  hideCaption?: boolean;
}

export function VocabPhoto({
  image,
  alt,
  t,
  heightClass = 'h-48 sm:h-56',
  onRequestPick,
  onFetchSingle,
  isFetching = false,
  hideCaption = false,
}: VocabPhotoProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(image?.thumbUrl && failedUrl !== image.thumbUrl);

  return (
    <div className="w-full space-y-1.5">
      <div
        className={`relative w-full ${heightClass} rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 flex items-center justify-center`}
      >
        {showImage && image ? (
          <img
            src={image.thumbUrl}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={() => setFailedUrl(image.thumbUrl)}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-4 text-center text-slate-500 dark:text-slate-400">
            <ImageOff className="w-7 h-7 opacity-55" />
            <span className="text-xs font-medium max-w-[220px]">{t.common.noPhoto}</span>
            {onFetchSingle && (
              <button
                type="button"
                onClick={onFetchSingle}
                disabled={isFetching}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                <span>{t.common.fetchPhotos}</span>
              </button>
            )}
          </div>
        )}

        {onRequestPick && (
          <button
            type="button"
            onClick={onRequestPick}
            title={t.common.changePhoto}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-950/75 text-white text-xs font-medium hover:bg-slate-950 transition-colors cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>{t.common.changePhoto}</span>
          </button>
        )}
      </div>

      {!hideCaption && showImage && image && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
          <span className="truncate max-w-[70%]">
            {t.common.attribution}: {image.author} · {image.license}
          </span>
          <a
            href={image.pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline shrink-0"
          >
            <span>Wikimedia Commons</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      )}
    </div>
  );
}
