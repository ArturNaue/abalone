// v1.3.0 | 2026-05-30 MEZ

import React, { useMemo, useState, useRef } from 'react';
import { generateAbaloneBoard, hexToPixel, toKey, areCoordsEqual, isValidLine } from '../utils/hexGeometry';
import { getLegalMoves, Move } from '../utils/gameLogic';
import { BoardState, PlayerColor, HexCoord, Player } from '../types/game';
import { GameAction } from '../reducers/gameReducer';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PlayerOverlayProps {
  player: Player;
  score: number;
  isActive: boolean;
  winner: PlayerColor | null;
  onRename: (name: string) => void;
  flipped?: boolean;
}

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ player, score, isActive, winner, onRename, flipped = false }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(player.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(player.name);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed) onRename(trimmed);
    setEditing(false);
  };

  const isBlack = player.color === 'BLACK';

  return (
    <div
      className="player-card"
      style={{
        transform: flipped ? 'rotate(180deg)' : undefined,
        background: isActive && !winner ? 'rgba(120, 53, 15, 0.35)' : 'rgba(17, 24, 39, 0.85)',
        border: isActive && !winner ? '1px solid rgb(245, 158, 11)' : '1px solid rgb(31, 41, 55)',
        borderRadius: '10px',
        backdropFilter: 'blur(4px)',
        transition: 'border-color 0.15s, background 0.15s',
        flexShrink: 0,
      }}
    >
      {/* Marble + Name row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <div
          style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            background: isBlack ? 'rgb(39,39,42)' : 'rgb(244,244,245)',
            border: isBlack ? '1px solid rgb(82,82,91)' : '1px solid rgb(212,212,216)',
            boxShadow: isBlack ? '0 1px 3px black' : '0 1px 3px rgba(0,0,0,0.4)',
          }}
        />
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
            style={{
              flex: 1,
              background: 'rgb(31, 41, 55)',
              border: '1px solid rgb(75, 85, 99)',
              borderRadius: '4px',
              padding: '2px 4px',
              color: 'white',
              outline: 'none',
              minWidth: 0,
            }}
            className="player-card-name"
            maxLength={16}
            autoFocus
          />
        ) : (
          <button
            onClick={startEdit}
            title="Namen bearbeiten"
            className="player-card-name"
            style={{ color: 'rgb(156, 163, 175)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', whiteSpace: 'nowrap' }}
          >
            {player.name} ✎
          </button>
        )}
      </div>
      <div className="player-card-score">{score}</div>
    </div>
  );
};

interface GameBoardProps {
  board: BoardState;
  currentPlayer: PlayerColor;
  winner: PlayerColor | null;
  players: { BLACK: Player; WHITE: Player };
  scores: { BLACK: number; WHITE: number };
  dispatch: React.Dispatch<GameAction>;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board, currentPlayer, winner, players, scores, dispatch,
}) => {
  const hexSize = 40;
  const hexes = useMemo(() => generateAbaloneBoard(), []);
  const [selectedHexes, setSelectedHexes] = useState<HexCoord[]>([]);

  const legalMoves = useMemo(
    () => getLegalMoves(board, selectedHexes, currentPlayer),
    [board, selectedHexes, currentPlayer]
  );

  const targetHexSet = useMemo(() => {
    const set = new Set<string>();
    legalMoves.forEach(m => m.targetHexes.forEach(h => set.add(toKey(h.q, h.r))));
    return set;
  }, [legalMoves]);

  function findMoveForTarget(coord: HexCoord): Move | null {
    for (const move of legalMoves) {
      if (move.targetHexes.some(h => areCoordsEqual(h, coord))) return move;
    }
    return null;
  }

  const handleHexClick = (coord: HexCoord) => {
    if (winner) return;
    const key = toKey(coord.q, coord.r);
    const content = board[key];

    if (targetHexSet.has(key)) {
      const move = findMoveForTarget(coord);
      if (move) {
        dispatch({ type: 'EXECUTE_MOVE', selectedHexes, move });
        setSelectedHexes([]);
      }
      return;
    }

    if (selectedHexes.some(h => areCoordsEqual(h, coord))) {
      setSelectedHexes(selectedHexes.filter(h => !areCoordsEqual(h, coord)));
      return;
    }

    if (content === currentPlayer) {
      if (selectedHexes.length < 3) {
        const candidate = [...selectedHexes, coord];
        if (isValidLine(candidate)) {
          setSelectedHexes(candidate);
        } else {
          setSelectedHexes([coord]);
        }
      } else {
        setSelectedHexes([coord]);
      }
      return;
    }

    setSelectedHexes([]);
  };

  const activePlayerName = winner
    ? players[winner].name
    : players[currentPlayer].name;

  const statusText = winner
    ? `${activePlayerName} gewinnt!`
    : selectedHexes.length > 0
      ? `Auswahl aufheben (${selectedHexes.length} Kugel${selectedHexes.length > 1 ? 'n' : ''})`
      : `${activePlayerName} am Zug`;

  return (
    <div
      style={{ position: 'relative', background: 'rgb(55, 65, 85)' }}
      className="board-container w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col items-center border border-gray-600"
    >
      {/* Top row: Black (flipped) | status bar | White (flipped) */}
      <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <PlayerOverlay
          player={players.BLACK} score={scores.BLACK}
          isActive={currentPlayer === 'BLACK'} winner={winner} flipped
          onRename={name => dispatch({ type: 'SET_PLAYER_NAME', player: 'BLACK', name })}
        />
        <button
          onClick={() => { if (selectedHexes.length > 0) setSelectedHexes([]); }}
          style={{
            flex: 1, transform: 'rotate(180deg)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            cursor: selectedHexes.length > 0 && !winner ? 'pointer' : 'default',
            borderColor: currentPlayer === 'WHITE' && !winner ? 'rgb(245,158,11)' : undefined,
            background: currentPlayer === 'WHITE' && !winner ? 'rgba(120,53,15,0.35)' : undefined,
          }}
          className="px-2 py-1.5 bg-gray-800 text-xs text-gray-400 rounded-lg border border-gray-700 text-center"
        >{statusText}</button>
        <PlayerOverlay
          player={players.WHITE} score={scores.WHITE}
          isActive={currentPlayer === 'WHITE'} winner={winner} flipped
          onRename={name => dispatch({ type: 'SET_PLAYER_NAME', player: 'WHITE', name })}
        />
      </div>

      <svg viewBox="-320 -280 640 560" className="w-full h-full select-none">
        <defs>
          {/* 3D Black marble */}
          <radialGradient id="marbleBlack" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#6b6b72" />
            <stop offset="40%"  stopColor="#28282f" />
            <stop offset="100%" stopColor="#0a0a0d" />
          </radialGradient>
          <radialGradient id="marbleBlackSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#8b8b94" />
            <stop offset="40%"  stopColor="#38383f" />
            <stop offset="100%" stopColor="#111118" />
          </radialGradient>
          {/* 3D White marble */}
          <radialGradient id="marbleWhite" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="45%"  stopColor="#dcdce0" />
            <stop offset="100%" stopColor="#a8a8b0" />
          </radialGradient>
          <radialGradient id="marbleWhiteSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#ffffff" />
            <stop offset="45%"  stopColor="#e8e8ec" />
            <stop offset="100%" stopColor="#b8b8c0" />
          </radialGradient>
          {/* Cell background */}
          <radialGradient id="cellBg" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#848fa0" />
            <stop offset="100%" stopColor="#606878" />
          </radialGradient>
          <radialGradient id="cellBgTarget" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="#5a3a1a" />
            <stop offset="100%" stopColor="#2a1a08" />
          </radialGradient>
        </defs>
        {hexes.map(({ q, r }) => {
          const { x, y } = hexToPixel(q, r, hexSize);
          const coord = { q, r };
          const key = toKey(q, r);
          const content = board[key];
          const isSelected = selectedHexes.some(h => areCoordsEqual(h, coord));
          const isTarget = targetHexSet.has(key);

          return (
            <g
              key={key}
              transform={`translate(${x}, ${y})`}
              onClick={() => handleHexClick(coord)}
              style={{ cursor: winner ? 'default' : 'pointer' }}
            >
              {/* Cell */}
              <circle
                r={hexSize * 0.85}
                fill={isTarget ? 'url(#cellBgTarget)' : 'url(#cellBg)'}
                stroke={isTarget ? 'rgb(245,158,11)' : '#2a3040'}
                strokeWidth={isTarget ? 1.5 : 1}
                className={isTarget ? 'animate-pulse' : ''}
              />
              {/* Black marble */}
              {content === 'BLACK' && (
                <>
                  <circle
                    r={hexSize * 0.62}
                    fill={isSelected ? 'url(#marbleBlackSelected)' : 'url(#marbleBlack)'}
                    stroke={isSelected ? 'rgb(251,191,36)' : '#111'}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.8))' }}
                  />
                  {/* Specular highlight */}
                  <ellipse cx={-hexSize*0.18} cy={-hexSize*0.2} rx={hexSize*0.12} ry={hexSize*0.08}
                    fill="rgba(255,255,255,0.18)" style={{ pointerEvents: 'none' }} />
                </>
              )}
              {/* White marble */}
              {content === 'WHITE' && (
                <>
                  <circle
                    r={hexSize * 0.62}
                    fill={isSelected ? 'url(#marbleWhiteSelected)' : 'url(#marbleWhite)'}
                    stroke={isSelected ? 'rgb(245,158,11)' : '#bbb'}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
                  />
                  {/* Specular highlight */}
                  <ellipse cx={-hexSize*0.18} cy={-hexSize*0.2} rx={hexSize*0.14} ry={hexSize*0.09}
                    fill="rgba(255,255,255,0.7)" style={{ pointerEvents: 'none' }} />
                </>
              )}
              {/* Target dot on empty cells */}
              {isTarget && !content && (
                <circle r={hexSize * 0.18} fill="rgba(245,158,11,0.7)" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Bottom row: Black (normal) | status bar | White (normal) */}
      <div style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        <PlayerOverlay
          player={players.BLACK} score={scores.BLACK}
          isActive={currentPlayer === 'BLACK'} winner={winner}
          onRename={name => dispatch({ type: 'SET_PLAYER_NAME', player: 'BLACK', name })}
        />
        <button
          onClick={() => { if (selectedHexes.length > 0) setSelectedHexes([]); }}
          style={{
            flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            cursor: selectedHexes.length > 0 && !winner ? 'pointer' : 'default',
            borderColor: currentPlayer === 'BLACK' && !winner ? 'rgb(245,158,11)' : undefined,
            background: currentPlayer === 'BLACK' && !winner ? 'rgba(120,53,15,0.35)' : undefined,
          }}
          className="px-2 py-1.5 bg-gray-800 text-xs text-gray-400 rounded-lg border border-gray-700 text-center"
        >{statusText}</button>
        <PlayerOverlay
          player={players.WHITE} score={scores.WHITE}
          isActive={currentPlayer === 'WHITE'} winner={winner}
          onRename={name => dispatch({ type: 'SET_PLAYER_NAME', player: 'WHITE', name })}
        />
      </div>
    </div>
  );
};
