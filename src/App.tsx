// v1.5.0 | 2026-05-31 MEZ

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

  const controls = (flipped: boolean) => (
    <div
      className="flex gap-2"
      style={{ transform: flipped ? 'rotate(180deg)' : undefined }}
    >
      <button
        onClick={() => dispatch({ type: 'UNDO' })}
        disabled={!canUndo}
        className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors"
      >
        ← Undo
      </button>
      <button
        onClick={() => dispatch({ type: 'REDO' })}
        disabled={!canRedo}
        className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 rounded-lg border border-gray-700 transition-colors"
      >
        Redo →
      </button>
      <button
        onClick={() => dispatch({ type: 'NEW_GAME' })}
        className="px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg border border-gray-700 transition-colors"
      >
        Neu starten
      </button>
    </div>
  );

  const title = (flipped: boolean) => (
    <div
      className="text-center"
      style={{ transform: flipped ? 'rotate(180deg)' : undefined }}
    >
      <h1 style={titleStyle} className="text-3xl text-white uppercase">Abalone</h1>
      <p style={subtitleStyle} className="text-gray-500 text-sm mt-1">2-Spieler Offline Modus</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 gap-4" style={{ position: 'relative' }}>
      {/* Update-Overlay – blockiert das Spiel während SW-Download */}
      {swUpdating && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(3, 7, 18, 0.88)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: '20px',
        }}>
          {/* Spinner */}
          <div style={{
            width: '48px', height: '48px',
            border: '4px solid rgba(245,158,11,0.2)',
            borderTopColor: 'rgb(245,158,11)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }} />
          <p style={{
            fontFamily: "'Exo 2', sans-serif", fontWeight: 600,
            fontSize: '16px', color: 'rgb(245,158,11)',
            letterSpacing: '0.05em',
          }}>
            Neue Version wird geladen…
          </p>
          <p style={{
            fontFamily: "'Exo 2', sans-serif", fontWeight: 300,
            fontSize: '13px', color: 'rgba(156,163,175,0.7)',
          }}>
            Die App startet automatisch neu.
          </p>
        </div>
      )}

      {/* Flipped controls for top player */}
      {controls(true)}

      {/* Flipped title for top player */}
      {title(true)}

      <main className="w-full flex justify-center">
        <GameBoard
          board={snap.board}
          currentPlayer={snap.currentPlayer}
          winner={state.winner}
          players={state.players}
          scores={snap.scores}
          dispatch={dispatch}
        />
      </main>

      {/* Normal title for bottom player */}
      {title(false)}

      {/* Normal controls for bottom player */}
      {controls(false)}

      {/* Attribution – zentriert unten */}
      <a
        href="https://www.artur.ch"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          fontSize: '10px', color: 'rgba(156,163,175,0.5)',
          textDecoration: 'none', letterSpacing: '0.03em',
          fontFamily: "'Exo 2', sans-serif",
        }}
      >
        © A.N. 05/2026
      </a>
    </div>
  );
}

export default App;
