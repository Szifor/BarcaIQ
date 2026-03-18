'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

const SPRING = 'http://localhost:8080';

type Tab = 'intelligence' | 'gnn' | 'era';

const COL: Record<string, string> = {
  third_man_combo   : '#EDBB4D',
  false_nine_drop   : '#A50044',
  inverted_winger   : '#004D98',
  tiki_taka_buildup : '#FCBF00',
  direct_attack     : '#DB0030',
  other             : '#5A7499',
};

const LABEL: Record<string, string> = {
  third_man_combo   : 'Third-Man Combo',
  false_nine_drop   : 'False Nine Drop',
  inverted_winger   : 'Inverted Winger',
  tiki_taka_buildup : 'Tiki-Taka Buildup',
  direct_attack     : 'Direct Attack',
  other             : 'Possession Keeping',
};

const ICON: Record<string, string> = {
  third_man_combo   : '△',
  false_nine_drop   : '↓',
  inverted_winger   : '↺',
  tiki_taka_buildup : '⬡',
  direct_attack     : '→',
  other             : '○',
};

const DESC: Record<string, string> = {
  third_man_combo   : 'Player A passes to B who immediately lays off to C arriving late from deep — bypassing the press entirely. GNN assigns 20.7% probability, confirming it as the highest-danger pattern in the dataset.',
  false_nine_drop   : 'Central striker drops into midfield dragging a CB out of position, creating a 2v1 corridor. Critical GNN finding: model assigns only 9.5% probability but actual shot rate is 21.1% — the late forward run that creates danger is invisible to graph structure analysis.',
  inverted_winger   : 'Wide player receives on stronger foot and cuts inside through the half-space, forcing defensive rotation. Overlapping fullback provides the release valve.',
  tiki_taka_buildup : 'Long passing sequences (avg 14.3 passes, 8.3 players) to advance through lines and draw the press. GNN assigns low probability because danger comes after the buildup, not during it.',
  direct_attack     : 'Vertical ball into forward run bypassing midfield press. Shortest sequences (avg 3.9 passes). MSN era used this 59.9% more — faster vertical transitions under Luis Enrique.',
  other             : 'Possession circulation without penetrative intent. GNN correctly assigns lowest probability (6.0%) — pure shape maintenance with no shot-creating structure.',
};

const ERA_SPLIT: Record<string, { pep: number; msn: number }> = {
  third_man_combo   : { pep: 0.533, msn: 0.467 },
  false_nine_drop   : { pep: 0.382, msn: 0.618 },
  inverted_winger   : { pep: 0.552, msn: 0.448 },
  tiki_taka_buildup : { pep: 0.657, msn: 0.343 },
  direct_attack     : { pep: 0.401, msn: 0.599 },
  other             : { pep: 0.595, msn: 0.405 },
};

// Real GNN probabilities from our inference (gnn_pattern_stats.csv)
const GNN_PROB: Record<string, number> = {
  third_man_combo   : 0.207,
  false_nine_drop   : 0.095,
  inverted_winger   : 0.125,
  tiki_taka_buildup : 0.084,
  direct_attack     : 0.065,
  other             : 0.060,
};

interface Pattern {
  name       : string;
  shot_rate  : number;
  count      : number;
  avg_passes?: number;
  avg_players?: number;
}

