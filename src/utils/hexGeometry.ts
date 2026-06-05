import { HexCoord, BoardState, GameMode, PlayerColor } from '../types/game';

export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },   // Rechts
  { q: 1, r: -1 },  // Oben-Rechts
  { q: 0, r: -1 },  // Oben-Links
  { q: -1, r: 0 },  // Links
  { q: -1, r: 1 },  // Unten-Links
  { q: 0, r: 1 },   // Unten-Rechts
];

export const toKey = (q: number, r: number): string => `${q},${r}`;

export const fromKey = (key: string): HexCoord => {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
};

export const areCoordsEqual = (a: HexCoord, b: HexCoord): boolean => a.q === b.q && a.r === b.r;

export const generateAbaloneBoard = (): HexCoord[] => {
  const coords: HexCoord[] = [];
  const radius = 4;
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      coords.push({ q, r });
    }
  }
  return coords;
};

export const getInitialBoard = (mode: GameMode = 'two', activePlayers: PlayerColor[]): BoardState => {
  const board: BoardState = {};
  const coords = generateAbaloneBoard();
  coords.forEach(({ q, r }) => { board[toKey(q, r)] = null; });

  if (mode === 'three') {
    const [bottomPlayer, topLeftPlayer, topRightPlayer] = activePlayers;

    // Spieler 1 (Blau) unten: 11 Kugeln auf der unteren Seite.
    for (let q = -4; q <= 0; q++) board[toKey(q, 4)] = bottomPlayer;
    for (let q = -4; q <= 1; q++) board[toKey(q, 3)] = bottomPlayer;

    // Spieler 2 (Rot) links oben: 11 Kugeln auf der oberen linken Seite.
    for (let q = -4; q <= 0; q++) board[toKey(q, -4 - q)] = topLeftPlayer;
    for (let q = -4; q <= 1; q++) board[toKey(q, -3 - q)] = topLeftPlayer;

    // Spieler 3 (Grün) rechts oben: 11 Kugeln auf der oberen rechten Seite.
    for (let r = -4; r <= 0; r++) board[toKey(4, r)] = topRightPlayer;
    for (let r = -4; r <= 1; r++) board[toKey(3, r)] = topRightPlayer;
    return board;
  }

  const [topPlayer, bottomPlayer] = activePlayers;

  // WEISS (Oben)
  for (let q = 0; q <= 4; q++) board[toKey(q, -4)] = topPlayer;
  for (let q = -1; q <= 4; q++) board[toKey(q, -3)] = topPlayer;
  board[toKey(0, -2)] = topPlayer; board[toKey(1, -2)] = topPlayer; board[toKey(2, -2)] = topPlayer;

  // SCHWARZ (Unten)
  for (let q = -4; q <= 0; q++) board[toKey(q, 4)] = bottomPlayer;
  for (let q = -4; q <= 1; q++) board[toKey(q, 3)] = bottomPlayer;
  board[toKey(-2, 2)] = bottomPlayer; board[toKey(-1, 2)] = bottomPlayer; board[toKey(0, 2)] = bottomPlayer;

  return board;
};

export const hexToPixel = (q: number, r: number, size: number) => {
  const x = size * (Math.sqrt(3) * q + (Math.sqrt(3) / 2) * r);
  const y = size * ((3 / 2) * r);
  return { x, y };
};

export const getNeighbors = (coord: HexCoord): HexCoord[] => {
  return HEX_DIRECTIONS.map(dir => ({ q: coord.q + dir.q, r: coord.r + dir.r }));
};

export const isValidLine = (coords: HexCoord[]): boolean => {
  if (coords.length <= 1) return true;
  if (coords.length > 3) return false;

  const sorted = [...coords].sort((a, b) => a.q - b.q || a.r - b.r);
  const dq = sorted[1].q - sorted[0].q;
  const dr = sorted[1].r - sorted[0].r;

  const isValidDirection = HEX_DIRECTIONS.some(dir => dir.q === dq && dir.r === dr);
  if (!isValidDirection) return false;

  if (sorted.length === 3) {
    const dq2 = sorted[2].q - sorted[1].q;
    const dr2 = sorted[2].r - sorted[1].r;
    if (dq2 !== dq || dr2 !== dr) return false;
  }
  return true;
};
