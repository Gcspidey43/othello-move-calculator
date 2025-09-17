/**
 * Minimax search with alpha-beta pruning, iterative deepening, and transposition table
 */

import { Board, Cell, Move, EngineResult, SearchOptions, TTEntry } from './types.js';
import { generateLegalMoves, applyMove, moveToAlgebraic } from './board.js';
import { evaluatePosition } from './evaluation.js';
import { hashBoard, updateHash } from './zobrist.js';

// Progress callback type for reporting search progress
type ProgressCallback = (info: { nodes: number; depth: number; bestMove: string; timeMs: number }) => void;

// Search constants
const INFINITY = 999999;

// Transposition table
const transpositionTable = new Map<string, TTEntry>();
const MAX_TT_SIZE = 1000000;

/**
 * Main engine search function
 */
export async function engineSearch(
  board: Board, 
  color: Cell, 
  options: SearchOptions = {},
  progressCallback?: ProgressCallback
): Promise<EngineResult> {
  const depth = options.depth ?? 6;
  const timeLimitMs = options.timeLimitMs ?? 2000;
  const startTime = Date.now();
  
  let nodes = 0;
  let bestMove: Move = null;
  let bestScore = -INFINITY;
  let pv: string[] = [];
  let depthSearched = 0;
  let stopped = false;
  
  // Check if we need to pass
  const legalMoves = generateLegalMoves(board, color);
  if (legalMoves.length === 0) {
    return {
      bestMove: null,
      bestMoveAlgebraic: 'pass',
      flips: 0,
      score: evaluatePosition(board, color),
      pv: ['pass'],
      nodes: 1,
      timeMs: Date.now() - startTime,
      depthSearched: 0
    };
  }
  
  // Iterative deepening
  for (let currentDepth = 1; currentDepth <= depth && !stopped; currentDepth++) {
    
    // Check time limit
    if (Date.now() - startTime >= timeLimitMs) {
      break;
    }
    
    try {
      const deadline = startTime + timeLimitMs;
      const result = minimax(
        board, 
        color, 
        currentDepth, 
        -INFINITY, 
        INFINITY, 
        true, 
        [], 
        hashBoard(board, color),
        deadline,
        progressCallback ? (info) => {
          progressCallback({
            ...info,
            depth: currentDepth,
            timeMs: Date.now() - startTime
          });
        } : undefined
      );
      
      if (result.timeout) {
        stopped = true;
        break;
      }
      
      nodes += result.nodes;
      bestMove = result.bestMove;
      bestScore = result.score;
      pv = result.pv;
      depthSearched = currentDepth;
      
      // Report progress
      if (progressCallback) {
        progressCallback({
          nodes,
          depth: currentDepth,
          bestMove: moveToAlgebraic(bestMove),
          timeMs: Date.now() - startTime
        });
      }
      
    } catch (error) {
      if (error instanceof Error && error.message === 'TIMEOUT') {
        stopped = true;
      } else {
        throw error;
      }
    }
  }
  
  // Calculate flips for the best move
  let flips = 0;
  if (bestMove) {
    const result = applyMove(board, bestMove, color);
    flips = result.flips;
  }
  
  return {
    bestMove,
    bestMoveAlgebraic: moveToAlgebraic(bestMove),
    flips,
    score: bestScore,
    pv,
    nodes,
    timeMs: Date.now() - startTime,
    depthSearched
  };
}

// Helper to get flipped positions for hash updates
function getFlippedPositions(board: Board, move: Move, color: Cell): [number, number][] {
  if (!move) return [];
  
  const flipped: [number, number][] = [];
  const { r, c } = move;
  const opponent = -color as Cell;
  
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1]
  ];
  
  for (const [dr, dc] of directions) {
    const directionFlips: [number, number][] = [];
    let nr = r + dr;
    let nc = c + dc;
    
    // Collect opponent pieces
    while (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === opponent) {
      directionFlips.push([nr, nc]);
      nr += dr;
      nc += dc;
    }
    
    // Only add flips if we end with our color
    if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && board[nr][nc] === color) {
      flipped.push(...directionFlips);
    }
  }
  
  return flipped;
}

/**
 * Minimax with alpha-beta pruning
 */
