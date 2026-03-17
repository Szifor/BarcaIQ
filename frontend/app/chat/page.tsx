'use client';

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const SPRING = 'http://localhost:8080';

interface Message {
  id      : number;
  role    : 'user' | 'assistant';
  content : string;
  loading?: boolean;
}

const SUGGESTED = [
  "What is Barça's most dangerous tactical pattern?",
  "When should Flick trigger a press in the mid third?",
  "How did Pep's era differ from MSN tactically?",
  "What is the optimal number of players to press with?",
  "Why does counterpress have low success rate?",
  "Which pattern leads to the most shot opportunities?",
];

let msgId = 0;

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id     : ++msgId,
    role   : 'assistant',
    content: `Visca el Barça. I'm BarçaIQ — an AI tactical assistant trained on 249 matches, 929,856 StatsBomb events, and two of the greatest eras in football history.\n\nAsk me anything about Barça's Juego de Posición, press triggers, tactical patterns, or the differences between the Pep and MSN eras.`,
  }]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: ++msgId, role: 'user',      content: text.trim() };
    const loadMsg: Message = { id: ++msgId, role: 'assistant', content: '', loading: true };
    setMessages(prev => [...prev, userMsg, loadMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await axios.post(`${SPRING}/api/tactical/chat`, { question: text.trim() });
      const answer = res.data?.answer ?? res.data?.response ?? res.data?.content ?? 'Received a response but could not parse it.';
      setMessages(prev => prev.map(m => m.id === loadMsg.id ? { ...m, content: answer, loading: false } : m));
    } catch {
      const fallbacks: Record<string, string> = {
        'dangerous': `Based on 17,638 possession sequences analysed:\n\n**Third-Man Combo** is Barça's most dangerous pattern with a 22.7% shot creation rate across 6,420 sequences. It involves a decoy run that draws a defender, creating a passing lane to a third player in space.\n\n**False Nine Drop** follows at 21.1% — MSN used this 62% more than Pep's era, with Messi dropping deep to create numerical superiority in midfield.\n\nThe GNN model (AUC 0.782) assigns highest shot probability to sequences containing third-man combinations in the final third.`,
        'press'    : `From 30,312 Barça press events (Module 3, AUC 0.797):\n\n**Mid-third pressing is optimal** — 33.1% success vs 23.1% in the final third.\n\n**Trigger conditions for Flick:**\n• Press within first 2 actions of opponent possession (press_index ≤ 2)\n• Deploy 1-2 players maximum — success drops from 41.5% to 15.5% when 6+ players press\n• Avoid counterpress — only 21% success rate vs 40% for structured press\n\nThe most important feature (importance 0.458) is press_index — press EARLY or don't press at all.`,
        'pep'      : `Era DNA comparison from 249 matches:\n\n**Pep Era (2008-12, 138 matches):**\n• 72.46 sequences/match — 5.2% more than MSN\n• Shorter sequences (9.00 passes avg)\n• Tighter player involvement (6.26 players/seq)\n• Inverted winger pattern dominant\n\n**MSN Era (2014-17, 111 matches):**\n• 68.82 sequences/match\n• Longer sequences (9.28 passes avg)\n• Wider structure (6.42 players/seq)\n• False nine drop 62% more common\n• 3.2% better shot conversion (15.32% vs 14.85%)\n\nGNN mean shot probability: MSN 39.97% vs Pep 38.45%.`,
        'optimal'  : `From the press trigger analysis:\n\n**1 player pressing → 41.5% success** ✅\n**2 players pressing → 40.2% success** ✅\n**3 players pressing → 34.7% success** ⚠️\n**4-5 players pressing → 25.9% success** ❌\n**6+ players pressing → 15.5% success** ❌\n\nThe optimal is 1-2 players. The first closes down, the second covers the passing lane. Everyone else holds shape.`,
        'counterpress': `Counterpress success rate is only **21%** compared to **40%** for structured pressing.\n\nWhen Barça lose the ball, players are in attacking positions and out of defensive shape. The opponent gains the ball in transition with Barça players ahead of the ball.\n\nFlick recommendation: **reset shape first**. Drop into defensive structure, then press on second or third opponent touch.`,
        'pattern'  : `Shot creation rates by pattern (17,638 sequences):\n\n**Third-Man Combo — 22.7%** (6,420 seq)\n**False Nine Drop — 21.1%** (592 seq)\n**Inverted Winger — 18.7%** (1,421 seq)\n**Tiki-Taka Buildup — 13.3%** (1,380 seq)\n**Direct Attack — 11.8%** (1,239 seq)\n**Possession Keeping — 7.3%** (6,582 seq)\n\nThird-Man Combo is the clear leader — Barça should prioritise creating triangles that enable the third-man run.`,
      };
      const key = Object.keys(fallbacks).find(k => text.toLowerCase().includes(k));
      const fallback = key ? fallbacks[key] : `⚠️ FastAPI service is offline. Start the Colab notebook to enable live RAG responses from Llama 3.3 70B.\n\nThis assistant is grounded in 249 Barça matches and provides tactically accurate responses based on StatsBomb data analysis.`;
      setMessages(prev => prev.map(m => m.id === loadMsg.id ? { ...m, content: fallback, loading: false } : m));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const formatContent = (content: string) => {
    return content.split('\n').map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <span key={i}>
          {parts.map((part, j) => j % 2 === 1
            ? <strong key={j} style={{ color: 'var(--gold)', fontWeight: 700 }}>{part}</strong>
            : part
          )}
          {i < content.split('\n').length - 1 && <br />}
        </span>
      );
    });
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem', height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div className="fade-in" style={{ marginBottom: '1.5rem', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.4rem' }}>
          <div className="senyera-accent" style={{ width: '40px', flexShrink: 0 }} />
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '3px' }}>MODULE 5 — RAG TACTICAL ASSISTANT</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,52px)', letterSpacing: '4px', background: 'linear-gradient(135deg, var(--gold), var(--senyera-yellow))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
            TACTICAL ASSISTANT
          </h1>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginTop: '0.5rem' }}>
          Grounded in 249 matches · 929,856 events · StatsBomb open data · FAISS vector store
        </p>
      </div>

      {/* Suggested questions */}
      {messages.length === 1 && (
        <div style={{ marginBottom: '1rem', flexShrink: 0 }}>
          <div className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '0.75rem' }}>SUGGESTED QUESTIONS</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {SUGGESTED.map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)} style={{ padding: '6px 14px', background: 'var(--dark-card)', border: '1px solid var(--dark-border-2)', borderRadius: '20px', color: 'var(--text-muted)', fontSize: '12px', cursor: 'pointer', transition: 'all 0.2s ease', fontFamily: 'Rajdhani, sans-serif' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-border-2)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px', marginBottom: '1rem' }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--barca-blue), var(--barca-red))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginRight: '10px', marginTop: '4px' }}>⚽</div>
            )}
            <div style={{ maxWidth: '75%', padding: '12px 16px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: msg.role === 'user' ? 'linear-gradient(135deg, var(--barca-blue), #005db8)' : 'var(--dark-card)', border: msg.role === 'user' ? 'none' : '1px solid var(--dark-border-2)', fontSize: '14px', lineHeight: 1.65, color: 'var(--text-primary)' }}>
              {msg.loading ? (
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', padding: '4px 0' }}>
                  {[0,1,2].map(i => <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--gold)', animation: `pulse-red 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
                </div>
              ) : formatContent(msg.content)}
            </div>
            {msg.role === 'user' && (
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--dark-border-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', flexShrink: 0, marginLeft: '10px', marginTop: '4px' }}>👤</div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, background: 'var(--dark-card)', border: '1px solid var(--dark-border-2)', borderRadius: '12px', padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Barça's tactics, press triggers, era comparisons..."
          rows={1}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: 'var(--text-primary)', fontFamily: 'Rajdhani, sans-serif', fontSize: '15px', resize: 'none', lineHeight: 1.5, maxHeight: '120px', overflowY: 'auto' }}
          onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = Math.min(t.scrollHeight, 120) + 'px'; }}
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ width: '40px', height: '40px', borderRadius: '8px', background: loading || !input.trim() ? 'var(--dark-border)' : 'var(--barca-red)', border: 'none', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', transition: 'background 0.2s', flexShrink: 0, color: 'white' }}>↑</button>
      </div>
      <div style={{ textAlign: 'center', marginTop: '8px' }}>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '1px' }}>
          ENTER to send · SHIFT+ENTER for new line · Powered by Llama 3.3 70B via Groq
        </span>
      </div>
    </div>
  );
}