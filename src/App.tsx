// v1.7.0 | 2026-05-31 MEZ

import React, { useReducer, useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { DEFAULT_ACTIVE_PLAYERS, gameReducer, makeInitialState } from './reducers/gameReducer';
import { currentSnapshot, GameMode, PlayerColor, PlayerMap } from './types/game';
import { getAiMove } from './utils/aiPlayer';

const titleStyle: React.CSSProperties = { fontFamily: "'Exo 2', sans-serif", fontWeight: 900, letterSpacing: '0.12em' };
type AppTheme = 'classic' | 'sand';

const playerDefaults: Record<PlayerColor, string> = {
  BLACK: 'Schwarz',
  WHITE: 'Weiss',
  BLUE: 'Blau',
  RED: 'Rot',
  GREEN: 'Grün',
  YELLOW: 'Gelb',
  BROWN: 'Braun',
  PURPLE: 'Violett',
};

const colorLabels: Record<PlayerColor, string> = {
  BLACK: 'Schwarz',
  WHITE: 'Weiss',
  BLUE: 'Blau',
  RED: 'Rot',
  GREEN: 'Grün',
  YELLOW: 'Gelb',
  BROWN: 'Braun',
  PURPLE: 'Violett',
};

const playerSwatches: Record<PlayerColor, { bg: string; border: string }> = {
  BLACK: { bg: '#171717', border: '#050505' },
  WHITE: { bg: '#f4f4f5', border: '#b8b8c0' },
  BLUE: { bg: '#2563eb', border: '#1d4ed8' },
  RED: { bg: '#f43f5e', border: '#be123c' },
  GREEN: { bg: '#22c55e', border: '#15803d' },
  YELLOW: { bg: '#f59e0b', border: '#92400e' },
  BROWN: { bg: '#5a351d', border: '#2f1a0d' },
  PURPLE: { bg: '#8b5cf6', border: '#6d28d9' },
};

const playerColorOptions: PlayerColor[] = ['WHITE', 'BLACK', 'BLUE', 'RED', 'GREEN', 'YELLOW', 'BROWN', 'PURPLE'];

function DiscPreview({
  color,
  selected,
  disabled,
  onClick,
}: {
  color: PlayerColor;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const swatch = playerSwatches[color];
  return (
    <button
      type="button"
      aria-label={colorLabels[color]}
      aria-pressed={selected}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`setup-color-dot${selected ? ' setup-color-dot-active' : ''}`}
      style={{ background: swatch.bg, borderColor: selected ? 'var(--button-bg)' : swatch.border }}
    />
  );
}

function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, makeInitialState);
  const snap = currentSnapshot(state);
  const [swUpdating, setSwUpdating] = useState(false);
  const [showSetup, setShowSetup] = useState(true);
  const [showMenuConfirm, setShowMenuConfirm] = useState(false);
  const [setupMode, setSetupMode] = useState<GameMode>('two');
  const [setupActivePlayers, setSetupActivePlayers] = useState<PlayerColor[]>(DEFAULT_ACTIVE_PLAYERS.two);
  const [setupPlayers, setSetupPlayers] = useState<PlayerMap>(state.players);
  const [theme, setTheme] = useState<AppTheme>(() => {
    const saved = localStorage.getItem('abalone-theme');
    return saved === 'classic' ? 'classic' : 'sand';
  });

  useEffect(() => {
    const handler = () => setSwUpdating(true);
    window.addEventListener('sw-update-start', handler);
    return () => window.removeEventListener('sw-update-start', handler);
  }, []);

  useEffect(() => {
    localStorage.setItem('abalone-theme', theme);
  }, [theme]);

  useEffect(() => {
    if (showSetup || showMenuConfirm) return;
    if (state.winner) return;
    const currentPlayer = state.players[snap.currentPlayer];
    if (!currentPlayer.isAi) return;

    const timer = window.setTimeout(() => {
      const aiMove = getAiMove(snap.board, snap.currentPlayer);
      if (!aiMove) return;
      dispatch({ type: 'EXECUTE_MOVE', selectedHexes: aiMove.selectedHexes, move: aiMove.move });
    }, 550);

    return () => window.clearTimeout(timer);
  }, [showMenuConfirm, showSetup, snap, state.historyIndex, state.mode, state.players, state.winner]);

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  const isSandTheme = theme === 'sand';
  const isSetupThreePlayerMode = setupMode === 'three';

  const updateSetupPlayerName = (player: PlayerColor, name: string) => {
    setSetupPlayers(prev => ({
      ...prev,
      [player]: { ...prev[player], name },
    }));
  };

  const toggleSetupPlayerAi = (player: PlayerColor) => {
    setSetupPlayers(prev => ({
      ...prev,
      [player]: { ...prev[player], isAi: !prev[player].isAi },
    }));
  };

  const selectSetupPlayerColor = (index: number, color: PlayerColor) => {
    if (setupActivePlayers.some((selected, selectedIndex) => selectedIndex !== index && selected === color)) return;
    const oldColor = setupActivePlayers[index];

    setSetupPlayers(prev => {
      const oldPlayer = prev[oldColor];
      const shouldUseNewDefault = !oldPlayer.name.trim() || oldPlayer.name === playerDefaults[oldColor];
      return {
        ...prev,
        [color]: {
          ...prev[color],
          name: shouldUseNewDefault ? playerDefaults[color] : oldPlayer.name,
          isAi: oldPlayer.isAi,
        },
      };
    });

    setSetupActivePlayers(prev => {
      const next = [...prev];
      next[index] = color;
      return next;
    });
  };

  const startConfiguredGame = () => {
    const players = { ...setupPlayers };
    for (const player of setupActivePlayers) {
      const trimmed = players[player].name.trim();
      players[player] = {
        ...players[player],
        name: trimmed || playerDefaults[player],
      };
    }

    dispatch({ type: 'START_GAME', mode: setupMode, players, activePlayers: setupActivePlayers });
    setShowSetup(false);
    setShowMenuConfirm(false);
  };

  const openSetup = () => {
    setSetupMode(state.mode);
    setSetupActivePlayers(state.activePlayers);
    setSetupPlayers(state.players);
    setShowMenuConfirm(false);
    setShowSetup(true);
  };

  const handleMenuClick = () => {
    if (state.winner || state.historyIndex === 0) {
      openSetup();
      return;
    }
    setShowMenuConfirm(true);
  };

  // pos = 'top' (gespiegelt) oder 'bottom' (normal)
  const controls = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <div id={`app-controls-${pos}`} className="flex gap-2" style={{ transform: flipped ? 'rotate(180deg)' : undefined }}>
        <button id={`app-btn-undo-${pos}`} onClick={() => dispatch({ type: 'UNDO' })} disabled={!canUndo}
          className="app-button px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border transition-colors">
          ← Undo
        </button>
        <button id={`app-btn-redo-${pos}`} onClick={() => dispatch({ type: 'REDO' })} disabled={!canRedo}
          className="app-button px-3 py-1.5 text-xs disabled:opacity-30 disabled:cursor-not-allowed rounded-lg border transition-colors">
          Redo →
        </button>
        <button id={`app-btn-new-${pos}`} onClick={() => dispatch({ type: 'NEW_GAME' })}
          className="app-button px-3 py-1.5 text-xs rounded-lg border transition-colors">
          Neu starten
        </button>
        <button id={`app-btn-menu-${pos}`} onClick={handleMenuClick}
          className="app-button px-3 py-1.5 text-xs rounded-lg border transition-colors">
          Setup
        </button>
      </div>
    );
  };

  const themeToggle = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <div
        id={`app-theme-${pos}`}
        className={`theme-control${isSandTheme ? ' theme-control-active' : ''}`}
        style={{ transform: flipped ? 'rotate(180deg)' : undefined }}
      >
        <span id={`app-theme-label-gray-${pos}`} className="theme-label">Grau</span>
        <button
          id={`app-theme-switch-${pos}`}
          type="button"
          role="switch"
          aria-checked={isSandTheme}
          aria-label="Farbschema Sand umschalten"
          className="theme-switch"
          onClick={() => setTheme(isSandTheme ? 'classic' : 'sand')}
        >
          <span className="theme-switch-thumb" />
        </button>
        <span id={`app-theme-label-sand-${pos}`} className="theme-label">Sand</span>
      </div>
    );
  };

  const setupModeToggle = () => {
    const setMode = (mode: GameMode) => {
      const activePlayers = DEFAULT_ACTIVE_PLAYERS[mode];
      setSetupMode(mode);
      setSetupActivePlayers(activePlayers);
      setSetupPlayers(prev => {
        const next = { ...prev };
        for (const player of activePlayers) {
          if (!next[player].name.trim()) {
            next[player] = { ...next[player], name: playerDefaults[player] };
          }
        }
        return next;
      });
    };

    return (
      <div id="abalone-setup-mode" className="setup-count-buttons">
        <button
          id="abalone-setup-mode-two"
          type="button"
          className={`setup-count-button${!isSetupThreePlayerMode ? ' setup-count-button-active' : ''}`}
          onClick={() => setMode('two')}
          aria-pressed={!isSetupThreePlayerMode}
        >
          2 Spieler
        </button>
        <button
          id="abalone-setup-mode-three"
          type="button"
          className={`setup-count-button${isSetupThreePlayerMode ? ' setup-count-button-active' : ''}`}
          onClick={() => setMode('three')}
          aria-pressed={isSetupThreePlayerMode}
        >
          3 Spieler
        </button>
      </div>
    );
  };

  const heading = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <h1 id={`app-heading-${pos}`} style={{ ...titleStyle, color: 'var(--title-text)', transform: flipped ? 'rotate(180deg)' : undefined }}
        className="text-3xl uppercase text-center">Abalone</h1>
    );
  };

  const attribution = (flipped: boolean) => {
    const pos = flipped ? 'top' : 'bottom';
    return (
      <a id={`app-attribution-${pos}`} href="https://www.artur.ch" target="_blank" rel="noopener noreferrer"
        style={{
          transform: flipped ? 'rotate(180deg)' : undefined,
          fontSize: '10px', color: 'var(--muted-text)',
          textDecoration: 'none', letterSpacing: '0.03em',
          fontFamily: "'Exo 2', sans-serif",
        }}>
        © A.N. 05/2026
      </a>
    );
  };

  const renderSetup = () => (
    <div id="abalone-setup" className="setup-screen">
      <div style={{ textAlign: 'center' }}>
        <h1 id="abalone-setup-title" style={{ ...titleStyle, fontSize: '2.5rem', color: 'var(--title-text)', margin: 0 }}>
          ABALONE
        </h1>
      </div>

      <section id="abalone-setup-count" className="setup-card setup-main-card">
        <p className="setup-section-label">Anzahl Spieler</p>
        {setupModeToggle()}
        <p className="setup-section-label">Spielernamen</p>
        <div id="abalone-setup-players" className="setup-player-list">
          {setupActivePlayers.map((player, index) => {
            return (
              <div key={`player-${index}`} id={`abalone-setup-name-${index}`} className="setup-player-entry">
                <div className="setup-player-row">
                  <input
                    id={`abalone-setup-input-${index}`}
                    value={setupPlayers[player].name}
                    onChange={e => updateSetupPlayerName(player, e.target.value)}
                    maxLength={16}
                    placeholder={playerDefaults[player]}
                    className="setup-name-input"
                  />
                  <button
                    id={`abalone-setup-ai-${index}`}
                    type="button"
                    onClick={() => toggleSetupPlayerAi(player)}
                    aria-pressed={setupPlayers[player].isAi}
                    className={`setup-ai-button${setupPlayers[player].isAi ? ' setup-ai-button-active' : ''}`}
                    title={setupPlayers[player].isAi ? 'KI deaktivieren' : 'KI aktivieren'}
                  >
                    KI
                  </button>
                </div>
                <div id={`abalone-setup-color-${index}`} className="setup-color-row">
                  {playerColorOptions.map(option => {
                    const selected = option === player;
                    const disabled = !selected && setupActivePlayers.includes(option);
                    return (
                      <DiscPreview
                        key={option}
                        color={option}
                        selected={selected}
                        disabled={disabled}
                        onClick={() => selectSetupPlayerColor(index, option)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="abalone-setup-theme" className="setup-card setup-theme-card">
        <p className="setup-section-label">Farbschema</p>
        {themeToggle(false)}
      </section>

      <button id="abalone-setup-start" type="button" onClick={startConfiguredGame} className="setup-start-button">
        SPIEL STARTEN
      </button>

      <a href="https://www.artur.ch" target="_blank" rel="noopener noreferrer"
        style={{ fontSize: '10px', color: 'var(--muted-text)', textDecoration: 'none', fontFamily: "'Exo 2', sans-serif" }}
      >
        © A.N. 05/2026
      </a>
    </div>
  );

  const renderMenuConfirm = () => (
    <div id="abalone-menu-confirm" className="menu-confirm-overlay" onClick={() => setShowMenuConfirm(false)}>
      <div className="menu-confirm-panel" onClick={e => e.stopPropagation()}>
        <p className="menu-confirm-title">Spiel verlassen?</p>
        <p className="menu-confirm-copy">Der aktuelle Spielstand geht verloren.</p>
        <div className="menu-confirm-actions">
          <button id="abalone-menu-confirm-stay" type="button" className="menu-confirm-secondary" onClick={() => setShowMenuConfirm(false)}>
            ← Weiterspielen
          </button>
          <button id="abalone-menu-confirm-leave" type="button" className="menu-confirm-primary" onClick={openSetup}>
            Zum Setup
          </button>
        </div>
      </div>
    </div>
  );

  if (showSetup) {
    return (
      <div
        id="app-root"
        data-theme={theme}
        className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
        style={{ position: 'relative', background: 'var(--app-bg)', color: 'var(--primary-text)' }}
      >
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
        {renderSetup()}
      </div>
    );
  }

  return (
    <div
      id="app-root"
      data-theme={theme}
      className="min-h-screen flex flex-col items-center justify-center p-4 gap-4"
      style={{ position: 'relative', background: 'var(--app-bg)', color: 'var(--primary-text)' }}
    >

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
      {showMenuConfirm && renderMenuConfirm()}

      {/* ── OBEN (180° gedreht für oberen Spieler) ── */}
      {attribution(true)}
      {heading(true)}
      {themeToggle(true)}
      {controls(true)}

      {/* ── SPIELFELD ── */}
      <main id="app-board-section" className="w-full flex justify-center">
        <GameBoard
          mode={state.mode}
          board={snap.board}
          currentPlayer={snap.currentPlayer}
          winner={state.winner}
          players={state.players}
          scores={snap.scores}
          activePlayers={state.activePlayers}
          dispatch={dispatch}
          isCurrentPlayerAi={state.players[snap.currentPlayer].isAi}
        />
      </main>

      {/* ── UNTEN (normal für unteren Spieler) ── */}
      <div id="app-bottom-toolbar" className="bottom-toolbar">
        {controls(false)}
        {themeToggle(false)}
      </div>
      {heading(false)}
      {attribution(false)}

    </div>
  );
}

export default App;
