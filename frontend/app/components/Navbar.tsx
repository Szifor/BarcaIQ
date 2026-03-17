'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { href: '/',         label: 'DASHBOARD' },
  { href: '/press',    label: 'PRESS'     },
  { href: '/patterns', label: 'PATTERNS'  },
  { href: '/chat',     label: 'ASSISTANT' },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav style={{
      position      : 'fixed',
      top           : 0, left: 0, right: 0,
      zIndex        : 100,
      background    : 'rgba(6,9,20,0.92)',
      backdropFilter: 'blur(12px)',
      borderBottom  : '1px solid var(--dark-border-2)',
    }}>
      <div className="senyera-accent" />
      <div style={{
        maxWidth      : '1400px',
        margin        : '0 auto',
        padding       : '0 2rem',
        height        : '64px',
        display       : 'flex',
        alignItems    : 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width         : '36px', height: '36px', borderRadius: '50%',
              background    : 'linear-gradient(135deg, var(--barca-blue), var(--barca-red))',
              display       : 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize      : '16px',
              boxShadow     : '0 0 16px rgba(165,0,68,0.5)',
            }}>⚽</div>
            <div>
              <div className="display" style={{
                fontSize    : '22px', letterSpacing: '3px',
                background  : 'linear-gradient(90deg, var(--barca-red), var(--gold))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                lineHeight  : 1,
              }}>BARÇAIQ</div>
              <div className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
                TACTICAL INTELLIGENCE
              </div>
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          {navLinks.map(link => {
            const active = pathname === link.href;
            return (
              <Link key={link.href} href={link.href} style={{
                textDecoration: 'none',
                fontFamily    : 'Rajdhani, sans-serif',
                fontWeight    : 600, fontSize: '13px', letterSpacing: '2px',
                color         : active ? 'var(--gold)' : 'var(--text-muted)',
                borderBottom  : active ? '2px solid var(--gold)' : '2px solid transparent',
                paddingBottom : '2px',
                transition    : 'all 0.2s ease',
              }}>{link.label}</Link>
            );
          })}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'rgba(0,200,150,0.1)', border: '1px solid rgba(0,200,150,0.3)',
            borderRadius: '20px', padding: '4px 12px',
          }}>
            <div className="pulse" style={{
              width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)',
            }} />
            <span className="mono" style={{ fontSize: '10px', color: 'var(--success)', letterSpacing: '1px' }}>LIVE</span>
          </div>
        </div>
      </div>
    </nav>
  );
}