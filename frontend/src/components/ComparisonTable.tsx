import { useState } from 'react';
import { Download, ArrowUpDown, RotateCcw, Loader2 } from 'lucide-react';
import type jsPDFType from 'jspdf';
import { ShortlistResult, Vendor, Requirement } from '../types';
import VendorCard from './VendorCard';

interface Props {
  result: ShortlistResult;
  shortlistId: string;
  need?: string;
  requirements?: Requirement[];
  onExclude: (name: string) => void;
  onInclude: (name: string) => void;
}

type SortKey = 'overallScore' | 'matchScore' | 'name';

// ── Brand colours (matches Tailwind config) ──────────────────────────────────
type RGB = [number, number, number];
const C: Record<string, RGB> = {
  dark:        [15,  23,  42],
  mid:         [71,  85,  105],
  light:       [229, 229, 229],
  xlight:      [245, 245, 245],
  white:       [255, 255, 255],
  blue:        [37,  99,  235],
  blueLight:   [219, 234, 254],
  yellow:      [234, 179, 8],
  yellowLight: [254, 249, 195],
  green:       [22,  163, 74],
  greenLight:  [220, 252, 231],
  red:         [220, 38,  38],
  redLight:    [254, 226, 226],
};

// ── PDF helpers ───────────────────────────────────────────────────────────────

type jsPDF = InstanceType<typeof jsPDFType>;

function fill(doc: jsPDF, c: RGB) { doc.setFillColor(c[0], c[1], c[2]); }
function ink(doc: jsPDF, c: RGB)  { doc.setTextColor(c[0], c[1], c[2]); }
function stroke(doc: jsPDF, c: RGB) { doc.setDrawColor(c[0], c[1], c[2]); }

function addPageBand(doc: jsPDF, date: string) {
  fill(doc, C.dark);
  doc.rect(0, 0, 210, 11, 'F');
  ink(doc, C.white);
  doc.setFontSize(8); doc.setFont('helvetica', 'bold');
  doc.text('VendorLens', 15, 7.5);
  doc.setFont('helvetica', 'normal');
  doc.text(date, 195, 7.5, { align: 'right' });
}

function newPage(doc: jsPDF, date: string): number {
  doc.addPage();
  addPageBand(doc, date);
  return 18; // y after header
}

function checkPage(doc: jsPDF, y: number, needed: number, date: string): number {
  if (y + needed > 272) return newPage(doc, date);
  return y;
}

function scoreBar(doc: jsPDF, x: number, y: number, w: number, score: number) {
  const h = 3.5;
  fill(doc, C.light); doc.rect(x, y, w, h, 'F');
  const barColor: RGB = score >= 7 ? C.green : score >= 5 ? C.yellow : C.red;
  fill(doc, barColor); doc.rect(x, y, (w * score) / 10, h, 'F');
}

function weightLabel(w: number): string {
  return ['', 'Low', 'Minor', 'Medium', 'High', 'Critical'][w] ?? String(w);
}

function getLastY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 0;
}

// ── Main PDF generator ────────────────────────────────────────────────────────

