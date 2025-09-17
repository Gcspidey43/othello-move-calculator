/**
 * Zobrist hashing for position keys in transposition table
 * Uses 64-bit BigInt for hash keys
 */

import { Board, Cell } from './types.js';

// 64-bit random constants for Zobrist hashing
// [position][color] where color: 0=black, 1=white
const ZOBRIST_PIECES: bigint[][] = [];
const ZOBRIST_SIDE_TO_MOVE: bigint = 0x1a2b3c4d5e6f7a8bn;

/**
 * Initialize Zobrist hash constants
 * Called once at module load
 */
function initializeZobrist(): void {
  // Generate random 64-bit constants for each square and piece type
  for (let pos = 0; pos < 64; pos++) {
    ZOBRIST_PIECES[pos] = [];
    ZOBRIST_PIECES[pos][0] = generateRandom64BitBigInt(); // black
    ZOBRIST_PIECES[pos][1] = generateRandom64BitBigInt(); // white
  }
}

/**
 * Generate a random 64-bit BigInt
 */
function generateRandom64BitBigInt(): bigint {
  // Generate two 32-bit random numbers and combine them
  const high = BigInt(Math.floor(Math.random() * 0x100000000));
  const low = BigInt(Math.floor(Math.random() * 0x100000000));
  return (high << 32n) | low;
}

/**
 * Calculate hash for a board position
 */
export function hashBoard(board: Board, sideToMove: Cell): bigint {
  let hash = 0n;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece !== 0) {
        const pos = r * 8 + c;
        const colorIndex = piece === 1 ? 0 : 1; // black=0, white=1
        hash ^= ZOBRIST_PIECES[pos][colorIndex];
      }
    }
  }
  
  // Include side to move
  if (sideToMove === 1) { // black to move
    hash ^= ZOBRIST_SIDE_TO_MOVE;
  }
  
  return hash;
}

/**
 * Update hash incrementally after a move
 */
export function updateHash(oldHash: bigint, _board: Board, move: { r: number; c: number }, color: Cell, flippedPositions: [number, number][]): bigint {
  let hash = oldHash;
  
  // Remove old side to move
  hash ^= ZOBRIST_SIDE_TO_MOVE;
  
  // Add the new piece
  const pos = move.r * 8 + move.c;
  const colorIndex = color === 1 ? 0 : 1;
  hash ^= ZOBRIST_PIECES[pos][colorIndex];
  
  // Update flipped pieces
  for (const [r, c] of flippedPositions) {
    const flipPos = r * 8 + c;
    // Remove old color
    const oldColorIndex = color === 1 ? 1 : 0; // opposite of the moving color
    hash ^= ZOBRIST_PIECES[flipPos][oldColorIndex];
    // Add new color
    hash ^= ZOBRIST_PIECES[flipPos][colorIndex];
  }
  
  // Add new side to move (opposite color)
  const newSideToMove = -color as Cell;
  if (newSideToMove === 1) {
    hash ^= ZOBRIST_SIDE_TO_MOVE;
  }
  
  return hash;
}

// Initialize on module load
initializeZobrist();