function minimax(
  board: Board,
  color: Cell,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  currentPV: string[],
  boardHash: bigint,
  deadline?: number,
  progressCallback?: (info: { nodes: number; bestMove: string }) => void
): { score: number; bestMove: Move; pv: string[]; nodes: number; timeout?: boolean } {
  let nodes = 1;
  
  // Check timeout every 1024 nodes for efficiency
  if (deadline && nodes % 1024 === 0 && Date.now() > deadline) {
    return {
      score: -INFINITY,
      bestMove: null,
      pv: currentPV,
      nodes,
      timeout: true
    };
  }
  
  // Check transposition table
  const ttKey = boardHash.toString();
  const ttEntry = transpositionTable.get(ttKey);
  
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === 'EXACT') {
      return {
        score: ttEntry.value,
        bestMove: ttEntry.bestMove,
        pv: currentPV,
        nodes
      };
    } else if (ttEntry.flag === 'LOWER' && ttEntry.value >= beta) {
      return {
        score: ttEntry.value,
        bestMove: ttEntry.bestMove,
        pv: currentPV,
        nodes
      };
    } else if (ttEntry.flag === 'UPPER' && ttEntry.value <= alpha) {
      return {
        score: ttEntry.value,
        bestMove: ttEntry.bestMove,
        pv: currentPV,
        nodes
      };
    }
  }
  
  // Base case
  if (depth === 0) {
    const score = evaluatePosition(board, color);
    return {
      score: isMaximizing ? score : -score,
      bestMove: null,
      pv: currentPV,
      nodes
    };
  }
  
  const currentColor = isMaximizing ? color : (-color as Cell);
  const moves = generateLegalMoves(board, currentColor);
  
  // No legal moves - pass
  if (moves.length === 0) {
    const oppositeColor = -currentColor as Cell;
    const oppositeMoves = generateLegalMoves(board, oppositeColor);
    
    if (oppositeMoves.length === 0) {
      // Game over - evaluate final position
      const score = evaluatePosition(board, color);
      return {
        score: isMaximizing ? score : -score,
        bestMove: null,
        pv: [...currentPV, 'pass'],
        nodes
      };
    } else {
      // Pass and continue with opponent
      const result = minimax(board, color, depth - 1, alpha, beta, !isMaximizing, [...currentPV, 'pass'], boardHash, deadline);
      return {
        score: result.score,
        bestMove: null,
        pv: result.pv,
        nodes: nodes + result.nodes
      };
    }
  }
  
  // Order moves for better pruning
  const orderedMoves = orderMoves(board, moves, currentColor);
  
  let bestMove: Move = null;
  let bestScore = isMaximizing ? -INFINITY : INFINITY;
  let bestPV: string[] = currentPV;
  let originalAlpha = alpha;
  
  for (const move of orderedMoves) {
    const { board: newBoard } = applyMove(board, move, currentColor);
    const newPV = [...currentPV, moveToAlgebraic(move)];
    
    // Use incremental hash update for efficiency
    const flippedPositions = getFlippedPositions(board, move, currentColor);
    const newHash = move ? updateHash(boardHash, board, move, currentColor, flippedPositions) : boardHash;
    
    const result = minimax(newBoard, color, depth - 1, alpha, beta, !isMaximizing, newPV, newHash, deadline, progressCallback);
    nodes += result.nodes;
    
    // Check for timeout from recursive call
    if (result.timeout) {
      return {
        score: bestScore,
        bestMove,
        pv: bestPV,
        nodes,
        timeout: true
      };
    }
    
    // Report progress periodically
    if (progressCallback && nodes % 100 === 0) {
      progressCallback({
        nodes,
        bestMove: moveToAlgebraic(bestMove)
      });
    }
    
    if (isMaximizing) {
      if (result.score > bestScore) {
        bestScore = result.score;
        bestMove = move;
        bestPV = result.pv;
      }
      alpha = Math.max(alpha, result.score);
    } else {
      if (result.score < bestScore) {
        bestScore = result.score;
        bestMove = move;
        bestPV = result.pv;
      }
      beta = Math.min(beta, result.score);
    }
    
    // Alpha-beta pruning
    if (beta <= alpha) {
      break;
    }
  }
  
  // Store in transposition table
  if (transpositionTable.size < MAX_TT_SIZE) {
    let flag: 'EXACT' | 'LOWER' | 'UPPER';
    if (bestScore <= originalAlpha) {
      flag = 'UPPER';
    } else if (bestScore >= beta) {
      flag = 'LOWER';
    } else {
      flag = 'EXACT';
    }
    
    transpositionTable.set(ttKey, {
      key: boardHash,
      depth,
      value: bestScore,
      flag,
      bestMove
    });
  }
  
  return {
    score: bestScore,
    bestMove,
    pv: bestPV,
    nodes
  };
}

/**
 * Order moves for better alpha-beta pruning
 * Priority: corners > high flip count > mobility reduction
 */
function orderMoves(board: Board, moves: Move[], color: Cell): Move[] {
  const corners = new Set(['0,0', '0,7', '7,0', '7,7']);
  
  return moves.sort((a, b) => {
    if (!a || !b) return 0;
    
    const aKey = `${a.r},${a.c}`;
    const bKey = `${b.r},${b.c}`;
    
    // Prefer corners
    const aIsCorner = corners.has(aKey);
    const bIsCorner = corners.has(bKey);
    if (aIsCorner && !bIsCorner) return -1;
    if (!aIsCorner && bIsCorner) return 1;
    
    // Prefer moves with more flips
    const aFlips = applyMove(board, a, color).flips;
    const bFlips = applyMove(board, b, color).flips;
    if (aFlips !== bFlips) return bFlips - aFlips;
    
    // Prefer moves that reduce opponent mobility
    const afterA = applyMove(board, a, color).board;
    const afterB = applyMove(board, b, color).board;
    const oppColor = -color as Cell;
    const aOppMobility = generateLegalMoves(afterA, oppColor).length;
    const bOppMobility = generateLegalMoves(afterB, oppColor).length;
    
    return aOppMobility - bOppMobility;
  });
}