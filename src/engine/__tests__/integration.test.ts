/**
 * Integration tests for engine search functionality
 */

import { engineSearch, createStartingBoard } from '../index';
import type { Board } from '../index';

describe('Engine Integration', () => {
  test('engineSearch returns legal move and valid score for starting position', async () => {
    const board = createStartingBoard();
    const result = await engineSearch(board, 1, { depth: 2, timeLimitMs: 1000 });
    
    expect(result.bestMove).not.toBeNull();
    expect(result.bestMoveAlgebraic).toMatch(/^[a-h][1-8]$/);
    expect(typeof result.score).toBe('number');
    expect(result.score).not.toBeNaN();
    expect(result.nodes).toBeGreaterThan(0);
    expect(result.timeMs).toBeGreaterThan(0);
    expect(result.depthSearched).toBeGreaterThanOrEqual(1);
    expect(result.pv).toBeInstanceOf(Array);
  }, 10000);
  
  test('engineSearch handles no legal moves (pass)', async () => {
    // Create a board where black has no legal moves
    const board: Board = [
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1, -1]
    ];
    
    const result = await engineSearch(board, -1, { depth: 2, timeLimitMs: 500 });
    
    expect(result.bestMove).toBeNull();
    expect(result.bestMoveAlgebraic).toBe('pass');
    expect(result.flips).toBe(0);
  }, 5000);
  
  test('engineSearch respects time limit', async () => {
    const board = createStartingBoard();
    const startTime = Date.now();
    
    const result = await engineSearch(board, 1, { depth: 10, timeLimitMs: 100 });
    const elapsed = Date.now() - startTime;
    
    // Should complete within reasonable time of the limit
    expect(elapsed).toBeLessThan(500);
    expect(result.timeMs).toBeLessThanOrEqual(200);
  }, 5000);
  
  test('engine produces consistent results for same position', async () => {
    const board = createStartingBoard();
    
    const result1 = await engineSearch(board, 1, { depth: 3, timeLimitMs: 1000 });
    const result2 = await engineSearch(board, 1, { depth: 3, timeLimitMs: 1000 });
    
    // Should return the same best move for deterministic search
    expect(result1.bestMoveAlgebraic).toBe(result2.bestMoveAlgebraic);
  }, 10000);
});