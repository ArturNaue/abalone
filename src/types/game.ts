// v1.1.0 | 2026-05-30 MEZ

export type PlayerColor = 'BLACK' | 'WHITE';

export interface Player {
  name: string;
  color: PlayerColor;
}

export interface HexCoord {
  q: number;
  r: number;
}

export type BoardState = Record<string, PlayerColor | null>;

export interface GameSnapshot {
  board: BoardState;
  currentPlayer: PlayerColor;
  scores: { BLACK: number; WHITE: number };
}

export interface GameState {
  players: { BLACK: Player; WHITE: Player };
  winner: PlayerColor | null;
  history: GameSnapshot[];
  historyIndex: number;
}

export function currentSnapshot(state: GameState): GameSnapshot {
  return state.history[state.historyIndex];
}
