// v1.0.0 | 2026-05-30 MEZ

import { GameMode, GameState, GameSnapshot, PlayerColor, HexCoord, PlayerMap, ScoreMap } from '../types/game';
import { getInitialBoard } from '../utils/hexGeometry';
import { Move, executeMove } from '../utils/gameLogic';

export type GameAction =
  | { type: 'EXECUTE_MOVE'; selectedHexes: HexCoord[]; move: Move }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PLAYER_NAME'; player: PlayerColor; name: string }
  | { type: 'TOGGLE_PLAYER_AI'; player: PlayerColor }
  | { type: 'START_GAME'; mode: GameMode; players: PlayerMap; activePlayers: PlayerColor[] }
  | { type: 'SET_GAME_MODE'; mode: GameMode }
  | { type: 'NEW_GAME' };

export const DEFAULT_ACTIVE_PLAYERS: Record<GameMode, PlayerColor[]> = {
  two: ['WHITE', 'BLACK'],
  three: ['BLUE', 'RED', 'GREEN'],
};

const INITIAL_PLAYERS: PlayerMap = {
  BLACK: { name: 'Schwarz', color: 'BLACK', isAi: false },
  WHITE: { name: 'Weiss', color: 'WHITE', isAi: false },
  BLUE: { name: 'Blau', color: 'BLUE', isAi: false },
  RED: { name: 'Rot', color: 'RED', isAi: false },
  GREEN: { name: 'Grün', color: 'GREEN', isAi: false },
  YELLOW: { name: 'Gelb', color: 'YELLOW', isAi: false },
  BROWN: { name: 'Braun', color: 'BROWN', isAi: false },
  PURPLE: { name: 'Violett', color: 'PURPLE', isAi: false },
};

function makeInitialScores(): ScoreMap {
  return { BLACK: 0, WHITE: 0, BLUE: 0, RED: 0, GREEN: 0, YELLOW: 0, BROWN: 0, PURPLE: 0 };
}

function getNextPlayer(activePlayers: PlayerColor[], currentPlayer: PlayerColor): PlayerColor {
  const index = activePlayers.indexOf(currentPlayer);
  return activePlayers[(index + 1) % activePlayers.length];
}

function getWinner(activePlayers: PlayerColor[], scores: ScoreMap): PlayerColor | null {
  return activePlayers.find(player => scores[player] >= 6) ?? null;
}

function makeInitialSnapshot(mode: GameMode, activePlayers: PlayerColor[]): GameSnapshot {
  return {
    board: getInitialBoard(mode, activePlayers),
    currentPlayer: activePlayers[0],
    scores: makeInitialScores(),
  };
}

export function makeInitialState(
  mode: GameMode = 'two',
  activePlayers: PlayerColor[] = DEFAULT_ACTIVE_PLAYERS[mode]
): GameState {
  const snapshot = makeInitialSnapshot(mode, activePlayers);
  return {
    mode,
    activePlayers,
    players: INITIAL_PLAYERS,
    winner: null,
    history: [snapshot],
    historyIndex: 0,
  };
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'EXECUTE_MOVE': {
      if (state.winner) return state;
      const snap = state.history[state.historyIndex];
      const { newBoard, pushedOff } = executeMove(
        snap.board,
        action.selectedHexes,
        action.move,
        snap.currentPlayer
      );

      const newScores = { ...snap.scores };
      if (pushedOff > 0) newScores[snap.currentPlayer] += pushedOff;

      const winner: PlayerColor | null = newScores[snap.currentPlayer] >= 6
        ? snap.currentPlayer
        : null;

      const nextPlayer: PlayerColor = winner
        ? snap.currentPlayer
        : getNextPlayer(state.activePlayers, snap.currentPlayer);

      const newSnapshot: GameSnapshot = {
        board: newBoard,
        currentPlayer: nextPlayer,
        scores: newScores,
      };

      const newHistory = [
        ...state.history.slice(0, state.historyIndex + 1),
        newSnapshot,
      ];

      return {
        ...state,
        winner,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      return { ...state, winner: null, historyIndex: state.historyIndex - 1 };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      const nextSnap = state.history[nextIndex];
      const winner = getWinner(state.activePlayers, nextSnap.scores);
      return { ...state, winner, historyIndex: nextIndex };
    }

    case 'SET_PLAYER_NAME': {
      return {
        ...state,
        players: {
          ...state.players,
          [action.player]: { ...state.players[action.player], name: action.name },
        },
      };
    }

    case 'TOGGLE_PLAYER_AI': {
      return {
        ...state,
        players: {
          ...state.players,
          [action.player]: { ...state.players[action.player], isAi: !state.players[action.player].isAi },
        },
      };
    }

    case 'NEW_GAME': {
      return {
        ...makeInitialState(state.mode, state.activePlayers),
        players: state.players,
      };
    }

    case 'START_GAME': {
      return {
        ...makeInitialState(action.mode, action.activePlayers),
        players: action.players,
      };
    }

    case 'SET_GAME_MODE': {
      const activePlayers = DEFAULT_ACTIVE_PLAYERS[action.mode];
      return {
        ...makeInitialState(action.mode, activePlayers),
        players: state.players,
      };
    }

    default:
      return state;
  }
}
