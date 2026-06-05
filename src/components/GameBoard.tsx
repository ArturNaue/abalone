// v1.3.0 | 2026-05-30 MEZ

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { generateAbaloneBoard, hexToPixel, toKey, areCoordsEqual, isValidLine } from '../utils/hexGeometry';
import { getLegalMoves, Move } from '../utils/gameLogic';
import { BoardState, PlayerColor, HexCoord, Player, PlayerMap, ScoreMap, GameMode } from '../types/game';
import { GameAction } from '../reducers/gameReducer';

type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface PlayerOverlayProps {
  id: string;
  player: Player;
  score: number;
  isActive: boolean;
  winner: PlayerColor | null;
  flipped?: boolean;
}

function getPlayerAccent(color: PlayerColor): string {
  if (color === 'BLACK') return 'var(--player-black-accent)';
  if (color === 'WHITE') return 'var(--player-white-accent)';
  if (color === 'BLUE') return '#2563eb';
  if (color === 'RED') return '#f43f5e';
  if (color === 'GREEN') return '#22c55e';
  if (color === 'YELLOW') return '#f59e0b';
  if (color === 'BROWN') return '#5a351d';
  return '#8b5cf6';
}

function getPlayerSwatch(color: PlayerColor): { background: string; border: string; shadow: string } {
  if (color === 'BLACK') {
    return { background: 'rgb(39,39,42)', border: 'rgb(82,82,91)', shadow: '0 1px 3px black' };
  }
  if (color === 'WHITE') {
    return { background: 'rgb(244,244,245)', border: 'rgb(212,212,216)', shadow: '0 1px 3px rgba(0,0,0,0.4)' };
  }
  if (color === 'BLUE') {
    return { background: '#2563eb', border: '#1d4ed8', shadow: '0 1px 4px rgba(37,99,235,0.55)' };
  }
  if (color === 'RED') {
    return { background: '#f43f5e', border: '#be123c', shadow: '0 1px 4px rgba(244,63,94,0.55)' };
  }
  if (color === 'GREEN') {
    return { background: '#22c55e', border: '#15803d', shadow: '0 1px 4px rgba(34,197,94,0.55)' };
  }
  if (color === 'YELLOW') {
    return { background: '#f59e0b', border: '#92400e', shadow: '0 1px 4px rgba(245,158,11,0.55)' };
  }
  if (color === 'BROWN') {
    return { background: '#5a351d', border: '#2f1a0d', shadow: '0 1px 4px rgba(90,53,29,0.55)' };
  }
  return { background: '#8b5cf6', border: '#6d28d9', shadow: '0 1px 4px rgba(139,92,246,0.55)' };
}

type ColoredMarble = Exclude<PlayerColor, 'BLACK' | 'WHITE'>;

const coloredMarbleGradient: Record<ColoredMarble, { normal: string; selected: string; stroke: string }> = {
  BLUE: { normal: 'url(#marbleBlue)', selected: 'url(#marbleBlueSelected)', stroke: '#1d4ed8' },
  RED: { normal: 'url(#marbleRed)', selected: 'url(#marbleRedSelected)', stroke: '#be123c' },
  GREEN: { normal: 'url(#marbleGreen)', selected: 'url(#marbleGreenSelected)', stroke: '#15803d' },
  YELLOW: { normal: 'url(#marbleYellow)', selected: 'url(#marbleYellowSelected)', stroke: '#92400e' },
  BROWN: { normal: 'url(#marbleBrown)', selected: 'url(#marbleBrownSelected)', stroke: '#2f1a0d' },
  PURPLE: { normal: 'url(#marblePurple)', selected: 'url(#marblePurpleSelected)', stroke: '#6d28d9' },
};

