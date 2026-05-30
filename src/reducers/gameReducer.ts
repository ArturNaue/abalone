// v1.0.0 | 2026-05-30 MEZ

import { GameState, GameSnapshot, PlayerColor, HexCoord } from '../types/game';
import { getInitialBoard } from '../utils/hexGeometry';
import { Move, executeMove } from '../utils/gameLogic';

export type GameAction =
  | { type: 'EXECUTE_MOVE'; selectedHexes: HexCoord[]; move: Move }
  | { type: 'UNDO' }
  | { type: 'REDO' }
  | { type: 'SET_PLAYER_NAME'; player: PlayerColor; name: string }
  | { type: 'NEW_GAME' };

function makeInitialSnapshot(): GameSnapshot {
  return {
    board: getInitialBoard(),
    currentPlayer: 'WHITE',
    scores: { BLACK: 0, WHITE: 0 },
  };
}

export function makeInitialState(): GameState {
  const snapshot = makeInitialSnapshot();
  return {
    players: {
      BLACK: { name: 'Schwarz', color: 'BLACK' },
      WHITE: { name: 'Weiss', color: 'WHITE' },
    },
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
        : snap.currentPlayer === 'BLACK' ? 'WHITE' : 'BLACK';

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
      const scores = nextSnap.scores;
      const winner: PlayerColor | null =
        scores.BLACK >= 6 ? 'BLACK' : scores.WHITE >= 6 ? 'WHITE' : null;
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

    case 'NEW_GAME': {
      return makeInitialState();
    }

    default:
      return state;
  }
}
