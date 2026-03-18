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
      const res = await axios.post(
        `${SPRING}/api/tactical/chat`,
        { question: text.trim() },
        { timeout: 60000 }
      );
      const answer = res.data?.answer
        ?? res.data?.response
        ?? res.data?.content
        ?? JSON.stringify(res.data);
      setMessages(prev => prev.map(m =>
        m.id === loadMsg.id ? { ...m, content: answer, loading: false } : m
      ));
    } catch (err: any) {
      const isOffline =
        err?.code === 'ERR_NETWORK' ||
        err?.response?.status === 503 ||
        err?.response?.data?.status === '503';
      const fallback = isOffline
        ? `⚠️ FastAPI service is offline. Start the Colab notebook to enable live RAG responses from Llama 3.3 70B.`
        : `Error: ${err?.response?.data?.detail ?? err?.message ?? 'Unexpected error'}`;
      setMessages(prev => prev.map(m =>
        m.id === loadMsg.id ? { ...m, content: fallback, loading: false } : m
      ));
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