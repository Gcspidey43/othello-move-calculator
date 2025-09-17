/**
 * Unit tests for board utilities and game logic
 */

import {
  createStartingBoard,
  generateLegalMoves,
  applyMove,
  serializeBoard,
  deserializeBoard,
  countPieces,
  moveToAlgebraic,
  algebraicToMove
} from '../board';
import { hashBoard } from '../zobrist';

describe('Board Logic', () => {
  test('createStartingBoard returns standard starting position', () => {
    const board = createStartingBoard();
    
    expect(board[3][3]).toBe(-1); // d4 white
    expect(board[3][4]).toBe(1);  // e4 black
    expect(board[4][3]).toBe(1);  // d5 black
    expect(board[4][4]).toBe(-1); // e5 white
    
    const pieces = countPieces(board);
    expect(pieces.black).toBe(2);
    expect(pieces.white).toBe(2);
  });
  
  test('generateLegalMoves returns 4 moves for starting position', () => {
    const board = createStartingBoard();
    const blackMoves = generateLegalMoves(board, 1);
    const whiteMoves = generateLegalMoves(board, -1);
    
    expect(blackMoves).toHaveLength(4);
    expect(whiteMoves).toHaveLength(4);
  });
  
  test('applyMove correctly flips pieces and counts flips', () => {
    const board = createStartingBoard();
    const move = { r: 2, c: 3 }; // d3
    const result = applyMove(board, move, 1); // black
    
    expect(result.flips).toBeGreaterThan(0);
    expect(result.board[2][3]).toBe(1); // Move placed
    
    const newPieces = countPieces(result.board);
    expect(newPieces.black).toBeGreaterThan(2);
  });
  
  test('applyMove correctly flips pieces in a specific scenario', () => {
    // Create a specific test position
    const board = createStartingBoard();
    // Make a move at d3 (r=2, c=3) for black
    const move = { r: 2, c: 3 };
    const result = applyMove(board, move, 1); // black moves
    
    // Check that the move was placed correctly
    expect(result.board[2][3]).toBe(1);
    
    // Check that the flipped piece is now black (was white at d4)
    expect(result.board[3][3]).toBe(1);
    
    // Should have flipped exactly 1 piece
    expect(result.flips).toBe(1);
  });
  
  test('serializeBoard and deserializeBoard roundtrip correctly', () => {
    const originalBoard = createStartingBoard();
    const serialized = serializeBoard(originalBoard);
    const deserialized = deserializeBoard(serialized);
    
    expect(deserialized).toEqual(originalBoard);
  });
  
  test('moveToAlgebraic and algebraicToMove conversion', () => {
    const move = { r: 2, c: 3 };
    const algebraic = moveToAlgebraic(move);
    expect(algebraic).toBe('d3');
    
    const convertedBack = algebraicToMove(algebraic);
    expect(convertedBack).toEqual(move);
    
    expect(moveToAlgebraic(null)).toBe('pass');
    expect(algebraicToMove('pass')).toBe(null);
  });
  
  test('Zobrist hash consistency', () => {
    const board1 = createStartingBoard();
    const board2 = createStartingBoard();
    
    const hash1 = hashBoard(board1, 1);
    const hash2 = hashBoard(board2, 1);
    
    expect(hash1).toBe(hash2);
    
    // Different side to move should produce different hash
    const hash3 = hashBoard(board1, -1);
    expect(hash1).not.toBe(hash3);
  });
});