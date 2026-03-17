'use client';

import { useState, useRef, useCallback } from 'react';

const PW = 800;
const PH = 520;

interface Player {
  id      : number;
  name    : string;
  x       : number;
  y       : number;
  team    : 'barca' | 'opponent';
  role    : string;
  hasBall : boolean;
}

interface PressAnalysis {
  playerId          : number;
  name              : string;
  successProbability: number;
  distanceToBall    : number;
  recommendation    : string;
  role              : string;
}

interface AnalysisResult {
  primaryPressers : PressAnalysis[];
  holdPlayers     : PressAnalysis[];
  zoneName        : string;
  overallStrategy : string;
  pressIndex      : number;
}

const defaultPlayers: Player[] = [
  { id:1,  name:'JOAN',        x:40,  y:260, team:'barca',    role:'GK',  hasBall:false },
  { id:2,  name:'BALDE',       x:200, y:50, team:'barca',    role:'LB',  hasBall:false },
  { id:3,  name:'GERARD',      x:130, y:160, team:'barca',    role:'CB',  hasBall:false },
  { id:4,  name:'CUBARSÍ',     x:130, y:350, team:'barca',    role:'CB',  hasBall:false },
  { id:5,  name:'KOUNDE',      x:200, y:470, team:'barca',    role:'RB',  hasBall:false },
  { id:6,  name:'PEDRI',       x:250, y:190, team:'barca',    role:'CDM',  hasBall:false },
  { id:7,  name:'DE JONG',     x:250, y:310, team:'barca',    role:'CDM', hasBall:false },
  { id:8,  name:'FERMIN',      x:380, y:340, team:'barca',    role:'AM',  hasBall:false },
  { id:9,  name:'RAPHINHA',    x:440, y:120, team:'barca',    role:'LW',  hasBall:false },
  { id:10, name:'LEWANDOWSKI', x:510, y:260, team:'barca',    role:'ST',  hasBall:false },
  { id:11, name:'YAMAL',       x:470, y:440, team:'barca',    role:'RW',  hasBall:false },
  { id:12, name:'GK',          x:760, y:260, team:'opponent', role:'GK',  hasBall:false },
  { id:13, name:'RB',          x:600, y:50, team:'opponent', role:'RB',  hasBall:false },
  { id:14, name:'CB1',         x:670, y:160, team:'opponent', role:'CB',  hasBall:false },
  { id:15, name:'CB2',         x:670, y:350, team:'opponent', role:'CB',  hasBall:false },
  { id:16, name:'LB',          x:600, y:470, team:'opponent', role:'LB',  hasBall:false },
  { id:17, name:'CM1',         x:520, y:180, team:'opponent', role:'CM',  hasBall:false },
  { id:18, name:'CM2',         x:600, y:260, team:'opponent', role:'CDM', hasBall:false },
  { id:19, name:'CM3',         x:520, y:340, team:'opponent', role:'CM',  hasBall:false },
  { id:20, name:'RW',          x:380, y:120, team:'opponent', role:'RW',  hasBall:false },
  { id:21, name:'ST',          x:360, y:260, team:'opponent', role:'ST',  hasBall:false },
  { id:22, name:'LW',          x:380, y:400, team:'opponent', role:'LW',  hasBall:false },
];

function calcPressProb(distanceToBall: number, normX: number, teammates: number, pressIndex: number, isCounterpress: boolean): number {
  const maxDist      = Math.sqrt(PW * PW + PH * PH);
  const distNorm     = distanceToBall / maxDist;
  const isMidThird   = normX >= 0.333 && normX < 0.667 ? 1 : 0;
  const isFinalThird = normX >= 0.667 ? 1 : 0;
  let prob = 0.38;
  prob += (1 - distNorm)    * 0.25;
  prob -= (pressIndex - 1)  * 0.045;
  prob -= (teammates - 1.5) * 0.04;
  prob += isMidThird        * 0.06;
  prob -= isFinalThird      * 0.04;
  prob -= isCounterpress ? 0.14 : 0;
  prob -= distNorm          * 0.15;
  return Math.min(0.92, Math.max(0.08, prob));
}

function getZoneName(normX: number) {
  if (normX < 0.333) return 'DEFENSIVE THIRD';
  if (normX < 0.667) return 'MID THIRD';
  return 'FINAL THIRD';
}

