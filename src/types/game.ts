// v1.1.0 | 2026-05-30 MEZ

export type GameMode = 'two' | 'three';
export type PlayerColor = 'BLACK' | 'WHITE' | 'BLUE' | 'RED' | 'GREEN' | 'YELLOW' | 'BROWN' | 'PURPLE';

export interface Player {
  name: string;
  color: PlayerColor;
  isAi: boolean;
}

export interface HexCoord {
  q: number;
  r: number;
}

export type BoardState = Record<string, PlayerColor | null>;
export type PlayerMap = Record<PlayerColor, Player>;
export type ScoreMap = Record<PlayerColor, number>;

export interface GameSnapshot {
  board: BoardState;
  currentPlayer: PlayerColor;
  scores: ScoreMap;
}

export interface GameState {
  mode: GameMode;
  activePlayers: PlayerColor[];
  players: PlayerMap;
  winner: PlayerColor | null;
  history: GameSnapshot[];
  historyIndex: number;
}

export function currentSnapshot(state: GameState): GameSnapshot {
  return state.history[state.historyIndex];
}