async function generatePDF(
  result: ShortlistResult,
  shortlistId: string,
  need: string,
  requirements: Requirement[],
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210, ML = 15, MR = 15, CW = W - ML - MR;
  const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const activeVendors = result.vendors.filter((v: Vendor) => !v.excluded);

  // ── Page 1 header band ───────────────────────────────────────────────────
  addPageBand(doc, date);

  // Title
  let y = 20;
  ink(doc, C.dark); doc.setFontSize(22); doc.setFont('helvetica', 'bold');
  doc.text('Vendor Shortlist Report', ML, y); y += 7;
  ink(doc, C.mid); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Powered by VendorLens · Gemini 2.5 Flash', ML, y); y += 9;

  stroke(doc, C.light); doc.setLineWidth(0.3);
  doc.line(ML, y, W - MR, y); y += 8;

  // Search query box
  fill(doc, C.xlight); doc.roundedRect(ML, y, CW, 16, 2, 2, 'F');
  ink(doc, C.mid); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
  doc.text('YOUR SEARCH', ML + 4, y + 5);
  ink(doc, C.dark); doc.setFontSize(10); doc.setFont('helvetica', 'normal');
  const needLine = doc.splitTextToSize(need || '—', CW - 8);
  doc.text(needLine[0], ML + 4, y + 12);
  y += 22;

  // Requirements table
  if (requirements.length > 0) {
    ink(doc, C.mid); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
    doc.text('REQUIREMENTS', ML, y); y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: ML, right: MR },
      head: [['#', 'Requirement', 'Importance']],
      body: requirements.map((r, i) => [
        `${i + 1}`,
        r.text,
        `${weightLabel(r.weight)} (${r.weight}/5)`,
      ]),
      styles: { fontSize: 9, cellPadding: 2.5, overflow: 'linebreak' },
      headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 7.5, fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
      },
      alternateRowStyles: { fillColor: C.xlight },
      didDrawPage: () => { addPageBand(doc, date); },
    });
    y = getLastY(doc) + 8;
  }

  // Overview table
  y = checkPage(doc, y, 40, date);
  ink(doc, C.mid); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
  doc.text('VENDOR OVERVIEW', ML, y); y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: ML, right: MR },
    head: [['Rank', 'Vendor', 'Price Range', 'Match', 'Overall']],
    body: activeVendors.map((v: Vendor, i: number) => [
      `#${i + 1}`,
      v.name,
      v.priceRange,
      `${v.matchScore}/10`,
      `${v.overallScore}/10`,
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: C.dark, textColor: C.white, fontSize: 7.5, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 22, halign: 'center' },
    },
    alternateRowStyles: { fillColor: C.xlight },
    didParseCell: (data) => {
      if (data.section === 'body' && (data.column.index === 3 || data.column.index === 4)) {
        const score = parseFloat(String(data.cell.text));
        if (score >= 7) data.cell.styles.textColor = C.green;
        else if (score <= 4) data.cell.styles.textColor = C.red;
      }
    },
    didDrawPage: () => { addPageBand(doc, date); },
  });
  y = getLastY(doc) + 10;

  // ── Per-vendor detail sections ─────────────────────────────────────────────
  for (let vi = 0; vi < activeVendors.length; vi++) {
    const v = activeVendors[vi];

    // Vendor header — needs ~55 mm minimum; push to new page if tight
    y = checkPage(doc, y, 55, date);

    // Dark header block
    fill(doc, C.dark); doc.rect(ML, y, CW, 15, 'F');

    // Yellow rank badge
    fill(doc, C.yellow); doc.rect(ML, y, 13, 15, 'F');
    ink(doc, C.dark); doc.setFontSize(10); doc.setFont('helvetica', 'bold');
    doc.text(`#${vi + 1}`, ML + 6.5, y + 9.5, { align: 'center' });

    // Vendor name
    ink(doc, C.white); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(v.name, ML + 17, y + 9.5);

    // Scores (right-aligned)
    doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(`Match ${v.matchScore}/10  ·  Overall ${v.overallScore}/10`, W - MR, y + 9.5, { align: 'right' });
    y += 18;

    // Website + price
    ink(doc, C.blue); doc.setFontSize(8); doc.setFont('helvetica', 'normal');
    doc.text(v.website || '—', ML, y);
    ink(doc, C.mid);
    doc.text(`Price: ${v.priceRange}`, W - MR, y, { align: 'right' });
    y += 6;

    // Score bar
    scoreBar(doc, ML, y, CW, v.overallScore);
    ink(doc, C.mid); doc.setFontSize(6.5);
    doc.text(`Overall score: ${v.overallScore}/10`, W - MR, y - 1, { align: 'right' });
    y += 7;

    // Requirements analysis table
    if (v.matchedFeatures.length > 0) {
      y = checkPage(doc, y, 20, date);
      ink(doc, C.mid); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('REQUIREMENTS ANALYSIS', ML, y); y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        head: [['Requirement', 'Status', 'Notes']],
        body: v.matchedFeatures.map((mf) => [
          mf.requirement,
          mf.satisfied ? '✓  Met' : '✗  Not met',
          mf.notes || '—',
        ]),
        styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak' },
        headStyles: { fillColor: C.mid, textColor: C.white, fontSize: 7, fontStyle: 'bold' },
        columnStyles: { 1: { cellWidth: 26, halign: 'center' } },
        alternateRowStyles: { fillColor: C.xlight },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 1) {
            const isMet = String(data.cell.text).startsWith('✓');
            data.cell.styles.textColor = isMet ? C.green : C.red;
            data.cell.styles.fontStyle = 'bold';
          }
        },
        didDrawPage: () => { addPageBand(doc, date); },
      });
      y = getLastY(doc) + 6;
    }

    // Risks table
    if (v.risks.length > 0) {
      y = checkPage(doc, y, 20, date);
      ink(doc, C.red); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('RISKS & LIMITATIONS', ML, y); y += 4;

      autoTable(doc, {
        startY: y,
        margin: { left: ML, right: MR },
        body: v.risks.slice(0, 6).map((r) => [`• ${r}`]),
        styles: { fontSize: 8.5, cellPadding: 2.5, overflow: 'linebreak', fillColor: C.redLight, textColor: C.dark },
        columnStyles: { 0: { fontStyle: 'normal' } },
        didDrawPage: () => { addPageBand(doc, date); },
      });
      y = getLastY(doc) + 6;
    }

    // Evidence links
    if (v.evidenceLinks.length > 0) {
      y = checkPage(doc, y, 20, date);
      ink(doc, C.mid); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('EVIDENCE SOURCES', ML, y); y += 5;

      v.evidenceLinks.slice(0, 4).forEach((ev) => {
        y = checkPage(doc, y, 14, date);
        ink(doc, C.blue); doc.setFontSize(7.5); doc.setFont('helvetica', 'normal');
        const url = ev.url.length > 80 ? ev.url.slice(0, 77) + '…' : ev.url;
        doc.text(`• ${url}`, ML, y); y += 4.5;
        if (ev.snippet) {
          ink(doc, C.mid); doc.setFontSize(7);
          const snippetLines = doc.splitTextToSize(`"${ev.snippet.slice(0, 140)}"`, CW - 6);
          doc.text(snippetLines, ML + 4, y); y += snippetLines.length * 3.8;
        }
        y += 2;
      });
      y += 4;
    }

    y += 8; // gap between vendors
  }

  // ── Summary & Recommendation ───────────────────────────────────────────────
  if (result.summary || result.recommendation) {
    y = checkPage(doc, y, 30, date);
    stroke(doc, C.light); doc.setLineWidth(0.3);
    doc.line(ML, y, W - MR, y); y += 8;

    if (result.summary) {
      const lines = doc.splitTextToSize(result.summary, CW - 12);
      const boxH = lines.length * 4.8 + 14;
      y = checkPage(doc, y, boxH, date);
      fill(doc, C.blueLight); doc.rect(ML, y, CW, boxH, 'F');
      fill(doc, C.blue);      doc.rect(ML, y, 3, boxH, 'F');
      ink(doc, C.blue); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('SUMMARY', ML + 7, y + 6);
      ink(doc, C.dark); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(lines, ML + 7, y + 11);
      y += boxH + 7;
    }

    if (result.recommendation) {
      const lines = doc.splitTextToSize(result.recommendation, CW - 12);
      const boxH = lines.length * 4.8 + 14;
      y = checkPage(doc, y, boxH, date);
      fill(doc, C.yellowLight); doc.rect(ML, y, CW, boxH, 'F');
      fill(doc, C.yellow);      doc.rect(ML, y, 3, boxH, 'F');
      ink(doc, [120, 90, 0] as RGB); doc.setFontSize(6.5); doc.setFont('helvetica', 'bold');
      doc.text('RECOMMENDATION', ML + 7, y + 6);
      ink(doc, C.dark); doc.setFontSize(9); doc.setFont('helvetica', 'normal');
      doc.text(lines, ML + 7, y + 11);
    }
  }

  // ── Footer on every page ───────────────────────────────────────────────────
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    fill(doc, C.dark); doc.rect(0, 284, 210, 13, 'F');
    ink(doc, [100, 116, 139] as RGB); doc.setFontSize(7); doc.setFont('helvetica', 'normal');
    doc.text('VendorLens  ·  Powered by Gemini 2.5 Flash', ML, 291);
    doc.text(`Page ${p} of ${total}  ·  ${date}`, W - MR, 291, { align: 'right' });
  }

  doc.save(`vendorlens-${shortlistId.slice(0, 8)}.pdf`);
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ComparisonTable({ result, shortlistId, need, requirements, onExclude, onInclude }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('overallScore');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [showExcluded, setShowExcluded] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...result.vendors].sort((a, b) => {
    const av = sortKey === 'name' ? a.name : a[sortKey];
    const bv = sortKey === 'name' ? b.name : b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string')
      return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
    return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  const activeVendors = sorted.filter((v) => !v.excluded);
  const excludedCount = result.vendors.filter((v) => v.excluded).length;
  const visible = showExcluded ? sorted : activeVendors;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => toggleSort(k)}
      className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded transition-colors
        ${sortKey === k ? 'bg-ink-950 text-white' : 'text-ink-500 hover:text-ink-900 hover:bg-ink-100'}`}
    >
      {label}
      {sortKey === k && <ArrowUpDown size={10} />}
    </button>
  );

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      await generatePDF(result, shortlistId, need ?? '', requirements ?? []);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-ink-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="label-xs">Sort</span>
          <SortBtn k="overallScore" label="Overall" />
          <SortBtn k="matchScore" label="Match" />
          <SortBtn k="name" label="Name" />
          {excludedCount > 0 && (
            <button
              onClick={() => setShowExcluded((v) => !v)}
              className="flex items-center gap-1 text-[11px] text-ink-500 hover:text-ink-800 hover:bg-ink-100 px-2.5 py-1.5 rounded transition-colors"
            >
              <RotateCcw size={10} />
              {showExcluded ? 'Hide' : 'Show'} excluded ({excludedCount})
            </button>
          )}
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-[11px] text-ink-400">{activeVendors.length} vendor{activeVendors.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleExportPDF}
            disabled={pdfLoading}
            className="btn-secondary text-[12px] py-1.5 px-3 disabled:opacity-60"
          >
            {pdfLoading
              ? <><Loader2 size={12} className="animate-spin" /> Generating…</>
              : <><Download size={12} /> Export PDF</>
            }
          </button>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {visible.map((vendor: Vendor, i) => (
          <VendorCard
            key={vendor.name}
            vendor={vendor}
            rank={i + 1}
            onExclude={() => onExclude(vendor.name)}
            onInclude={() => onInclude(vendor.name)}
          />
        ))}
      </div>

      {/* Summary + Recommendation */}
      {(result.summary || result.recommendation) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-ink-100">
          {result.summary && (
            <div className="bg-info-50 border border-info-200 rounded-xl p-4">
              <p className="label-xs text-info-600 mb-2">Summary</p>
              <p className="text-sm text-ink-800 leading-relaxed">{result.summary}</p>
            </div>
          )}
          {result.recommendation && (
            <div className="bg-hi-50 border border-hi-300 rounded-xl p-4">
              <p className="label-xs text-hi-600 mb-2">Recommendation</p>
              <p className="text-sm text-ink-800 leading-relaxed">{result.recommendation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
