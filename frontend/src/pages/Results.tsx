import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Shortlist } from '../types';
import ComparisonTable from '../components/ComparisonTable';

const POLL_MS = 2000;

const STEPS = [
  'Queued…',
  'Identifying top vendors…',
  'Scraping pricing pages…',
  'Analysing vendors against your requirements…',
  'Generating markdown report…',
];

function ProgressPulse({ step }: { step: string | null }) {
  const idx = STEPS.indexOf(step || '') + 1 || 1;
  const pct = Math.round((idx / STEPS.length) * 100);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Spinner */}
        <div className="flex justify-center mb-8">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-ink-100" />
            <div className="absolute inset-0 rounded-full border-4 border-ink-950 border-t-transparent animate-spin" />
          </div>
        </div>

        {/* Step label */}
        <div className="text-center mb-6">
          <p className="text-base font-bold text-ink-950 mb-1">Building your shortlist</p>
          <p className="text-sm text-info-600 font-medium animate-pulse">
            {step || 'Starting up…'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-[11px] text-ink-400 mb-1.5">
            <span>Progress</span>
            <span>{pct}%</span>
          </div>
          <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-ink-950 rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Steps checklist */}
        <div className="space-y-2">
          {STEPS.map((s, i) => {
            const done = i < idx - 1;
            const active = i === idx - 1;
            return (
              <div key={s} className={`flex items-center gap-2.5 text-[12px] transition-opacity
                ${done ? 'opacity-40' : active ? 'opacity-100' : 'opacity-25'}`}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                  ${done ? 'bg-ink-950' : active ? 'bg-hi-400 animate-pulse' : 'bg-ink-200'}`}
                >
                  {done && (
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1.5 4L3.5 6L6.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <span className={active ? 'font-semibold text-ink-900' : 'text-ink-500'}>{s}</span>
              </div>
            );
          })}
        </div>

        <p className="text-center text-[11px] text-ink-400 mt-6">
          Usually takes 20–40 seconds
        </p>
      </div>
    </div>
  );
}

export default function Results() {
  const { id } = useParams<{ id: string }>();
  const [shortlist, setShortlist] = useState<Shortlist | null>(null);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    if (!id) return 'error';
    try {
      const data = await api.getShortlist(id);
      setShortlist(data);
      return data.status;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load.');
      return 'error';
    }
  }, [id]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    fetchData().then((status) => {
      if (status === 'processing' || status === 'pending') {
        timer = setInterval(async () => {
          const s = await fetchData();
          if (s === 'done' || s === 'error') clearInterval(timer);
        }, POLL_MS);
      }
    });
    return () => clearInterval(timer);
  }, [fetchData]);

  const refresh = () => fetchData();

  const handleExclude = async (name: string) => {
    if (!id) return;
    await api.excludeVendor(id, name);
    refresh();
  };

  const handleInclude = async (name: string) => {
    if (!id) return;
    await api.includeVendor(id, name);
    refresh();
  };

  // Network error
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card p-8 max-w-sm text-center">
          <AlertCircle size={32} className="text-hi-500 mx-auto mb-3" />
          <p className="font-bold text-ink-950 mb-1">Network error</p>
          <p className="text-sm text-ink-500 mb-5">{error}</p>
          <Link to="/" className="btn-primary">← Start over</Link>
        </div>
      </div>
    );
  }

  // Processing
  if (!shortlist || shortlist.status === 'processing' || shortlist.status === 'pending') {
    return <ProgressPulse step={shortlist?.progress ?? null} />;
  }

  // Error from backend
  if (shortlist.status === 'error') {
    const errMsg = shortlist.error_message || 'An unexpected error occurred.';
    const isQuota = errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('rate limit');
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(180deg,#dde3ec 0%,#eaecf0 40%,#f0f2f5 100%)' }}
      >
        <div
          className="border border-white/70 rounded-2xl p-8 max-w-sm w-full text-center"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)' }}
        >
          {/* Icon */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4
            ${isQuota ? 'bg-hi-100' : 'bg-ink-100'}`}
          >
            <AlertCircle size={22} className={isQuota ? 'text-hi-600' : 'text-ink-500'} />
          </div>

          <p className="font-bold text-ink-950 text-base mb-2">
            {isQuota ? 'Rate limit reached' : 'Processing failed'}
          </p>
          <p className="text-[13px] text-ink-600 mb-1 leading-relaxed">{errMsg}</p>
          {isQuota && (
            <p className="text-[11px] text-ink-400 mb-5">
              We automatically tried all API keys. Please wait a moment before retrying.
            </p>
          )}
          {!isQuota && (
            <p className="text-[11px] text-ink-400 mb-5">
              Try rephrasing your need or simplifying your requirements.
            </p>
          )}

          <Link to="/" className="btn-primary gap-2 w-full justify-center">
            <RefreshCw size={13} /> Try again
          </Link>
        </div>
      </div>
    );
  }

  // Done
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb + title */}
        <div className="mb-7">
          <Link to="/" className="inline-flex items-center gap-1.5 text-[12px] text-ink-400 hover:text-ink-700 mb-3 transition-colors">
            <ArrowLeft size={12} /> New search
          </Link>
          <h1 className="text-xl font-black text-ink-950 mb-1.5">Shortlist results</h1>
          <p className="text-sm text-ink-600 italic mb-3 break-words">"{shortlist.need}"</p>
          {shortlist.requirements.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {shortlist.requirements.map((r, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-[11px] bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                  {r.text}
                  <span className={`text-[9px] font-black px-1 rounded ml-0.5 ${r.weight >= 4 ? 'bg-hi-200 text-hi-700' : 'text-ink-400'}`}>
                    w{r.weight}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {shortlist.result ? (
          <ComparisonTable
            result={shortlist.result}
            shortlistId={shortlist.id}
            need={shortlist.need}
            requirements={shortlist.requirements}
            onExclude={handleExclude}
            onInclude={handleInclude}
          />
        ) : (
          <p className="text-ink-400 text-sm">No results available.</p>
        )}
      </div>
    </div>
  );
}
