import { BoardState, HexCoord, PlayerColor } from '../types/game';
import { generateAbaloneBoard, isValidLine, toKey } from './hexGeometry';
import { executeMove, getLegalMoves, Move } from './gameLogic';

interface AiCandidate {
  selectedHexes: HexCoord[];
  move: Move;
  score: number;
}

function combinationKey(coords: HexCoord[]): string {
  return coords
    .map(coord => toKey(coord.q, coord.r))
    .sort()
    .join('|');
}

function getSelectableGroups(board: BoardState, player: PlayerColor): HexCoord[][] {
  const playerHexes = generateAbaloneBoard().filter(coord => board[toKey(coord.q, coord.r)] === player);
  const groups: HexCoord[][] = playerHexes.map(coord => [coord]);
  const seen = new Set<string>(groups.map(combinationKey));

  for (let i = 0; i < playerHexes.length; i++) {
    for (let j = i + 1; j < playerHexes.length; j++) {
      const pair = [playerHexes[i], playerHexes[j]];
      if (!isValidLine(pair)) continue;
      const key = combinationKey(pair);
      if (!seen.has(key)) {
        seen.add(key);
        groups.push(pair);
      }

      for (let k = j + 1; k < playerHexes.length; k++) {
        const trio = [playerHexes[i], playerHexes[j], playerHexes[k]];
        if (!isValidLine(trio)) continue;
        const trioKey = combinationKey(trio);
        if (!seen.has(trioKey)) {
          seen.add(trioKey);
          groups.push(trio);
        }
      }
    }
  }

  return groups;
}

export function getAiMove(
  board: BoardState,
  currentPlayer: PlayerColor
): { selectedHexes: HexCoord[]; move: Move } | null {
  const candidates: AiCandidate[] = [];

  for (const selectedHexes of getSelectableGroups(board, currentPlayer)) {
    const legalMoves = getLegalMoves(board, selectedHexes, currentPlayer);
    for (const move of legalMoves) {
      const { pushedOff } = executeMove(board, selectedHexes, move, currentPlayer);
      const score = pushedOff * 100 + selectedHexes.length * 4 + (move.type === 'inline' ? 2 : 0);
      candidates.push({ selectedHexes, move, score });
    }
  }

  if (candidates.length === 0) return null;

  const bestScore = Math.max(...candidates.map(candidate => candidate.score));
  const bestCandidates = candidates.filter(candidate => candidate.score === bestScore);
  const chosen = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
  return { selectedHexes: chosen.selectedHexes, move: chosen.move };
}
