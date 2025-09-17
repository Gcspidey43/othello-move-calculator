/**
 * Board utilities and game logic for Othello
 * Coordinate mapping: columns 'a'-'h' (0-7), rows '1'-'8' (0-7 top to bottom)
 */

import { Board, Cell, Move, PieceCount } from './types.js';

/**
 * Creates the standard starting board position
 */
export function createStartingBoard(): Board {
  const board: Board = Array(8).fill(null).map(() => Array(8).fill(0));
  
  // Standard starting position: d4=black, e4=white, d5=white, e5=black
  board[3][3] = 1;  // d4 (black)
  board[3][4] = -1; // e4 (white)
  board[4][3] = -1; // d5 (white)
  board[4][4] = 1;  // e5 (black)
  
  return board;
}

/**
 * Converts move coordinates to algebraic notation
 */
export function moveToAlgebraic(move: Move): string {
  if (!move) return 'pass';
  const col = String.fromCharCode(97 + move.c); // 'a' + column
  const row = (move.r + 1).toString(); // 1-based row
  return col + row;
}

/**
 * Converts algebraic notation to move coordinates
 */
export function algebraicToMove(algebraic: string): Move {
  if (algebraic === 'pass') return null;
  if (algebraic.length !== 2) return null;
  
  const col = algebraic.charCodeAt(0) - 97; // 'a' = 0
  const row = parseInt(algebraic[1]) - 1; // 1-based to 0-based
  
  if (col < 0 || col > 7 || row < 0 || row > 7) return null;
  return { r: row, c: col };
}

/**
 * Generates all legal moves for the given color
 */
export function generateLegalMoves(board: Board, color: Cell): Move[] {
  if (color === 0) return [];
  
  const moves: Move[] = [];
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] !== 0) continue;
      
      // Check if this empty square is a legal move
      let isLegal = false;
      for (const [dr, dc] of directions) {
        if (hasFlipsInDirection(board, r, c, dr, dc, color)) {
          isLegal = true;
          break;
        }
      }
      
      if (isLegal) {
        moves.push({ r, c });
      }
    }
  }
  
  return moves;
}

/**
 * Checks if placing a piece at (r,c) would flip pieces in the given direction
 */
function hasFlipsInDirection(board: Board, r: number, c: number, dr: number, dc: number, color: Cell): boolean {
  const opponent = -color as Cell;
  let nr = r + dr;
  let nc = c + dc;
  let hasOpponent = false;
  
  // Look for opponent pieces
  while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
    hasOpponent = true;
    nr += dr;
    nc += dc;
  }
  
  // Must have opponent pieces and end with our color
  return hasOpponent && nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === color;
}

/**
 * Applies a move and returns new board with flipped pieces
 */
export function applyMove(board: Board, move: Move, color: Cell): { board: Board; flips: number } {
  if (!move) {
    return { board: board.map(row => [...row]), flips: 0 };
  }
  
  const newBoard = board.map(row => [...row]);
  const { r, c } = move;
  
  newBoard[r][c] = color;
  let totalFlips = 0;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const flipsInDirection = getFlipsInDirection(board, r, c, dr, dc, color);
    totalFlips += flipsInDirection.length;
    
    // Apply flips
    for (const [fr, fc] of flipsInDirection) {
      newBoard[fr][fc] = color;
    }
  }
  
  return { board: newBoard, flips: totalFlips };
}

/**
 * Gets the positions of pieces that would be flipped in a direction
 */
function getFlipsInDirection(board: Board, r: number, c: number, dr: number, dc: number, color: Cell): [number, number][] {
  const opponent = -color as Cell;
  const flips: [number, number][] = [];
  let nr = r + dr;
  let nc = c + dc;
  
  // Collect opponent pieces
  while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
    flips.push([nr, nc]);
    nr += dr;
    nc += dc;
  }
  
  // Only return flips if we end with our color
  if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === color) {
    return flips;
  }
  
  return [];
}

/**
 * Counts pieces on the board
 */
export function countPieces(board: Board): PieceCount {
  let black = 0;
  let white = 0;
  
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      if (board[r][c] === 1) black++;
      else if (board[r][c] === -1) white++;
    }
  }
  
  return { black, white };
}

/**
 * Serializes board to string format
 */
export function serializeBoard(board: Board): string {
  return board.map(row => 
    row.map(cell => cell === 0 ? '.' : cell === 1 ? 'B' : 'W').join('')
  ).join('\n');
}

/**
 * Deserializes board from string format
 */
export function deserializeBoard(str: string): Board {
  const lines = str.trim().split('\n');
  if (lines.length !== 8) {
    throw new Error('Invalid board format: must have 8 rows');
  }
  
  const board: Board = [];
  for (const line of lines) {
    if (line.length !== 8) {
      throw new Error('Invalid board format: each row must have 8 columns');
    }
    
    const row: Cell[] = [];
    for (const char of line) {
      if (char === '.') row.push(0);
      else if (char === 'B') row.push(1);
      else if (char === 'W') row.push(-1);
      else throw new Error(`Invalid character: ${char}`);
    }
    board.push(row);
  }
  
  return board;
}