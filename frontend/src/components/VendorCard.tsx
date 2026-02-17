import { useState } from 'react';
import { ExternalLink, ChevronDown, ChevronUp, Check, X, EyeOff, Eye, Minus } from 'lucide-react';
import { Vendor } from '../types';

interface Props {
  vendor: Vendor;
  rank: number;
  onExclude: () => void;
  onInclude: () => void;
}

function scoreBadge(v: number) {
  if (v >= 80) return 'score-hi';
  if (v >= 60) return 'score-mid';
  return 'score-lo';
}

function ScoreBar({ value, label }: { value: number; label: string }) {
  const filled = Math.round(value / 10);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[11px] text-ink-500">{label}</span>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${scoreBadge(value)}`}>{value}</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-all duration-500 ${i < filled ? 'bg-ink-900' : 'bg-ink-100'}`}
            style={{ transitionDelay: `${i * 40}ms` }}
          />
        ))}
      </div>
    </div>
  );
}

export default function VendorCard({ vendor, rank, onExclude, onInclude }: Props) {
  const [showFeatures, setShowFeatures] = useState(true);
  const [showEvidence, setShowEvidence] = useState(false);

  if (vendor.excluded) {
    return (
      <div className="border border-ink-200 rounded-xl p-4 bg-ink-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-ink-400">
          <EyeOff size={14} />
          <span className="text-sm font-medium">{vendor.name}</span>
          <span className="text-xs">excluded</span>
        </div>
        <button onClick={onInclude} className="flex items-center gap-1 text-xs text-info-600 hover:text-info-700 font-medium">
          <Eye size={11} /> Restore
        </button>
      </div>
    );
  }

  const satisfied = vendor.matchedFeatures.filter((f) => f.satisfied).length;
  const total = vendor.matchedFeatures.length;
  const isTopPick = rank === 1;

  return (
    <div className={`card hover:shadow-card-hover transition-shadow duration-200 animate-slide-up overflow-hidden
      ${isTopPick ? 'ring-2 ring-hi-400' : ''}`}
      style={{ animationDelay: `${rank * 60}ms` }}
    >
      {/* Top pick ribbon */}
      {isTopPick && (
        <div className="bg-hi-400 text-hi-900 text-[10px] font-black uppercase tracking-widest px-4 py-1 text-center">
          Top Pick
        </div>
      )}

      {/* Header */}
      <div className="p-5 pb-4 border-b border-ink-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap mb-0.5">
              <h3 className="font-bold text-ink-950 text-base">{vendor.name}</h3>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${scoreBadge(vendor.overallScore)}`}>
                {vendor.overallScore}/100
              </span>
            </div>
            <a
              href={vendor.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-info-600 hover:underline truncate"
            >
              <ExternalLink size={10} />
              {vendor.website.replace(/^https?:\/\//, '')}
            </a>
          </div>
          <button
            onClick={onExclude}
            className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink-700 hover:bg-ink-100 px-2 py-1 rounded transition-colors whitespace-nowrap"
          >
            <EyeOff size={11} /> Exclude
          </button>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Price */}
        <div className="flex items-start gap-3">
          <span className="label-xs w-12 pt-0.5">Price</span>
          <span className="text-sm text-ink-800 font-medium leading-tight">{vendor.priceRange}</span>
        </div>

        {/* Tags */}
        {vendor.tags.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {vendor.tags.map((tag) => (
              <span key={tag} className="text-[10px] font-medium bg-ink-100 text-ink-600 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Score bars */}
        <div className="grid grid-cols-2 gap-3">
          <ScoreBar value={vendor.matchScore} label="Req. match" />
          <ScoreBar value={vendor.overallScore} label="Overall" />
        </div>

        {/* Requirements */}
        <div>
          <button
            onClick={() => setShowFeatures((v) => !v)}
            className="flex items-center justify-between w-full text-[12px] font-semibold text-ink-700 hover:text-ink-950 mb-2 group"
          >
            <span>
              Requirements
              <span className="ml-1 font-normal text-ink-400">({satisfied}/{total} met)</span>
            </span>
            {showFeatures ? <ChevronUp size={13} className="text-ink-400" /> : <ChevronDown size={13} className="text-ink-400" />}
          </button>

          {showFeatures && (
            <div className="space-y-1.5 animate-fade-in">
              {vendor.matchedFeatures.map((feat, i) => (
                <div key={i} className="flex items-start gap-2">
                  <div className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center
                    ${feat.satisfied ? 'bg-ink-950' : 'bg-ink-200'}`}
                  >
                    {feat.satisfied
                      ? <Check size={9} className="text-white" />
                      : <X size={9} className="text-ink-500" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[12px] text-ink-800 font-medium">{feat.requirement}</span>
                      {feat.weight >= 4 && (
                        <span className="text-[9px] font-black bg-hi-100 text-hi-700 px-1 rounded uppercase tracking-wide">
                          w:{feat.weight}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-ink-500 mt-0.5 leading-relaxed">{feat.notes}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Risks */}
        {vendor.risks.length > 0 && (
          <div>
            <p className="text-[12px] font-semibold text-ink-700 mb-1.5">Limitations</p>
            <div className="space-y-1">
              {vendor.risks.map((risk, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px] text-hi-700 bg-hi-50 border border-hi-200 rounded-md px-2.5 py-1.5">
                  <Minus size={10} className="flex-shrink-0 mt-0.5" />
                  {risk}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evidence */}
        {vendor.evidenceLinks.length > 0 && (
          <div>
            <button
              onClick={() => setShowEvidence((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-info-600 hover:text-info-700 font-medium mb-2"
            >
              {showEvidence ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              {showEvidence ? 'Hide' : 'View'} sources ({vendor.evidenceLinks.length})
            </button>
            {showEvidence && (
              <div className="space-y-1.5 animate-fade-in">
                {vendor.evidenceLinks.map((ev, i) => (
                  <div key={i} className="bg-ink-50 border border-ink-200 rounded-md p-2.5">
                    <a
                      href={ev.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[11px] text-info-600 hover:underline truncate mb-1"
                    >
                      <ExternalLink size={9} />
                      {ev.url}
                    </a>
                    {ev.snippet && (
                      <p className="text-[11px] text-ink-500 italic line-clamp-2">
                        "{ev.snippet}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