// SVG pass flow animations per pattern
function PatternSVG({ name, color }: { name: string; color: string }) {
  const flows: Record<string, JSX.Element> = {
    third_man_combo: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        <circle cx="30"  cy="60"  r="10" fill={color} opacity="0.9" />
        <circle cx="100" cy="40"  r="10" fill={color} opacity="0.7" />
        <circle cx="170" cy="60"  r="10" fill={color} opacity="0.9" />
        <circle cx="100" cy="90"  r="8"  fill="rgba(165,0,68,0.6)" />
        <text x="30"  y="64"  textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">A</text>
        <text x="100" y="44"  textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">B</text>
        <text x="170" y="64"  textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">C</text>
        <line x1="40" y1="58" x2="90" y2="43" stroke={color} strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />
        <line x1="110" y1="43" x2="158" y2="57" stroke={color} strokeWidth="2" strokeDasharray="4,2" opacity="0.8" />
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">A→B→C late run</text>
      </svg>
    ),
    false_nine_drop: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        <circle cx="100" cy="30" r="10" fill={color} opacity="0.9" />
        <circle cx="100" cy="70" r="10" fill={color} opacity="0.6" />
        <circle cx="50"  cy="50" r="8"  fill="rgba(0,77,152,0.7)" />
        <circle cx="150" cy="50" r="8"  fill="rgba(0,77,152,0.7)" />
        <circle cx="100" cy="95" r="6"  fill="rgba(237,187,77,0.8)" />
        <text x="100" y="34"  textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">ST</text>
        <text x="100" y="74"  textAnchor="middle" fill="white" fontSize="7">drop</text>
        <line x1="100" y1="40" x2="100" y2="60" stroke={color} strokeWidth="2" strokeDasharray="3,2" opacity="0.8" />
        <line x1="90"  y1="68" x2="58"  y2="55" stroke="rgba(237,187,77,0.8)" strokeWidth="1.5" strokeDasharray="3,2" />
        <line x1="110" y1="68" x2="142" y2="55" stroke="rgba(237,187,77,0.8)" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Drop → CB dragged → space</text>
      </svg>
    ),
    inverted_winger: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        <circle cx="30"  cy="30" r="10" fill={color} opacity="0.9" />
        <circle cx="30"  cy="90" r="8"  fill="rgba(0,77,152,0.8)" />
        <circle cx="120" cy="50" r="8"  fill={color} opacity="0.6" />
        <circle cx="170" cy="60" r="8"  fill="rgba(237,187,77,0.8)" />
        <text x="30"  y="34"  textAnchor="middle" fill="white" fontSize="7">LW</text>
        <text x="30"  y="94"  textAnchor="middle" fill="white" fontSize="7">LB</text>
        <path d="M 40 32 Q 80 20 115 47" stroke={color} strokeWidth="2" fill="none" strokeDasharray="4,2" opacity="0.8" />
        <line x1="40" y1="88" x2="155" y2="62" stroke="rgba(0,77,152,0.6)" strokeWidth="1.5" strokeDasharray="3,2" />
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Cut inside + overlap run</text>
      </svg>
    ),
    tiki_taka_buildup: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        {[30,70,110,150].map((x, i) => (
          <circle key={i} cx={x} cy={i%2===0 ? 40 : 70} r="8" fill={color} opacity="0.8" />
        ))}
        <circle cx="170" cy="50" r="8" fill={color} opacity="0.6" />
        <line x1="38" y1="40" x2="62" y2="68" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
        <line x1="78" y1="68" x2="102" y2="42" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
        <line x1="118" y1="42" x2="142" y2="68" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
        <line x1="158" y1="68" x2="163" y2="53" stroke={color} strokeWidth="1.5" strokeDasharray="3,2" opacity="0.7" />
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">14.3 avg passes · 8.3 players</text>
      </svg>
    ),
    direct_attack: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        <circle cx="30"  cy="60" r="10" fill={color} opacity="0.9" />
        <circle cx="170" cy="60" r="10" fill={color} opacity="0.9" />
        <circle cx="100" cy="60" r="6"  fill="rgba(255,255,255,0.2)" />
        <line x1="40" y1="60" x2="158" y2="60" stroke={color} strokeWidth="2.5" strokeDasharray="6,3" opacity="0.8" />
        <polygon points="155,55 170,60 155,65" fill={color} opacity="0.9" />
        <text x="30"  y="64" textAnchor="middle" fill="white" fontSize="7">CDM</text>
        <text x="170" y="64" textAnchor="middle" fill="white" fontSize="7">ST</text>
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">3.9 avg passes · bypass press</text>
      </svg>
    ),
    other: (
      <svg viewBox="0 0 200 120" style={{ width: '100%' }}>
        <rect width="200" height="120" fill="#1a3a1a" rx="4" />
        {[[50,40],[100,30],[150,45],[160,75],[100,90],[40,70]].map(([x,y], i) => (
          <circle key={i} cx={x} cy={y} r="8" fill={color} opacity="0.5" />
        ))}
        <circle cx="100" cy="60" r="20" fill="none" stroke={color} strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
        <text x="100" y="110" textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">Circulation · shape maintenance</text>
      </svg>
    ),
  };
  return flows[name] ?? flows['other'];
}

