import { Player, Position, RuleSet } from "../types";
import { BOARD_SIZE } from "../constants";
import { checkForbiddenMove, isValidPos } from "./gomokuLogic";

// Weight constants for board evaluation
const SCORES = {
  WIN: 1000000,    // 5 in a row
  LIVE_4: 50000,   // Open 4 (can become 5 both ways)
  DEAD_4: 5000,    // Closed 4 (blocked one side)
  LIVE_3: 5000,    // Open 3
  DEAD_3: 1000,    // Closed 3
  LIVE_2: 500,     // Open 2
  DEAD_2: 100,     // Closed 2
  ONE: 10          // Single stone
};

// Directions for scanning: Horizontal, Vertical, Diagonal \, Diagonal /
const DIRECTIONS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
];

/**
 * Calculates a score for a specific position for a given player.
 * Checks all 4 directions for patterns.
 */
const evaluatePosition = (
  board: Player[][],
  row: number,
  col: number,
  player: Player
): number => {
  let totalScore = 0;

  for (const [dr, dc] of DIRECTIONS) {
    let count = 1;      // How many consecutive stones
    let blocked = 0;    // How many ends are blocked/walls

    // 1. Scan Forward
    let r = row + dr;
    let c = col + dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      r += dr;
      c += dc;
    }
    if (!isValidPos(r, c) || board[r][c] !== Player.None) {
      blocked++;
    }

    // 2. Scan Backward
    r = row - dr;
    c = col - dc;
    while (isValidPos(r, c) && board[r][c] === player) {
      count++;
      r -= dr;
      c -= dc;
    }
    if (!isValidPos(r, c) || board[r][c] !== Player.None) {
      blocked++;
    }

    // 3. Map pattern to score
    if (blocked === 2) {
      // If blocked on both ends and count < 5, it's useless (except for 5)
      if (count >= 5) totalScore += SCORES.WIN;
      else totalScore += 0; 
    } else {
      // Patterns based on count and blocked ends
      if (count >= 5) totalScore += SCORES.WIN;
      else if (count === 4) {
        totalScore += (blocked === 0) ? SCORES.LIVE_4 : SCORES.DEAD_4;
      } else if (count === 3) {
        totalScore += (blocked === 0) ? SCORES.LIVE_3 : SCORES.DEAD_3;
      } else if (count === 2) {
        totalScore += (blocked === 0) ? SCORES.LIVE_2 : SCORES.DEAD_2;
      } else if (count === 1) {
        totalScore += SCORES.ONE;
      }
    }
  }

  return totalScore;
};

/**
 * Local Heuristic AI
 * Replaces the remote Gemini API call.
 */
export const getAIMove = async (
  board: Player[][],
  currentRuleSet: RuleSet
): Promise<Position> => {
  // Simulate "thinking" time for better UX (0.5s)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const emptySpots: Position[] = [];
  
  // 1. Identify all valid empty spots
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === Player.None) {
        // Optimization: Only consider spots near existing stones (radius 2)
        // If board is empty (first move), center is best.
        if (hasNeighbor(board, r, c, 2)) {
          emptySpots.push({ row: r, col: c });
        }
      }
    }
  }

  // If board is completely empty, start at center
  if (emptySpots.length === 0) {
    const center = Math.floor(BOARD_SIZE / 2);
    if (board[center][center] === Player.None) return { row: center, col: center };
    // Scan everything if logic falls through
    for(let r=0;r<BOARD_SIZE;r++) for(let c=0;c<BOARD_SIZE;c++) if(board[r][c]===Player.None) emptySpots.push({row:r, col:c});
  }

  let bestScore = -1;
  let bestMoves: Position[] = [];

  // AI is always Player.White in this app context (PvAI)
  // Opponent is Player.Black
  const aiPlayer = Player.White;
  const opponent = Player.Black;

  for (const pos of emptySpots) {
    // Attack Score: How good is this spot for AI?
    const attackScore = evaluatePosition(board, pos.row, pos.col, aiPlayer);
    
    // Defense Score: How good is this spot for Opponent? (i.e., we block them)
    let defenseScore = evaluatePosition(board, pos.row, pos.col, opponent);

    // Forbidden Rule logic:
    // If RuleSet is Forbidden, and this spot creates a forbidden move for Black,
    // Black CANNOT play here. So AI doesn't need to "defend" this spot urgently
    // unless it's also a good attack spot for AI.
    if (currentRuleSet === RuleSet.Forbidden) {
       const isForbiddenForBlack = checkForbiddenMove(board, pos.row, pos.col);
       if (isForbiddenForBlack) {
         // Reduce defense score heavily because opponent can't move here anyway.
         defenseScore = 0; 
       }
    }

    // Weighting: Usually blocking a win is slightly more prioritized than creating a win
    // unless we have a guaranteed win.
    // However, simply adding them works well for standard Gomoku.
    // If opponent has WIN score, we MUST block (Score becomes very high).
    
    // Boost defense slightly to play safe
    const finalScore = attackScore + (defenseScore * 1.1); 

    if (finalScore > bestScore) {
      bestScore = finalScore;
      bestMoves = [pos];
    } else if (finalScore === bestScore) {
      bestMoves.push(pos);
    }
  }

  // Randomize among the best moves to avoid robotic repetition
  const randomIdx = Math.floor(Math.random() * bestMoves.length);
  return bestMoves[randomIdx];
};

/**
 * Helper: Check if a spot has any neighbors within 'radius' distance.
 * This prunes the search space significantly.
 */
const hasNeighbor = (board: Player[][], r: number, c: number, radius: number): boolean => {
  const rMin = Math.max(0, r - radius);
  const rMax = Math.min(BOARD_SIZE - 1, r + radius);
  const cMin = Math.max(0, c - radius);
  const cMax = Math.min(BOARD_SIZE - 1, c + radius);

  for (let i = rMin; i <= rMax; i++) {
    for (let j = cMin; j <= cMax; j++) {
      if (board[i][j] !== Player.None) return true;
    }
  }
  return false;
};