const PlayerOverlay: React.FC<PlayerOverlayProps> = ({ id, player, score, isActive, winner, flipped = false }) => {
  const playerAccent = getPlayerAccent(player.color);
  const swatch = getPlayerSwatch(player.color);

  return (
    <div
      id={id}
      className="player-card"
      style={{
        transform: flipped ? 'rotate(180deg)' : undefined,
        background: isActive && !winner ? 'var(--panel-active-bg)' : 'var(--panel-bg)',
        border: isActive && !winner ? `1px solid ${playerAccent}` : '1px solid var(--panel-border)',
        borderRadius: '10px',
        backdropFilter: 'blur(4px)',
        transition: 'border-color 0.15s, background 0.15s',
        flexShrink: 0,
        boxShadow: isActive && !winner ? `0 0 0 1px ${playerAccent}` : undefined,
      }}
    >
      {/* Marble + Name row */}
      <div id={`${id}-header`} style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
        <div
          id={`${id}-marble`}
          style={{
            width: '14px', height: '14px', borderRadius: '50%', flexShrink: 0,
            background: swatch.background,
            border: `1px solid ${swatch.border}`,
            boxShadow: swatch.shadow,
          }}
        />
        <span
          id={`${id}-name`}
          className="player-card-name"
          style={{ color: playerAccent, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
        >
          {player.name}
        </span>
      </div>
      <div id={`${id}-score`} className="player-card-score">{score}</div>
    </div>
  );
};

interface GameBoardProps {
  mode: GameMode;
  board: BoardState;
  currentPlayer: PlayerColor;
  winner: PlayerColor | null;
  players: PlayerMap;
  scores: ScoreMap;
  activePlayers: PlayerColor[];
  dispatch: React.Dispatch<GameAction>;
  isCurrentPlayerAi: boolean;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  mode, board, currentPlayer, winner, players, scores, activePlayers, dispatch, isCurrentPlayerAi,
}) => {
  const hexSize = 40;
  const hexes = useMemo(() => generateAbaloneBoard(), []);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const dragStartRef = useRef<{
    x: number;
    y: number;
    coord: HexCoord;
    selection: HexCoord[];
    previousSelection: HexCoord[];
  } | null>(null);
  const dragActiveRef = useRef(false);
  const suppressClickRef = useRef(false);
  const [selectedHexes, setSelectedHexes] = useState<HexCoord[]>([]);

  const legalMoves = useMemo(
    () => getLegalMoves(board, selectedHexes, currentPlayer),
    [board, selectedHexes, currentPlayer]
  );

  useEffect(() => {
    if (isCurrentPlayerAi && selectedHexes.length > 0) {
      setSelectedHexes([]);
    }
  }, [isCurrentPlayerAi, selectedHexes.length]);

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

  function findMoveInList(moves: Move[], coord: HexCoord): Move | null {
    for (const move of moves) {
      if (move.targetHexes.some(h => areCoordsEqual(h, coord))) return move;
    }
    return null;
  }

  function getNearestHexFromPointer(event: React.PointerEvent<SVGGElement>): HexCoord | null {
    const svg = svgRef.current;
    if (!svg) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const svgPoint = point.matrixTransform(matrix.inverse());

    let nearest: HexCoord | null = null;
    let nearestDistance = Infinity;
    for (const hex of hexes) {
      const { x, y } = hexToPixel(hex.q, hex.r, hexSize);
      const distance = Math.hypot(svgPoint.x - x, svgPoint.y - y);
      if (distance < nearestDistance) {
        nearest = hex;
        nearestDistance = distance;
      }
    }

    return nearestDistance <= hexSize ? nearest : null;
  }

  const handleHexClick = (coord: HexCoord) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    if (winner || isCurrentPlayerAi) return;
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

  const handlePointerDown = (coord: HexCoord, event: React.PointerEvent<SVGGElement>) => {
    if (winner || isCurrentPlayerAi) return;
    if (board[toKey(coord.q, coord.r)] !== currentPlayer) return;

    const selected = selectedHexes.some(h => areCoordsEqual(h, coord));
    const selection = selected && selectedHexes.length > 0 ? selectedHexes : [coord];
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      coord,
      selection,
      previousSelection: selectedHexes,
    };
    dragActiveRef.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const handlePointerMove = (event: React.PointerEvent<SVGGElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    const distance = Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y);
    if (!dragActiveRef.current && distance > 8) {
      dragActiveRef.current = true;
      suppressClickRef.current = true;
      setSelectedHexes(dragStart.selection);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<SVGGElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;

    if (!dragActiveRef.current) return;

    const dropCoord = getNearestHexFromPointer(event);
    const dragMoves = getLegalMoves(board, dragStart.selection, currentPlayer);
    const move = dropCoord ? findMoveInList(dragMoves, dropCoord) : null;

    if (move) {
      dispatch({ type: 'EXECUTE_MOVE', selectedHexes: dragStart.selection, move });
      setSelectedHexes([]);
    } else {
      setSelectedHexes(dragStart.previousSelection);
    }

    dragActiveRef.current = false;
  };

  const handlePointerCancel = (event: React.PointerEvent<SVGGElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    dragStartRef.current = null;
    dragActiveRef.current = false;
    setSelectedHexes(dragStart.previousSelection);
  };

  const activePlayerName = winner
    ? players[winner].name
    : players[currentPlayer].name;

  const statusText = winner
    ? `${activePlayerName} gewinnt!`
    : isCurrentPlayerAi
      ? `${activePlayerName} (KI) am Zug`
    : selectedHexes.length > 0
      ? `Auswahl aufheben (${selectedHexes.length} Kugel${selectedHexes.length > 1 ? 'n' : ''})`
      : `${activePlayerName} am Zug`;

  const renderPlayerOverlay = (id: string, playerColor: PlayerColor, flipped = false) => (
    <PlayerOverlay
      id={id}
      player={players[playerColor]} score={scores[playerColor]}
      isActive={currentPlayer === playerColor} winner={winner} flipped={flipped}
    />
  );

  const renderStatusButton = (id: string, activeColor: PlayerColor, flipped = false) => (
    <button
      id={id}
      onClick={() => { if (selectedHexes.length > 0) setSelectedHexes([]); }}
      style={{
        flex: 1, transform: flipped ? 'rotate(180deg)' : undefined, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        cursor: selectedHexes.length > 0 && !winner ? 'pointer' : 'default',
        borderColor: currentPlayer === activeColor && !winner ? getPlayerAccent(activeColor) : 'var(--panel-border)',
        background: currentPlayer === activeColor && !winner ? 'var(--panel-active-bg)' : 'var(--panel-bg)',
        color: 'var(--secondary-text)',
      }}
      className="px-2 py-1.5 text-xs rounded-lg border text-center"
    >{statusText}</button>
  );

  const isThreePlayerMode = mode === 'three';

  return (
    <div
      id="board-container"
      style={{
        position: 'relative',
        background: 'var(--app-wall)',
        borderColor: 'var(--board-border)',
        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.28), inset 0 0 0 8px var(--board-border), inset 0 0 32px var(--board-border)',
      }}
      className="board-container w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col items-center border"
    >
      {/* Top row: Black (flipped) | status bar | White (flipped) */}
      <div id="board-row-top" style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {isThreePlayerMode
          ? (
            <>
              {renderPlayerOverlay('board-card-player-2-top', activePlayers[1], true)}
              {renderStatusButton('board-status-top', activePlayers.includes(currentPlayer) ? currentPlayer : activePlayers[1], true)}
              {renderPlayerOverlay('board-card-player-3-top', activePlayers[2], true)}
            </>
          )
          : (
            <>
              {renderPlayerOverlay('board-card-black-top', activePlayers[1], true)}
              {renderStatusButton('board-status-top', activePlayers[0], true)}
              {renderPlayerOverlay('board-card-white-top', activePlayers[0], true)}
            </>
          )}
      </div>

      <svg id="board-svg" ref={svgRef} viewBox="-320 -280 640 560" className="w-full h-full select-none" style={{ touchAction: 'none' }}>
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
          <radialGradient id="marbleBlue" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#93c5fd" />
            <stop offset="45%"  stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          <radialGradient id="marbleBlueSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#bfdbfe" />
            <stop offset="45%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </radialGradient>
          <radialGradient id="marbleRed" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#fecdd3" />
            <stop offset="45%"  stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </radialGradient>
          <radialGradient id="marbleRedSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#ffe4e6" />
            <stop offset="45%"  stopColor="#fb7185" />
            <stop offset="100%" stopColor="#be123c" />
          </radialGradient>
          <radialGradient id="marbleGreen" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#bbf7d0" />
            <stop offset="45%"  stopColor="#22c55e" />
            <stop offset="100%" stopColor="#166534" />
          </radialGradient>
          <radialGradient id="marbleGreenSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#dcfce7" />
            <stop offset="45%"  stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
          <radialGradient id="marbleYellow" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#fde68a" />
            <stop offset="45%"  stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
          <radialGradient id="marbleYellowSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#fef3c7" />
            <stop offset="45%"  stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#b45309" />
          </radialGradient>
          <radialGradient id="marbleBrown" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#8b5e34" />
            <stop offset="45%"  stopColor="#5a351d" />
            <stop offset="100%" stopColor="#2f1a0d" />
          </radialGradient>
          <radialGradient id="marbleBrownSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#a47551" />
            <stop offset="45%"  stopColor="#704523" />
            <stop offset="100%" stopColor="#3a2110" />
          </radialGradient>
          <radialGradient id="marblePurple" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#c4b5fd" />
            <stop offset="45%"  stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#6d28d9" />
          </radialGradient>
          <radialGradient id="marblePurpleSelected" cx="35%" cy="30%" r="60%">
            <stop offset="0%"   stopColor="#ddd6fe" />
            <stop offset="45%"  stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#7c3aed" />
          </radialGradient>
          {/* Cell background */}
          <radialGradient id="cellBg" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="var(--cell-start)" />
            <stop offset="100%" stopColor="var(--cell-end)" />
          </radialGradient>
          <radialGradient id="cellBgTarget" cx="40%" cy="35%" r="65%">
            <stop offset="0%"   stopColor="var(--target-start)" />
            <stop offset="100%" stopColor="var(--target-end)" />
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
              onPointerDown={event => handlePointerDown(coord, event)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              style={{ cursor: winner || isCurrentPlayerAi ? 'default' : 'pointer' }}
            >
              {/* Cell */}
              <circle
                r={hexSize * 0.85}
                fill={isTarget ? 'url(#cellBgTarget)' : 'url(#cellBg)'}
                stroke={isTarget ? 'var(--target-stroke)' : 'var(--cell-stroke)'}
                strokeWidth={isTarget ? 1.5 : 1}
                className={isTarget ? 'animate-pulse' : ''}
              />
              {/* Black marble */}
              {content === 'BLACK' && (
                <>
                  <circle
                    r={hexSize * 0.62}
                    fill={isSelected ? 'url(#marbleBlackSelected)' : 'url(#marbleBlack)'}
                    stroke={isSelected ? '#f59e0b' : '#111'}
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
                    stroke={isSelected ? '#f59e0b' : '#bbb'}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.5))' }}
                  />
                  {/* Specular highlight */}
                  <ellipse cx={-hexSize*0.18} cy={-hexSize*0.2} rx={hexSize*0.14} ry={hexSize*0.09}
                    fill="rgba(255,255,255,0.7)" style={{ pointerEvents: 'none' }} />
                </>
              )}
              {content && content in coloredMarbleGradient && (
                <>
                  <circle
                    r={hexSize * 0.62}
                    fill={isSelected ? coloredMarbleGradient[content as ColoredMarble].selected : coloredMarbleGradient[content as ColoredMarble].normal}
                    stroke={isSelected ? '#f59e0b' : coloredMarbleGradient[content as ColoredMarble].stroke}
                    strokeWidth={isSelected ? 2 : 1}
                    style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.48))' }}
                  />
                  <ellipse cx={-hexSize*0.18} cy={-hexSize*0.2} rx={hexSize*0.12} ry={hexSize*0.08}
                    fill="rgba(255,255,255,0.38)" style={{ pointerEvents: 'none' }} />
                </>
              )}
              {/* Target dot on empty cells */}
              {isTarget && !content && (
                <circle r={hexSize * 0.18} fill="var(--target-dot)" />
              )}
            </g>
          );
        })}
      </svg>

      {/* Bottom row: Black (normal) | status bar | White (normal) */}
      <div id="board-row-bottom" style={{ position: 'absolute', bottom: '12px', left: '12px', right: '12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
        {isThreePlayerMode
          ? (
            <>
              {renderPlayerOverlay('board-card-player-1-bottom', activePlayers[0])}
              {renderStatusButton('board-status-bottom', activePlayers.includes(currentPlayer) ? currentPlayer : activePlayers[0])}
            </>
          )
          : (
            <>
              {renderPlayerOverlay('board-card-black-bottom', activePlayers[1])}
              {renderStatusButton('board-status-bottom', activePlayers[1])}
              {renderPlayerOverlay('board-card-white-bottom', activePlayers[0])}
            </>
          )}
      </div>
    </div>
  );
};
