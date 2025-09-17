/**
 * Evaluation function for Othello positions
 * Uses weighted combination of positional, mobility, frontier, stability, and piece difference
 */

import { Board, Cell } from './types.js';
import { generateLegalMoves } from './board.js';

// Evaluation weights - configurable constants
export const EVAL_WEIGHTS = {
  PIECE_SQUARE: 1.0,
  MOBILITY: 78.0,
  FRONTIER: -50.0,
  STABILITY: 100.0,
  DISC_DIFF: 1.0
};

// Exact piece-square table as specified
const SQUARE_WEIGHTS = [
  [100, -20, 10, 5, 5, 10, -20, 100],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [10, -2, -1, -1, -1, -1, -2, 10],
  [5, -2, -1, -1, -1, -1, -2, 5],
  [5, -2, -1, -1, -1, -1, -2, 5],
  [10, -2, -1, -1, -1, -1, -2, 10],
  [-20, -50, -2, -2, -2, -2, -50, -20],
  [100, -20, 10, 5, 5, 10, -20, 100],
];

/**
 * Main evaluation function
 * Returns score from perspective of the given color (positive = good for color)
 */
export function evaluatePosition(board: Board, color: Cell): number {
  if (color === 0) return 0;
  
  const pieceSquareScore = calculatePieceSquareScore(board, color);
  const mobilityScore = calculateMobilityScore(board, color);
  const frontierScore = calculateFrontierScore(board, color);
  const stabilityScore = calculateStabilityScore(board, color);
  const discDiffScore = calculateDiscDifferenceScore(board, color);
  
  const evaluation = 
    EVAL_WEIGHTS.PIECE_SQUARE * pieceSquareScore +
    EVAL_WEIGHTS.MOBILITY * mobilityScore +
    EVAL_WEIGHTS.FRONTIER * frontierScore +
    EVAL_WEIGHTS.STABILITY * stabilityScore +
    EVAL_WEIGHTS.DISC_DIFF * discDiffScore;
  
  return Math.round(evaluation);
}

/**
 * Calculate piece-square table score
 */
function calculatePieceSquareScore(board: Board, color: Cell): number {
  let myScore = 0;
  let oppScore = 0;
  const opponent = -color as Cell;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      const weight = SQUARE_WEIGHTS[r][c];
      
      if (piece === color) {
        myScore += weight;
      } else if (piece === opponent) {
        oppScore += weight;
      }
    }
  }
  
  return myScore - oppScore;
}

/**
 * Calculate mobility score (normalized)
 * Formula: 100 * (my_moves - opp_moves) / (my_moves + opp_moves + 1)
 */
function calculateMobilityScore(board: Board, color: Cell): number {
  const myMoves = generateLegalMoves(board, color).length;
  const oppMoves = generateLegalMoves(board, -color as Cell).length;
  
  return 100 * (myMoves - oppMoves) / (myMoves + oppMoves + 1);
}

/**
 * Calculate frontier score (normalized)
 * Frontier discs are pieces adjacent to empty squares
 * Formula: -50 * (my_frontier - opp_frontier) / (my_frontier + opp_frontier + 1)
 */
function calculateFrontierScore(board: Board, color: Cell): number {
  let myFrontier = 0;
  let oppFrontier = 0;
  const opponent = -color as Cell;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === 0) continue;
      
      // Check if this piece is adjacent to an empty square
      let isFrontier = false;
      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === 0) {
          isFrontier = true;
          break;
        }
      }
      
      if (isFrontier) {
        if (piece === color) {
          myFrontier++;
        } else if (piece === opponent) {
          oppFrontier++;
        }
      }
    }
  }
  
  return -50 * (myFrontier - oppFrontier) / (myFrontier + oppFrontier + 1);
}

/**
 * Calculate stability score using iterative algorithm
 * Stable discs cannot be flipped for the rest of the game
 */
function calculateStabilityScore(board: Board, color: Cell): number {
  const stable = calculateStableDiscs(board);
  let myStable = 0;
  let oppStable = 0;
  const opponent = -color as Cell;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (stable[r][c]) {
        if (board[r][c] === color) {
          myStable++;
        } else if (board[r][c] === opponent) {
          oppStable++;
        }
      }
    }
  }
  
  return 100 * (myStable - oppStable);
}

/**
 * Calculate stable discs using iterative corner-based algorithm
 * Algorithm:
 * 1. Start from corners: any disc in an occupied corner is stable
 * 2. Iteratively mark discs stable if they form a contiguous chain
 *    with other stable discs along any direction to the edge
 */
function calculateStableDiscs(board: Board): boolean[][] {
  const stable: boolean[][] = Array(8).fill(null).map(() => Array(8).fill(false));
  
  // Corner positions
  const corners = [[0, 0], [0, 7], [7, 0], [7, 7]];
  
  // Mark corner discs as stable if occupied
  for (const [r, c] of corners) {
    if (board[r][c] !== 0) {
      stable[r][c] = true;
    }
  }
  
  // Iteratively find stable discs
  let changed = true;
  while (changed) {
    changed = false;
    
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (board[r][c] === 0 || stable[r][c]) continue;
        
        // Check if this disc should be marked stable
        if (isDiscStable(board, stable, r, c)) {
          stable[r][c] = true;
          changed = true;
        }
      }
    }
  }
  
  return stable;
}

/**
 * Check if a disc at (r,c) should be marked stable
 * A disc is stable if in at least one direction it forms a complete
 * chain of same-color discs to the edge, all of which are stable
 */
function isDiscStable(board: Board, stable: boolean[][], r: number, c: number): boolean {
  const color = board[r][c];
  if (color === 0) return false;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  // Check each direction - if any direction is fully stable, the disc is stable
  for (const [dr, dc] of directions) {
    if (isDirectionStable(board, stable, r, c, dr, dc, color)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check if a direction from (r,c) is stable
 * A direction is stable if it goes to the edge with all same-color stable discs
 */
function isDirectionStable(board: Board, stable: boolean[][], r: number, c: number, dr: number, dc: number, color: Cell): boolean {
  let nr = r + dr;
  let nc = c + dc;
  
  // Follow the direction to the edge
  while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
    // Must be same color and stable
    if (board[nr][nc] !== color || !stable[nr][nc]) {
      return false;
    }
    nr += dr;
    nc += dc;
  }
  
  // Successfully reached the edge with all stable same-color discs
  return true;
}

/**
 * Calculate simple disc difference score
 */
function calculateDiscDifferenceScore(board: Board, color: Cell): number {
  let myCount = 0;
  let oppCount = 0;
  const opponent = -color as Cell;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece === color) {
        myCount++;
      } else if (piece === opponent) {
        oppCount++;
      }
    }
  }
  
  return myCount - oppCount;
}