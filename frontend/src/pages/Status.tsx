import { useEffect, useState } from 'react';
import { Activity, Database, Cpu, Server, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { api } from '../api/client';
import { HealthStatus } from '../types';

interface RowProps {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  ok: boolean | null;
}

function StatusRow({ icon: Icon, label, sublabel, ok }: RowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-4 border-b border-ink-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0
          ${ok === null ? 'bg-ink-50 border-ink-200' : ok ? 'bg-ink-950 border-ink-950' : 'bg-hi-50 border-hi-200'}`}
        >
          <Icon size={16} className={ok === null ? 'text-ink-400' : ok ? 'text-white' : 'text-hi-600'} />
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-900">{label}</p>
          <p className="text-[11px] text-ink-400 mt-0.5">{sublabel}</p>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        {ok === null
          ? <Loader2 size={16} className="animate-spin text-ink-400" />
          : ok
          ? <CheckCircle2 size={18} className="text-ink-950" />
          : <XCircle size={18} className="text-hi-500" />
        }
        <span className={`text-[11px] font-bold ${ok === null ? 'text-ink-400' : ok ? 'text-ink-950' : 'text-hi-600'}`}>
          {ok === null ? 'Checking' : ok ? 'Healthy' : 'Down'}
        </span>
      </div>
    </div>
  );
}

export default function Status() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const check = async () => {
    setLoading(true);
    setError('');
    try {
      setHealth(await api.getHealth());
      setCheckedAt(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Health check failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { check(); }, []);

  const ok = health?.status === 'ok';

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-7">
          <div>
            <h1 className="text-xl font-black text-ink-950 flex items-center gap-2">
              <Activity size={18} className="text-ink-400" /> System Status
            </h1>
            {checkedAt && (
              <p className="text-[11px] text-ink-400 mt-0.5">
                Last checked {checkedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            )}
          </div>
          <button
            onClick={check}
            disabled={loading}
            className="btn-ghost disabled:opacity-40 flex-shrink-0"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Overall banner */}
        {health && (
          <div className={`rounded-xl border px-4 py-3 mb-5 flex items-center gap-2 text-sm font-semibold
            ${ok
              ? 'bg-ink-950 border-ink-950 text-white'
              : 'bg-hi-50 border-hi-300 text-hi-800'
            }`}
          >
            {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {ok ? 'All systems operational' : 'Partial degradation detected'}
            {health.latency_ms > 0 && (
              <span className={`ml-auto text-[11px] font-normal ${ok ? 'text-white/60' : 'text-hi-600'}`}>
                {health.latency_ms}ms
              </span>
            )}
          </div>
        )}

        {error && !health && (
          <div className="bg-hi-50 border border-hi-200 rounded-xl p-4 text-sm text-hi-700 mb-5">
            {error}
          </div>
        )}

        {/* Status rows */}
        <div className="card overflow-hidden">
          <div className="px-5">
            <StatusRow
              icon={Server}
              label="Backend API"
              sublabel="FastAPI · Python 3.11"
              ok={loading && !health ? null : (health?.backend ?? false)}
            />
            <StatusRow
              icon={Database}
              label="Database"
              sublabel="SQLite · shortlist storage"
              ok={loading && !health ? null : (health?.database ?? false)}
            />
            <StatusRow
              icon={Cpu}
              label="LLM Connection"
              sublabel={health?.llm_model ? `Google ${health.llm_model}` : 'Google Gemini 2.5 Flash'}
              ok={loading && !health ? null : (health?.llm ?? false)}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
