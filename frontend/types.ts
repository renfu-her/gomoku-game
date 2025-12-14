export enum Player {
  None = 0,
  Black = 1,
  White = 2,
}

export enum GameMode {
  PvP = 'pvp',
  PvAI = 'pvai',
}

export enum RuleSet {
  Free = 'free',         // Standard: No restrictions
  Forbidden = 'forbidden' // Competitive: Black has restrictions (3-3, 4-4, Overline)
}

export interface Position {
  row: number;
  col: number;
}

export interface GameState {
  board: Player[][];
  currentPlayer: Player;
  winner: Player | null;
  history: Position[];
  isGameOver: boolean;
  winningLine: Position[] | null;
}
