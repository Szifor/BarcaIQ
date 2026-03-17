'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const SPRING = 'http://localhost:8080';

interface EraDna {
  eras: {
    pep: { mean_shot_prob: number; actual_shot_rate: number; n_sequences: number };
    msn: { mean_shot_prob: number; actual_shot_rate: number; n_sequences: number };
  };
  model_auc: number;
}

interface Pattern {
  name     : string;
  shot_rate: number;
  count    : number;
}

export default function Dashboard() {
  const [eraDna,   setEraDna]   = useState<EraDna | null>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get(`${SPRING}/api/tactical/era-dna`),
      axios.get(`${SPRING}/api/tactical/patterns`),
    ]).then(([era, pat]) => {
      setEraDna(era.data);
      setPatterns(pat.data.patterns);
    }).catch(() => {
      setEraDna({
        model_auc: 0.782,
        eras: {
          pep: { mean_shot_prob: 0.3845, actual_shot_rate: 0.1485, n_sequences: 9997 },
          msn: { mean_shot_prob: 0.3997, actual_shot_rate: 0.1532, n_sequences: 7637 },
        }
      });
      setPatterns([
        { name: 'third_man_combo',   shot_rate: 0.227, count: 6420 },
        { name: 'false_nine_drop',   shot_rate: 0.211, count: 592  },
        { name: 'inverted_winger',   shot_rate: 0.187, count: 1421 },
        { name: 'tiki_taka_buildup', shot_rate: 0.133, count: 1380 },
        { name: 'direct_attack',     shot_rate: 0.118, count: 1239 },
        { name: 'other',             shot_rate: 0.073, count: 6582 },
      ]);
    }).finally(() => setLoading(false));
  }, []);

  const patternLabel = (name: string) => ({
    third_man_combo   : 'Third-Man Combo',
    false_nine_drop   : 'False Nine Drop',
    inverted_winger   : 'Inverted Winger',
    tiki_taka_buildup : 'Tiki-Taka Buildup',
    direct_attack     : 'Direct Attack',
    other             : 'Possession Keeping',
  }[name] ?? name);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '3rem 2rem' }}>

      {/* Hero */}
      <div className="fade-in" style={{ marginBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div className="senyera-accent" style={{ width: '40px', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px' }}>
            BARÇA INNOVATION HUB — TACTICAL AI
          </span>
        </div>
        <h1 className="display" style={{
          fontSize    : 'clamp(48px,8vw,96px)', letterSpacing: '4px', lineHeight: 1,
          background  : 'linear-gradient(135deg, var(--badge-white) 0%, var(--gold) 50%, var(--barca-red) 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          TACTICAL<br />INTELLIGENCE
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '16px', marginTop: '1rem', maxWidth: '600px', lineHeight: 1.6 }}>
          AI-powered analysis of FC Barcelona's Juego de Posición across 249 matches,
          929,856 events, and two golden eras.
        </p>
      </div>

      {/* Stat strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem', marginBottom: '3rem' }}>
        {[
          { label: 'MATCHES ANALYSED', value: '249',     accent: 'var(--barca-blue)'     },
          { label: 'EVENTS PROCESSED', value: '929,856', accent: 'var(--barca-red)'      },
          { label: 'GNN MODEL AUC',    value: '0.782',   accent: 'var(--gold)'           },
          { label: 'PRESS MODEL AUC',  value: '0.797',   accent: 'var(--senyera-yellow)' },
        ].map((stat, i) => (
          <div key={i} className="card fade-in" style={{ animationDelay: `${i*0.1}s`, borderTop: `2px solid ${stat.accent}` }}>
            <div className="mono" style={{ fontSize: '28px', fontWeight: 700, color: stat.accent }}>{stat.value}</div>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Era DNA */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 className="display" style={{ fontSize: '32px', letterSpacing: '3px', marginBottom: '1.5rem' }}>ERA DNA COMPARISON</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          {eraDna && (['pep','msn'] as const).map(era => {
            const data   = eraDna.eras[era];
            const isPep  = era === 'pep';
            const accent = isPep ? 'var(--barca-blue)' : 'var(--barca-red)';
            return (
              <div key={era} className="gradient-border fade-in" style={{ animationDelay: isPep ? '0s' : '0.2s', padding: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                  <div>
                    <div className="display" style={{ fontSize: '28px', color: accent, letterSpacing: '2px' }}>
                      {isPep ? 'PEP GUARDIOLA' : 'LUIS ENRIQUE'}
                    </div>
                    <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {isPep ? '2008 — 2012' : '2014 — 2017'}
                    </div>
                  </div>
                  <div style={{ background: accent, borderRadius: '4px', padding: '4px 10px' }}>
                    <span className="mono" style={{ fontSize: '11px', color: 'white', letterSpacing: '1px' }}>
                      {era.toUpperCase()} ERA
                    </span>
                  </div>
                </div>
                {[
                  { label: 'GNN Shot Probability', value: (data.mean_shot_prob * 100).toFixed(1) + '%'    },
                  { label: 'Actual Shot Rate',      value: (data.actual_shot_rate * 100).toFixed(1) + '%' },
                  { label: 'Sequences Analysed',    value: data.n_sequences.toLocaleString()              },
                ].map((metric, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--dark-border)' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-muted)', letterSpacing: '1px' }}>{metric.label}</span>
                    <span className="mono" style={{ fontSize: '16px', color: accent, fontWeight: 700 }}>{metric.value}</span>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Patterns */}
      <div style={{ marginBottom: '3rem' }}>
        <h2 className="display" style={{ fontSize: '32px', letterSpacing: '3px', marginBottom: '1.5rem' }}>TACTICAL PATTERNS</h2>
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', letterSpacing: '2px' }}>SHOT CREATION RATE BY PATTERN TYPE</span>
          </div>
          {patterns.map((p, i) => {
            const colors = ['var(--gold)','var(--barca-red)','var(--barca-blue)','var(--senyera-yellow)','var(--senyera-red)','var(--text-muted)'];
            return (
              <div key={i} style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '13px', letterSpacing: '1px' }}>{patternLabel(p.name)}</span>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <span className="mono" style={{ fontSize: '13px', color: colors[i] }}>{(p.shot_rate*100).toFixed(1)}%</span>
                    <span className="mono" style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{p.count.toLocaleString()} seq</span>
                  </div>
                </div>
                <div style={{ height: '6px', background: 'var(--dark-border-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(p.shot_rate/0.227)*100}%`, background: colors[i], borderRadius: '3px', transition: 'width 1s ease' }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modules */}
      <div>
        <h2 className="display" style={{ fontSize: '32px', letterSpacing: '3px', marginBottom: '1.5rem' }}>AI MODULES</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem' }}>
          {[
            { title:'TACTICAL DNA',  sub:'Module 2 — GNN', desc:'GraphSAGE neural network classifying possession sequences by shot probability.', auc:'0.782', accent:'var(--barca-blue)', href:'/patterns' },
            { title:'PRESS TRIGGER', sub:'Module 3 — GBM', desc:'Gradient Boosting classifier identifying optimal press moments for Flick.',      auc:'0.797', accent:'var(--barca-red)',  href:'/press'    },
            { title:'RAG ASSISTANT', sub:'Module 5 — LLM', desc:'Llama 3.3 70B grounded in StatsBomb data. Tactical Q&A for coaching staff.',    auc:'LLM',   accent:'var(--gold)',       href:'/chat'     },
          ].map((mod, i) => (
            <a key={i} href={mod.href} style={{ textDecoration: 'none' }}>
              <div className="card fade-in" style={{
                animationDelay: `${i*0.15}s`, borderLeft: `3px solid ${mod.accent}`,
                cursor: 'pointer', transition: 'transform 0.2s ease',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <div className="display" style={{ fontSize: '22px', letterSpacing: '2px', color: mod.accent, marginBottom: '4px' }}>{mod.title}</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '1rem' }}>{mod.sub}</div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1rem' }}>{mod.desc}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AUC</span>
                  <span className="mono" style={{ fontSize: '20px', color: mod.accent, fontWeight: 700 }}>{mod.auc}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid var(--dark-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
          BARCAIQ © 2026 — BUILT FOR BARÇA INNOVATION HUB
        </span>
        <div className="senyera-accent" style={{ width: '80px' }} />
      </div>
    </div>
  );
}