function probColor(p: number) {
  return p >= 0.5 ? '#00C896' : p >= 0.35 ? '#EDBB4D' : '#A50044';
}

export default function PressPage() {
  const [players,      setPlayers]      = useState<Player[]>(defaultPlayers);
  const [ball,         setBall]         = useState({ x: 600, y: 260 });
  const [pressIndex,   setPressIndex]   = useState(1);
  const [counterpress, setCounterpress] = useState(false);
  const [result,       setResult]       = useState<AnalysisResult | null>(null);
  const [editingId,    setEditingId]    = useState<number | null>(null);
  const [editName,     setEditName]     = useState('');
  const [dragging,     setDragging]     = useState<{ type: 'player' | 'ball'; id?: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const toSvgCoords = useCallback((clientX: number, clientY: number) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect   = svgRef.current.getBoundingClientRect();
    const scaleX = PW / rect.width;
    const scaleY = PH / rect.height;
    return {
      x: Math.min(PW - 10, Math.max(10, (clientX - rect.left) * scaleX)),
      y: Math.min(PH - 10, Math.max(10, (clientY - rect.top)  * scaleY)),
    };
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const { x, y } = toSvgCoords(e.clientX, e.clientY);
    if (dragging.type === 'ball') {
      setBall({ x, y });
    } else if (dragging.type === 'player' && dragging.id !== undefined) {
      setPlayers(ps => ps.map(p => p.id === dragging.id ? { ...p, x, y } : p));
    }
  }, [dragging, toSvgCoords]);

  const onMouseUp = useCallback(() => setDragging(null), []);

  // Ball carrier = nearest opponent to ball
  const ballCarrier = players
    .filter(p => p.team === 'opponent')
    .reduce((nearest, p) => {
      const dist     = Math.sqrt((p.x - ball.x) ** 2 + (p.y - ball.y) ** 2);
      const nearDist = Math.sqrt((nearest.x - ball.x) ** 2 + (nearest.y - ball.y) ** 2);
      return dist < nearDist ? p : nearest;
    });

  const saveEdit = (id: number) => {
    setPlayers(ps => ps.map(p => p.id === id ? { ...p, name: editName.toUpperCase() } : p));
    setEditingId(null);
  };

  const analysePress = () => {
    const normX    = ballCarrier.x / PW;
    const zoneName = getZoneName(normX);

    const allBarca = players
      .filter(p => p.team === 'barca')
      .map(p => ({ ...p, dist: Math.sqrt((p.x - ballCarrier.x) ** 2 + (p.y - ballCarrier.y) ** 2) }))
      .sort((a, b) => a.dist - b.dist);

    const candidates = allBarca.slice(0, 4);
    const rest       = allBarca.slice(4);

    const analyses: PressAnalysis[] = candidates.map(p => ({
      playerId          : p.id,
      name              : p.name,
      successProbability: calcPressProb(p.dist, normX, 1, pressIndex, counterpress),
      distanceToBall    : p.dist,
      recommendation    : '',
      role              : p.role,
    })).sort((a, b) => b.successProbability - a.successProbability);

    const holdRest: PressAnalysis[] = rest.map(p => ({
      playerId          : p.id,
      name              : p.name,
      successProbability: calcPressProb(p.dist, normX, 1, pressIndex, counterpress),
      distanceToBall    : p.dist,
      recommendation    : '',
      role              : p.role,
    }));

    const top       = analyses[0];
    const second    = analyses[1];
    const addSecond = second.successProbability > 0.35 && second.distanceToBall < 200;
    const primaryPressers = addSecond ? [top, second] : [top];
    const holdPlayers = [...analyses.slice(addSecond ? 2 : 1), ...holdRest.slice(0, 3)].slice(0, 4);

    const names   = primaryPressers.map(p => p.name).join(' + ');
    const avgProb = primaryPressers.reduce((s, p) => s + p.successProbability, 0) / primaryPressers.length;

    const strategy = avgProb >= 0.50
      ? `✅ PRESS NOW — ${names} ${primaryPressers.length === 1 ? 'closes down' : 'coordinate press'}. Success probability: ${(avgProb * 100).toFixed(0)}%. Others hold shape and cover lanes.`
      : avgProb >= 0.35
      ? `⚠️ CAUTIOUS PRESS — ${names} can press but risk is moderate (${(avgProb * 100).toFixed(0)}%). Ensure cover before committing.`
      : `❌ HOLD SHAPE — No optimal presser available (best: ${(avgProb * 100).toFixed(0)}%). Barça should retreat and reorganise.`;

    setResult({ primaryPressers, holdPlayers, zoneName, overallStrategy: strategy, pressIndex });
  };

  const RosterPanel = ({ team }: { team: 'barca' | 'opponent' }) => {
    const color = team === 'barca' ? 'var(--barca-blue)' : 'var(--senyera-red)';
    const label = team === 'barca' ? 'BARÇA PLAYERS' : 'OPPONENT PLAYERS';
    return (
      <div className="card" style={{ padding: '1rem' }}>
        <div className="mono" style={{ fontSize: '10px', color, letterSpacing: '2px', marginBottom: '0.75rem' }}>
          ▶ {label} — CLICK ✏️ TO RENAME
        </div>
        {players.filter(p => p.team === team).map(p => (
          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid var(--dark-border)' }}>
            {editingId === p.id ? (
              <input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') setEditingId(null); }}
                autoFocus
                style={{ flex: 1, padding: '4px 8px', marginRight: '8px', background: 'var(--dark-bg)', border: `1px solid ${color}`, borderRadius: '4px', color: 'white', fontFamily: 'JetBrains Mono, monospace', fontSize: '12px' }}
              />
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{p.name}</span>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{p.role}</span>
              </div>
            )}
            <button onClick={() => { if (editingId === p.id) { saveEdit(p.id); } else { setEditingId(p.id); setEditName(p.name); } }}
              style={{ background: 'transparent', border: 'none', color: editingId === p.id ? 'var(--success)' : 'var(--text-muted)', cursor: 'pointer', fontSize: '13px', padding: '2px 6px' }}>
              {editingId === p.id ? '✓' : '✏️'}
            </button>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
      <div className="fade-in" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
          <div className="senyera-accent" style={{ width: '40px', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px' }}>MODULE 3 — PRESS TRIGGER SIMULATOR</span>
        </div>
        <h1 className="display" style={{ fontSize: 'clamp(32px,5vw,64px)', letterSpacing: '4px', color: 'var(--barca-red)', lineHeight: 1 }}>
          TACTICAL PRESS BOARD
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '0.5rem', maxWidth: '700px' }}>
          Drag players and ball to set up any scenario. Rename any player. Nearest opponent to ball auto-becomes carrier.
          Hit ANALYSE PRESS for AI-powered recommendation based on GBM model trained on 30,312 Barça press events.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        <div className="card" style={{ padding: '1rem' }}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '180px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px' }}>PRESS INDEX</span>
                <span className="mono" style={{ fontSize: '12px', color: 'var(--gold)', fontWeight: 700 }}>{pressIndex}</span>
              </div>
              <input type="range" min={1} max={8} value={pressIndex} onChange={e => setPressIndex(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--barca-red)', margin: '4px 0' }} />
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {pressIndex <= 2 ? '✅ Early — opponent unsettled' : pressIndex <= 4 ? '⚠️ Mid possession' : '❌ Late — opponent settled'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>COUNTERPRESS</span>
              <div onClick={() => setCounterpress(!counterpress)} style={{ width: '42px', height: '24px', borderRadius: '12px', background: counterpress ? 'var(--barca-red)' : 'var(--dark-border-2)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', border: '1px solid var(--dark-border)' }}>
                <div style={{ position: 'absolute', top: '3px', left: counterpress ? '21px' : '3px', width: '16px', height: '16px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={analysePress} style={{ padding: '10px 24px', background: 'var(--barca-red)', border: 'none', borderRadius: '6px', color: 'white', fontFamily: 'Bebas Neue, cursive', fontSize: '16px', letterSpacing: '3px', cursor: 'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#C8005A')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--barca-red)')}>
                ANALYSE PRESS
              </button>
              <button onClick={() => { setResult(null); setPlayers(defaultPlayers); setBall({ x: 600, y: 260 }); }} style={{ padding: '10px 16px', background: 'transparent', border: '1px solid var(--dark-border)', borderRadius: '6px', color: 'var(--text-muted)', fontFamily: 'Bebas Neue, cursive', fontSize: '14px', letterSpacing: '2px', cursor: 'pointer' }}>
                RESET
              </button>
            </div>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            {[
              { color: 'var(--barca-blue)',  label: 'Barça'        },
              { color: 'var(--senyera-red)', label: 'Opponent'     },
              { color: 'var(--gold)',        label: 'Ball carrier' },
              { color: 'white',             label: 'Ball'         },
              { color: 'var(--success)',     label: 'Press now'    },
              { color: '#EDBB4D',           label: 'Caution'      },
              { color: 'var(--barca-red)',   label: 'Hold shape'   },
            ].map((l, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* SVG Pitch */}
          <svg ref={svgRef} viewBox={`0 0 ${PW} ${PH}`}
            style={{ width: '100%', cursor: dragging ? 'grabbing' : 'default', userSelect: 'none', borderRadius: '4px', display: 'block' }}
            onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}>
            <rect width={PW} height={PH} fill="#1a3a1a" rx="4" />
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x={i*80} y={0} width={80} height={PH} fill={i%2===0 ? 'rgba(255,255,255,0.018)' : 'transparent'} />
            ))}
            <rect x={0}           y={0} width={PW/3}   height={PH} fill="rgba(0,77,152,0.07)"   />
            <rect x={PW/3}        y={0} width={PW/3}   height={PH} fill="rgba(237,187,77,0.04)" />
            <rect x={(PW/3)*2}    y={0} width={PW/3}   height={PH} fill="rgba(165,0,68,0.07)"   />
            <rect x={1} y={1} width={PW-2} height={PH-2} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
            <line x1={PW/2} y1={0} x2={PW/2} y2={PH} stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle cx={PW/2} cy={PH/2} r={70} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <circle cx={PW/2} cy={PH/2} r={5}  fill="rgba(255,255,255,0.4)" />
            <rect x={0} y={PH*0.23} width={PW*0.15} height={PH*0.54} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={0} y={PH*0.35} width={PW*0.07} height={PH*0.30} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={PW*0.85} y={PH*0.23} width={PW*0.15} height={PH*0.54} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <rect x={PW*0.93} y={PH*0.35} width={PW*0.07} height={PH*0.30} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
            <text x={PW*0.167} y={PH-12} textAnchor="middle" fill="rgba(0,77,152,0.5)"   fontSize="11" fontFamily="monospace">DEFENSIVE</text>
            <text x={PW*0.5}   y={PH-12} textAnchor="middle" fill="rgba(237,187,77,0.5)" fontSize="11" fontFamily="monospace">MID THIRD</text>
            <text x={PW*0.833} y={PH-12} textAnchor="middle" fill="rgba(165,0,68,0.5)"   fontSize="11" fontFamily="monospace">FINAL THIRD</text>

            {/* Press lines */}
            {result?.primaryPressers.map(pp => {
              const p = players.find(pl => pl.id === pp.playerId);
              if (!p) return null;
              return <line key={pp.playerId} x1={p.x} y1={p.y} x2={ballCarrier.x} y2={ballCarrier.y} stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="6,4" opacity={0.7} />;
            })}

            {/* Ball */}
            <circle cx={ball.x} cy={ball.y} r={10} fill="white" stroke="rgba(0,0,0,0.4)" strokeWidth="2" style={{ cursor: 'grab' }}
              onMouseDown={e => { e.stopPropagation(); setDragging({ type: 'ball' }); }} />
            <text x={ball.x} y={ball.y-16} textAnchor="middle" fill="rgba(255,255,255,0.55)" fontSize="9" fontFamily="monospace">BALL</text>

            {/* Players */}
            {players.map(p => {
              const isBarca   = p.team === 'barca';
              const isCarrier = p.id === ballCarrier.id;
              const isPrimary = result?.primaryPressers.some(pp => pp.playerId === p.id);
              const isHold    = result?.holdPlayers.some(pp => pp.playerId === p.id);
              const baseColor = isBarca ? '#004D98' : '#C8001A';
              const strokeCol = isPrimary ? 'var(--gold)' : isCarrier ? 'var(--gold)' : 'rgba(255,255,255,0.35)';
              const radius    = 18;
              const ringAnalysis = result
                ? (result.primaryPressers.find(pp => pp.playerId === p.id) ?? result.holdPlayers.find(pp => pp.playerId === p.id))
                : null;
              return (
                <g key={p.id} style={{ cursor: 'grab' }}
                  onMouseDown={e => { e.stopPropagation(); setDragging({ type: 'player', id: p.id }); }}
                  onClick={() => {}}>
                  {isBarca && ringAnalysis && (() => {
                    const pct  = ringAnalysis.successProbability;
                    const circ = 2 * Math.PI * (radius + 7);
                    const dash = circ * pct;
                    return <circle cx={p.x} cy={p.y} r={radius+7} fill="none" stroke={probColor(pct)} strokeWidth="3" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" transform={`rotate(-90 ${p.x} ${p.y})`} opacity={0.85} />;
                  })()}
                  <circle cx={p.x} cy={p.y} r={radius} fill={isCarrier ? 'var(--gold)' : baseColor} stroke={strokeCol} strokeWidth={isPrimary || isCarrier ? 3 : 1.5} opacity={0.93} />
                  <text x={p.x} y={p.y+4} textAnchor="middle" fill={isCarrier ? '#000' : 'white'} fontSize="9" fontFamily="monospace" fontWeight="600">{p.role}</text>
                  <text x={p.x} y={p.y+radius+14} textAnchor="middle"
                    fill={isPrimary ? 'var(--gold)' : isHold ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.75)'}
                    fontSize="9" fontFamily="monospace" fontWeight={isPrimary ? '700' : '400'}>
                    {p.name.length > 8 ? p.name.slice(0,8) : p.name}
                  </text>
                </g>
              );
            })}
          </svg>

          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1.5rem', fontSize: '12px', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
            <span>🖱️ <strong>Drag</strong> players or ball</span>
            <span>🔴 <strong>Nearest opponent to ball</strong> = auto ball carrier</span>
            <span>✏️ <strong>Rename</strong> players in the panel →</span>
          </div>
        </div>

        {/* Right panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {result ? (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="card" style={{ borderTop: '2px solid var(--gold)', padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '4px' }}>PRESS ZONE</div>
                <div className="display" style={{ fontSize: '22px', color: 'var(--gold)', letterSpacing: '2px' }}>{result.zoneName}</div>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>OPPONENT ACTION #{result.pressIndex} IN POSSESSION</div>
              </div>
              <div className="card" style={{ borderLeft: `3px solid ${result.overallStrategy.startsWith('✅') ? 'var(--success)' : result.overallStrategy.startsWith('⚠') ? 'var(--gold)' : 'var(--barca-red)'}`, padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' }}>AI RECOMMENDATION</div>
                <p style={{ fontSize: '13px', lineHeight: 1.6 }}>{result.overallStrategy}</p>
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '0.75rem' }}>▶ PRESS NOW</div>
                {result.primaryPressers.map((pp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--dark-border)' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gold)' }}>{pp.name}</div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pp.role} · {pp.distanceToBall.toFixed(0)}u away</div>
                    </div>
                    <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color: probColor(pp.successProbability) }}>{(pp.successProbability*100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding: '1rem' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>▶ HOLD SHAPE</div>
                {result.holdPlayers.map((pp, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--dark-border)' }}>
                    <div>
                      <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{pp.name}</div>
                      <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{pp.role}</div>
                    </div>
                    <div className="mono" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{(pp.successProbability*100).toFixed(0)}%</div>
                  </div>
                ))}
              </div>
              <button onClick={() => setResult(null)} style={{ padding: '10px', background: 'transparent', border: '1px solid var(--dark-border)', borderRadius: '6px', color: 'var(--text-muted)', fontFamily: 'Bebas Neue, cursive', fontSize: '14px', letterSpacing: '2px', cursor: 'pointer' }}>
                BACK TO ROSTER
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <RosterPanel team="barca" />
              <RosterPanel team="opponent" />
              <div className="card" style={{ padding: '1rem', borderLeft: '3px solid var(--gold)' }}>
                <div className="mono" style={{ fontSize: '10px', color: 'var(--gold)', letterSpacing: '2px', marginBottom: '8px' }}>QUICK TIPS</div>
                {[
                  '🖱️ Drag players or ball to reposition',
                  '🔴 Drag ball near an opponent — they auto-become carrier',
                  '⚡ Low press index = early in possession = higher success',
                  '👥 1-2 pressers optimal — 6+ causes shape collapse',
                  '⚠️ Counterpress only 21% success rate',
                ].map((t, i) => (
                  <div key={i} style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '4px 0', lineHeight: 1.5 }}>{t}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}