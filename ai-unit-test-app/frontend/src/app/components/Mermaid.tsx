'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MermaidProps {
  chart: string;
  className?: string;
}

export default function Mermaid({ chart, className }: MermaidProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [renderedSvg, setRenderedSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setError(null);

    import('mermaid')
      .then((mermaidMod) => {
        const mermaid = mermaidMod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          securityLevel: 'loose',
          themeVariables: {
            background: '#0b0f19',
            primaryColor: '#6366f1',
            primaryTextColor: '#f8fafc',
            lineColor: '#475569',
            secondaryColor: '#1e293b',
            tertiaryColor: '#0f172a',
          },
        });

        if (ref.current && chart && isMounted) {
          const uniqueId = `mermaid-${Math.floor(Math.random() * 100000)}`;
          try {
            mermaid
              .render(uniqueId, chart)
              .then((result) => {
                if (isMounted) {
                  setRenderedSvg(result.svg);
                }
              })
              .catch((err) => {
                console.error('Mermaid rendering error:', err);
                if (isMounted) {
                  setError('Failed to render flowchart');
                }
              });
          } catch (e: any) {
            console.error('Mermaid render crash:', e);
            if (isMounted) {
              setError(e.message || 'Render crash');
            }
          }
        }
      })
      .catch((err) => {
        console.error('Failed to import mermaid:', err);
        if (isMounted) {
          setError('Failed to load mermaid engine');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-mono">
        <strong>Flowchart Error:</strong> {error}
      </div>
    );
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        overflowX: 'auto',
        background: '#0b0f19',
        padding: '1.5rem',
        borderRadius: '12px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
      }}
      dangerouslySetInnerHTML={{
        __html: renderedSvg || '<div style="display: flex; align-items: center; gap: 0.5rem; color: #94a3b8; font-size: 0.85rem;"><div class="spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>Rendering flowchart...</div>'
      }}
    />
  );
}
