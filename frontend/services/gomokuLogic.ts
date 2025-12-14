import { BOARD_SIZE } from '../constants';
import { Player, Position, RuleSet } from '../types';

// Directions: [dRow, dCol]
// Horizontal, Vertical, Diagonal (\), Diagonal (/)
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Checks if a coordinate is within board bounds.
 */
export const isValidPos = (row: number, col: number): boolean => {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
};

/**
 * Checks if the last move resulted in a win.
 */
export const checkWin = (
  board: Player[][],
  lastMove: Position,
  player: Player,
  ruleSet: RuleSet
): { won: boolean; line: Position[] } => {
  const { row, col } = lastMove;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    const line: Position[] = [{ row, col }];

    // Check forward
    let r = row + dr;
    let c = col + dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      line.push({ row: r, col: c });
      r += dr;
      c += dc;
    }

    // Check backward
    r = row - dr;
    c = col - dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      line.push({ row: r, col: c });
      r -= dr;
      c -= dc;
    }

    if (ruleSet === RuleSet.Free) {
      if (count >= 5) return { won: true, line };
    } else {
      // In Forbidden rules:
      // White wins with 5 or more.
      // Black wins ONLY with exactly 5.
      if (player === Player.White && count >= 5) return { won: true, line };
      if (player === Player.Black && count === 5) return { won: true, line };
    }
  }

  return { won: false, line: [] };
};

/**
 * FORBIDDEN MOVE LOGIC (Renju-lite)
 * Only applies to Black.
 * 1. Overline (6 or more in a row)
 * 2. Double Four (4-4)
 * 3. Double Three (3-3)
 */
export const checkForbiddenMove = (
  board: Player[][],
  row: number,
  col: number
): string | null => {
  // Simulate placing a black stone
  const tempBoard = board.map(row => [...row]);
  tempBoard[row][col] = Player.Black;

  // 1. Check Overline (Long Connect)
  // If Black creates a line of 6 or more, it is forbidden.
  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;
    let r = row + dr;
    let c = col + dc;
    while (isValidPos(r, c) && tempBoard[r][c] === Player.Black) { count++; r += dr; c += dc; }
    r = row - dr;
    c = col - dc;
    while (isValidPos(r, c) && tempBoard[r][c] === Player.Black) { count++; r -= dr; c -= dc; }

    if (count > 5) return "禁手：長連 (Overline) - 形成超過五子的連線";
  }

  // Helper to count continuous stones and check open ends
  const analyzeLine = (dr: number, dc: number) => {
    let count = 1;
    let closedEnds = 0;
    
    // Check positive direction
    let r = row + dr;
    let c = col + dc;
    while (isValidPos(r, c) && tempBoard[r][c] === Player.Black) { count++; r += dr; c += dc; }
    if (!isValidPos(r, c) || tempBoard[r][c] === Player.White) closedEnds++; // Blocked or Edge
    // Jump check (for specialized patterns like 1011) - Simplified here to strict connections for stability

    // Check negative direction
    r = row - dr;
    c = col - dc;
    while (isValidPos(r, c) && tempBoard[r][c] === Player.Black) { count++; r -= dr; c -= dc; }
    if (!isValidPos(r, c) || tempBoard[r][c] === Player.White) closedEnds++;

    return { count, closedEnds };
  };

  let threeCount = 0;
  let fourCount = 0;

  for (const [dr, dc] of DIRECTIONS) {
    const { count, closedEnds } = analyzeLine(dr, dc);

    // Simple heuristic for "Four": Length 4.
    // In strict Renju, "Four" means a line that can become 5. 
    // If it has 2 closed ends (blocked on both sides), it's dead, but usually 4-4 counts overlapping shapes.
    // Here we treat length 4 as a 'Four' threat.
    if (count === 4) {
      fourCount++;
    }

    // "Open Three": Length 3 and Open on BOTH ends (0 closed ends).
    // This is a simplified "Open Three" check. Strict Renju requires simulating the next move.
    if (count === 3 && closedEnds === 0) {
      threeCount++;
    }
  }

  if (fourCount >= 2) return "禁手：雙四 (Double Four)";
  if (threeCount >= 2) return "禁手：雙三 (Double Three)";

  return null;
};
