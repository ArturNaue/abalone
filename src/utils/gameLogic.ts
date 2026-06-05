// v1.0.0 | 2026-05-30 MEZ

import { HexCoord, BoardState, PlayerColor } from '../types/game';
import { HEX_DIRECTIONS, toKey, areCoordsEqual } from './hexGeometry';

export interface Move {
  type: 'inline' | 'sidestep';
  direction: HexCoord;
  targetHexes: HexCoord[];
}

function add(a: HexCoord, b: HexCoord): HexCoord {
  return { q: a.q + b.q, r: a.r + b.r };
}

function isOnBoard(board: BoardState, coord: HexCoord): boolean {
  return toKey(coord.q, coord.r) in board;
}

export function getLegalMoves(
  board: BoardState,
  selectedHexes: HexCoord[],
  currentPlayer: PlayerColor
): Move[] {
  if (selectedHexes.length === 0) return [];

  const moves: Move[] = [];

  if (selectedHexes.length === 1) {
    const marble = selectedHexes[0];
    for (const dir of HEX_DIRECTIONS) {
      const target = add(marble, dir);
      if (!isOnBoard(board, target)) continue;
      if (board[toKey(target.q, target.r)] === null) {
        moves.push({ type: 'inline', direction: dir, targetHexes: [target] });
      }
      // Single marble cannot push enemies
    }
    return moves;
  }

  // 2 or 3 marbles: determine line axis
  const sorted = [...selectedHexes].sort((a, b) => a.q - b.q || a.r - b.r);
  const lineDir: HexCoord = { q: sorted[1].q - sorted[0].q, r: sorted[1].r - sorted[0].r };
  const revDir: HexCoord = { q: -lineDir.q, r: -lineDir.r };
  const sideDirs = HEX_DIRECTIONS.filter(
    d => !areCoordsEqual(d, lineDir) && !areCoordsEqual(d, revDir)
  );

  // Inline moves
  for (const dir of [lineDir, revDir]) {
    const lead = areCoordsEqual(dir, lineDir) ? sorted[sorted.length - 1] : sorted[0];
    const target = add(lead, dir);
    const targetKey = toKey(target.q, target.r);

    if (!isOnBoard(board, target)) continue;

    const targetContent = board[targetKey];

    if (targetContent === null) {
      moves.push({ type: 'inline', direction: dir, targetHexes: [target] });
    } else if (targetContent !== currentPlayer) {
      const enemy = targetContent;
      // Count enemy chain length
      let enemyCount = 0;
      let cur = target;
      while (board[toKey(cur.q, cur.r)] === enemy) {
        enemyCount++;
        cur = add(cur, dir);
      }
      const afterKey = toKey(cur.q, cur.r);
      const afterContent = board[afterKey];
      // Sumito requires outnumbering: our marbles > enemy chain
      const canPush = selectedHexes.length > enemyCount;
      // After enemy chain must be empty (on-board) or off-board
      if (canPush && (afterContent === null || afterContent === undefined)) {
        moves.push({ type: 'inline', direction: dir, targetHexes: [target] });
      }
    }
    // Own marble in front → blocked
  }

  // Sidestep moves
  for (const dir of sideDirs) {
    const dests = selectedHexes.map(h => add(h, dir));
    const allEmpty = dests.every(d => board[toKey(d.q, d.r)] === null);
    if (allEmpty) {
      moves.push({ type: 'sidestep', direction: dir, targetHexes: dests });
    }
  }

  return moves;
}

export function executeMove(
  board: BoardState,
  selectedHexes: HexCoord[],
  move: Move,
  currentPlayer: PlayerColor
): { newBoard: BoardState; pushedOff: number } {
  const newBoard = { ...board };
  let pushedOff = 0;

  const dir = move.direction;

  if (move.type === 'sidestep') {
    selectedHexes.forEach(h => { newBoard[toKey(h.q, h.r)] = null; });
    selectedHexes.forEach(h => {
      const dest = add(h, dir);
      newBoard[toKey(dest.q, dest.r)] = currentPlayer;
    });
    return { newBoard, pushedOff };
  }

  // Inline move
  const target = move.targetHexes[0];
  const targetContent = board[toKey(target.q, target.r)];

  if (targetContent === null) {
    // Simple shift
    selectedHexes.forEach(h => { newBoard[toKey(h.q, h.r)] = null; });
    selectedHexes.forEach(h => {
      const dest = add(h, dir);
      newBoard[toKey(dest.q, dest.r)] = currentPlayer;
    });
  } else if (targetContent !== currentPlayer) {
    const enemy = targetContent;
    // Sumito: collect enemy chain
    const enemies: HexCoord[] = [];
    let cur = target;
    while (board[toKey(cur.q, cur.r)] === enemy) {
      enemies.push(cur);
      cur = add(cur, dir);
    }
    const afterEnemies = cur;
    const afterKey = toKey(afterEnemies.q, afterEnemies.r);
    const afterContent = board[afterKey];

    // Clear all enemy positions
    enemies.forEach(e => { newBoard[toKey(e.q, e.r)] = null; });

    if (afterContent === null) {
      // Enemies shift forward, all survive
      enemies.forEach(e => {
        const dest = add(e, dir);
        newBoard[toKey(dest.q, dest.r)] = enemy;
      });
    } else {
      // afterContent === undefined: last enemy falls off the board
      enemies.slice(0, -1).forEach(e => {
        const dest = add(e, dir);
        newBoard[toKey(dest.q, dest.r)] = enemy;
      });
      pushedOff = 1;
    }

    // Shift our marbles
    selectedHexes.forEach(h => { newBoard[toKey(h.q, h.r)] = null; });
    selectedHexes.forEach(h => {
      const dest = add(h, dir);
      newBoard[toKey(dest.q, dest.r)] = currentPlayer;
    });
  }

  return { newBoard, pushedOff };
}
