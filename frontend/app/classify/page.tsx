'use client';

import { useState, useRef, useCallback } from 'react';
import axios from 'axios';

const SPRING = 'http://localhost:8080';
const PW = 800;
const PH = 520;

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

const FEATURE_LABELS: Record<string, string> = {
  norm_x        : 'Forward Position',
  norm_y        : 'Lateral Position',
  involvement   : 'Touch Involvement',
  is_final_third: 'Final Third',
  pass_count    : 'Passes Made',
  receive_count : 'Passes Received',
};

interface Player { id: string; name: string; x: number; y: number; }
interface Pass    { from: string; to: string; }

interface GNNResult {
  shot_probability       : number;
  matched_pattern        : string;
  pattern_similarity     : number;
  pattern_scores         : Record<string, number>;
  pattern_avg_shot_prob  : number;
  pattern_avg_passes     : number;
  pattern_avg_players    : number;
  pattern_count          : number;
  most_important_player  : string;
  most_important_feature : string;
  most_important_pass    : { from: string; to: string };
  player_importances     : Record<string, number>;
  feature_importances    : Record<string, number>;
}

export default function ClassifyPage() {
  const [players,   setPlayers]   = useState<Player[]>([]);
  const [passes,    setPasses]    = useState<Pass[]>([]);
  const [result,    setResult]    = useState<GNNResult | null>(null);
  const [loading,   setLoading]   = useState(false);
  const [mode,      setMode]      = useState<'place' | 'pass'>('place');
  const [passFrom,  setPassFrom]  = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName,  setEditName]  = useState('');
  const [dragging,  setDragging]  = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect   = svgRef.current.getBoundingClientRect();
    const scaleX = PW / rect.width;
    const scaleY = PH / rect.height;
    return {
      x: Math.min(PW - 20, Math.max(20, (clientX - rect.left) * scaleX)),
      y: Math.min(PH - 20, Math.max(20, (clientY - rect.top)  * scaleY)),
    };
  }, []);

  const handlePitchClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging) return;
    if (mode === 'place') {
      if (players.length >= 11) return;
      const { x, y } = toSvgCoords(e.clientX, e.clientY);
      setPlayers(prev => [...prev, { id: `p${Date.now()}`, name: `P${prev.length + 1}`, x, y }]);
    }
  };

  const handlePlayerClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (dragging) return;
    if (mode === 'pass') {
      if (!passFrom) {
        setPassFrom(id);
      } else if (passFrom !== id) {
        const exists = passes.some(p => p.from === passFrom && p.to === id);
        if (!exists) setPasses(prev => [...prev, { from: passFrom, to: id }]);
        setPassFrom(null);
      } else {
        setPassFrom(null);
      }
    }
  };

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    setPlayers(prev => prev.map(p => p.id === dragging ? { ...p, x, y } : p));
  }, [dragging, toSvgCoords]);

  const removePlayer = (id: string) => {
    setPlayers(prev => prev.filter(p => p.id !== id));
    setPasses(prev => prev.filter(p => p.from !== id && p.to !== id));
  };

  const classify = async () => {
    if (players.length < 2 || passes.length < 1) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await axios.post(`${SPRING}/api/tactical/sequence`, { players, passes }, { timeout: 60000 });
      setResult(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const reset = () => { setPlayers([]); setPasses([]); setResult(null); setPassFrom(null); setMode('place'); setEditingId(null); };

  const probColor = (p: number) => p >= 0.5 ? '#00C896' : p >= 0.25 ? '#EDBB4D' : '#A50044';
  const maxImportance = result ? Math.max(...Object.values(result.player_importances)) : 1;
  const maxFeature    = result ? Math.max(...Object.values(result.feature_importances)) : 1;

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>

      {/* Header */}
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
          <div className="senyera-accent" style={{ width: '40px', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px' }}>
            MODULE 2 — LIVE GNN SEQUENCE CLASSIFIER
          </span>
        </div>
        <h1 className="display" style={{
          fontSize: 'clamp(28px,4vw,60px)', letterSpacing: '4px', lineHeight: 1,
          background: 'linear-gradient(135deg, var(--barca-blue), var(--gold))',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>SEQUENCE<br />CLASSIFIER</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '0.5rem', maxWidth: '600px' }}>
          Draw any passing sequence. GNN scores it live and GNNExplainer identifies which player,
          pass, and feature drove the prediction. Pattern matched against 17,638 real Barça sequences.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>

        {/* Pitch */}
        <div className="card" style={{ padding: '1rem' }}>

          {/* Controls */}
          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ display: 'flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--dark-border)' }}>
              {(['place', 'pass'] as const).map(m => (
                <button key={m} onClick={() => { setMode(m); setPassFrom(null); }} style={{
                  padding: '8px 16px',
                  background: mode === m ? 'var(--barca-blue)' : 'transparent',
                  border: 'none', color: mode === m ? 'white' : 'var(--text-muted)',
                  fontFamily: 'Bebas Neue, cursive', fontSize: '14px', letterSpacing: '2px', cursor: 'pointer',
                }}>
                  {m === 'place' ? `+ PLACE PLAYER (${players.length}/11)` : '→ DRAW PASS'}
                </button>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
              <button onClick={classify} disabled={loading || players.length < 2 || passes.length < 1} style={{
                padding: '8px 20px',
                background: (loading || players.length < 2 || passes.length < 1) ? 'var(--dark-border)' : 'var(--barca-red)',
                border: 'none', borderRadius: '6px', color: 'white',
                fontFamily: 'Bebas Neue, cursive', fontSize: '15px', letterSpacing: '3px', cursor: 'pointer',
              }}>
                {loading ? 'RUNNING GNN...' : 'CLASSIFY'}
              </button>
              <button onClick={reset} style={{
                padding: '8px 16px', background: 'transparent',
                border: '1px solid var(--dark-border)', borderRadius: '6px',
                color: 'var(--text-muted)', fontFamily: 'Bebas Neue, cursive', fontSize: '14px', letterSpacing: '2px', cursor: 'pointer',
              }}>RESET</button>
            </div>
          </div>

          {/* Status bar */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {[{ label: 'Players', value: players.length, min: 2 }, { label: 'Passes', value: passes.length, min: 1 }].map((s, i) => (
              <div key={i} style={{ padding: '4px 12px', borderRadius: '4px', background: s.value >= s.min ? 'rgba(0,200,150,0.1)' : 'rgba(90,116,153,0.1)', border: `1px solid ${s.value >= s.min ? 'rgba(0,200,150,0.3)' : 'var(--dark-border)'}` }}>
                <span className="mono" style={{ fontSize: '11px', color: s.value >= s.min ? 'var(--success)' : 'var(--text-muted)' }}>{s.label}: {s.value}</span>
              </div>
            ))}
            {mode === 'pass' && passFrom && (
              <div style={{ padding: '4px 12px', borderRadius: '4px', background: 'rgba(237,187,77,0.1)', border: '1px solid rgba(237,187,77,0.3)' }}>
                <span className="mono" style={{ fontSize: '11px', color: 'var(--gold)' }}>FROM: {players.find(p => p.id === passFrom)?.name} → click target</span>
              </div>
            )}
          </div>

          {/* SVG Pitch */}
          <svg ref={svgRef} viewBox={`0 0 ${PW} ${PH}`}
            style={{ width: '100%', cursor: mode === 'place' && players.length < 11 ? 'crosshair' : 'default', userSelect: 'none', borderRadius: '4px', display: 'block' }}
            onClick={handlePitchClick} onMouseMove={onMouseMove}
            onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}
          >
            <rect width={PW} height={PH} fill="#1a3a1a" rx="4" />
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x={i*80} y={0} width={80} height={PH} fill={i%2===0 ? 'rgba(255,255,255,0.018)' : 'transparent'} />
            ))}
            <rect x={1} y={1} width={PW-2} height={PH-2} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <line x1={PW/2} y1={0} x2={PW/2} y2={PH} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle cx={PW/2} cy={PH/2} r={70} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle cx={PW/2} cy={PH/2} r={5} fill="rgba(255,255,255,0.4)" />
            <rect x={0} y={PH*0.23} width={PW*0.15} height={PH*0.54} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={0} y={PH*0.35} width={PW*0.07} height={PH*0.30} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={PW*0.85} y={PH*0.23} width={PW*0.15} height={PH*0.54} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={PW*0.93} y={PH*0.35} width={PW*0.07} height={PH*0.30} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <text x={PW*0.167} y={PH-12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace">DEFENSIVE</text>
            <text x={PW*0.5}   y={PH-12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace">MID THIRD</text>
            <text x={PW*0.833} y={PH-12} textAnchor="middle" fill="rgba(255,255,255,0.2)" fontSize="11" fontFamily="monospace">FINAL THIRD</text>

            {/* Passes */}
            {passes.map((pass, i) => {
              const from = players.find(p => p.id === pass.from);
              const to   = players.find(p => p.id === pass.to);
              if (!from || !to) return null;
              const isKey = result && result.most_important_pass.from === from.name && result.most_important_pass.to === to.name;
              const color = isKey ? '#EDBB4D' : 'rgba(0,200,150,0.7)';
              const dx = to.x - from.x; const dy = to.y - from.y;
              const len = Math.sqrt(dx*dx + dy*dy);
              const ux = dx/len; const uy = dy/len;
              const ex = to.x - ux*22; const ey = to.y - uy*22;
              return (
                <g key={i} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); setPasses(prev => prev.filter((_, idx) => idx !== i)); }}>
                  <line x1={from.x} y1={from.y} x2={ex} y2={ey} stroke={color} strokeWidth={isKey ? 3 : 1.5} opacity={0.85} />
                  <polygon points={`${ex},${ey} ${ex-ux*8+uy*5},${ey-uy*8-ux*5} ${ex-ux*8-uy*5},${ey-uy*8+ux*5}`} fill={color} opacity={0.85} />
                  {isKey && <text x={(from.x+to.x)/2} y={(from.y+to.y)/2-10} textAnchor="middle" fill="var(--gold)" fontSize="9" fontFamily="monospace">KEY PASS</text>}
                </g>
              );
            })}

            {/* Players */}
            {players.map(p => {
              const isPassFrom  = passFrom === p.id;
              const importance  = result?.player_importances[p.name];
              const isTopPlayer = result?.most_important_player === p.name;
              const radius      = 20;
              return (
                <g key={p.id}
                  style={{ cursor: mode === 'pass' ? 'pointer' : 'grab' }}
                  onMouseDown={e => { if (mode === 'place') { e.stopPropagation(); setDragging(p.id); } }}
                  onClick={e => handlePlayerClick(e, p.id)}
                  onDoubleClick={e => { e.stopPropagation(); setEditingId(p.id); setEditName(p.name); }}
                >
                  {importance !== undefined && (() => {
                    const pct = importance / maxImportance;
                    const circ = 2 * Math.PI * (radius + 7);
                    return <circle cx={p.x} cy={p.y} r={radius+7} fill="none" stroke={isTopPlayer ? 'var(--gold)' : 'var(--barca-blue)'} strokeWidth="3" strokeDasharray={`${circ*pct} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${p.x} ${p.y})`} opacity={0.85} />;
                  })()}
                  <circle cx={p.x} cy={p.y} r={radius} fill={isPassFrom ? 'var(--gold)' : 'var(--barca-blue)'} stroke={isTopPlayer ? 'var(--gold)' : isPassFrom ? 'white' : 'rgba(255,255,255,0.4)'} strokeWidth={isTopPlayer || isPassFrom ? 3 : 1.5} opacity={0.93} />
                  <text x={p.x} y={p.y+5} textAnchor="middle" fill="white" fontSize="9" fontFamily="monospace" fontWeight="600">
                    {p.name.length > 6 ? p.name.slice(0,6) : p.name}
                  </text>
                  {isTopPlayer && <text x={p.x} y={p.y-radius-8} textAnchor="middle" fill="var(--gold)" fontSize="9" fontFamily="monospace">★ KEY</text>}
                  {/* Remove button */}
                  <circle cx={p.x+radius-4} cy={p.y-radius+4} r={7} fill="var(--barca-red)" opacity={0.9} style={{ cursor: 'pointer' }} onClick={e => { e.stopPropagation(); removePlayer(p.id); }} />
                  <text x={p.x+radius-4} y={p.y-radius+8} textAnchor="middle" fill="white" fontSize="10" fontFamily="monospace" style={{ pointerEvents: 'none' }}>×</text>
                  {/* Rename input */}
                  {editingId === p.id && (
                    <foreignObject x={p.x-55} y={p.y+radius+4} width="110" height="28">
                      <input style={{ width:'100%', background:'var(--dark-bg)', border:'1px solid var(--gold)', color:'white', fontFamily:'monospace', fontSize:'11px', padding:'3px 6px', borderRadius:'3px' }}
                        value={editName}
                        onChange={e => setEditName(e.target.value.toUpperCase())}
                        onKeyDown={e => {
                          if (e.key === 'Enter') { setPlayers(prev => prev.map(pl => pl.id === p.id ? { ...pl, name: editName } : pl)); setEditingId(null); }
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                      />
                    </foreignObject>
                  )}
                </g>
              );
            })}
          </svg>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>➕ <strong>Place mode:</strong> click pitch · drag to move · × to remove</span>
            <span>→ <strong>Pass mode:</strong> click A then B · click pass arrow to remove</span>
            <span>✏️ <strong>Double-click</strong> player to rename</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {!result && !loading && (
            <div className="card" style={{ borderLeft: '3px solid var(--barca-blue)', padding: '1.25rem' }}>
              <div className="display" style={{ fontSize: '18px', color: 'var(--barca-blue)', letterSpacing: '2px', marginBottom: '0.75rem' }}>HOW TO USE</div>
              {[
                '1. Place players on pitch (max 11)',
                '2. Double-click any player to rename',
                '3. Switch to DRAW PASS mode',
                '4. Click player A then player B to draw a pass',
                '5. Click a pass arrow to remove it',
                '6. Click × on a player to remove them',
                '7. Hit CLASSIFY',
                '8. GNN scores shot probability live',
                '9. Pattern matched against 17,638 real Barça sequences',
                '10. GNNExplainer shows key player, pass, and feature',
              ].map((step, i) => (
                <div key={i} style={{ padding: '5px 0', borderBottom: '1px solid var(--dark-border)', fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>{step}</div>
              ))}
            </div>
          )}

          {loading && (
            <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
              <div className="display" style={{ fontSize: '22px', color: 'var(--barca-blue)', letterSpacing: '2px', marginBottom: '1rem' }}>RUNNING GNN</div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                {[0,1,2].map(i => <div key={i} style={{ width:'10px', height:'10px', borderRadius:'50%', background:'var(--gold)', animation:`pulse-red 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '1rem' }}>
                PyG graph → GNN inference → GNNExplainer → pattern matching
              </p>
            </div>
          )}

          {result && !loading && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Shot probability */}
              <div className="gradient-border" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>GNN SHOT PROBABILITY</div>
                <div className="display" style={{ fontSize: '72px', color: probColor(result.shot_probability), lineHeight: 1 }}>
                  {(result.shot_probability * 100).toFixed(1)}%
                </div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '8px', letterSpacing: '1px' }}>
                  RAW MODEL OUTPUT — NO THRESHOLDS APPLIED
                </div>
              </div>

              {/* Pattern match */}
              <div className="card" style={{ padding: '1rem', borderTop: `2px solid ${COL[result.matched_pattern] ?? 'var(--gold)'}` }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>
                  CLOSEST PATTERN — 17,638 TRAINING SEQUENCES
                </div>
                <div className="display" style={{ fontSize: '20px', color: COL[result.matched_pattern] ?? 'var(--gold)', letterSpacing: '2px', marginBottom: '4px' }}>
                  {LABEL[result.matched_pattern] ?? result.matched_pattern}
                </div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                  {(result.pattern_similarity * 100).toFixed(1)}% match · {result.pattern_count.toLocaleString()} training sequences
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  {[
                    { label: 'Avg passes',  value: result.pattern_avg_passes.toFixed(1)  },
                    { label: 'Avg players', value: result.pattern_avg_players.toFixed(1) },
                    { label: 'Shot rate',   value: `${(result.pattern_avg_shot_prob*100).toFixed(1)}%` },
                  ].map((m, i) => (
                    <div key={i} style={{ flex:1, padding:'6px', background:'rgba(0,0,0,0.2)', borderRadius:'4px', textAlign:'center' }}>
                      <div style={{ fontSize:'9px', color:'var(--text-muted)', marginBottom:'2px' }}>{m.label}</div>
                      <div className="mono" style={{ fontSize:'13px', color: COL[result.matched_pattern] ?? 'var(--gold)', fontWeight:700 }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {Object.entries(result.pattern_scores).sort(([,a],[,b]) => b-a).map(([pat, score], i) => (
                  <div key={i} style={{ marginBottom: '5px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'2px' }}>
                      <span style={{ fontSize:'11px', color: pat === result.matched_pattern ? (COL[pat] ?? 'var(--gold)') : 'var(--text-muted)' }}>{LABEL[pat] ?? pat}</span>
                      <span className="mono" style={{ fontSize:'10px', color:'var(--text-muted)' }}>{(score*100).toFixed(1)}%</span>
                    </div>
                    <div style={{ height:'3px', background:'var(--dark-border-2)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${score*100}%`, background: pat === result.matched_pattern ? (COL[pat] ?? 'var(--gold)') : 'var(--dark-border)', transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Key player */}
              <div className="card" style={{ padding: '1rem', borderTop: '2px solid var(--gold)' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>GNNEXPLAINER — KEY PLAYER</div>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.75rem' }}>
                  <div className="display" style={{ fontSize:'22px', color:'var(--gold)', letterSpacing:'2px' }}>{result.most_important_player}</div>
                  <div className="mono" style={{ fontSize:'10px', color:'var(--text-muted)' }}>highest node importance</div>
                </div>
                {Object.entries(result.player_importances).sort(([,a],[,b]) => b-a).map(([name, imp], i) => (
                  <div key={i} style={{ marginBottom:'6px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                      <span style={{ fontSize:'12px', color: name === result.most_important_player ? 'var(--gold)' : 'var(--text-muted)' }}>{name}</span>
                      <span className="mono" style={{ fontSize:'11px', color:'var(--text-muted)' }}>{imp.toFixed(3)}</span>
                    </div>
                    <div style={{ height:'4px', background:'var(--dark-border-2)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(imp/maxImportance)*100}%`, background: name === result.most_important_player ? 'var(--gold)' : 'var(--barca-blue)', transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Key pass */}
              <div className="card" style={{ padding: '1rem', borderTop: '2px solid var(--barca-red)' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>GNNEXPLAINER — KEY PASS</div>
                <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                  <span style={{ fontSize:'14px', color:'var(--barca-red)', fontWeight:600 }}>{result.most_important_pass.from}</span>
                  <span style={{ color:'var(--gold)', fontSize:'18px' }}>→</span>
                  <span style={{ fontSize:'14px', color:'var(--barca-red)', fontWeight:600 }}>{result.most_important_pass.to}</span>
                </div>
                <div style={{ fontSize:'12px', color:'var(--text-muted)', marginTop:'6px' }}>
                  Highest edge importance score — this pass drove the GNN prediction most
                </div>
              </div>

              {/* Feature importance */}
              <div className="card" style={{ padding: '1rem', borderTop: '2px solid var(--barca-blue)' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>GNNEXPLAINER — FEATURE IMPORTANCE</div>
                <div className="mono" style={{ fontSize: '11px', color: 'var(--barca-blue)', marginBottom: '0.75rem' }}>
                  ★ {FEATURE_LABELS[result.most_important_feature] ?? result.most_important_feature}
                </div>
                {Object.entries(result.feature_importances).sort(([,a],[,b]) => b-a).map(([feat, imp], i) => (
                  <div key={i} style={{ marginBottom:'6px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'3px' }}>
                      <span style={{ fontSize:'11px', color: feat === result.most_important_feature ? 'var(--barca-blue)' : 'var(--text-muted)' }}>{FEATURE_LABELS[feat] ?? feat}</span>
                      <span className="mono" style={{ fontSize:'10px', color:'var(--text-muted)' }}>{imp.toFixed(3)}</span>
                    </div>
                    <div style={{ height:'4px', background:'var(--dark-border-2)', borderRadius:'2px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${(imp/maxFeature)*100}%`, background: feat === result.most_important_feature ? 'var(--barca-blue)' : 'var(--dark-border)', transition:'width 0.8s ease' }} />
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={() => setResult(null)} style={{
                padding:'10px', background:'transparent', border:'1px solid var(--dark-border)',
                borderRadius:'6px', color:'var(--text-muted)', fontFamily:'Bebas Neue, cursive',
                fontSize:'14px', letterSpacing:'2px', cursor:'pointer',
              }}>CLASSIFY ANOTHER SEQUENCE</button>
            </div>
          )}
        </div>
      </div>

      <div style={{ marginTop:'3rem', paddingTop:'2rem', borderTop:'1px solid var(--dark-border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span className="mono" style={{ fontSize:'11px', color:'var(--text-muted)', letterSpacing:'2px' }}>BARCAIQ © 2026 — BUILT FOR BARÇA INNOVATION HUB</span>
        <div className="senyera-accent" style={{ width:'80px' }} />
      </div>
    </div>
  );
}