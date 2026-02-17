import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X, Scale, BookOpen, ShieldAlert, Clock, ChevronRight, Info } from 'lucide-react';
import ShortlistForm from '../components/ShortlistForm';
import { api } from '../api/client';
import { ShortlistFormData } from '../types';

/* ── Info panel (slides from right) ───────────────────────────────────────── */
function InfoPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const steps = [
    'Describe what you need in plain English',
    'Add 1–8 requirements with an importance weight (1–5)',
    'Optionally exclude vendors you\'ve already ruled out',
    'VendorLens identifies, scrapes, and analyses 4 vendors',
    'Review scores, risks, evidence links',
    'Export a Markdown report to share',
  ];

  const features = [
    { icon: Scale,      title: 'Weighted scoring',  body: 'Assign importance 1–5 to each requirement. Scores reflect your priorities.' },
    { icon: BookOpen,   title: 'Evidence links',     body: 'Real URLs and quoted snippets scraped from vendor pages.' },
    { icon: ShieldAlert,title: 'Risks surfaced',     body: 'Every vendor\'s limitations and gotchas, clearly listed.' },
    { icon: Clock,      title: 'History',            body: 'Last 5 shortlists saved automatically. Revisit anytime.' },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/20 z-40 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <div className={`fixed top-0 right-0 h-full w-80 bg-white border-l border-ink-200 z-50 flex flex-col
        transition-transform duration-300 ease-in-out ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ boxShadow: open ? '-8px 0 32px rgba(0,0,0,0.10)' : 'none' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <span className="font-bold text-ink-950 text-sm">How it works</span>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-ink-100 text-ink-400 hover:text-ink-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">
          <div>
            <p className="label-xs mb-3">Steps</p>
            <ol className="space-y-3">
              {steps.map((step, i) => (
                <li key={i} className="flex items-start gap-2.5 text-[12px] text-ink-600 leading-relaxed">
                  <span className="w-4 h-4 rounded bg-ink-950 text-white flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="h-px bg-ink-100" />
          <div>
            <p className="label-xs mb-3">What you get</p>
            <div className="space-y-4">
              {features.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-md bg-ink-100 flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-ink-600" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-ink-900">{title}</p>
                    <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">{body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────────── */
export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [panelOpen, setPanelOpen] = useState(false);

  const handleSubmit = async (data: ShortlistFormData) => {
    setLoading(true);
    setApiError('');
    try {
      const shortlist = await api.createShortlist(data);
      navigate(`/results/${shortlist.id}`);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Something went wrong.');
      setLoading(false);
    }
  };

  return (
    <>
      <InfoPanel open={panelOpen} onClose={() => setPanelOpen(false)} />

      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(180deg, #dde3ec 0%, #eaecf0 40%, #f0f2f5 100%)', zIndex: 0 }}
      />
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(71,85,105,0.20) 1px, transparent 1px)',
          backgroundSize: '26px 26px',
          maskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.1) 100%)',
          WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.25) 60%, rgba(0,0,0,0.1) 100%)',
          zIndex: 1,
        }}
      />
      <div className="relative min-h-[calc(100vh-56px)]" style={{ zIndex: 2 }}>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/40 backdrop-blur-sm border border-white/60 text-ink-700 text-[11px] font-semibold px-3 py-1 rounded-full mb-6">
            <Zap size={10} className="text-hi-500" fill="currentColor" />
            Powered by Gemini 2.5 Flash
          </div>

          <h1 className="text-[2.6rem] sm:text-[3.2rem] font-black leading-[1.07] tracking-tight text-ink-950 mb-4">
            Find the right vendor.
            <br />
            <span className="text-ink-600">In seconds.</span>
          </h1>
          <p className="text-[15px] text-ink-600 max-w-md mx-auto leading-relaxed">
            Describe your need, set requirements, and get a researched vendor shortlist — with pricing, risks, and real evidence links.
          </p>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 relative">
          <div className="flex justify-end mb-3">
            <button
              onClick={() => setPanelOpen(true)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500 hover:text-ink-800
                         hover:bg-white/60 px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Info size={11} />
              How it works
              <ChevronRight size={10} />
            </button>
          </div>

          {apiError && (
            <div className="mb-5 text-sm text-hi-700 bg-hi-50 border border-hi-300 rounded-lg px-4 py-3">
              {apiError}
            </div>
          )}

          <div
            className="border border-white/70 rounded-2xl shadow-card p-4 sm:p-5"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <ShortlistForm onSubmit={handleSubmit} loading={loading} />
          </div>
        </div>
      </div>
    </>
  );
}
