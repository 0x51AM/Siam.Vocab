import { useState } from 'react';
import {
  Cloud,
  HardDrive,
  Loader2,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { Translations } from '../i18n/translations';
import { getSupabaseClient, isSupabaseConfigured } from '../services/supabaseClient';
import { UserProfile } from '../types';
import { PWAInstallButton } from './PWAInstallButton';

interface AccountViewProps {
  t: Translations;
  user: UserProfile | null;
  onSyncNow: () => Promise<void>;
  isSyncing: boolean;
}

export function AccountView({
  t,
  user,
  onSyncNow,
  isSyncing,
}: AccountViewProps) {
  const configured = isSupabaseConfigured();
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      if (authMode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
      } else {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage('Account created! Check your email if confirmation is enabled.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t.account.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
            {t.account.subtitle}
          </p>
        </div>
        <PWAInstallButton t={t} />
      </div>

      {/* Supabase Connection Status */}
      {!configured ? (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-semibold text-sm">
            <HardDrive className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{t.account.localModeTitle}</span>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {t.account.localModeSub}
          </p>
        </section>
      ) : user ? (
        <section className="rounded-xl border border-blue-200 dark:border-blue-900 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Cloud className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t.account.cloudConnected}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void onSyncNow()}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                {isSyncing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                <span>{t.account.syncNow}</span>
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{t.account.signOut}</span>
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setAuthMode('signin')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.account.signIn}
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('signup')}
              className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.account.signUp}
            </button>
          </div>

          {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
          {message && <p className="text-xs text-blue-700 dark:text-blue-400">{message}</p>}

          <form onSubmit={handleAuthSubmit} className="space-y-3 max-w-md">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.account.email}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t.account.password}
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold cursor-pointer"
            >
              {loading
                ? t.common.loading
                : authMode === 'signin'
                  ? t.account.signIn
                  : t.account.signUp}
            </button>
          </form>
        </section>
      )}

      {/* Beginner-friendly Setup Instructions */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t.account.setupGuideTitle}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          {t.account.setupGuideSub}
        </p>
        <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <li>
            Create a free project at <strong>supabase.com</strong> → open <strong>SQL Editor</strong> → paste and run the contents of <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">supabase/schema.sql</code> (enables Row Level Security).
          </li>
          <li>
            In Supabase <strong>Project Settings → API</strong>, copy your <strong>Project URL</strong> and <strong>anon public key</strong>.
          </li>
          <li>
            Deploy to <strong>Cloudflare Pages</strong> from GitHub: set Build command to <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">npm run build</code> and Output directory to <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">dist</code>, and add <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">VITE_SUPABASE_URL</code> + <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-mono text-xs">VITE_SUPABASE_ANON_KEY</code> in Environment Variables.
          </li>
        </ol>
      </section>
    </div>
  );
}
