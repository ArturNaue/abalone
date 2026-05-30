// v1.4.0 | 2026-05-30 MEZ

import React, { useReducer } from 'react';
import { GameBoard } from './components/GameBoard';
import { gameReducer, makeInitialState } from './reducers/gameReducer';
import { currentSnapshot } from './types/game';

const titleStyle: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif", fontWeight: 900, letterSpacing: '0.12em' };
const subtitleStyle: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif", fontWeight: 300 };

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialState);
  const snap = currentSnapshot(state);

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
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-4 gap-4">
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
    </div>
  );
}

export default App;
