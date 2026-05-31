// v1.7.0 | 2026-05-31 MEZ

import React, { useReducer, useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { gameReducer, makeInitialState } from './reducers/gameReducer';
import { currentSnapshot } from './types/game';

const titleStyle: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif", fontWeight: 900, letterSpacing: '0.12em' };
const subtitleStyle: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif", fontWeight: 300 };

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialState);
  const snap = currentSnapshot(state);
  const [swUpdating, setSwUpdating] = useState(false);

  useEffect(() => {
    const handler = () => setSwUpdating(true);
    window.addEventListener('sw-update-start', handler);
    return () => window.removeEventListener('sw-update-start', handler);
  }, []);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // pos = 'top' (gespiegelt) oder 'bottom' (normal)
  const controls = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <div id={`app-controls-${pos}`} className="flex gap-2" style={{ transform: flipped ? 'rotate(180deg)' : undefined }}>
        <button id={`app-btn-undo-${pos}`} onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors">
          ← Undo
        </button>
        <button id={`app-btn-redo-${pos}`} onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors">
          Redo →
        </button>
        <button id={`app-btn-new-${pos}`} onClick={() => dispatch({ type: 'NEW_GAME' })}
          className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors">
          Neu starten
        </button>
      </div>
    );
  };

  const heading = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <h1 id={`app-heading-${pos}`} style={{ ...titleStyle, transform: flipped ? 'rotate(180deg)' : undefined }}
        className="text-3xl text-white uppercase text-center">Abalone</h1>
    );
  };

  const subtitle = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <p id={`app-subtitle-${pos}`} style={{ ...subtitleStyle, transform: flipped ? 'rotate(180deg)' : undefined }}
        className="text-gray-500 text-sm text-center">2-Spieler Offline Modus</p>
    );
  };

  const attribution = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <a id={`app-attribution-${pos}`} href="https://www.artur.ch" target="_blank" rel="noopener noreferrer"
        style={{
          transform: flipped ? 'rotate(180deg)' : undefined,
          fontSize: '10px', color: 'rgba(156,163,175,0.5)',
          textDecoration: 'none', letterSpacing: '0.03em',
          fontFamily: "'Exo 2', sans-serif",
        }}>
        © A.N. 05/2026
      </a>
    );
  };

  return (
    <div id="app-root" className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 gap-4" style={{ position: 'relative' }}>

      {/* Update-Overlay */}
      {swUpdating && (
        <div id="app-update-overlay" style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(3, 7, 18, 0.88)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: '20px',
        }}>
          <div id="app-update-spinner" style={{
            width: '48px', height: '48px',
            border: '4px solid rgba(245,158,11,0.2)',
            borderTopColor: 'rgb(245,158,11)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p id="app-update-message" style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 600, fontSize: '16px', color: 'rgb(245,158,11)', letterSpacing: '0.05em' }}>
            Neue Version wird geladen…
          </p>
          <p id="app-update-submessage" style={{ fontFamily: "'Exo 2', sans-serif", fontWeight: 300, fontSize: '13px', color: 'rgba(156,163,175,0.7)' }}>
            Die App startet automatisch neu.
          </p>
        </div>
      )}

      {/* ── OBEN (180° gedreht für oberen Spieler) ── */}
      {attribution(true)}
      {subtitle(true)}
      {heading(true)}
      {controls(true)}

      {/* ── SPIELFELD ── */}
      <main id="app-board-section" className="w-full flex justify-center">
        <GameBoard
          board={snap.board}
          currentPlayer={snap.currentPlayer}
          winner={state.winner}
          players={state.players}
          scores={snap.scores}
          dispatch={dispatch}
        />
      </main>

      {/* ── UNTEN (normal für unteren Spieler) ── */}
      {controls(false)}
      {heading(false)}
      {subtitle(false)}
      {attribution(false)}

    </div>
  );
}

export default App;
