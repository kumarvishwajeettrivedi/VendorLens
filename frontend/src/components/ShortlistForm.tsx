import { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, ChevronRight, AlertCircle, Search } from 'lucide-react';
import { ShortlistFormData, Requirement } from '../types';

interface Props {
  onSubmit: (data: ShortlistFormData) => void;
  loading: boolean;
}

const EXAMPLES = [
  'Email delivery service for India with high deliverability',
  'Vector database for a small ML team on a tight budget',
  'Hosted PostgreSQL with a generous free tier',
  'Payment gateway supporting Indian UPI and international cards',
];

const WEIGHT_META: Record<number, { label: string; hi: boolean }> = {
  1: { label: 'Low',      hi: false },
  2: { label: 'Minor',    hi: false },
  3: { label: 'Medium',   hi: false },
  4: { label: 'High',     hi: true  },
  5: { label: 'Critical', hi: true  },
};

function WeightPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const { label, hi } = WEIGHT_META[value];
  return (
    <div className="flex items-center gap-1.5 flex-shrink-0">
      <div className="flex gap-[3px]">
        {[1, 2, 3, 4, 5].map((w) => (
          <button
            key={w}
            type="button"
            title={WEIGHT_META[w].label}
            onClick={() => onChange(w)}
            className={`w-[14px] rounded-[2px] transition-all duration-150 hover:opacity-75
              ${w <= value
                ? hi ? 'bg-hi-500' : 'bg-ink-700'
                : 'bg-ink-200'
              }`}
            style={{ height: `${8 + w * 2}px`, alignSelf: 'flex-end' }}
          />
        ))}
      </div>
      <span className={`hidden sm:inline text-[10px] font-semibold w-[42px] ${hi ? 'text-hi-600' : 'text-ink-500'}`}>
        {label}
      </span>
    </div>
  );
}

export default function ShortlistForm({ onSubmit, loading }: Props) {
  const [need, setNeed] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [requirements, setRequirements] = useState<Requirement[]>([
    { text: '', weight: 3 },
    { text: '', weight: 3 },
    { text: '', weight: 3 },
  ]);
  const [excludedInput, setExcludedInput] = useState('');
  const [error, setError] = useState('');
  const expandRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (need.length > 0 && !expanded) setExpanded(true);
  }, [need]);

  const addReq = () => {
    if (requirements.length < 8) setRequirements([...requirements, { text: '', weight: 3 }]);
  };

  const removeReq = (i: number) => {
    if (requirements.length > 1) setRequirements(requirements.filter((_, idx) => idx !== i));
  };

  const updateReq = (i: number, field: keyof Requirement, value: string | number) => {
    const next = [...requirements];
    next[i] = { ...next[i], [field]: value };
    setRequirements(next);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (need.trim().length < 10) {
      setExpanded(true);
      inputRef.current?.focus();
      setError('Please describe your need (at least 10 characters).');
      return;
    }
    const validReqs = requirements.filter((r) => r.text.trim().length > 1);
    const excluded = excludedInput.split(',').map((s) => s.trim()).filter(Boolean);
    onSubmit({ need: need.trim(), requirements: validReqs, excluded_vendors: excluded });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-0">

      <div className={`flex items-center gap-2 transition-all duration-200
        ${expanded ? 'pb-4 border-b border-ink-100 mb-4' : ''}`}
      >
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none"
          />
          <input
            ref={inputRef}
            type="text"
            value={need}
            onChange={(e) => setNeed(e.target.value)}
            onFocus={() => setExpanded(true)}
            placeholder="What do you need? e.g. Email service for India…"
            maxLength={500}
            className="w-full border border-ink-300 rounded-xl pl-9 pr-3 py-3 text-sm text-ink-950
                       placeholder-ink-400 transition-all duration-150 bg-white
                       focus:outline-none focus:border-ink-900 focus:ring-1 focus:ring-ink-900"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary rounded-xl py-3 px-5 whitespace-nowrap flex-shrink-0 text-[13px]"
        >
          {loading ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building…
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Build Shortlist</span>
              <span className="sm:hidden">Build</span>
              <ChevronRight size={14} />
            </span>
          )}
        </button>
      </div>
      <div
        ref={expandRef}
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: expanded ? '900px' : '0px',
          opacity: expanded ? 1 : 0,
          transitionProperty: 'max-height, opacity',
          transitionDuration: '350ms, 200ms',
          transitionTimingFunction: 'ease-in-out, ease',
        }}
      >
        <div className="space-y-5">
          <div>
            <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider mb-2">Try an example</p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => { setNeed(ex); inputRef.current?.focus(); }}
                  className="text-[11px] text-ink-600 bg-ink-100 hover:bg-ink-200 hover:text-ink-900
                             px-2.5 py-1 rounded-lg transition-colors text-left leading-tight max-w-[220px] truncate"
                >
                  {ex}
                </button>
              ))}
            </div>
            <div className="flex justify-end mt-1">
              <span className="text-[10px] text-ink-300">{need.length}/500</span>
            </div>
          </div>

          <div className="h-px bg-ink-100" />
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
                  Requirements
                </p>
                <span className="text-[11px] text-ink-400">
                  {requirements.length}/8
                </span>
              </div>
              <button
                type="button"
                onClick={addReq}
                disabled={requirements.length >= 8}
                className="flex items-center gap-1 text-[11px] text-info-600 hover:text-info-700
                           disabled:opacity-30 disabled:cursor-not-allowed font-medium"
              >
                <Plus size={11} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {requirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-ink-300 font-mono w-3.5 text-right flex-shrink-0">{i + 1}</span>
                  <input
                    type="text"
                    value={req.text}
                    onChange={(e) => updateReq(i, 'text', e.target.value)}
                    placeholder={`e.g. "Free tier available"`}
                    maxLength={200}
                    className="flex-1 border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-900
                               placeholder-ink-300 focus:outline-none focus:border-ink-700 focus:ring-1
                               focus:ring-ink-700 transition-colors bg-white"
                  />
                  <WeightPicker
                    value={req.weight}
                    onChange={(v) => updateReq(i, 'weight', v)}
                  />
                  <button
                    type="button"
                    onClick={() => removeReq(i)}
                    disabled={requirements.length <= 1}
                    className="p-1.5 text-ink-300 hover:text-ink-600 hover:bg-ink-100
                               rounded disabled:opacity-20 transition-colors flex-shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-ink-100" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <p className="text-[11px] font-semibold text-ink-700 uppercase tracking-wider">
                Exclude vendors
              </p>
              <span className="text-[10px] text-ink-400 normal-case">optional · comma-separated</span>
            </div>
            <input
              type="text"
              value={excludedInput}
              onChange={(e) => setExcludedInput(e.target.value)}
              placeholder="e.g. AWS SES, SendGrid"
              className="w-full border border-ink-200 rounded-lg px-3 py-2 text-[13px] text-ink-900
                         placeholder-ink-300 focus:outline-none focus:border-ink-700 focus:ring-1
                         focus:ring-ink-700 transition-colors bg-white"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[13px] text-hi-700 bg-hi-50 border border-hi-200 rounded-lg px-3 py-2.5">
              <AlertCircle size={13} className="flex-shrink-0" />
              {error}
            </div>
          )}
          <p className="text-center text-[11px] text-ink-400 pt-1 pb-2">
            Takes ~20–40 seconds · 4 vendors researched
          </p>
        </div>
      </div>
    </form>
  );
}