export default function PatternsPage() {
  const [patterns,  setPatterns]  = useState<Pattern[]>([]);
  const [tab,       setTab]       = useState<Tab>('intelligence');
  const [selected,  setSelected]  = useState<string>('third_man_combo');
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    axios.get(`${SPRING}/api/tactical/patterns`)
      .then(res => setPatterns(res.data.patterns))
      .catch(() => setPatterns([
        { name: 'third_man_combo',   shot_rate: 0.227, count: 6420, avg_passes: 12.6, avg_players: 7.3 },
        { name: 'false_nine_drop',   shot_rate: 0.211, count: 592,  avg_passes: 7.9,  avg_players: 6.3 },
        { name: 'inverted_winger',   shot_rate: 0.187, count: 1421, avg_passes: 9.1,  avg_players: 6.6 },
        { name: 'tiki_taka_buildup', shot_rate: 0.133, count: 1380, avg_passes: 14.3, avg_players: 8.3 },
        { name: 'direct_attack',     shot_rate: 0.118, count: 1239, avg_passes: 3.9,  avg_players: 4.6 },
        { name: 'other',             shot_rate: 0.073, count: 6582, avg_passes: 5.7,  avg_players: 5.2 },
      ]))
      .finally(() => setLoading(false));
  }, []);

  const sel     = patterns.find(p => p.name === selected);
  const selCol  = COL[selected] ?? 'var(--gold)';
  const gnnProb = GNN_PROB[selected] ?? 0;
  const eraData = ERA_SPLIT[selected] ?? { pep: 0.5, msn: 0.5 };
  const gap     = sel ? ((sel.shot_rate - gnnProb) * 100).toFixed(1) : '0';
  const isUndervalued = sel ? sel.shot_rate > gnnProb + 0.05 : false;

  const TABS: { key: Tab; label: string }[] = [
    { key: 'intelligence', label: 'PATTERN INTELLIGENCE' },
    { key: 'gnn',          label: 'GNN ANALYSIS'         },
    { key: 'era',          label: 'ERA BREAKDOWN'         },
  ];

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2.5rem 2rem' }}>

      {/* Header */}
      <div className="fade-in" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
          <div className="senyera-accent" style={{ width: '40px', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px' }}>
            MODULE 2 — GRAPHSAGE GNN · AUC 0.782 · 17,638 SEQUENCES
          </span>
        </div>
        <h1 className="display" style={{
          fontSize: 'clamp(32px,5vw,72px)', letterSpacing: '4px', lineHeight: 1,
          background: 'linear-gradient(135deg, var(--barca-blue), var(--gold))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          TACTICAL PATTERN<br />INTELLIGENCE
        </h1>

        {/* Key insight callout */}
        <div style={{
          marginTop: '1rem', padding: '0.875rem 1.25rem',
          background: 'rgba(165,0,68,0.1)', border: '1px solid rgba(165,0,68,0.3)',
          borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ color: 'var(--barca-red)', fontSize: '16px' }}>⚠</span>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--gold)' }}>Key GNN Finding:</strong> False Nine Drop is systematically undervalued by the model —
            actual shot rate (21.1%) is <strong style={{ color: 'var(--barca-red)' }}>2.2× higher</strong> than GNN probability (9.5%).
            The late forward run that creates danger is invisible to graph structure analysis.
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem' }}>

        {/* Pattern list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.5rem' }}>
            SELECT PATTERN
          </div>
          {patterns.map((p, i) => {
            const isActive = selected === p.name;
            const color    = COL[p.name];
            const gnn      = GNN_PROB[p.name] ?? 0;
            const underval = p.shot_rate > gnn + 0.05;
            return (
              <div key={i} onClick={() => setSelected(p.name)}
                className="card fade-in"
                style={{
                  animationDelay : `${i * 0.06}s`,
                  cursor         : 'pointer',
                  borderLeft     : `3px solid ${isActive ? color : 'var(--dark-border)'}`,
                  background     : isActive ? `${color}11` : 'var(--dark-card)',
                  padding        : '0.875rem 1rem',
                  transition     : 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px', color }}>{ICON[p.name]}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: isActive ? color : 'var(--text-primary)' }}>
                        {LABEL[p.name]}
                      </div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {p.count.toLocaleString()} sequences
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="mono" style={{ fontSize: '18px', fontWeight: 700, color }}>
                      {(p.shot_rate * 100).toFixed(1)}%
                    </div>
                    {underval && (
                      <div style={{ fontSize: '9px', color: 'var(--barca-red)', letterSpacing: '1px' }}>
                        GNN GAPS
                      </div>
                    )}
                  </div>
                </div>
                {/* Mini bar */}
                <div style={{ height: '3px', background: 'var(--dark-border-2)', borderRadius: '2px', overflow: 'hidden', marginTop: '8px' }}>
                  <div style={{ height: '100%', width: `${(p.shot_rate / 0.227) * 100}%`, background: color, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Right panel */}
        <div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '4px', marginBottom: '1.5rem', borderBottom: '1px solid var(--dark-border)' }}>
            {TABS.map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding      : '8px 18px',
                background   : 'transparent',
                border       : 'none',
                borderBottom : tab === t.key ? `2px solid ${selCol}` : '2px solid transparent',
                color        : tab === t.key ? selCol : 'var(--text-muted)',
                fontFamily   : 'Bebas Neue, cursive',
                fontSize     : '14px',
                letterSpacing: '2px',
                cursor       : 'pointer',
                marginBottom : '-1px',
                transition   : 'all 0.2s',
              }}>{t.label}</button>
            ))}
          </div>

          {/* Tab: Pattern Intelligence */}
          {tab === 'intelligence' && sel && (
            <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

              {/* SVG visualization */}
              <div className="card" style={{ borderTop: `2px solid ${selCol}`, padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>
                  PASS FLOW STRUCTURE
                </div>
                <PatternSVG name={selected} color={selCol} />
              </div>

              {/* Stats grid */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { label: 'Actual Shot Rate',    value: `${(sel.shot_rate * 100).toFixed(1)}%`, color: selCol },
                  { label: 'GNN Shot Probability', value: `${(gnnProb * 100).toFixed(1)}%`,      color: isUndervalued ? 'var(--barca-red)' : selCol },
                  { label: 'Sequence Count',       value: sel.count.toLocaleString(),             color: 'var(--text-primary)' },
                  { label: 'Avg Passes / Seq',     value: (sel.avg_passes ?? 0).toFixed(1),      color: 'var(--text-primary)' },
                  { label: 'Avg Players / Seq',    value: (sel.avg_players ?? 0).toFixed(1),     color: 'var(--text-primary)' },
                ].map((m, i) => (
                  <div key={i} className="card" style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '1px', marginBottom: '4px' }}>{m.label}</div>
                    <div className="mono" style={{ fontSize: '22px', fontWeight: 700, color: m.color }}>{m.value}</div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="card" style={{ gridColumn: '1 / -1', borderLeft: `3px solid ${selCol}`, padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: selCol, letterSpacing: '2px', marginBottom: '8px' }}>
                  TACTICAL DESCRIPTION
                </div>
                <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-muted)' }}>
                  {DESC[selected]}
                </p>
              </div>
            </div>
          )}

          {/* Tab: GNN Analysis */}
          {tab === 'gnn' && sel && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* GNN vs Actual comparison */}
              <div className="gradient-border" style={{ padding: '1.5rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '1rem' }}>
                  GNN PROBABILITY vs ACTUAL SHOT RATE
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,77,152,0.1)', borderRadius: '6px', border: '1px solid rgba(0,77,152,0.2)' }}>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>GNN PREDICTION</div>
                    <div className="display" style={{ fontSize: '48px', color: 'var(--barca-blue)', lineHeight: 1 }}>
                      {(gnnProb * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div style={{ textAlign: 'center', padding: '1rem', background: `${selCol}11`, borderRadius: '6px', border: `1px solid ${selCol}33` }}>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>ACTUAL SHOT RATE</div>
                    <div className="display" style={{ fontSize: '48px', color: selCol, lineHeight: 1 }}>
                      {(sel.shot_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Gap bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Model accuracy gap</span>
                    <span className="mono" style={{
                      fontSize: '13px',
                      color: isUndervalued ? 'var(--barca-red)' : 'var(--success)',
                      fontWeight: 700,
                    }}>
                      {isUndervalued ? '▲' : '▼'} {Math.abs(parseFloat(gap)).toFixed(1)}pp {isUndervalued ? 'UNDERESTIMATED' : 'OVERESTIMATED'}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--dark-border-2)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((sel.shot_rate / 0.227) * 100, 100)}%`,
                      background: `linear-gradient(90deg, var(--barca-blue) ${(gnnProb / sel.shot_rate) * 100}%, ${isUndervalued ? 'var(--barca-red)' : 'var(--success)'} 100%)`,
                      transition: 'width 0.8s ease',
                    }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', color: 'var(--barca-blue)' }}>GNN sees</span>
                    <span style={{ fontSize: '10px', color: isUndervalued ? 'var(--barca-red)' : 'var(--success)' }}>
                      {isUndervalued ? 'Reality is higher' : 'Reality is lower'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Insight cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="card" style={{ padding: '1rem', borderTop: '2px solid var(--barca-blue)' }}>
                  <div className="mono" style={{ fontSize: '10px', color: 'var(--barca-blue)', letterSpacing: '2px', marginBottom: '8px' }}>
                    WHAT GNN DETECTS
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    Graph structure — passing triangles, player positioning, pass direction and distance.
                    Effective for possession-based patterns with clear network topology.
                  </p>
                </div>
                <div className="card" style={{ padding: '1rem', borderTop: `2px solid ${isUndervalued ? 'var(--barca-red)' : 'var(--success)'}` }}>
                  <div className="mono" style={{ fontSize: '10px', color: isUndervalued ? 'var(--barca-red)' : 'var(--success)', letterSpacing: '2px', marginBottom: '8px' }}>
                    {isUndervalued ? 'WHAT GNN MISSES' : 'GNN ACCURATE'}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {isUndervalued
                      ? 'Off-ball runs and late movements — the forward run that creates danger arrives after the pass graph is formed, invisible to graph-level analysis.'
                      : 'GNN probability closely matches actual shot rate for this pattern — graph structure captures the danger well.'}
                  </p>
                </div>
              </div>

              {/* Dataset context */}
              <div className="card" style={{ padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>
                  DATASET CONTEXT
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Dataset avg GNN prob</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--text-muted)', fontWeight: 700 }}>10.6%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>This pattern vs avg</div>
                    <div className="mono" style={{ fontSize: '20px', color: selCol, fontWeight: 700 }}>
                      {((gnnProb / 0.106) * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total sequences</div>
                    <div className="mono" style={{ fontSize: '20px', color: 'var(--text-primary)', fontWeight: 700 }}>17,638</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Era Breakdown */}
          {tab === 'era' && sel && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Era dominance */}
              <div className="card" style={{ padding: '1.5rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '1rem' }}>
                  ERA DOMINANCE — {LABEL[selected].toUpperCase()}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                  {[
                    { label: 'PEP ERA (2008-12)', pct: eraData.pep, color: 'var(--barca-blue)', seqs: Math.round(sel.count * eraData.pep) },
                    { label: 'MSN ERA (2014-17)', pct: eraData.msn, color: 'var(--barca-red)',  seqs: Math.round(sel.count * eraData.msn) },
                  ].map((era, i) => (
                    <div key={i} style={{ padding: '1rem', background: `${era.color}11`, borderRadius: '6px', border: `1px solid ${era.color}22` }}>
                      <div className="mono" style={{ fontSize: '10px', color: era.color, letterSpacing: '1px', marginBottom: '8px' }}>{era.label}</div>
                      <div className="display" style={{ fontSize: '42px', color: era.color, lineHeight: 1 }}>
                        {(era.pct * 100).toFixed(0)}%
                      </div>
                      <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ~{era.seqs.toLocaleString()} sequences
                      </div>
                    </div>
                  ))}
                </div>

                {/* Split bar */}
                <div style={{ height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                  <div style={{ width: `${eraData.pep * 100}%`, background: 'var(--barca-blue)', transition: 'width 0.8s ease' }} />
                  <div style={{ flex: 1, background: 'var(--barca-red)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--barca-blue)' }}>← PEP</span>
                  <span style={{ fontSize: '11px', color: 'var(--barca-red)' }}>MSN →</span>
                </div>
              </div>

              {/* Era insight */}
              <div className="card" style={{ padding: '1rem', borderLeft: `3px solid ${eraData.pep > eraData.msn ? 'var(--barca-blue)' : 'var(--barca-red)'}` }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>
                  ERA INSIGHT
                </div>
                <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.65 }}>
                  {eraData.pep > eraData.msn
                    ? `This pattern was dominant in the Pep era (${(eraData.pep * 100).toFixed(0)}% of sequences). Guardiola's system built specifically around this movement — it was a core tactical pillar, not an occasional variation.`
                    : `This pattern was dominant in the MSN era (${(eraData.msn * 100).toFixed(0)}% of sequences). Luis Enrique's system relied on this movement more heavily, reflecting the different attacking profiles of Suárez, Neymar, and Messi together.`
                  }
                </p>
              </div>

              {/* All patterns era comparison */}
              <div className="card" style={{ padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>
                  ALL PATTERNS — ERA SPLIT
                </div>
                {Object.entries(ERA_SPLIT).map(([name, era], i) => (
                  <div key={i} style={{ marginBottom: '0.75rem', opacity: name === selected ? 1 : 0.6, cursor: 'pointer', transition: 'opacity 0.2s' }}
                    onClick={() => setSelected(name)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '12px', color: name === selected ? COL[name] : 'var(--text-muted)' }}>{LABEL[name]}</span>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--barca-blue)' }}>P {(era.pep*100).toFixed(0)}%</span>
                        <span className="mono" style={{ fontSize: '11px', color: 'var(--barca-red)'  }}>M {(era.msn*100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <div style={{ height: '4px', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
                      <div style={{ width: `${era.pep * 100}%`, background: 'var(--barca-blue)', transition: 'width 0.6s ease' }} />
                      <div style={{ flex: 1, background: 'var(--barca-red)' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
          BARCAIQ © 2026 — BUILT FOR BARÇA INNOVATION HUB
        </span>
        <div className="senyera-accent" style={{ width: '80px' }} />
      </div>
    </div>
  );
}