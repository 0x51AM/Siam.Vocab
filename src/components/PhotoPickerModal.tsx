import { useEffect, useState } from 'react';
import { ExternalLink, ImageOff, Loader2, Search, X } from 'lucide-react';
import { Translations } from '../i18n/translations';
import { buildWikimediaSearchQuery, searchWikimediaPhotos } from '../services/wikimediaService';
import { VocabItem, WikimediaImage } from '../types';

interface PhotoPickerModalProps {
  item: VocabItem;
  t: Translations;
  onSelect: (image: WikimediaImage | null) => void;
  onClose: () => void;
}

export function PhotoPickerModal({ item, t, onSelect, onClose }: PhotoPickerModalProps) {
  const initialQuery = buildWikimediaSearchQuery(item.germanWord, item.english, item.imageQuery);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<WikimediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const photos = await searchWikimediaPhotos(searchTerm, 9);
      setResults(photos);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Wikimedia Commons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch(initialQuery);
  }, [initialQuery]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4"
    >
      <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {item.german} — Wikimedia Commons
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {item.bangla} · {item.english}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="p-2 min-w-[44px] min-h-[44px] rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            runSearch(query);
          }}
          className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex gap-2"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Wikimedia Commons (English or German works best)..."
              className="w-full pl-9 pr-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 min-h-[44px] rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
          >
            {t.common.search}
          </button>
        </form>

        <div className="p-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-sm">{t.common.loading}</span>
            </div>
          ) : error ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm text-rose-600 dark:text-rose-400">{error}</p>
              <button
                type="button"
                onClick={() => runSearch(query)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium cursor-pointer"
              >
                {t.common.retry}
              </button>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
              <ImageOff className="w-8 h-8 opacity-60" />
              <p className="text-sm">{t.common.noPhoto}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {results.map((photo) => (
                <div
                  key={photo.pageUrl}
                  className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950"
                >
                  <button
                    type="button"
                    onClick={() => onSelect(photo)}
                    className="group relative aspect-[4/3] w-full overflow-hidden bg-slate-200 dark:bg-slate-800 cursor-pointer"
                  >
                    <img
                      src={photo.thumbUrl}
                      alt={photo.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </button>
                  <div className="p-2.5 text-xs space-y-1 flex-1 flex flex-col justify-between">
                    <div className="text-slate-700 dark:text-slate-300 font-medium line-clamp-1">
                      {photo.author}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-slate-500 dark:text-slate-400">
                      <span className="truncate">{photo.license}</span>
                      <a
                        href={photo.pageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-700 dark:text-blue-400 hover:underline shrink-0"
                      >
                        <span>Commons</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="px-3 py-2 min-h-[44px] rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            {t.common.noPhoto} (Use neutral placeholder)
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
          >
            {t.common.cancel}
          </button>
        </div>
      </div>
    </div>
  );
}
