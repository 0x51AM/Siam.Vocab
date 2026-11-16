import { GermanArticle } from '../types';

interface GermanTextProps {
  german: string;
  article?: GermanArticle;
  className?: string;
}

export function getArticleTextClass(article?: GermanArticle): string {
  if (article === 'der') return 'text-blue-700 dark:text-blue-400';
  if (article === 'die' || article === 'die (Pl.)') return 'text-rose-700 dark:text-rose-400';
  if (article === 'das') return 'text-blue-700 dark:text-blue-400';
  return 'text-slate-900 dark:text-slate-100';
}

export function GermanText({ german, article, className = '' }: GermanTextProps) {
  const trimmed = german.trim();
  const match = trimmed.match(/^(der\/die|der|die|das)\s+(.+)$/i);

  if (!match) {
    return <span className={`font-semibold text-slate-900 dark:text-slate-100 ${className}`}>{german}</span>;
  }

  const prefix = match[1];
  const rest = match[2];
  const colorClass = getArticleTextClass(
    article ??
      (prefix.toLowerCase().startsWith('der')
        ? 'der'
        : prefix.toLowerCase() === 'das'
          ? 'das'
          : 'die')
  );

  return (
    <span className={`font-semibold ${className}`}>
      <span className={colorClass}>{prefix}</span>{' '}
      <span className="text-slate-900 dark:text-slate-100">{rest}</span>
    </span>
  );
}
