import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Trash2, AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { Shortlist } from '../types';

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    done:       'bg-ink-950 text-white',
    processing: 'bg-info-100 text-info-700 animate-pulse',
    pending:    'bg-ink-100 text-ink-500',
    error:      'bg-hi-100 text-hi-700',
  };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${styles[status] ?? 'bg-ink-100 text-ink-500'}`}>
      {status}
    </span>
  );
}

function ShortlistRow({ shortlist, onDelete }: { shortlist: Shortlist; onDelete: () => void }) {
  const vendors = shortlist.result?.vendors ?? [];
  const active = vendors.filter((v) => !v.excluded);
  const topVendor = [...active].sort((a, b) => b.overallScore - a.overallScore)[0];
  const createdAt = new Date(shortlist.created_at);

  return (
    <div className="card p-5 hover:shadow-card-hover transition-shadow duration-200 animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <StatusPill status={shortlist.status} />
            <span className="text-[11px] text-ink-400">
              {createdAt.toLocaleDateString()} · {createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm font-semibold text-ink-900 leading-tight line-clamp-2">
            "{shortlist.need}"
          </p>
        </div>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-ink-300 hover:text-ink-700 hover:bg-ink-100 transition-colors flex-shrink-0"
          title="Delete"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Requirements chips */}
      {shortlist.requirements.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {shortlist.requirements.slice(0, 4).map((r, i) => (
            <span key={i} className="text-[10px] bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
              {r.text.slice(0, 32)}{r.text.length > 32 ? '…' : ''}
            </span>
          ))}
          {shortlist.requirements.length > 4 && (
            <span className="text-[10px] text-ink-400">+{shortlist.requirements.length - 4} more</span>
          )}
        </div>
      )}

      {/* Top pick highlight */}
      {topVendor && (
        <div className="flex items-center gap-2 bg-hi-50 border border-hi-200 rounded-lg px-3 py-1.5 mb-3">
          <span className="text-[10px] font-bold text-hi-600 uppercase tracking-wider">Top pick</span>
          <span className="text-[12px] font-semibold text-ink-900">{topVendor.name}</span>
          <span className="text-[10px] text-ink-500 ml-auto">{topVendor.overallScore}/100</span>
        </div>
      )}

      {/* Error */}
      {shortlist.status === 'error' && shortlist.error_message && (
        <div className="flex items-center gap-1.5 text-[11px] text-hi-600 mb-3">
          <AlertCircle size={11} />
          {shortlist.error_message.slice(0, 90)}
        </div>
      )}

      {/* CTA */}
      {shortlist.status === 'done' && (
        <Link
          to={`/results/${shortlist.id}`}
          className="flex items-center gap-1.5 text-[12px] font-semibold text-info-600 hover:text-info-700 group"
        >
          View comparison
          <span className="text-ink-300">({vendors.length} vendor{vendors.length !== 1 ? 's' : ''})</span>
          <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
      {shortlist.status === 'processing' && (
        <div className="flex items-center gap-1.5 text-[12px] text-info-600">
          <Loader2 size={11} className="animate-spin" />
          {(shortlist as any).progress ?? 'Processing…'}
        </div>
      )}
    </div>
  );
}

export default function History() {
  const [shortlists, setShortlists] = useState<Shortlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setShortlists(await api.listShortlists());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this shortlist?')) return;
    try {
      await api.deleteShortlist(id);
      setShortlists((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert('Delete failed.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-xl font-black text-ink-950 flex items-center gap-2">
              <Clock size={18} className="text-ink-400" /> Recent Shortlists
            </h1>
            <p className="text-[12px] text-ink-500 mt-0.5">Your last 5 searches, saved automatically.</p>
          </div>
          <Link to="/" className="btn-secondary text-[12px] py-1.5 px-3 flex-shrink-0">
            + New search
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={22} className="animate-spin text-ink-400" />
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-hi-700 bg-hi-50 border border-hi-200 rounded-xl p-4 text-sm">
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {!loading && !error && shortlists.length === 0 && (
          <div className="text-center py-16 border border-ink-100 rounded-2xl bg-ink-50">
            <Inbox size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-600 font-semibold text-sm">No shortlists yet</p>
            <p className="text-[12px] text-ink-400 mt-1 mb-5">Build your first shortlist to see it here.</p>
            <Link to="/" className="btn-primary text-[13px] py-2 px-4">Get started</Link>
          </div>
        )}

        <div className="space-y-3">
          {shortlists.map((s) => (
            <ShortlistRow key={s.id} shortlist={s} onDelete={() => handleDelete(s.id)} />
          ))}
        </div>
      </div>
    </div>
  );
}
